"""
Maps RAVDESS and CREMA-D emotion labels to VentSpace 3-class system.

VentSpace classes:
    0 = frustration
    1 = sadness
    2 = neutral  (low energy, subdued — maps to healthy baseline)

Note: "despair" is not a separate audio class. The text pipeline (Person 2)
handles the self-destruction signal. Audio gives emotion tone only.
"""

# RAVDESS emotion codes (from filename position 3)
# Format: 03-01-{EMOTION}-01-01-01-01.wav
RAVDESS_MAP = {
    "01": "neutral",      # neutral
    "02": "neutral",      # calm
    "03": None,           # happy — skip, not relevant to venting
    "04": "sadness",      # sad
    "05": "frustration",  # angry
    "06": "sadness",      # fearful
    "07": "frustration",  # disgust
    "08": None,           # surprised — skip
}

# CREMA-D emotion codes (from filename, e.g. 1001_DFA_ANG_XX.wav → ANG)
CREMA_MAP = {
    "ANG": "frustration",
    "SAD": "sadness",
    "FEA": "sadness",
    "DIS": "frustration",
    "NEU": "neutral",
    "HAP": None,          # skip happy
}

LABEL_TO_INT = {
    "frustration": 0,
    "sadness": 1,
    "neutral": 2,
}

INT_TO_LABEL = {v: k for k, v in LABEL_TO_INT.items()}


def parse_ravdess_label(filename: str) -> str | None:
    """
    Extract VentSpace label from a RAVDESS filename.
    Returns label string or None if file should be skipped.

    Example filename: 03-01-05-01-01-01-01.wav → angry → frustration
    """
    parts = filename.replace(".wav", "").split("-")
    if len(parts) < 3:
        return None
    emotion_code = parts[2]
    return RAVDESS_MAP.get(emotion_code, None)


def parse_crema_label(filename: str) -> str | None:
    """
    Extract VentSpace label from a CREMA-D filename.
    Returns label string or None if file should be skipped.

    Example filename: 1001_DFA_ANG_XX.wav → ANG → frustration
    """
    parts = filename.replace(".wav", "").split("_")
    if len(parts) < 3:
        return None
    emotion_code = parts[2]
    return CREMA_MAP.get(emotion_code, None)