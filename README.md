# VentSpace — LLM Module

**Model:** Mistral-Nemo-Instruct-2407 (12B, 4-bit quantized)  

---

## Files

```
ventspace_llm.py   ← main module 
setup.py           ← one-time setup
README_LLM.md      ← this file
```

---

## First-Time Setup

Run this once on whatever machine will run the Flask server:

```bash
python setup.py
```

This handles everything automatically:
1. Installs all required Python packages
2. Checks GPU availability
3. Downloads Mistral-Nemo model (~24GB — cached after first run)
4. Builds the Amod ChromaDB collection (~3,500 real therapist conversations)
5. Runs a smoke test to confirm everything works

**Expected time on Discovery A100:** ~30-45 min first run. Instant on subsequent runs.  
**Expected time on CPU (no GPU):** Very slow — for demo, always run on Discovery.

---

## Flask Integration

```python
from ventspace_llm import generate_response, load_model, build_amod_collection

# ── App startup — call once ───────────────────────────────────
build_amod_collection()   # skips if already built
load_model()              # loads Mistral once, reused for all requests

# ── Text input endpoint ───────────────────────────────────────
@app.route("/analyze", methods=["POST"])
def analyze():
    data        = request.json
    user_text   = data["text"]
    cycle_phase = data.get("cycle_phase", "unknown")

    result = generate_response(user_text, cycle_phase)
    return jsonify(result)

# ── Audio input endpoint ──────────────────────────────────────
@app.route("/analyze-audio", methods=["POST"])
def analyze_audio_endpoint():
    import sys
    sys.path.insert(0, "/path/to/audio_pipeline")
    from audio_pipeline import analyze_audio

    wav_path    = data["wav_path"]
    cycle_phase = data.get("cycle_phase", "unknown")

    audio_result = analyze_audio(wav_path)
    result = generate_response(
        user_input   = audio_result["transcript"],
        cycle_phase  = cycle_phase,
        audio_result = audio_result
    )
    return jsonify(result)
```

---

## Return Schema

```json
{
  "tier":          "GREEN",
  "response":      "That sounds genuinely exhausting...",
  "cycle_phase":   "luteal",
  "phase_display": "🍂 Luteal Phase (Day 21)",
  "audio_emotion": "sadness"
}
```

| Field | Type | Values |
|---|---|---|
| `tier` | str | `"GREEN"` \| `"YELLOW"` \| `"RED"` |
| `response` | str | VentSpace response text |
| `cycle_phase` | str | `"follicular"` \| `"ovulation"` \| `"luteal"` \| `"menstrual"` \| `"unknown"` |
| `phase_display` | str | Human-readable e.g. `"🍂 Luteal Phase (Day 21)"` |
| `audio_emotion` | str \| None | `"frustration"` \| `"sadness"` \| `"neutral"` \| `None` |

**Tier → frontend level mapping:**

| Tier | Frontend level |
|---|---|
| `GREEN` | `"green"` |
| `YELLOW` | `"yellow"` |
| `RED` | `"red"` |

---

## Cycle Phase Calculator 

```python
from ventspace_llm import get_cycle_phase
from datetime import date

# user enters last period start date on onboarding
phase_info = get_cycle_phase(date(2025, 3, 10))

print(phase_info["phase"])    # "luteal"
print(phase_info["display"])  # "🍂 Luteal Phase (Day 21)"
print(phase_info["day"])      # 21

# pass phase into the API call
result = generate_response(user_text, phase_info["phase"])
```

If user skips period setup, pass `cycle_phase="unknown"`.  
The model responds normally without any hormonal context — no errors, no weirdness.

---

## Audio Pipeline Integration 

The audio pipeline output feeds directly into `generate_response()`:

```python
from audio_pipeline import analyze_audio
from ventspace_llm  import generate_response

audio_result = analyze_audio("recording.wav")

result = generate_response(
    user_input   = audio_result["transcript"],   # Whisper text → your input
    cycle_phase  = "luteal",
    audio_result = audio_result                  # emotion calibrates LLM tone
)
```

**Emotion classes used:**

| Emotion | What it does |
|---|---|
| `frustration` | Prompt tells model: "she may be more agitated than her words suggest" |
| `sadness` | Prompt tells model: "be especially gentle, do not push toward action" |
| `neutral` | No additional context — prompt unchanged |

Emotion context is internal only — the model never says "your voice sounded sad."

---

## Tier Logic

| Tier | Triggers | Response behaviour |
|---|---|---|
| 🟢 GREEN | Bad day, frustration, tiredness | Validation + phase-specific self-care suggestion |
| 🟡 YELLOW | "I always", self-blame, dark outlook, depression | Pattern reflection + one grounding nudge |
| 🔴 RED | Crisis language, suicidal ideation | Warm + 988 Lifeline + Crisis Text Line |

**Safety override:** specific crisis keywords (e.g. "want to disappear", "better off without me") bypass the LLM entirely and use a focused crisis prompt. This runs before model inference and cannot be disabled.



## Running on Discovery

```bash
# 1. SSH into Discovery
ssh yourname@login.discovery.neu.edu

# 2. Request GPU (do this 60 min before your slot)
srun --partition=gpu --gres=gpu:a100:1 --cpus-per-task=4 \
     --mem=40GB --time=04:00:00 --pty /bin/bash

# 3. Activate env
source activate /opt/miniconda/envs/eai

# 4. Start Flask (inside tmux so it survives disconnection)
tmux new -s ventspace
python app.py

# 5. In a second terminal — expose via ngrok
pip install pyngrok --user
python -c "from pyngrok import ngrok; url = ngrok.connect(5000); print(url)"

# 6. Send the ngrok URL to frontend teammate
#    They set REACT_APP_API_URL=https://xxxx.ngrok.io in their .env
```

---

## Tested Environment

```
Python       : 3.12
torch        : 2.5.1+cu121
transformers : 4.49.0
bitsandbytes : 0.49.2
accelerate   : 1.5.2
sentence-transformers : latest
chromadb     : latest
Cluster      : Northeastern Discovery (eai conda env)
```
