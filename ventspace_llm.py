import re
import os
import torch
from datetime import date
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig

# ── Constants ─────────────────────────────────────────────────────────────────

MODEL_ID        = "mistralai/Mistral-Nemo-Instruct-2407"
CHROMA_PATH     = os.path.expanduser("~/chroma_store")
COLLECTION_NAME = "ventspace_amod"
EMBED_MODEL     = "BAAI/bge-m3"

BANNED_TERMS = [
    r"\bsweetheart\b", r"\bsweetie\b", r"\bhoney\b", r"\bdarling\b",
    r"\bdear heart\b", r"\bmy dear\b",
    r"\blove\b(?!\s+to|\s+it|\s+that|\s+how)",
    r"\bchamp\b", r"\bwow\b",
    r"\bamazing\b(?!\s+how)",
    r"\bfantastic\b", r"\bhey there\b", r"\bwell hey\b",
    r"\bhuh\b", r"\bhiya\b", r"\bwhatcha\b",
    r"\bhon\b",
    r"\bgirl\b(?!\s+scout|\s+friend)",
]

CRISIS_KEYWORDS = [
    # explicit
    "want to disappear", "wanna disappear",
    "want to end it", "wanna end it", "end my life",
    "want to die", "wanna die",
    "kill myself", "killing myself",
    "not worth living", "life isn't worth", "life is not worth",
    # implicit
    "better off without me",
    "no one would miss me", "nobody would miss me",
    "don't want to be here", "dont want to be here",
    "don't want to exist", "dont want to exist",
    "what's the point of living", "whats the point of living",
    # hopelessness
    "i dont see the point", "i don't see the point",
    "no point anymore",
    "what's the point of all this", "whats the point of all this",
    "cant do this anymore", "can't do this anymore",
    "so tired of everything",
    "tired of being here",
    "don't want to be alive", "dont want to be alive",
    "wish i wasn't here", "wish i was dead",
    "rather not exist",
    "life is pointless",
]

FALLBACK_RESPONSES = {
    "GREEN":  "That sounds like a lot to carry today. Whatever you're feeling right now is valid — you don't need a reason for it to be real.",
    "YELLOW": "That inner critic is loud right now. Those thoughts aren't the full picture of who you are, even when they feel convincing.",
    "RED":    "What you're sharing matters deeply. Please reach out to the 988 Suicide and Crisis Lifeline (call or text 988) or text HOME to 741741. You don't have to sit with this alone.",
}

# ── Cycle phase data ──────────────────────────────────────────────────────────

CYCLE_PHASES = {
    "follicular": {
        "days": "6-13",
        "description": "Energy and mood are rising. A stable, clearer emotional baseline.",
        "note": "Stable phase — self-criticism here is not hormonally driven. Take it seriously.",
        "green_suggestions":  "something energising — a brisk walk, a new playlist, or reaching out to a friend she's been meaning to catch up with",
        "yellow_suggestions": "journaling — writing down three specific things she did well this week, not just general positives",
        "red_suggestions":    "calling someone she trusts right now, before doing anything else",
    },
    "ovulation": {
        "days": "14-16",
        "description": "Peak energy and confidence. Emotional lows are least expected this phase.",
        "note": "If she's struggling now it carries more weight — this is when she usually feels her strongest.",
        "green_suggestions":  "channelling this energy into something creative or social — even a short walk outside can feel really good right now",
        "yellow_suggestions": "talking to someone she trusts — connection tends to help more than solitude right now",
        "red_suggestions":    "reaching out to a crisis line or a trusted person immediately — she does not have to sit with this alone",
    },
    "luteal": {
        "days": "17-28",
        "description": "Progesterone drop. Self-doubt, irritability and emotional heaviness are common.",
        "note": "Emotional weight feels heavier here. Validate fully before any gentle reframe. Never lead with hormones — feelings are real regardless of cause.",
        "green_suggestions":  "something gentle and nourishing — magnesium-rich foods like dark chocolate or nuts, or just an early night without guilt",
        "yellow_suggestions": "something grounding for the body — light stretching or a slow walk, and mood-stabilising foods like oats, salmon or leafy greens",
        "red_suggestions":    "contacting a crisis line or therapist today — these feelings deserve real support, not just self-care",
    },
    "menstrual": {
        "days": "1-5",
        "description": "Energy is low, sensitivity is high. Physical discomfort amplifies everything emotionally.",
        "note": "Be the gentlest here. Rest is valid. No pushing, no silver linings. Just warmth.",
        "green_suggestions":  "giving herself full permission to rest — comfort food, something easy to watch, no productivity required",
        "yellow_suggestions": "being as physically gentle as possible — warmth, rest, iron-rich foods like lentils or spinach, zero pressure to be okay",
        "red_suggestions":    "reaching out to a crisis line or someone she trusts — she deserves support beyond what any app can give",
    },
    "unknown": {
        "days": "N/A",
        "description": "No cycle data provided.",
        "note": "No cycle context available. Do not reference hormones, cycle phases, or periods anywhere in your response.",
        "green_suggestions":  "something small and restorative — a walk, a good meal, or time with someone who makes her feel calm",
        "yellow_suggestions": "writing down what she would say to a close friend going through the same thing, then reading it back to herself",
        "red_suggestions":    "reaching out to a crisis line or someone she trusts right now — she does not have to carry this alone",
    },
}

