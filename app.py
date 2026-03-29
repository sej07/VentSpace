import io
import os
import tempfile
from collections import Counter
from datetime import datetime

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

from ventspace_llm import generate_response, get_cycle_phase
from audio_pipeline.audio_pipeline import analyze_audio


def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})
    reports_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports")
    os.makedirs(reports_dir, exist_ok=True)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok", "service": "ventspace-api"})

    @app.post("/cycle-phase")
    def cycle_phase():
        data = request.get_json(silent=True) or {}
        last_period_start = data.get("last_period_start")
        cycle_length = int(data.get("cycle_length", 28) or 28)

        if not last_period_start:
            return jsonify({"error": "last_period_start is required (YYYY-MM-DD)"}), 400

        try:
            start_date = datetime.strptime(last_period_start, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "invalid last_period_start format, expected YYYY-MM-DD"}), 400

        info = get_cycle_phase(start_date, cycle_length=cycle_length)
        return jsonify(info)

    @app.post("/analyze")
    def analyze():
        cycle_phase = "unknown"
        user_text = ""
        audio_result = None

        if request.content_type and request.content_type.startswith("multipart/form-data"):
            user_text = (request.form.get("text") or "").strip()
            cycle_phase = (request.form.get("cycle_phase") or "unknown").strip().lower()
            audio_file = request.files.get("audio")

            if audio_file:
                suffix = os.path.splitext(audio_file.filename or "audio.webm")[1] or ".webm"
                with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                    audio_file.save(tmp.name)
                    tmp_path = tmp.name
                try:
                    audio_result = analyze_audio(tmp_path)
                    transcript = (audio_result or {}).get("transcript", "").strip()
                    if transcript and not user_text:
                        user_text = transcript
                finally:
                    try:
                        os.remove(tmp_path)
                    except OSError:
                        pass
        else:
            data = request.get_json(silent=True) or {}
            user_text = (data.get("text") or "").strip()
            cycle_phase = (data.get("cycle_phase") or "unknown").strip().lower()

        if not user_text:
            return jsonify({"error": "No text or audio transcript provided"}), 400

        result = _safe_generate_response(user_text, cycle_phase, audio_result)
        fusion = _fuse_scores(result.get("tier", "GREEN"), result.get("audio_emotion"), cycle_phase)

        payload = {
            "tier": result.get("tier", "GREEN"),
            "response": result.get("response", "Thanks for sharing. You're not alone in this."),
            "cycle_phase": result.get("cycle_phase", cycle_phase),
            "phase_display": result.get("phase_display", cycle_phase),
            "audio_emotion": result.get("audio_emotion"),
            "spectrum_score": fusion["score"],
            "spectrum_level": fusion["level"],
            "transcript": (audio_result or {}).get("transcript") if audio_result else None,
            "audio_error": (audio_result or {}).get("error") if audio_result else None,
        }
        return jsonify(payload)

    @app.post("/report/weekly")
    def report_weekly():
        data = request.get_json(silent=True) or {}
        entries = data.get("entries", [])
        period_log = data.get("period_log", {})
        summary = data.get("summary", "")

        pdf_bytes = _build_weekly_pdf(entries, period_log, summary)
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"ventspace-weekly-report-{datetime.now().strftime('%Y%m%d')}.pdf",
        )

    @app.post("/report/chat")
    def report_chat():
        data = request.get_json(silent=True) or {}
        messages = data.get("messages", [])

        if not isinstance(messages, list) or not messages:
            return jsonify({"error": "messages array is required"}), 400

        summary = _summarize_chat_messages(messages)
        pdf_bytes = _build_chat_pdf(messages, summary)

        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        file_name = f"ventspace-chat-report-{stamp}.pdf"
        file_path = os.path.join(reports_dir, file_name)
        with open(file_path, "wb") as fp:
            fp.write(pdf_bytes)

        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=file_name,
        )

    return app


