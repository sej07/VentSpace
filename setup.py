"""
VentSpace LLM — One-time setup script
======================================
Run this ONCE before starting the Flask server.
Installs packages, downloads the model, and builds the Amod ChromaDB collection.

Usage:
    python setup.py

Requirements:
    - Python 3.10+
    - CUDA-capable GPU with 20GB+ VRAM recommended (A100 ideal)
    - ~30GB disk space (model ~24GB + ChromaDB ~1GB)
    - Internet access on first run (model + dataset download)

After setup completes, start Flask normally:
    python app.py
"""

import subprocess
import sys
import os


# ── Step 1: Install packages ──────────────────────────────────────────────────

REQUIRED_PACKAGES = [
    "torch==2.5.1",
    "transformers>=4.49.0",
    "bitsandbytes>=0.49.0",
    "accelerate>=1.5.0",
    "sentencepiece>=0.2.0",
    "sentence-transformers",
    "chromadb",
    "datasets",
    "huggingface_hub",
]


def install_packages():
    print("\n[Setup] Step 1 — Installing packages...")
    failed = []
    for pkg in REQUIRED_PACKAGES:
        print(f"  {pkg}...", end=" ", flush=True)
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", "--quiet", pkg],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            print("WARN")
            failed.append(pkg)
        else:
            print("✓")
    if failed:
        print(f"\n[Setup] WARNING: these packages may need manual install: {failed}")
    else:
        print("[Setup] All packages installed\n")


# ── Step 2: Check GPU ─────────────────────────────────────────────────────────

def check_gpu():
    print("[Setup] Step 2 — Checking GPU...")
    try:
        import torch
        if not torch.cuda.is_available():
            print("[Setup] WARNING: No CUDA GPU detected.")
            print("        Mistral-Nemo-12B requires 20GB+ VRAM for comfortable inference.")
            print("        On CPU responses will be very slow (~30-60s each).")
            print("        For the demo, run on Northeastern Discovery cluster (A100 80GB).")
        else:
            name = torch.cuda.get_device_name(0)
            mem  = torch.cuda.get_device_properties(0).total_memory / 1e9
            print(f"[Setup] GPU: {name} ({mem:.0f} GB) ✓")
    except ImportError:
        print("[Setup] torch not yet importable — will check after install")
    print()


# ── Step 3: Download model ────────────────────────────────────────────────────

def download_model():
    MODEL_ID  = "mistralai/Mistral-Nemo-Instruct-2407"
    cache_dir = os.path.expanduser("~/.cache/huggingface/hub")
    model_dir = os.path.join(
        cache_dir, "models--mistralai--Mistral-Nemo-Instruct-2407"
    )

    print(f"[Setup] Step 3 — Checking model: {MODEL_ID}")

    if os.path.exists(model_dir):
        print(f"[Setup] Model already cached at {model_dir} ✓\n")
        return

    print("[Setup] Model not found — downloading (~24GB, 20-30 min)...")
    print("        This only happens once. Future runs use the cache.\n")

    try:
        from huggingface_hub import snapshot_download
        snapshot_download(MODEL_ID)
        print("[Setup] Model downloaded ✓\n")
    except Exception as e:
        print(f"[Setup] Download error: {e}")
        print("        Model will download automatically on first generate_response() call.\n")


# ── Step 4: Build Amod collection ─────────────────────────────────────────────

def build_collection():
    print("[Setup] Step 4 — Building Amod ChromaDB collection...")
    print("        Embeds 3,500 real therapist conversations for RAG.")
    print("        ~10-15 min on GPU, ~30-40 min on CPU.\n")

    try:
        from ventspace_llm import build_amod_collection
        build_amod_collection()
        print("[Setup] Amod collection ready ✓\n")
    except Exception as e:
        print(f"[Setup] Collection build error: {e}")
        print("        You can build manually: python -c 'from ventspace_llm import build_amod_collection; build_amod_collection()'\n")


# ── Step 5: Smoke test ────────────────────────────────────────────────────────

def smoke_test():
    print("[Setup] Step 5 — Smoke test...")
    try:
        from ventspace_llm import generate_response, load_model
        load_model()
        result = generate_response("i had a really hard day today", "follicular")
        assert result["tier"] in ("GREEN", "YELLOW", "RED"), f"Unexpected tier: {result['tier']}"
        assert len(result["response"]) > 20, "Response too short"
        print(f"[Setup] Smoke test passed ✓")
        print(f"        Tier    : {result['tier']}")
        print(f"        Response: {result['response'][:120]}...\n")
    except Exception as e:
        print(f"[Setup] Smoke test failed: {e}")
        print("        Check GPU availability and model download.\n")


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("VentSpace LLM — Setup")
    print("=" * 60)

    install_packages()
    check_gpu()
    download_model()
    build_collection()
    smoke_test()

    print("=" * 60)
    print("Setup complete.")
    print("Next step: start the Flask server with   python app.py")
    print("=" * 60)