# ── Model loader ──────────────────────────────────────────────────────────────

_model     = None
_tokenizer = None


def load_model():
    """
    Load Mistral-Nemo with 4-bit quantization.
    Called once at Flask startup — safe to call multiple times.
    Returns cached instance on subsequent calls.
    """
    global _model, _tokenizer
    if _model is not None:
        return _model, _tokenizer

    print(f"[VentSpace] Loading {MODEL_ID}...")

    bnb_cfg = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
        bnb_4bit_quant_type="nf4",
    )

    _tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    _tokenizer.pad_token = _tokenizer.eos_token

    _model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        quantization_config=bnb_cfg,
        device_map="auto",
        torch_dtype=torch.float16,
    )
    _model.eval()

    mem = torch.cuda.memory_allocated(0) / 1e9 if torch.cuda.is_available() else 0
    print(f"[VentSpace] Model ready — GPU usage: {mem:.1f} GB")
    return _model, _tokenizer


# ── RAG setup ─────────────────────────────────────────────────────────────────

_embedder = None
_amod_col = None


def _load_rag():
    """
    Load ChromaDB collection and sentence embedder.
    Called lazily on first generate_response() call.
    Fails gracefully — returns (None, None) if unavailable.
    """
    global _embedder, _amod_col
    if _amod_col is not None:
        return _embedder, _amod_col

    try:
        import chromadb
        from sentence_transformers import SentenceTransformer

        client = chromadb.PersistentClient(path=CHROMA_PATH)
        cols   = [c.name for c in client.list_collections()]

        if COLLECTION_NAME not in cols:
            print(f"[VentSpace] WARNING: '{COLLECTION_NAME}' not found.")
            print("[VentSpace] Run build_amod_collection() first. Continuing without RAG.")
            return None, None

        _amod_col = client.get_collection(COLLECTION_NAME)
        _embedder = SentenceTransformer(EMBED_MODEL, device="cuda" if torch.cuda.is_available() else "cpu")
        print(f"[VentSpace] RAG ready — {_amod_col.count()} Amod docs")

    except Exception as e:
        print(f"[VentSpace] RAG unavailable: {e} — running without RAG")
        return None, None

    return _embedder, _amod_col


