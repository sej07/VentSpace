"""
Trains an SVM emotion classifier on the prebuilt dataset.npz
and saves the model + scaler to audio_pipeline/models/.

Why SVM and not a neural net?
- Dataset is ~10K samples after filtering — SVM generalizes better at this size
- Training takes seconds not hours — critical for a 24hr hackathon
- Accuracy is competitive with small MLPs on tabular audio features
- Easy to swap out later if needed

Usage:
    python train_classifier.py \
        --data  audio_pipeline/data/dataset.npz \
        --out   audio_pipeline/models/
"""

import argparse
import numpy as np
import joblib
import os
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report


def train(data_path: str, out_dir: str):
    # Load dataset
    data = np.load(data_path)
    X, y = data["X"], data["y"]
    print(f"Loaded {len(X)} samples, {X.shape[1]} features")

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Normalize — critical for SVM
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)

    # Train
    print("Training SVM...")
    clf = SVC(kernel="rbf", C=10, gamma="scale", probability=True)
    clf.fit(X_train, y_train)

    # Evaluate
    y_pred = clf.predict(X_test)
    print("\nClassification Report:")
    print(classification_report(
        y_test, y_pred,
        target_names=["frustration", "sadness", "neutral"]
    ))

    # Save
    os.makedirs(out_dir, exist_ok=True)
    joblib.dump(clf,    os.path.join(out_dir, "emotion_classifier.pkl"))
    joblib.dump(scaler, os.path.join(out_dir, "scaler.pkl"))
    print(f"\nModel saved to {out_dir}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True, help="Path to dataset.npz")
    parser.add_argument("--out",  required=True, help="Directory to save model files")
    args = parser.parse_args()

    train(args.data, args.out)