def _safe_generate_response(user_text, cycle_phase, audio_result):
    try:
        return generate_response(user_text, cycle_phase, audio_result)
    except Exception:
        # Lightweight fallback so demo doesn't hard-fail if model load is unavailable.
        lower = user_text.lower()
        tier = "GREEN"
        if any(k in lower for k in ["want to die", "end it", "better off without me", "kill myself"]):
            tier = "RED"
        elif any(k in lower for k in ["not good enough", "stupid", "worthless", "i always fail"]):
            tier = "YELLOW"

        fallback = {
            "GREEN": "That sounds genuinely hard. Your feelings make sense, and this space is here for you.",
            "YELLOW": "You're being very hard on yourself right now. That inner critic feels loud, but it is not the full truth of who you are.",
            "RED": "What you're carrying sounds heavier than a bad day. Please reach out to 988 (call or text) or text HOME to 741741. You deserve support right now.",
        }
        return {
            "tier": tier,
            "response": fallback[tier],
            "cycle_phase": cycle_phase,
            "phase_display": cycle_phase,
            "audio_emotion": (audio_result or {}).get("emotion") if audio_result else None,
        }


def _fuse_scores(tier, audio_emotion, cycle_phase):
    text_map = {"GREEN": 0.25, "YELLOW": 0.60, "RED": 0.90}
    audio_map = {"neutral": 0.35, "frustration": 0.65, "sadness": 0.75, None: 0.35}
    phase_adjust = {"luteal": -0.05, "menstrual": -0.03, "follicular": 0.03, "ovulation": 0.05}

    text_score = text_map.get((tier or "GREEN").upper(), 0.25)
    audio_score = audio_map.get((audio_emotion or "neutral").lower() if isinstance(audio_emotion, str) else audio_emotion, 0.35)

    score = 0.60 * text_score + 0.40 * audio_score + phase_adjust.get((cycle_phase or "unknown").lower(), 0.0)
    score = max(0.0, min(1.0, score))

    if score < 0.45:
        level = "green"
    elif score < 0.75:
        level = "yellow"
    else:
        level = "red"

    return {"score": round(score, 3), "level": level}


