# VentSpace

Vent freely. Understand yourself. Know when to ask for help.

## Integrated Components

- React frontend (chat and journaling UI)
- Python LLM module (`ventspace_llm.py`)
- Python setup/bootstrap script (`setup.py`)

## Frontend Setup

```bash
npm install
npm start
```

App runs on `http://localhost:3000`.

## Backend/LLM Setup

```bash
python setup.py
```

Then import and use the module from your Flask app:

```python
from ventspace_llm import generate_response

result = generate_response(user_text, cycle_phase)
```

## Recommended Next Integration Steps

1. Merge the audio pipeline branch and resolve any Python dependency conflicts.
2. Add a Flask `app.py` with `/analyze` and `/analyze-audio` endpoints.
3. Connect the React frontend to Flask via one base API URL config.
4. Add a single project-level `.env.example` for both frontend and backend keys.
5. Add smoke tests for text flow, audio flow, and cycle phase calculation.
- **Continuous Chat** — the Today tab is now a chat-style interface where you can keep venting back and forth (press Enter to send), not just one entry and done
- **Project Structure** — files are organized into proper `components/` and `pages/` folders so `npm start` actually works

---

Built for SheHacks 🌸
>>>>>>> origin/frontend
