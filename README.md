# Salagrilli 2026

A minimal landing page for upcoming puzzles, built with Vue 3 and Tailwind CSS.

## About

Serveri ry is a Computer Science student association at the University of Eastern Finland (Kuopio campus). 
Salagrillit is an event from the past that we are now bringing back. In the summer there are no student events. 
Salagrillit is a way to bring students together in the summer over barbecue. To get the time and location of Salagrillit, 
students need to solve few cs puzzles. The difficulty is an honest question at this point, it should be challenging to masters students, 
but also doable for first year students.

Challenges:

1. .wav file with a hidden message in the audio spectrum. First letter of the location name.
2-8. TODO — stub pages exist at `public/puzzle-2/index.html` through `public/puzzle-8/index.html`,
ready to be filled in with real content using the same pattern as puzzle 1.

## Architecture

- **Frontend** (this repo's root): Vue 3 + Vite + Tailwind, a static site. Deploys anywhere that
  serves static files (e.g. GitHub Pages).
- **Backend** (`server/`): a small stateless Express service that powers the chat widget. It
  holds the Gemini API key and the per-puzzle knowledge base, and is meant to run as a Docker
  container on your own VPS — never bundled into or deployed with the frontend.
- **Chat widget** (`public/chat-widget.js`): a single dependency-free vanilla-JS file included
  via a `<script>` tag on every puzzle page and on the landing page. It talks to the backend
  over HTTPS; the two halves communicate purely over that one `/api/chat` endpoint.

## Setup

```bash
npm install
npm run dev
```

For the chat widget to work in dev, also run the backend locally — see `server/README.md`.

## Build

```bash
npm run build
npm run preview
```

If deploying to GitHub Pages as a project page (served from a subpath rather than the domain
root), add a matching `base` option to `vite.config.js`.

## Customize puzzles

Edit `src/data/puzzles.js` to update titles, subtitles, and URLs for each puzzle link.

## Adding a new puzzle

1. Copy the stub pattern from an existing `public/puzzle-N/index.html` (plain static HTML,
   black background, no build step) and fill in the actual puzzle content in place of the
   `<!-- TODO -->` placeholder.
2. Keep the `<script src="/chat-widget.js" data-puzzle="N" data-api-base="...">` tag, with
   `data-puzzle` matching the puzzle number, so the chat assistant knows which puzzle is open.
3. Add/update the corresponding entry in `server/src/knowledge/puzzles.js`: a `summary`, a list
   of `hints` the bot may give freely, and — only for puzzles you deliberately want to make a
   "jailbreak me" side-challenge — `hasAnswer: true` plus the real `answer` and a
   `guardInstruction`. See the comment block at the top of that file for the full contract.
4. If the puzzle's URL doesn't follow the default `/puzzle-N/index.html` pattern (e.g. it's
   hosted externally), update the `url` for that id in `src/data/puzzles.js` too.

## Chat widget

`public/chat-widget.js` is a self-contained floating chat bubble/panel with no build dependency
— it can be dropped into any plain HTML page or the Vue app via:

```html
<script src="/chat-widget.js" data-puzzle="N" data-api-base="https://your-backend-host" defer></script>
```

- `data-puzzle`: `"1"`–`"8"` for a specific puzzle, or `"general"` for the landing page.
- `data-api-base`: the backend's origin (no trailing slash). Note this is repeated per page
  (one per puzzle page + the landing page) rather than centrally configured — a deliberate
  trade-off for a hunt this size; if the backend URL changes, update it in each file.

On the Vue landing page it's injected by `src/components/ChatWidgetLoader.vue` using
`VITE_CHAT_API_BASE` from the environment (see `.env.example`) instead of a hardcoded attribute.

## Chat backend

See `server/README.md` for running the backend locally or via Docker, and for how the
per-puzzle knowledge base (hints vs. guarded answers) works.

## Logo

The logo lives in `public/logo.svg` (sourced from `Logos/serveri.svg`).
