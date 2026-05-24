-- Row Level Security policies for Gwinya.
--
-- Run this AFTER `pnpm db:push` has created the tables. Paste into the
-- Supabase SQL editor, or apply via psql:
--   psql "$POSTGRES_URL_NON_POOLING" -f lib/db/migrations/0001_rls.sql
--
-- Every table holding user data is gated by `auth.uid() = user_id`. RLS is
-- the defence-in-depth layer behind our application-level requireUser()
-- checks — if a bug ever ships a service-role client where a normal one
-- should be, the DB still says no.

-- profiles ----------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_owner_select" on public.profiles
  for select using (auth.uid() = user_id);
create policy "profiles_owner_insert" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "profiles_owner_update" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- clinical_plan -----------------------------------------------------------
alter table public.clinical_plan enable row level security;

create policy "clinical_plan_owner_all" on public.clinical_plan
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- streak ------------------------------------------------------------------
alter table public.streak enable row level security;

create policy "streak_owner_all" on public.streak
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- symptom_logs ------------------------------------------------------------
alter table public.symptom_logs enable row level security;

create policy "symptom_logs_owner_all" on public.symptom_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- lesson_progress ---------------------------------------------------------
alter table public.lesson_progress enable row level security;

create policy "lesson_progress_owner_all" on public.lesson_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- food_scans --------------------------------------------------------------
alter table public.food_scans enable row level security;

create policy "food_scans_owner_select" on public.food_scans
  for select using (auth.uid() = user_id);
create policy "food_scans_owner_insert" on public.food_scans
  for insert with check (auth.uid() = user_id);
create policy "food_scans_owner_delete" on public.food_scans
  for delete using (auth.uid() = user_id);
-- Note: no update policy — scans are append-only. Edit the user_note
-- separately if/when we add that affordance.


-- Storage bucket: food-scans ---------------------------------------------
-- Create the bucket if it doesn't exist; force private (not public).
insert into storage.buckets (id, name, public)
  values ('food-scans', 'food-scans', false)
  on conflict (id) do nothing;

-- Users can read only their own folder. The image path is "<user_id>/<scan_id>.<ext>".
create policy "food_scans_storage_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'food-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Writes / deletes are done by the service role from /api/scan; users do
-- not upload directly. So no insert/delete policy is needed for normal
-- users — but if you ever switch to client-side uploads, add:
--   create policy "food_scans_storage_insert_own" on storage.objects
--     for insert to authenticated
--     with check (
--       bucket_id = 'food-scans'
--       and (storage.foldername(name))[1] = auth.uid()::text
--     );
