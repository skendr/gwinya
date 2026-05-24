-- Block C — plan history.
--
-- Every save into clinical_plan first inserts a jsonb snapshot of the
-- previous row here, so users can see "your plan changed from L5 to L7
-- on this date" without us paying for full per-column auditing.
--
-- A single jsonb column keeps the migration simple and is fine for an
-- audit log we read by user + date, not by individual field.

create table if not exists public.clinical_plan_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  snapshot jsonb not null,
  replaced_at timestamp with time zone not null default now()
);

create index if not exists clinical_plan_history_user_replaced_idx
  on public.clinical_plan_history (user_id, replaced_at);

alter table public.clinical_plan_history enable row level security;

-- Read-own + insert-own. Updates and deletes are deliberately omitted —
-- this is an append-only audit log.
create policy "clinical_plan_history_owner_select" on public.clinical_plan_history
  for select using (auth.uid() = user_id);

create policy "clinical_plan_history_owner_insert" on public.clinical_plan_history
  for insert with check (auth.uid() = user_id);
