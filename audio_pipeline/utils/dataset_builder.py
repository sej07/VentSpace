"""
Loads RAVDESS and CREMA-D datasets, extracts features, and returns
X (feature matrix) and y (label array) ready for classifier training.

Usage:
    python dataset_builder.py \
        --ravdess audio_pipeline/data/ravdess \
        --crema   audio_pipeline/data/crema_d/AudioWAV \
        --out     audio_pipeline/data/dataset.npz
"""

import os
import argparse
import numpy as np
from pathlib import Path
from tqdm import tqdm

from feature_extractor import extract_features, features_to_vector
from label_mapper import parse_ravdess_label, parse_crema_label, LABEL_TO_INT


def load_ravdess(ravdess_root: str) -> tuple[list, list]:
    """
    Walk all Actor_* subdirectories and extract features from each .wav file.
    Returns (X, y) as Python lists.
    """
    X, y = [], []
    root = Path(ravdess_root)
    wav_files = list(root.rglob("*.wav"))
    print(f"[RAVDESS] Found {len(wav_files)} wav files")

    for wav_path in tqdm(wav_files, desc="RAVDESS"):
        label_str = parse_ravdess_label(wav_path.name)
        if label_str is None:
            continue  # skip happy, surprised
        try:
            feats = extract_features(str(wav_path))
            vec = features_to_vector(feats)
            X.append(vec)
            y.append(LABEL_TO_INT[label_str])
        except Exception as e:
            print(f"  [skip] {wav_path.name}: {e}")

    return X, y


def load_crema(crema_audio_dir: str) -> tuple[list, list]:
    """
    Load all .wav files from CREMA-D AudioWAV directory.
    Returns (X, y) as Python lists.
    """
    X, y = [], []
    root = Path(crema_audio_dir)
    wav_files = list(root.glob("*.wav"))
    print(f"[CREMA-D] Found {len(wav_files)} wav files")

    for wav_path in tqdm(wav_files, desc="CREMA-D"):
        label_str = parse_crema_label(wav_path.name)
        if label_str is None:
            continue  # skip happy
        try:
            feats = extract_features(str(wav_path))
            vec = features_to_vector(feats)
            X.append(vec)
            y.append(LABEL_TO_INT[label_str])
        except Exception as e:
            print(f"  [skip] {wav_path.name}: {e}")

    return X, y


def build_dataset(ravdess_root: str, crema_audio_dir: str, out_path: str):
    """
    Combines RAVDESS + CREMA-D into a single .npz file.
    """
    X_r, y_r = load_ravdess(ravdess_root)
    X_c, y_c = load_crema(crema_audio_dir)

    X = np.array(X_r + X_c, dtype=np.float32)
    y = np.array(y_r + y_c, dtype=np.int32)

    print(f"\nDataset summary:")
    print(f"  Total samples : {len(X)}")
    print(f"  Feature dim   : {X.shape[1]}")
    print(f"  Class 0 (frustration): {np.sum(y == 0)}")
    print(f"  Class 1 (sadness)    : {np.sum(y == 1)}")
    print(f"  Class 2 (neutral)    : {np.sum(y == 2)}")

    np.savez(out_path, X=X, y=y)
    print(f"\nSaved to {out_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--ravdess", required=True, help="Path to RAVDESS root folder")
    parser.add_argument("--crema",   required=True, help="Path to CREMA-D AudioWAV folder")
    parser.add_argument("--out",     required=True, help="Output .npz path")
    args = parser.parse_args()

    build_dataset(args.ravdess, args.crema, args.out)