def build_amod_collection():
    """
    One-time setup: embed all Amod rows into ChromaDB.
    Run once before starting Flask. Skips automatically if already built.
    """
    import chromadb
    from datasets import load_dataset
    from sentence_transformers import SentenceTransformer

    client   = chromadb.PersistentClient(path=CHROMA_PATH)
    existing = [c.name for c in client.list_collections()]

    if COLLECTION_NAME in existing:
        col = client.get_collection(COLLECTION_NAME)
        print(f"[VentSpace] Amod collection exists: {col.count()} docs — skipping build")
        return

    print("[VentSpace] Building Amod collection (~10-15 min on GPU)...")
    ds = load_dataset("Amod/mental_health_counseling_conversations", split="train")
    ds = ds.filter(lambda x: x["Context"] and x["Response"]
                   and len(x["Context"].strip()) > 10
                   and len(x["Response"].strip()) > 10)
    print(f"[VentSpace] {len(ds)} rows loaded")

    device   = "cuda" if torch.cuda.is_available() else "cpu"
    embedder = SentenceTransformer(EMBED_MODEL, device=device)
    col      = client.create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}
    )

    contexts  = [row["Context"].strip()  for row in ds]
    responses = [row["Response"].strip() for row in ds]
    ids       = [f"amod_{i}" for i in range(len(ds))]
    batch     = 64

    for start in range(0, len(contexts), batch):
        end        = min(start + batch, len(contexts))
        embeddings = embedder.encode(
            contexts[start:end],
            normalize_embeddings=True,
            show_progress_bar=False
        ).tolist()
        col.add(
            ids        = ids[start:end],
            embeddings = embeddings,
            documents  = contexts[start:end],
            metadatas  = [{"response": r} for r in responses[start:end]]
        )
        if (start // batch) % 5 == 0:
            print(f"[VentSpace]   {end}/{len(contexts)} embedded...")

    print(f"[VentSpace] Amod collection built — {col.count()} docs")


# ── Cycle calculator ──────────────────────────────────────────────────────────

def get_cycle_phase(last_period_date: date, cycle_length: int = 28) -> dict:
    """
    Calculate current cycle phase from last period start date.

    Args:
        last_period_date : date object  e.g. date(2025, 3, 1)
        cycle_length     : default 28 days

    Returns:
        {phase, day, emoji, display}
        Pass result['phase'] into generate_response() as cycle_phase.

    Example:
        info = get_cycle_phase(date(2025, 3, 10))
        result = generate_response(user_text, info["phase"])
    """
    today        = date.today()
    days_since   = (today - last_period_date).days
    day_in_cycle = (days_since % cycle_length) + 1

    if day_in_cycle <= 5:
        phase, emoji = "menstrual",  "🌊"
    elif day_in_cycle <= 13:
        phase, emoji = "follicular", "🌱"
    elif day_in_cycle <= 16:
        phase, emoji = "ovulation",  "🌟"
    else:
        phase, emoji = "luteal",     "🍂"

    return {
        "phase":   phase,
        "day":     day_in_cycle,
        "emoji":   emoji,
        "display": f"{emoji} {phase.capitalize()} Phase (Day {day_in_cycle})",
    }


# ── Prompt builders ───────────────────────────────────────────────────────────

def _build_system_prompt(cycle_phase: str, audio_emotion: str = None) -> str:
    p = CYCLE_PHASES.get(cycle_phase.lower(), CYCLE_PHASES["unknown"])

    audio_context = ""
    if audio_emotion and audio_emotion != "neutral":
        notes = {
            "frustration": (
                "Her voice analysis detected frustration — elevated intensity, faster speech. "
                "She may be more agitated than her words suggest. "
                "Acknowledge the energy behind what she said, not just the content."
            ),
            "sadness": (
                "Her voice analysis detected sadness — low energy, slow speech, frequent pauses. "
                "She may be more emotionally depleted than her words convey. "
                "Be especially gentle. Do not push toward action or solutions."
            ),
        }
        note = notes.get(audio_emotion, "")
        if note:
            audio_context = f"\n\n━━━ VOICE EMOTION CONTEXT (INTERNAL) ━━━\n{note}\n"

    return f"""You are VentSpace — a warm, non-clinical emotional companion built exclusively for women.
Your role is to make her feel genuinely heard, validated, and gently guided — not managed or analysed.
You are NOT a therapist. You do NOT diagnose. You do NOT use clinical language.

━━━ CYCLE CONTEXT (INTERNAL — DO NOT STATE DIRECTLY) ━━━
Phase: {cycle_phase.upper()} (days {p['days']})
What this means: {p['description']}
Calibration: {p['note']}

IMPORTANT: Never open with her cycle as an explanation for her feelings.
Her feelings are real regardless of their cause. Cycle context shapes your tone and suggestions only.
If you reference the cycle at all, it must come after fully validating her — only as a gentle aside,
never as the reason for what she feels. If phase is "unknown" — never mention hormones or cycles. Ever.
{audio_context}
━━━ RESPONSE TIERS ━━━

🟢 GREEN — Healthy venting
Triggers: situational frustration, bad day, tiredness, general stress. No self-attack language.
Structure:
  1. Acknowledge her specific situation — name what she actually said, not a generic opener
  2. Reflect one specific detail back — show you actually heard her
  3. Validate the feeling warmly — normalise without minimising
  4. End with one gentle phase-appropriate suggestion: {p['green_suggestions']}
Length: 120–200 words. Flowing sentences. Warm and conversational.
Never summarise in one or two sentences — she deserves a full, present response.

🟡 YELLOW — Self-criticism
Triggers: identity-level attacks — "I always", "I never", "I'm so stupid", "not good enough",
repeated self-blame, describing a "dark outlook on life", persistent low mood described over
days or weeks, depression mentioned explicitly, feeling worthless or like a failure.
Structure: acknowledge what she's feeling → reflect the pattern back gently (not as a lecture) →
remind her that inner critic is not the truth → end with one grounding suggestion:
{p['yellow_suggestions']}
Length: 120–180 words. Never preachy. Never a list. One suggestion only.

🔴 RED — Crisis / Self-destruction
Triggers: wanting to disappear, "no one would miss me", "everyone would be better off without me",
"i want to end it", hopelessness about existence, any suicidal ideation explicit or implicit.
Structure: lead with full warmth → make clear this goes beyond a hard day → tell her she deserves
real support → weave in crisis resources naturally, not as a cold list.
Always include: 988 Suicide and Crisis Lifeline | Crisis Text Line: text HOME to 741741
Also end with: {p['red_suggestions']}
Length: no limit. Take the space she needs.

━━━ SHORT INPUT RULE ━━━
Under 15 words AND no crisis language → reflect what little she shared warmly, create space for more.
Do not ask a direct question. Do not push. Just hold space.
Example: "That sounds like it's been sitting heavy. This space is yours — take all the time you need."
Under 15 words AND crisis language present → skip this rule. Go straight to RED.

━━━ TONE RULES — NON-NEGOTIABLE ━━━
- Match her register. Casual lowercase = warm informal tone back. Never stiff or formal.
- Zero therapy-speak. Never: "I hear you", "that must be hard", "validate", "reframe", "DBT",
  "cognitive distortions", "it sounds like you're feeling".
- YOUR FIRST WORD must not be "I" under any circumstances. Starting with "I" is forbidden.
- YOUR FIRST WORD must not be any greeting: no "Hey", "Hi", "Hello", "Hiya", "Huh", "Oh hey".
  Wrong first words: "I see", "I know", "Hey,", "Hi there", "Hello", "Hiya", "Oh hey"
  Right first words: "That", "There's", "Carrying", "Feeling", "Something", "What you", "Sounds like"
- Never use pet names: no sweetie, sweetheart, honey, love, darling, dear.
- Never use hollow fillers: "wow", "champ", "amazing", "fantastic", "huh?", "hiya", "girl".
- Never use bullet points or numbered lists anywhere.
- Never end with a question. End with warmth or a concrete suggestion.
- Never lecture. One gentle nudge maximum.
- You are an app. Never suggest doing something together.
  Never say "let's", "we could", "how about we", "can we", "how about you".
  Suggest things SHE can do. "A short walk might help" not "Let's go for a walk."
- Write like a warm, perceptive friend — not a helpline script.
- Never reference yourself with "I" or "me" as if you are a person with experiences.
  Wrong: "There've been times when I felt that shift too"
  Right: "That shift from high to low can be completely disorienting."

━━━ OUTPUT FORMAT — FOLLOW EXACTLY ━━━
Line 1: TIER: GREEN   (or TIER: YELLOW or TIER: RED — plain text, no bold, no markdown)
Line 2: blank
Line 3+: your response in natural flowing sentences."""


def _build_crisis_prompt(cycle_phase: str) -> str:
    p = CYCLE_PHASES.get(cycle_phase.lower(), CYCLE_PHASES["unknown"])
    return f"""You are VentSpace — a warm, non-clinical emotional companion for women.
The user has shared something that contains crisis-level language. Read everything she wrote carefully.

━━━ HOW TO RESPOND ━━━
Do not give a generic crisis script. Read her actual words. Respond to what SHE specifically said.

Step 1 — Reflect her experience back specifically.
Name something real from what she wrote — a feeling, an image, a moment she described.
Show her you actually read every word. This is the most important thing you can do.

Step 2 — Validate the full weight of what she carries.
Hold all of it. Don't rush past it to get to resources.

Step 3 — If she ended on any note of hope or lightness — acknowledge it.
Do not ignore moments of relief she described. Hold both the pain and the light.

Step 4 — Tell her clearly and warmly that what she's carrying deserves real support.
Not because she's broken — because she matters and this is too heavy to carry alone.

Step 5 — Weave in crisis resources naturally. Not as a bullet list.
Always include: 988 Suicide and Crisis Lifeline (call or text 988)
Always include: Crisis Text Line — text HOME to 741741
End with: {p['red_suggestions']}

━━━ TONE ━━━
- Warm, grounded, present, specific. Not scripted. Not poetic.
- Even if she wrote poetically — respond in plain warm prose.
- Never open with "I" or any greeting.
- Never use pet names. Never end mid-sentence.
- Never use bullet points. Never say "let's" or "we".
- Write in flowing natural sentences."""


def _build_system_prompt_with_rag(
    cycle_phase:   str,
    examples:      list,
    audio_emotion: str = None
) -> str:
    base          = _build_system_prompt(cycle_phase, audio_emotion)
    example_block = "\n\n━━━ REAL THERAPIST EXAMPLES ━━━\n"
    example_block += (
        "These are how licensed therapists responded to emotionally similar situations.\n"
        "Mirror their empathy and emotional intelligence — NOT their exact words.\n"
        "Do NOT copy their opening phrases or sentence structure.\n"
        "Do NOT start with 'Hi there', 'Hello', 'It sounds like', 'I hear you'.\n"
        "Do NOT use 'Let's', 'Can we', 'How about we'.\n\n"
    )
    for i, ex in enumerate(examples, 1):
        preview = ex["response"][:300]
        if len(ex["response"]) > 300:
            preview += "..."
        example_block += f'Example {i} (style reference only):\n"{preview}"\n\n'
    return base + example_block


# ── Safety check ──────────────────────────────────────────────────────────────

def _is_crisis(text: str) -> bool:
    """Hard keyword check — runs before model inference. Cannot be disabled."""
    return any(kw in text.lower().strip() for kw in CRISIS_KEYWORDS)


# ── Post-processing ───────────────────────────────────────────────────────────

def _trim_to_last_sentence(text: str) -> str:
    """Trim to last complete sentence — prevents abrupt cutoffs at token limit."""
    match = re.search(r'[.!?](?=[^.!?]*$)', text)
    if match:
        return text[:match.end()].strip()
    return text.strip()


def _clean_response(text: str) -> str:
    """Strip TIER lines, banned terms, orphaned punctuation. Trim to last sentence."""
    # strip TIER line leaking into response body
    text = re.sub(
        r"^\*{0,2}TIER\*{0,2}:\s*(GREEN|YELLOW|RED)\*{0,2}[,.]?\s*",
        "", text, flags=re.IGNORECASE
    ).strip()
    # strip banned terms
    for pattern in BANNED_TERMS:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)
    # clean orphaned punctuation after word removal
    text = re.sub(r",\s*\?", ".", text)
    text = re.sub(r",\s*,",  ",", text)
    text = re.sub(r"\s+,",   ",", text)
    text = re.sub(r"^\s*[,\.]\s*", "", text)
    # fix whitespace
    text = re.sub(r"\s{2,}", " ", text).strip()
    text = re.sub(r"\s+([.,!?])", r"\1", text)
    # trim to last complete sentence
    text = _trim_to_last_sentence(text)
    return text


