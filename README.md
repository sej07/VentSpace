# VentSpace 🌸
> Vent freely. Understand yourself. Know when to ask for help.

A scrapbook-aesthetic mental wellness journaling app with a period tracker, built in React.

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Start the dev server
```bash
npm start
```
Opens at `http://localhost:3000`

### 3. Build for production
```bash
npm run build
```

---

## Project Structure

```
ventspace/
├── public/
│   └── index.html
├── src/
│   ├── App.jsx
│   ├── index.js
│   ├── components/
│   │   ├── Stickers.jsx
│   │   └── ScrapUI.jsx
│   └── pages/
│       ├── AuthPages.jsx
│       └── MainApp.jsx
├── package.json
└── README.md
```

---

## What's Fixed

- **Download PDF/Notes** — both the session notes (Today tab) and weekly report (Report tab) now generate and download a .txt file with therapist-ready content
- **Continuous Chat** — the Today tab is now a chat-style interface where you can keep venting back and forth (press Enter to send), not just one entry and done
- **Project Structure** — files are organized into proper `components/` and `pages/` folders so `npm start` actually works

---

Built for SheHacks 🌸
