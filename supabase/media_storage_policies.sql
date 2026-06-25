-- ============================================================================
--  media Storage bucket + RLS policies  (fixes attachment / File Center uploads)
--  Run this in: Supabase Dashboard → SQL Editor → New query → Run.
--
--  Symptom it fixes: uploads fail with "Bucket not found" or
--  "new row violates row-level security policy" and nothing lands in
--  Storage → media or the files table.
--
--  The app uploads to:  media/{auth.uid()}/{fileId}
--  so each signed-in user may only read/write inside their own /{uid}/ folder.
--  Safe + idempotent — re-running it does no harm.
-- ============================================================================

-- 1) Ensure the PRIVATE bucket exists (no-op if it already does).
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

-- 2) Policies on storage.objects scoped to the media bucket + the user's folder.
--    (storage.foldername(name))[1] is the first path segment = the user's id.
drop policy if exists "media_own_files"        on storage.objects;
drop policy if exists "media_insert_own"       on storage.objects;
drop policy if exists "media_select_own"       on storage.objects;
drop policy if exists "media_update_own"       on storage.objects;
drop policy if exists "media_delete_own"       on storage.objects;

create policy "media_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "media_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "media_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "media_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
