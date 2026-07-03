# Salagrillit chat backend

Stateless Express service that powers the puzzle-aware chat widget. Holds the Gemini API
key and per-puzzle knowledge base server-side — never exposed to the browser.

## Run locally

```bash
cd server
npm install
cp .env.example .env   # fill in GEMINI_API_KEY, set ALLOWED_ORIGIN to your frontend origin
npm run dev             # or: npm start
```

`GET /health` should return `{"status":"ok"}` once running.

## Run via Docker

From the repo root, after populating `server/.env`:

```bash
docker compose up --build
```

## Editing the knowledge base

- `src/knowledge/general.js` — event/Serveri ry background, always included in the system prompt.
- `src/knowledge/puzzles.js` — per-puzzle entries (`summary`, `hints`, `hasAnswer`, and — only
  when `hasAnswer: true` — `answer` + `guardInstruction`). See the comment at the top of that
  file for the full field contract and why `hasAnswer: true` is an intentional, guardable-but-not-
  bulletproof side-challenge rather than a bug.

No restart-free config reload — after editing the knowledge base, restart the process (or
`docker compose up --build` again).