def _parse_response(raw: str) -> dict:
    """
    Extract tier + response body from raw model output.
    Strips markdown bold (**TIER:**) before parsing.
    """
    tier          = "GREEN"
    response_text = raw
    lines         = raw.strip().split("\n")

    for i, line in enumerate(lines):
        clean_line = line.strip().replace("*", "").replace("_", "")
        if clean_line.upper().startswith("TIER:"):
            tier_raw = clean_line.upper().replace("TIER:", "").strip()
            tier_raw = re.sub(r"[^A-Z]", " ", tier_raw).strip()
            if   "RED"    in tier_raw: tier = "RED"
            elif "YELLOW" in tier_raw: tier = "YELLOW"
            else:                      tier = "GREEN"
            response_text = "\n".join(lines[i + 1:]).strip()
            break

    response_text = _clean_response(response_text)
    if not response_text.strip():
        response_text = FALLBACK_RESPONSES[tier]

    return {"tier": tier, "response": response_text}


# ── Inference ─────────────────────────────────────────────────────────────────

def _run_inference(messages: list, max_new_tokens: int = 400) -> str:
    """Shared inference call — used by normal and crisis flows."""
    model, tokenizer = load_model()

    input_ids = tokenizer.apply_chat_template(
        messages,
        add_generation_prompt=True,
        return_tensors="pt",
    ).to(model.device)

    attn_mask = (input_ids != tokenizer.eos_token_id).long()

    with torch.no_grad():
        output_ids = model.generate(
            input_ids,
            attention_mask=attn_mask,
            max_new_tokens=max_new_tokens,
            do_sample=True,
            temperature=0.80,
            top_p=0.9,
            repetition_penalty=1.15,
            pad_token_id=tokenizer.eos_token_id,
        )

    new_tokens = output_ids[0][input_ids.shape[-1]:]
    return tokenizer.decode(new_tokens, skip_special_tokens=True).strip()


