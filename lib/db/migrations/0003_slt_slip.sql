-- Block B — SLT eating-and-drinking-recommendations slip parser.
--
-- Adds the columns we extract from a clinician's slip:
--   posture              : printed posture line ("Sit upright for all swallowing")
--   special_precautions  : only the checkboxes the SLT actually ticked
--   warning_signs        : printed form warning list (verbatim)
--   educational_links    : labelled URLs (often YouTube) from the PLAN box
--   raw_plan_text        : verbatim PLAN-box text — kept for audit so neither
--                          we nor the model can paraphrase clinical instructions
--   source_image_path    : storage key under the clinical-plans bucket
--   parsed_confidence    : 'low'|'medium'|'high', from the vision model
--   parsed_at            : when the row was last replaced from a scan
--
-- Also creates the private clinical-plans Storage bucket and an RLS
-- policy that mirrors food-scans: each user can only read objects under
-- their own folder. Service-role uploads are still possible from the
-- /api/plan/scan route handler.

alter table public.clinical_plan
  add column if not exists posture              text,
  add column if not exists special_precautions  jsonb default '[]'::jsonb,
  add column if not exists warning_signs        jsonb default '[]'::jsonb,
  add column if not exists educational_links    jsonb default '[]'::jsonb,
  add column if not exists raw_plan_text        text,
  add column if not exists source_image_path    text,
  add column if not exists parsed_confidence    text,
  add column if not exists parsed_at            timestamp with time zone;

-- Storage bucket: clinical-plans -----------------------------------------
insert into storage.buckets (id, name, public)
  values ('clinical-plans', 'clinical-plans', false)
  on conflict (id) do nothing;

-- Image paths are "<user_id>/<scan_id>.<ext>" — same pattern as food-scans.
create policy "clinical_plans_storage_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'clinical-plans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Uploads happen server-side from /api/plan/scan with the service-role
-- client, so no insert/delete policy is needed for normal users. If we
-- ever switch to direct client uploads, add the analogous insert policy.
