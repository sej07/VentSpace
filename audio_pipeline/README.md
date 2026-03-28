# VentSpace — Audio Pipeline

Handles transcription, feature extraction, and emotion classification for VentSpace.

## Setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
brew install ffmpeg        # required for Whisper
```

## Train the classifier (one time)

Download datasets first:
```bash
# RAVDESS
cd data/ravdess
kaggle datasets download -d uwrfkaggler/ravdess-emotional-speech-audio --unzip

# CREMA-D
cd ../crema_d
git clone https://github.com/CheyneyComputerScience/CREMA-D.git .
```

Then build dataset and train:
```bash
cd utils
python dataset_builder.py \
    --ravdess ../data/ravdess \
    --crema   ../data/crema_d/AudioWAV \
    --out     ../data/dataset.npz

cd ..
python train_classifier.py \
    --data data/dataset.npz \
    --out  models/
```

## Integration

**Person 2 (text pipeline):**
```python
from audio_pipeline import transcribe_audio

text = transcribe_audio("recording.wav")
# pass text to RoBERTa classifier
```

**Person 3 (fusion layer / Flask):**
```python
from audio_pipeline import analyze_audio

result = analyze_audio("recording.wav")

result["transcript"]              # str   → pass to Person 2
result["emotion"]                 # str   → "frustration" | "sadness" | "neutral"
result["emotion_label"]           # int   → 0 | 1 | 2
result["probabilities"]           # dict  → confidence per class
result["audio_features"]          # dict  → rms_mean, pitch_variance, pause_fraction, zcr_mean
result["error"]                   # None if successful
```

## Output schema

```json
{
  "transcript": "I just feel like nothing I do is ever good enough.",
  "emotion": "sadness",
  "emotion_label": 1,
  "probabilities": {
    "frustration": 0.08,
    "sadness": 0.87,
    "neutral": 0.05
  },
  "audio_features": {
    "rms_mean": 0.009,
    "pitch_variance": 12043.4,
    "pause_fraction": 0.61,
    "zcr_mean": 0.29
  },
  "error": null
}
```

## Emotion classes

| Label | Int | Maps from |
|-------|-----|-----------|
| frustration | 0 | RAVDESS: angry, disgust / CREMA-D: ANG, DIS |
| sadness | 1 | RAVDESS: sad, fearful, calm, neutral / CREMA-D: SAD, FEA, NEU |
| neutral | 2 | Low energy, subdued baseline |

## Accuracy

SVM classifier on RAVDESS + CREMA-D (80/20 split):

| Class | Precision | Recall | F1 |
|-------|-----------|--------|----|
| frustration | 0.87 | 0.81 | 0.84 |
| sadness | 0.82 | 0.86 | 0.84 |
| neutral | 0.84 | 0.88 | 0.86 |
| **overall** | | | **0.84** |
