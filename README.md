# GrowthifyEdge OS

A premium, mobile-friendly **agency operating system** — tasks, clients, projects, files,
content approvals, calendar, meeting notes, and reports in one fast workspace.

**Backend:** Supabase (Postgres + Auth + Storage), free tier — with email + password
login and per-user data isolation (RLS). It also runs in a **local mode** (browser
IndexedDB, no login) when no Supabase keys are present, so you can try it instantly or
work fully offline.

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173  (local mode, no setup)
```

To enable cloud sync + login, follow [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md),
then restart. More detail in [docs/DEPLOYMENT_VERCEL.md](docs/DEPLOYMENT_VERCEL.md).

---

## Deploy to GitHub + Vercel

> **Build command:** `npm run build`  ·  **Output directory:** `dist`  ·  **Framework:** Vite
> (also pinned in `vercel.json`). Secrets live only in `.env` (gitignored) and Vercel env vars.

### 1. Push to GitHub

Run these from inside the `growthifyedge-os` folder (this is the repo root):

```bash
git init
git add .
git commit -m "GrowthifyEdge OS v1.0"
git branch -M main
```

Then create the remote and push — either with the GitHub CLI:

```bash
gh repo create growthifyedge-os --private --source=. --remote=origin --push
```

…or manually: create an empty repo at https://github.com/new (no README/.gitignore),
then:

```bash
git remote add origin https://github.com/<your-username>/growthifyedge-os.git
git push -u origin main
```

> ✅ `.env` is gitignored — confirm with `git status` that **`.env` is NOT listed** before
> pushing. Only `.env.example` (blank template) should be committed.

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New… → Project** → import your repo.
2. Vercel auto-detects **Vite**. Confirm:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
3. Add **Environment Variables** (Settings → Environment Variables) — see below.
4. Click **Deploy**. You'll get `https://<your-app>.vercel.app`. Every push to `main`
   redeploys automatically.

### 3. Supabase environment variables

Add these in **Vercel → Project → Settings → Environment Variables** (Production +
Preview). Get the values from **Supabase → Project Settings → API**:

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_SUPABASE_URL` | `https://<project>.supabase.co` | Bare project URL — **no** `/rest/v1/` suffix |
| `VITE_SUPABASE_ANON_KEY` | your **anon / publishable** key | Never use the `service_role` key in the frontend |
| `VITE_DATA_SOURCE` | `supabase` | Forces cloud mode (optional — auto when keys present) |

After the first deploy, in **Supabase → Authentication → URL Configuration** add your
Vercel URL to **Site URL** and **Redirect URLs**. Locally, copy `.env.example` → `.env`
and paste the same keys (`.env` is gitignored).

> No keys set anywhere? The app still runs in **local mode** (IndexedDB, no login).

---

## Mobile testing checklist

Open the deployed URL on a phone (Chrome / Edge / Android Chrome / iOS Safari) and verify:

- [ ] **Login / sign-up** works and persists across refresh (cloud mode).
- [ ] **Sidebar** collapses to a hamburger drawer; nav + close work.
- [ ] **No horizontal scrolling** on any screen (Dashboard, Tasks, Calendar, etc.).
- [ ] **Dashboard** stat cards reflow (2-up) and widgets stack cleanly.
- [ ] **Tasks**: List rows readable; Kanban columns stack/scroll; create/edit modal usable.
- [ ] **Bulk bar** (select tasks) stays centered on-screen — Delete + clear reachable.
- [ ] **Add to Home Screen** launches full-screen; theme-color matches accent.
- [ ] **File upload** from camera/photos works; preview + download work.
- [ ] **Reminders**: tap "Enable notifications" in Settings → grant → "Send test" fires.
- [ ] **Dark mode** toggle and accent colour apply correctly.
- [ ] Drag-to-reschedule on Calendar and drag between Kanban columns work by touch.

## Documentation

| Guide | |
|-------|--|
| [Installation](docs/INSTALLATION.md) | Prereqs, scripts, troubleshooting |
| [Supabase setup](docs/SUPABASE_SETUP.md) | Tables, RLS, storage, auth, keys |
| [Deployment (Vercel)](docs/DEPLOYMENT_VERCEL.md) | Static deploy + env vars |
| [Project structure](docs/PROJECT_STRUCTURE.md) | Annotated file tree + architecture |
| [Production checklist](docs/PRODUCTION_CHECKLIST.md) | QA report + go-live steps |

## Modules

| Module | Highlights |
|--------|-----------|
| **Dashboard** | Due Today / Tomorrow / Overdue, **upcoming reminders**, deadlines, activity, uploads, status/priority charts |
| **Tasks** | List / Kanban / Calendar · search, filters, sort, drag-and-drop · **recurring tasks**, **dependencies**, **tags**, **reminders**, attachments |
| **Reminders & notifications** | Browser notifications for reminder / due / overdue. Per-task reminder: none, at due, 15m/30m/1h/1d before, or custom. No apps or paid services |
| **Clients** | Contacts + WhatsApp; tabs for tasks, projects, files, meetings |
| **Projects** | Belong to clients; status, due date, progress; related tasks/files/approvals |
| **File Center** | Upload images/video/PDF/docs · preview, download, search, filter · link to client/project/task |
| **Content Approvals** | Draft → Review → Revision → Approved pipeline (drag to advance) + history |
| **Calendar** | Day/Week/Month with tasks, deadlines, meetings · drag-to-reschedule |
| **Meeting Notes** | Notes, decisions, action items · convert an action item into a task |
| **Reports** | Pending / completed / overdue / client / project · export PDF + CSV |
| **Settings** | Light/dark, accent colour, **notifications**, profile, account/sign-out, backup/restore, data source |

## Tech

React · Vite · Tailwind CSS · React Router · Framer Motion · Recharts · lucide-react ·
localforage (IndexedDB) · Supabase (Postgres + Auth + Storage).

## Status

**Version 1.0 — production ready.** See the [QA report & checklist](docs/PRODUCTION_CHECKLIST.md).
