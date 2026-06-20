# Supabase Setup Guide

This turns on **email + password login** and **cloud sync** across devices, on the free
tier. Takes ~10 minutes.

## 1. Create a project

1. Sign in at [supabase.com](https://supabase.com) → **New project**.
2. Pick a name, a strong **database password**, and a region near you.
3. Wait for it to finish provisioning (~2 min).

## 2. Create the database tables

1. In the project, open **SQL Editor → New query**.
2. Paste the entire contents of [`supabase/schema.sql`](../supabase/schema.sql) and click
   **Run**.

This creates all tables (`profiles`, `clients`, `projects`, `tasks`, `files`, `meetings`,
`approvals`, `activity`), enables **Row Level Security** so each user only sees their own
rows, and adds a trigger that auto-creates a `profiles` row on signup.

## 3. Create the storage bucket

1. Go to **Storage → New bucket**.
2. Name it exactly **`media`** and leave it **Private** (uncheck "Public bucket").
3. Click **Create**.

The storage access policy (each user confined to their own `/{user_id}/` folder) is
already included at the bottom of `schema.sql`. If you created the bucket *after* running
the SQL, re-run just the storage policy block at the end of the file.

## 4. Get your API keys

1. Go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon / public** key.

> Use the **anon** key only — never the `service_role` key in a frontend app.

## 5. Configure the app

In the project root, copy the template and paste your keys:

```bash
cp .env.example .env
```

```dotenv
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
VITE_DATA_SOURCE=supabase
```

## 6. Run and sign up

```bash
npm run dev
```

You'll now see a **login screen**. Click **Sign up**, create your account with email +
password, then sign in.

- **Email confirmation:** By default Supabase may require confirming your email. To skip
  it for a private single-user app, go to **Authentication → Providers → Email** and turn
  **"Confirm email" off**. Otherwise, check your inbox and confirm before signing in.
- The data source can also be toggled at runtime in **Settings → Data & Storage**.

## How security works (V1)

- Every row carries a `user_id`; RLS policies (`user_id = auth.uid()`) ensure each account
  reads/writes only its own data.
- Storage objects live under `media/{user_id}/…`, restricted by a matching storage policy.
- This is a **single-owner** model. Adding teammates later is additive (an
  `organizations` + `memberships` layer) and does not require reshaping existing tables.

## Free-tier notes

The Supabase free tier (500 MB database, 1 GB storage, 50k monthly active users) is far
beyond a solo agency's needs. Projects pause after ~1 week of inactivity — just open the
dashboard to resume.
