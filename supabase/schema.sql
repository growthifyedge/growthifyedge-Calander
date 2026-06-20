-- ============================================================================
--  GrowthifyEdge OS — Supabase schema (V1: solo user, team-ready)
--  Run in the Supabase SQL Editor. Then:
--    1) Create a PRIVATE Storage bucket named "media"
--    2) Put your project URL + anon key in the app's .env
--    3) Sign up in the app with email + password
--  Every row is owned by user_id and protected by RLS, so each account only
--  ever sees its own data. Adding teammates later is additive (orgs/memberships).
-- ============================================================================

-- ── Profiles (1:1 with auth.users; holds profile fields + settings) ──────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text default 'Agency Owner',
  email       text,
  company     text,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ── Clients ──────────────────────────────────────────────────────────────────
create table if not exists clients (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company     text not null,
  contact     text, email text, phone text, whatsapp text, notes text,
  created_at  timestamptz default now(),
  updated_at  timestamptz
);

-- ── Projects ─────────────────────────────────────────────────────────────────
create table if not exists projects (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null,
  client_id   text references clients(id) on delete set null,
  description text,
  status      text default 'planning' check (status in ('planning','active','on_hold','completed')),
  due_date    timestamptz,
  progress    int default 0 check (progress between 0 and 100),
  created_at  timestamptz default now(),
  updated_at  timestamptz
);

-- ── Tasks (incl. recurrence, dependencies, tags) ─────────────────────────────
create table if not exists tasks (
  id                   text primary key,
  user_id              uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title                text not null,
  description          text,
  client_id            text references clients(id) on delete set null,
  project_id           text references projects(id) on delete set null,
  category             text default 'General',
  priority             text default 'medium' check (priority in ('low','medium','high','urgent')),
  status               text default 'pending' check (status in ('pending','in_progress','review','done')),
  due_date             timestamptz,
  notes                text,
  tags                 jsonb default '[]',        -- array of strings
  dependencies         jsonb default '[]',        -- array of task ids this task is blocked by
  recurrence           text default 'none' check (recurrence in ('none','daily','weekly','monthly','custom')),
  recurrence_interval  int,                        -- days, when recurrence = 'custom'
  recurrence_until     timestamptz,                -- optional stop date
  reminder             text default 'none' check (reminder in ('none','at_due','15m','30m','1h','1d','custom')),
  reminder_custom_at   timestamptz,                -- exact time when reminder = 'custom'
  completed_at         timestamptz,
  created_at           timestamptz default now(),
  updated_at           timestamptz
);

-- Add reminder columns to pre-existing installs (no-op on fresh databases)
alter table tasks add column if not exists reminder text default 'none';
alter table tasks add column if not exists reminder_custom_at timestamptz;

-- ── Files (metadata; bytes live in the "media" bucket at storage_path) ────────
create table if not exists files (
  id           text primary key,
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name         text not null,
  mime         text, size bigint, kind text,
  storage_path text,
  client_id    text references clients(id) on delete set null,
  project_id   text references projects(id) on delete set null,
  task_id      text references tasks(id) on delete set null,
  approval_id  text,
  created_at   timestamptz default now()
);

-- ── Meetings ─────────────────────────────────────────────────────────────────
create table if not exists meetings (
  id           text primary key,
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title        text not null,
  client_id    text references clients(id) on delete set null,
  date         timestamptz,
  notes        text, decisions text,
  action_items jsonb default '[]',
  created_at   timestamptz default now(),
  updated_at   timestamptz
);

-- ── Content approvals ────────────────────────────────────────────────────────
create table if not exists approvals (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title       text not null,
  client_id   text references clients(id) on delete set null,
  project_id  text references projects(id) on delete set null,
  status      text default 'draft' check (status in ('draft','review','revision','approved')),
  notes       text,
  file_ids    jsonb default '[]',
  history     jsonb default '[]',
  created_at  timestamptz default now(),
  updated_at  timestamptz
);

-- ── Activity feed ─────────────────────────────────────────────────────────────
create table if not exists activity (
  id      text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type    text, action text, entity text,
  at      timestamptz default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists idx_tasks_user on tasks(user_id);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_projects_user on projects(user_id);
create index if not exists idx_clients_user on clients(user_id);
create index if not exists idx_files_user on files(user_id);

-- ============================================================================
--  Row Level Security — each user sees only their own rows
-- ============================================================================
alter table profiles enable row level security;
drop policy if exists "self_profile" on profiles;
create policy "self_profile" on profiles for all using (id = auth.uid()) with check (id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['clients','projects','tasks','files','meetings','approvals','activity']
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "owner_all" on %I;', t);
    execute format('create policy "owner_all" on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid());', t);
  end loop;
end $$;

-- ============================================================================
--  Storage — private "media" bucket, each user confined to a /{uid}/ folder
--  Create the bucket first (Dashboard → Storage → New bucket → "media", private),
--  or uncomment the insert below, then run these policies.
-- ============================================================================
-- insert into storage.buckets (id, name, public) values ('media','media', false)
--   on conflict (id) do nothing;

drop policy if exists "media_own_files" on storage.objects;
create policy "media_own_files" on storage.objects for all
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
