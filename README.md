# VentSpace

Vent freely. Understand yourself. Know when to ask for help.

Integrated period tracking, AI-powered venting analysis, and supportive chat responses with cycle-aware insights.

## Architecture Overview

- **Frontend**: React 18 with period logger, chat interface, weekly insights dashboard
- **Backend**: Flask API with text/audio analysis, cycle-aware scoring, and PDF report generation
- **LLM**: Mistral-Nemo-Instruct-2407 (quantized) with optional RAG retrieval from AMOD dataset
- **Audio**: Whisper-small for voice transcription (requires ffmpeg system dependency)
- **Vector Store**: Chroma embeddings for RAG (persistent at `~/chroma_store`)

## Prerequisites

- **Node.js** (v16+) for frontend
- **Python** (3.9+) for backend
- **ffmpeg** (for audio transcription support)
  ```bash
  # macOS
  brew install ffmpeg
  
  # Ubuntu/Debian
  sudo apt-get install ffmpeg
  ```

## Quick Start (Local Development)

### 1. Frontend Setup

```bash
npm install
npm start
```

Frontend runs on `http://localhost:3000`.

### 2. Backend Setup

Create Python environment (if not already done):
```bash
python -m venv shenv
source shenv/bin/activate  # macOS/Linux
# or: shenv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 3. Build RAG Embeddings (One-Time Setup)

For higher-quality LLM responses, build the AMOD dataset embeddings:

```bash
python -c "from ventspace_llm import build_amod_collection; build_amod_collection()"
```

This creates persistent embeddings at `~/chroma_store/`. They survive terminal restarts and are used automatically by the backend.

**Note**: RAG is optional. Skip this step if you only need heuristic-based responses. Skip if you don't have GPU (CPU embedding generation is slow).

### 4. Run Backend Server

```bash
PORT=5050 python app.py
```

Backend runs on `http://localhost:5050`. (Port 5050 avoids macOS AirPlay conflict.)

### 5. Connect Frontend to Backend

Open the frontend in your browser (http://localhost:3000), or start with environment variable:

```bash
REACT_APP_API_URL=http://localhost:5050 npm start
```

## Backend Endpoints

- `GET /health` — Server status check
- `GET /cycle-phase` — Calculate current cycle phase from period log
- `POST /analyze` — Analyze text/audio, return tier and response
- `POST /report/weekly` — Generate weekly patterns report
- `POST /report/chat` — Generate PDF report from chat session

## Deployment (GPU Recommended)

For production/demo, **GPU is strongly recommended** for Mistral LLM inference. Local CPU will fall back to heuristic responses.

### On a GPU Machine

1. Clone repo:
   ```bash
   git clone https://github.com/SHEHACK26/shehack26-final-submissions-team-2.git
   cd shehack26-final-submissions-team-2
   ```

2. Set up Python environment:
   ```bash
   python -m venv shenv
   source shenv/bin/activate
   pip install -r requirements.txt
   ```

3. Build RAG embeddings (or transfer from another machine):
   ```bash
   python -c "from ventspace_llm import build_amod_collection; build_amod_collection()"
   ```
   
   **Alternative**: Transfer embeddings from another machine to avoid rebuild:
   ```bash
   scp -r ~/chroma_store user@gpu-machine:~/chroma_store
   ```

4. Start backend (expose on public IP):
   ```bash
   PORT=5050 python app.py
   ```
   
   Note the IP address (e.g., `192.168.1.100`) or domain.

### On Your Local Machine

Connect frontend to remote GPU backend:

```bash
REACT_APP_API_URL=http://<gpu-machine-ip>:5050 npm start
```

Replace `<gpu-machine-ip>` with the GPU machine's IP address or hostname.

## Features

- **Period Logging** — Track cycle start dates and sync insights
- **Real-Time Chat** — Text input or voice recording (MediaRecorder API)
- **AI Analysis** — Mistral LLM with cycle-aware scoring (text 0.6 + audio emotion 0.4 + phase adjustment)
- **Crisis Detection** — Immediate helpline escalation (988 / Crisis Text Line)
- **PDF Reports** — Chat session summaries and weekly pattern insights
- **RAG Retrieval** — Optional AMOD dataset context for higher-quality responses

## Environment Variables

- `PORT` (backend) — Flask server port (default: 5000, use 5050 on macOS)
- `REACT_APP_API_URL` (frontend) — Backend API URL (default: `http://localhost:5050`)

## Troubleshooting

**"Address already in use" on startup**
- Port 5000 is reserved for AirPlay on macOS. Use `PORT=5050 python app.py` instead.

**Audio transcription fails ("ffmpeg not found")**
- Install ffmpeg (see Prerequisites) and restart the backend.

**Repeated responses instead of varied ones**
- LLM likely not loading on CPU. GPU strongly recommended. Heuristic fallback will be used until GPU available.

**RAG collection warning on startup**
- RAG is optional. Skip the build step or run `build_amod_collection()` once.

---

Built for SheHacks 🌸
