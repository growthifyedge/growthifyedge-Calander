-- ============================================================================
--  push_subscriptions — stores Web Push subscriptions (Step 4)
--  Run in the Supabase SQL editor. Written ONLY by the server (service role key)
--  via /api/save-push-subscription, so RLS is enabled with no public policies.
-- ============================================================================

create table if not exists push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      text,
  device_id    text not null,
  endpoint     text not null,
  subscription jsonb not null,
  user_agent   text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- One row per browser/device push endpoint (conflict target for upsert).
create unique index if not exists push_subscriptions_endpoint_key
  on push_subscriptions (endpoint);

-- Helpful lookup indexes for later (sending reminders by user/device).
create index if not exists push_subscriptions_user_id_idx on push_subscriptions (user_id);
create index if not exists push_subscriptions_device_id_idx on push_subscriptions (device_id);

-- Lock the table down: the anon/auth clients never touch it directly.
-- The service-role key used by the API route bypasses RLS.
alter table push_subscriptions enable row level security;