def _build_weekly_pdf(entries, period_log, summary):
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    from reportlab.lib.utils import ImageReader

    counts = {"green": 0, "yellow": 0, "red": 0}
    for e in entries:
        level = (e.get("level") or "").lower()
        if level in counts:
            counts[level] += 1

    period_days = sum(1 for v in period_log.values() if isinstance(v, dict) and v.get("isPeriod"))

    fig, ax = plt.subplots(figsize=(6, 3.2))
    labels = ["Healthy", "Self-Criticism", "Reach Out"]
    vals = [counts["green"], counts["yellow"], counts["red"]]
    colors = ["#7BBF7B", "#E8B830", "#C84040"]
    ax.bar(labels, vals, color=colors)
    ax.set_title("Weekly Emotional Pattern")
    ax.set_ylabel("Entries")
    fig.tight_layout()

    img_buf = io.BytesIO()
    fig.savefig(img_buf, format="png", dpi=160)
    plt.close(fig)
    img_buf.seek(0)

    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=letter)
    w, h = letter

    c.setFont("Helvetica-Bold", 18)
    c.drawString(48, h - 60, "VentSpace Weekly Report")

    c.setFont("Helvetica", 10)
    c.drawString(48, h - 80, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    c.drawString(48, h - 96, f"Entries: {len(entries)}")
    c.drawString(48, h - 112, f"Period days logged: {period_days}")

    c.drawImage(ImageReader(img_buf), 48, h - 360, width=500, height=240, preserveAspectRatio=True, mask='auto')

    c.setFont("Helvetica-Bold", 12)
    c.drawString(48, h - 390, "Therapist Session Summary")
    c.setFont("Helvetica", 10)

    text_obj = c.beginText(48, h - 408)
    text_obj.setLeading(14)
    report_summary = summary or "No summary provided by client."
    for line in _wrap_text(report_summary, 95):
        text_obj.textLine(line)
    c.drawText(text_obj)

    c.showPage()
    c.save()
    packet.seek(0)
    return packet.getvalue()


def _wrap_text(text, width):
    words = (text or "").split()
    lines = []
    line = []
    for word in words:
        candidate = " ".join(line + [word]).strip()
        if len(candidate) <= width:
            line.append(word)
        else:
            lines.append(" ".join(line))
            line = [word]
    if line:
        lines.append(" ".join(line))
    return lines


def _summarize_chat_messages(messages):
    user_msgs = [m for m in messages if m.get("role") == "user"]
    bot_msgs = [m for m in messages if m.get("role") == "bot"]

    level_counts = Counter((m.get("level") or "green").lower() for m in user_msgs)
    total = len(user_msgs)
    red = level_counts.get("red", 0)
    yellow = level_counts.get("yellow", 0)
    green = level_counts.get("green", 0)

    risk_band = "green"
    if red > 0:
        risk_band = "red"
    elif yellow > 0:
        risk_band = "yellow"

    phrase_bank = [
        "not good enough",
        "worthless",
        "stupid",
        "always mess up",
        "can't do this",
        "everyone except me",
        "nobody cares",
        "overwhelmed",
    ]
    phrase_counts = Counter()
    for m in user_msgs:
        txt = (m.get("text") or "").lower()
        for p in phrase_bank:
            if p in txt:
                phrase_counts[p] += 1

    top_phrases = phrase_counts.most_common(4)
    highlights = []
    for m in user_msgs[-3:]:
        text = (m.get("text") or "").strip()
        if text:
            highlights.append(text[:180])

    parts = [
        f"Session contained {total} user messages and {len(bot_msgs)} companion replies.",
        f"Risk profile: {green} healthy-venting, {yellow} self-criticism, {red} reach-out flags.",
    ]
    if top_phrases:
        phrase_line = ", ".join(f"\"{p}\" ({c}x)" for p, c in top_phrases)
        parts.append(f"Most repeated language patterns: {phrase_line}.")
    if highlights:
        parts.append("Recent highlights: " + " | ".join(f"\"{h}\"" for h in highlights))

    if risk_band == "red":
        parts.append("Recommendation: prioritize immediate human support and carry this report into the next therapist conversation.")
    elif risk_band == "yellow":
        parts.append("Recommendation: monitor recurring self-critical patterns and discuss them in the next check-in.")
    else:
        parts.append("Recommendation: continue regular journaling to maintain baseline awareness and resilience trends.")

    return " ".join(parts)


def _build_chat_pdf(messages, summary):
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas

    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=letter)
    w, h = letter

    c.setFont("Helvetica-Bold", 18)
    c.drawString(48, h - 56, "VentSpace Chat Session Report")

    c.setFont("Helvetica", 10)
    c.drawString(48, h - 74, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    c.drawString(48, h - 88, f"Messages captured: {len(messages)}")

    c.setFont("Helvetica-Bold", 12)
    c.drawString(48, h - 116, "Session Summary")
    c.setFont("Helvetica", 10)

    y = h - 132
    for line in _wrap_text(summary, 98):
        c.drawString(48, y, line)
        y -= 14
        if y < 64:
            c.showPage()
            y = h - 56

    y -= 8
    c.setFont("Helvetica-Bold", 12)
    c.drawString(48, y, "Chat Transcript")
    y -= 16
    c.setFont("Helvetica", 9)

    for msg in messages:
        role = (msg.get("role") or "unknown").upper()
        level = (msg.get("level") or "").lower()
        text = (msg.get("text") or "").strip() or "(empty)"
        prefix = f"{role}{f' [{level}]' if level else ''}: "

        for idx, line in enumerate(_wrap_text(text, 92)):
            row = (prefix if idx == 0 else " " * len(prefix)) + line
            c.drawString(48, y, row)
            y -= 12
            if y < 56:
                c.showPage()
                y = h - 56
                c.setFont("Helvetica", 9)

        y -= 4

    c.save()
    packet.seek(0)
    return packet.getvalue()


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=True)
