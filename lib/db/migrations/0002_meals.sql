-- Block A.1 — save scanned items as meals.
--
-- Adds the four columns we need to turn a raw food_scans row into a
-- user-confirmed meal log entry:
--   suggested_item_name  : the AI's plain-English guess (e.g. "porridge with banana"),
--                          stored alongside the scan so the UI can prefill it.
--   meal_name            : user-confirmed name; nullable until the user saves.
--   saved                : false by default; flips to true on "Save meal".
--   eaten_at             : separate from created_at so users can back-date.
--
-- We also add an index on (user_id, saved, eaten_at) so /meals can query
-- the latest saved meals cheaply.
--
-- This file is hand-written rather than drizzle-kit-generated to keep the
-- migration history readable and reviewable per-block. Schema.ts is the
-- source of truth; `pnpm db:push` will not produce a diff after this runs.

alter table public.food_scans
  add column if not exists suggested_item_name text,
  add column if not exists meal_name text,
  add column if not exists saved boolean not null default false,
  add column if not exists eaten_at timestamp with time zone;

create index if not exists food_scans_user_saved_idx
  on public.food_scans (user_id, saved, eaten_at);

-- RLS already covers food_scans (see 0001_rls.sql). The existing
-- food_scans_owner_select / _insert / _delete policies apply unchanged to
-- the new columns. We need a new *update* policy so the saveMeal server
-- action can write meal_name / saved / eaten_at on the user's own rows.
create policy "food_scans_owner_update" on public.food_scans
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
