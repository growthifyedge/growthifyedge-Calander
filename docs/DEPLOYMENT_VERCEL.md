# Deployment Guide — Vercel

GrowthifyEdge OS is a static Vite SPA, so it deploys to Vercel's free (Hobby) tier in a
couple of minutes.

## Option A — Deploy from Git (recommended)

1. Push the project to a GitHub/GitLab/Bitbucket repo.
2. At [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Vercel auto-detects **Vite**. Confirm the settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Add **Environment Variables** (only if using Supabase):
   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | your Supabase anon key |
   | `VITE_DATA_SOURCE` | `supabase` |
5. Click **Deploy**. You'll get a `https://your-app.vercel.app` URL.

> Re-deploys happen automatically on every push to the production branch.

## Option B — Deploy with the CLI

```bash
npm i -g vercel
vercel            # first run: link/create the project
vercel --prod     # deploy to production
```

Set env vars once with:

```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_DATA_SOURCE       # value: supabase
```

## SPA routing

The app uses **hash routing** (`/#/tasks`), so no rewrite rules are required — every URL
resolves to `index.html` automatically. (If you later switch to browser routing, add a
`vercel.json` rewrite of all paths to `/index.html`.)

## After deploying with Supabase

1. In **Supabase → Authentication → URL Configuration**, add your Vercel URL to **Site
   URL** and **Redirect URLs** (e.g. `https://your-app.vercel.app`).
2. Open the deployed URL, sign up / sign in, and confirm data syncs.

## Custom domain

Vercel → Project → **Settings → Domains** → add your domain and follow the DNS
instructions. Remember to also add the custom domain to Supabase's allowed URLs.

## Other static hosts

The same `dist/` output works on Netlify, Cloudflare Pages, GitHub Pages, or any static
host. Build command `npm run build`, publish directory `dist`, and set the same `VITE_*`
environment variables.
