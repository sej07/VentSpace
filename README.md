# VentSpace: Team 2
## Team Members:
- Sejal Barshikar
- Samantha John
- Rucha Bhandari
- Kashish Khatri

Vent freely. Understand yourself. Know when to ask for help.

Integrated period tracking, AI-powered venting analysis, and supportive chat responses with cycle-aware insights.

## Inspiration
Nearly half of ChatGPT users already turn to it as their primary support when dealing with mental health struggles. Women make up nearly 60% of that group. People are already reaching out to AI when they're hurting. The problem is that general-purpose AI isn't built for this. It doesn't track patterns, it doesn't understand context. VentSpace is built specifically for what's already happening and does it right. VentSpace is an AI companion that listens to women's venting, detects harmful patterns and adjusts its understanding based on their menstrual cycle phase, as well as generates ready-made reports for healthcare professionals.

## Impact of the Solution
 
VentSpace is a multimodal AI companion and triage tool built exclusively for women. She vents — by voice or text — and VentSpace does three things:
 
- **Detects in real time** where she sits on the spectrum from healthy venting to self-destruction
- **Contextualizes her emotional state** against her menstrual cycle phase — so the app knows the difference between expected luteal phase sensitivity and a genuine red flag
- **Acts as a mediator** — either validating her, nudging her toward coping strategies, or clearly recommending she speak to a therapist with a ready-made session report in hand
 
The key insight that makes this different: a woman's emotional baseline shifts every single week of her cycle. Every existing mental health app ignores this completely. VentSpace doesn't. Without cycle data, an app might over-alarm during luteal phase when self-criticism is hormonally expected — or miss a genuine red flag during follicular phase when she should be feeling her best. VentSpace adjusts its sensitivity dynamically, making the analysis genuinely personalized rather than one-size-fits-all.
 
She stays in complete control. Nothing is sent anywhere without her explicit action. The app never contacts a therapist directly.

## Tech Stack 
| Component | Technology |
|-----------|------------|
| Frontend | React |
| Backend API | Flask |
| Speech transcription | Whisper-small (Hugging Face) |
| Audio emotion analysis | librosa + SVM classifier (RAVDESS + CREMA-D) |
| Text classification | RAG based(Amod dataset) |
| Cycle phase calculator | Python |
| Weekly report | ReportLab PDF + matplotlib |

## Quick Start (Local Development)

### 1. Frontend Setup

```bash
npm install
npm start
```

Frontend runs on `http://localhost:3000`.

### 2. Backend Setup

Create Python environment:
```bash
python -m venv shenv
source shenv/bin/activate  # macOS/Linux
# or: shenv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 3. Build RAG Embeddings

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

3. Build RAG embeddings:
   ```bash
   python -c "from ventspace_llm import build_amod_collection; build_amod_collection()"
   ```

4. Start backend:
   ```bash
   PORT=5050 python app.py
   ```

## Features

- **Period Logging** — Track cycle start dates and sync insights
- **Real-Time Chat** — Text input or voice recording
- **AI Analysis** — Mistral LLM with cycle-aware scoring
- **Crisis Detection** — Immediate helpline escalation
- **PDF Reports** — Chat session summaries and weekly pattern insights
- **RAG Retrieval** — Optional AMOD dataset context for higher-quality responses

## Challenges Faced
 
- **Multimodal fusion** — combining three independent signals (audio emotion, text classification, cycle phase) into a single coherent output required careful weight tuning so no signal dominated unfairly; the cycle phase modifier especially had no existing benchmark to reference
- **Cycle-aware sensitivity** — defining what "adjusted threshold" actually means per phase required us to make judgment calls grounded in hormonal research rather than labeled data, since no dataset exists that pairs menstrual phase with emotional speech
- **Audio data quality** — a subset of CREMA-D files were corrupted or in unsupported formats and had to be filtered during feature extraction, reducing our training set
- **RoBERTa fine-tuning on messy data** — real venting language is fragmented, informal, and emotionally ambiguous; CounselChat and the Amod dataset provided counselor-facing text which required preprocessing to match the register of actual user input
- **React to Flask latency** — the full pipeline (Whisper transcription + librosa extraction + classification + RoBERTa inference) introduced noticeable response delay; managing the async flow in the frontend while keeping the UI feel responsive was a UX challenge
- **PDF report generation** — embedding matplotlib charts inside a ReportLab PDF with consistent formatting across different data volumes (some users vent once, some vent seven times in a week) required dynamic layout logic
- **Integration under time pressure** — four independently built components (frontend, text pipeline, audio pipeline, fusion layer) needed clean APIs from the start; any interface mismatch cost time we didn't have
- **24-hour constraint** — scoping a production-quality ML pipeline, a fine-tuned language model, a React frontend, and a PDF report generator within a single hackathon day required aggressive and constant prioritization

## Future Scope

- Longitudinal memory: track emotional patterns across weeks and months, not just sessions
- Voice breaking detection: add prosodic features that detect voice cracking as a distress signal
- Therapist portal: an opt-in view where professionals can access reports shared by their clients, reducing onboarding time
- Wearable integration: pull heart rate and sleep data to further contextualize emotional state
- Multilingual support: extend Whisper and RoBERTa pipelines to support non-English venting
- Personalized cycle modeling: move from a fixed 28-day assumption to a learned personal cycle using logged data over time


## AI Tool Disclosure
This project was built with the assistance of AI tools like Claude for development support, including debugging assistance.


## Troubleshooting

**"Address already in use" on startup**
- Port 5000 is reserved for AirPlay on macOS. Use `PORT=5050 python app.py` instead.

**Audio transcription fails ("ffmpeg not found")**
- Install ffmpeg (see Prerequisites) and restart the backend.

**Repeated responses instead of varied ones**
- LLM likely not loading on CPU. GPU strongly recommended. Heuristic fallback will be used until GPU available.

**RAG collection warning on startup**
- RAG is optional. Skip the build step or run `build_amod_collection()` once.

## Video Link:

## Presentation Link: 

### Built for SheHacks 🌸