def _retrieve_examples(user_input: str, k: int = 3) -> list:
    """
    RAG retrieval from Amod collection.
    Returns [] gracefully if collection not available.
    Deduplicates results and skips verbatim matches (distance < 0.05).
    """
    embedder, col = _load_rag()
    if col is None:
        return []

    query_emb = embedder.encode(
        user_input, normalize_embeddings=True
    ).tolist()

    results = col.query(
        query_embeddings=[query_emb],
        n_results=min(k * 2, col.count()),
        include=["documents", "metadatas", "distances"]
    )

    seen, examples = set(), []
    for i in range(len(results["ids"][0])):
        dist = round(results["distances"][0][i], 4)
        resp = results["metadatas"][0][i]["response"].strip()
        key  = resp[:120]

        if dist < 0.05:
            print(f"[VentSpace] RAG: skipping verbatim match (distance {dist})")
            continue
        if key in seen:
            continue

        seen.add(key)
        examples.append({
            "context":  results["documents"][0][i],
            "response": resp,
            "distance": dist,
        })
        if len(examples) == k:
            break

    return examples


# ── Public API ────────────────────────────────────────────────────────────────

def generate_response(
    user_input:   str,
    cycle_phase:  str  = "unknown",
    audio_result: dict = None
) -> dict:
    """
    Main entry point — called by Flask /analyze endpoint.

    Args:
        user_input   : raw text — typed input OR Whisper transcript from audio_pipeline
        cycle_phase  : "follicular"|"ovulation"|"luteal"|"menstrual"|"unknown"
                       Pass "unknown" if user skipped period setup.
        audio_result : dict from audio_pipeline.analyze_audio() — optional
                       Keys used: "emotion" (str), "error" (str|None)
                       Emotion "frustration"|"sadness" injected into prompt as calibration.
                       "neutral" is ignored — no additional context added.

    Returns:
        {
            "tier"         : "GREEN" | "YELLOW" | "RED",
            "response"     : str,
            "cycle_phase"  : str,
            "phase_display": str,
            "audio_emotion": str | None
        }
    """
    cycle_phase  = cycle_phase.lower().strip()
    phase_info   = get_cycle_phase(date.today())

    # extract audio emotion if provided and valid
    audio_emotion = None
    if audio_result and not audio_result.get("error"):
        audio_emotion = audio_result.get("emotion")

    # ── Safety override ───────────────────────────────────────────────────────
    # Crisis keywords bypass RAG and use focused crisis prompt.
    # This cannot be disabled.
    if _is_crisis(user_input):
        print("[VentSpace] SAFETY: crisis keyword detected — bypassing RAG")
        messages = [
            {"role": "system", "content": _build_crisis_prompt(cycle_phase)},
            {"role": "user",   "content": user_input.strip()},
        ]
        raw           = _run_inference(messages, max_new_tokens=400)
        response_text = _clean_response(raw)
        if not response_text.strip():
            response_text = FALLBACK_RESPONSES["RED"]
        return {
            "tier":          "RED",
            "response":      response_text,
            "cycle_phase":   cycle_phase,
            "phase_display": phase_info["display"],
            "audio_emotion": audio_emotion,
        }

    # ── RAG retrieval ─────────────────────────────────────────────────────────
    examples = _retrieve_examples(user_input, k=3)

    # ── Build prompt ──────────────────────────────────────────────────────────
    if examples:
        system_prompt = _build_system_prompt_with_rag(cycle_phase, examples, audio_emotion)
    else:
        system_prompt = _build_system_prompt(cycle_phase, audio_emotion)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user",   "content": user_input.strip()},
    ]

    raw    = _run_inference(messages)
    parsed = _parse_response(raw)

    # ── Short response retry ──────────────────────────────────────────────────
    # Only fires for substantive inputs (>10 words).
    # Short inputs like "im sad" are intentionally brief — no retry needed.
    if len(user_input.split()) > 10 and len(parsed["response"].split()) < 40:
        print("[VentSpace] Response too short — retrying at higher temperature")
        with torch.no_grad():
            input_ids  = _tokenizer.apply_chat_template(
                messages, add_generation_prompt=True, return_tensors="pt"
            ).to(_model.device)
            attn_mask  = (input_ids != _tokenizer.eos_token_id).long()
            output_ids = _model.generate(
                input_ids,
                attention_mask=attn_mask,
                max_new_tokens=400,
                do_sample=True,
                temperature=0.90,
                top_p=0.9,
                repetition_penalty=1.15,
                pad_token_id=_tokenizer.eos_token_id,
            )
        new_tokens = output_ids[0][input_ids.shape[-1]:]
        raw_retry  = _tokenizer.decode(new_tokens, skip_special_tokens=True).strip()
        parsed     = _parse_response(raw_retry)
        if len(parsed["response"].split()) < 40:
            parsed["response"] = FALLBACK_RESPONSES[parsed["tier"]]

    return {
        "tier":          parsed["tier"],
        "response":      parsed["response"],
        "cycle_phase":   cycle_phase,
        "phase_display": phase_info["display"],
        "audio_emotion": audio_emotion,
    }


