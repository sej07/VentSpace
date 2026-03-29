"""
VentSpace Audio Pipeline
========================
Single entry point for the entire audio analysis pipeline.

Person 2 (text/chatbot) imports:
    from audio_pipeline import transcribe_audio

Person 3 (fusion/Flask) imports:
    from audio_pipeline import analyze_audio

Output schema from analyze_audio():
{
    "transcript":      str,   # raw text from Whisper → pass to Person 2
    "emotion":         str,   # "frustration" | "sadness" | "neutral"
    "emotion_label":   int,   # 0 | 1 | 2
    "probabilities": {
        "frustration": float,
        "sadness":     float,
        "neutral":     float,
    },
    "audio_features": {
        "rms_mean":        float,  # vocal intensity
        "pitch_variance":  float,  # pitch expressiveness
        "pause_fraction":  float,  # silence ratio
        "zcr_mean":        float,  # speech rate proxy
    },
    "error": str | None         # None if successful, error message if not
}
"""

import os
import sys
import joblib
import numpy as np

# Allow imports from utils/ regardless of where this file is called from
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_UTILS_DIR = os.path.join(_THIS_DIR, "utils")
if _UTILS_DIR not in sys.path:
    sys.path.insert(0, _UTILS_DIR)

from feature_extractor import extract_features, features_to_vector
from transcriber import transcribe
from label_mapper import INT_TO_LABEL

# Paths to saved model files
_MODELS_DIR = os.path.join(_THIS_DIR, "models")
_CLF_PATH   = os.path.join(_MODELS_DIR, "emotion_classifier.pkl")
_SCALER_PATH = os.path.join(_MODELS_DIR, "scaler.pkl")

# Load classifier + scaler once at module level
_clf    = None
_scaler = None

def _load_models():
    global _clf, _scaler
    if _clf is None:
        if not os.path.exists(_CLF_PATH):
            raise FileNotFoundError(
                f"Classifier not found at {_CLF_PATH}. "
                "Run train_classifier.py first."
            )
        _clf    = joblib.load(_CLF_PATH)
        _scaler = joblib.load(_SCALER_PATH)


# ─────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────

def transcribe_audio(audio_path: str) -> str:
    """
    For Person 2 (text pipeline).
    Returns raw transcript string from Whisper.
    Pass this directly into the RoBERTa classifier.
    """
    return transcribe(audio_path)


def analyze_audio(audio_path: str) -> dict:
    """
    For Person 3 (fusion layer / Flask /analyze endpoint).
    Runs full audio analysis: transcription + feature extraction + emotion classification.
    Returns structured dict — see module docstring for full schema.
    """
    result = {
        "transcript":    "",
        "emotion":       "neutral",
        "emotion_label": None,
        "probabilities": {},
        "audio_features": {},
        "error":         None,
    }

    # Step 1 — Transcribe
    try:
        result["transcript"] = transcribe(audio_path)
    except Exception as e:
        result["error"] = f"Transcription failed: {e}"
        return result

    # Step 2 — Load emotion model. If missing, keep transcript and return neutral.
    model_ready = True
    try:
        _load_models()
    except FileNotFoundError as e:
        model_ready = False
        result["error"] = str(e)
        return result

    # Step 3 — Extract features
    try:
        features = extract_features(audio_path)
        vec = features_to_vector(features)
    except Exception as e:
        result["error"] = f"Feature extraction failed: {e}"
        return result

    # Step 4 — Classify emotion
    try:
        vec_scaled = _scaler.transform(vec.reshape(1, -1))
        label_int  = int(_clf.predict(vec_scaled)[0])
        proba      = _clf.predict_proba(vec_scaled)[0]

        result["emotion"]       = INT_TO_LABEL[label_int]
        result["emotion_label"] = label_int
        result["probabilities"] = {
            INT_TO_LABEL[i]: float(proba[i])
            for i in range(len(proba))
        }
    except Exception as e:
        result["error"] = f"Classification failed: {e}"
        return result

    # Step 5 — Surface key audio features for fusion layer
    result["audio_features"] = {
        "rms_mean":       features.get("rms_mean", 0.0),
        "pitch_variance": features.get("pitch_variance", 0.0),
        "pause_fraction": features.get("pause_fraction", 0.0),
        "zcr_mean":       features.get("zcr_mean", 0.0),
    }

    return result


# ─────────────────────────────────────────────
# Smoke test
# ─────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python audio_pipeline.py <path_to_wav>")
        sys.exit(1)

    import json
    output = analyze_audio(sys.argv[1])
    print(json.dumps(output, indent=2))