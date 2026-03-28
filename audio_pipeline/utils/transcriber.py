"""
Whisper transcription module for VentSpace.

Transcribes audio to text and passes it to Person 2's text pipeline.
Uses whisper-small for speed on CPU/MPS — good enough for short venting clips.

Usage (standalone):
    python transcriber.py <path_to_wav>

Usage (as module):
    from transcriber import transcribe
    text = transcribe("audio.wav")
"""

import whisper
import torch
import sys

# Load model once at module level — avoids reloading on every call
_MODEL = None

def _get_model():
    global _MODEL
    if _MODEL is None:
        # Use MPS on Apple Silicon if available, else CPU
        device = "cpu"  # whisper-small runs fine on CPU; MPS has known issues with whisper
        print(f"[Whisper] Loading whisper-small on {device}...")
        _MODEL = whisper.load_model("small", device=device)
        print("[Whisper] Model loaded.")
    return _MODEL


def transcribe(audio_path: str) -> str:
    """
    Transcribe a .wav audio file to text.

    Args:
        audio_path: Path to the audio file (.wav, .mp3, .m4a all work)

    Returns:
        Transcribed text string. Empty string if transcription fails.
    """
    try:
        model = _get_model()
        result = model.transcribe(audio_path, language="en", fp16=False)
        text = result["text"].strip()
        return text
    except Exception as e:
        print(f"[Whisper] Transcription failed for {audio_path}: {e}")
        return ""


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python transcriber.py <path_to_wav>")
        sys.exit(1)

    path = sys.argv[1]
    print(f"Transcribing: {path}")
    text = transcribe(path)
    print(f"\nTranscript:\n{text}")