# ── Standalone test ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 65)
    print("VentSpace LLM — Standalone Test")
    print("=" * 65)

    load_model()

    TEST_CASES = [
        ("my manager is the worst, today was honestly so bad",   "follicular", "GREEN"),
        ("im so exhausted i cant even think straight",           "menstrual",  "GREEN"),
        ("i always ruin everything i touch",                     "luteal",     "YELLOW"),
        ("why can i never get anything right, im so stupid",     "ovulation",  "YELLOW"),
        ("i always mess up, im not good enough for any of this", "follicular", "YELLOW"),
        ("i want to disappear",                                  "follicular", "RED"),
        ("everyone would be better off without me",              "luteal",     "RED"),
        ("i dont see the point anymore",                         "follicular", "RED"),
        ("im sad",                                               "menstrual",  "GREEN"),
        ("i just feel off today",                                "luteal",     "GREEN"),
    ]

    correct = 0
    for user_input, phase, expected in TEST_CASES:
        result = generate_response(user_input, phase)
        got    = result["tier"]
        ok     = "✓" if got == expected else "✗"
        if got == expected:
            correct += 1
        print(f"\n[{ok}] Input    : {user_input}")
        print(f"     Phase    : {phase} | Expected: {expected} | Got: {got}")
        print(f"─── Response ───────────────────────────────────────────────")
        print(result["response"])
        print(f"────────────────────────────────────────────────────────────")

    print(f"\nAccuracy: {correct}/{len(TEST_CASES)} ({correct / len(TEST_CASES) * 100:.0f}%)")

    # ── Audio integration smoke test ──────────────────────────────────────────
    # Uncomment once audio_pipeline is available and cloned
    # import sys
    # sys.path.insert(0, os.path.expanduser("~/audio_pipeline_repo/audio_pipeline"))
    # from audio_pipeline import analyze_audio
    #
    # audio_result = analyze_audio("test_recording.wav")
    # if not audio_result["error"]:
    #     result = generate_response(
    #         user_input   = audio_result["transcript"],
    #         cycle_phase  = "luteal",
    #         audio_result = audio_result
    #     )
    #     print(f"\nAudio test — Tier: {result['tier']}")
    #     print(f"Response: {result['response']}")