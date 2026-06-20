# Installation Guide

## Prerequisites

- **Node.js 18+** and npm (check with `node -v`). Download from [nodejs.org](https://nodejs.org).
- A modern browser (Chrome, Edge, Firefox, Safari).
- *(Optional)* A free [Supabase](https://supabase.com) account — only needed for cloud
  sync + login. Without it the app runs locally with zero setup.

## 1. Install dependencies

```bash
cd growthifyedge-os
npm install
```

## 2. Run in development

```bash
npm run dev
```

Open the URL it prints (default **http://localhost:5173**).

- **No `.env`?** The app runs in **local mode** — data is saved in your browser
  (IndexedDB), no login required. Great for trying it out or fully offline use.
- **Want cloud sync + login?** Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) first, then
  restart `npm run dev`.

## 3. Build for production

```bash
npm run build      # outputs static files to ./dist
npm run preview    # serve the build locally at http://localhost:4173
```

The build uses **relative asset paths + hash routing**, so `dist/` can be hosted on any
static host (Vercel, Netlify, GitHub Pages, S3) — or even opened directly from the file
system — without server-side route configuration.

## Available scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Type-free production build → `dist/` |
| `npm run preview` | Preview the production build locally |

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `command not found: npm` | Install Node.js (includes npm). |
| Blank page after build opened from `file://` | Use `npm run preview` or a static host; some browsers block `file://` modules. |
| Login screen won't accept credentials | You're in Supabase mode but the project/keys or `media` bucket aren't set up — see [SUPABASE_SETUP.md](SUPABASE_SETUP.md). |
| Want to wipe local demo data | Settings → **Clear all data**, or clear the site's IndexedDB in dev tools. |
