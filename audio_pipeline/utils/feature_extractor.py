import librosa
import numpy as np


def extract_features(audio_path: str, sr: int = 22050) -> dict:
    """
    Extract prosodic and spectral features from an audio file.

    Args:
        audio_path: Path to the .wav file
        sr: Sample rate (default 22050)

    Returns:
        dict of features, or raises ValueError if file is unreadable
    """
    try:
        y, sr = librosa.load(audio_path, sr=sr)
    except Exception as e:
        raise ValueError(f"Could not load audio file: {audio_path}. Error: {e}")

    if len(y) == 0:
        raise ValueError(f"Audio file is empty: {audio_path}")

    features = {}

    # --- MFCCs (mean + std of 13 coefficients = 26 values) ---
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    for i in range(13):
        features[f"mfcc_{i}_mean"] = float(np.mean(mfccs[i]))
        features[f"mfcc_{i}_std"] = float(np.std(mfccs[i]))

    # --- Pitch variance ---
    # librosa.yin returns f0 per frame; we extract variance and mean
    f0 = librosa.yin(y, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'))
    voiced_f0 = f0[f0 > 0]  # filter unvoiced frames
    features["pitch_mean"] = float(np.mean(voiced_f0)) if len(voiced_f0) > 0 else 0.0
    features["pitch_variance"] = float(np.var(voiced_f0)) if len(voiced_f0) > 0 else 0.0

    # --- Vocal intensity (RMS energy) ---
    rms = librosa.feature.rms(y=y)
    features["rms_mean"] = float(np.mean(rms))
    features["rms_std"] = float(np.std(rms))

    # --- Speech rate (proxy: zero crossing rate) ---
    zcr = librosa.feature.zero_crossing_rate(y)
    features["zcr_mean"] = float(np.mean(zcr))
    features["zcr_std"] = float(np.std(zcr))

    # --- Pause frequency (proxy: fraction of near-silent frames) ---
    # Frames where RMS < 1% of max RMS are considered pauses
    rms_flat = rms.flatten()
    silence_threshold = 0.01 * np.max(rms_flat)
    pause_fraction = float(np.sum(rms_flat < silence_threshold) / len(rms_flat))
    features["pause_fraction"] = pause_fraction

    # --- Spectral features ---
    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
    features["spectral_centroid_mean"] = float(np.mean(spectral_centroid))

    spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
    features["spectral_rolloff_mean"] = float(np.mean(spectral_rolloff))

    return features


def features_to_vector(features: dict) -> np.ndarray:
    """
    Converts the features dict into a flat numpy array for the classifier.
    Order is deterministic — always call this instead of dict.values().
    """
    keys = sorted(features.keys())
    return np.array([features[k] for k in keys], dtype=np.float32)


if __name__ == "__main__":
    # Quick smoke test — replace with any .wav file on your machine
    import sys
    if len(sys.argv) < 2:
        print("Usage: python feature_extractor.py <path_to_wav>")
        sys.exit(1)

    path = sys.argv[1]
    feats = extract_features(path)
    vec = features_to_vector(feats)
    print(f"Extracted {len(feats)} features")
    print(f"Feature vector shape: {vec.shape}")
    for k, v in feats.items():
        print(f"  {k}: {v:.4f}")