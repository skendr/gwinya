#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Recompute food_scans.matches_prescribed deterministically from
 * predicted_level + prescribed_level_at_scan, fixing rows where the
 * stored model output disagrees with the IDDSI arithmetic.
 *
 * Background: until /api/scan started overriding the model's
 * matchesPrescribed with a code-side computation, the value came
 * straight from Claude — and the "more-modified" vs "less-modified"
 * enum labels are ambiguous enough that the model occasionally
 * misclassified. A prescribed-L7 user could see a clearly within-plan
 * L5 meal tagged "outside plan", which is a clinical safety bug.
 *
 * This script catches up the historical data using the Supabase
 * Management API (same path as scripts/apply-migrations.mjs — works
 * when .env.local doesn't carry POSTGRES_URL).
 *
 *   node scripts/backfill-matches-prescribed.mjs [--dry-run]
 */

import { config } from "dotenv";

config({ path: ".env.local" });
config();

const pat = process.env.SUPABASE_PAT;
const ref =
  process.env.SUPABASE_PROJECT_REF ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/^https?:\/\/([a-z0-9]+)\./)?.[1];

if (!pat) {
  console.error("Missing SUPABASE_PAT");
  process.exit(1);
}
if (!ref) {
  console.error("Missing SUPABASE_PROJECT_REF or NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");

async function q(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${pat}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(typeof body === "object" && body && "message" in body ? body.message : `HTTP ${res.status}`);
  }
  return body;
}

/** Mirror lib/content/iddsi.ts:computeMatchesPrescribed. */
function computeMatch(predicted, prescribed) {
  if (predicted == null || prescribed == null) return "unknown";
  if (predicted === prescribed) return "matches";
  if (predicted < prescribed) return "more-modified";
  return "less-modified";
}

console.log(`Backfill against project ${ref}${dryRun ? " (DRY RUN — no writes)" : ""}\n`);

// Pull every comparable row. We only need to consider rows where both
// predicted_level and prescribed_level_at_scan are non-null — those are
// the rows whose verdict can be computed.
const rows = await q(`
  select id, predicted_level, prescribed_level_at_scan, matches_prescribed
  from public.food_scans
  where predicted_level is not null
    and prescribed_level_at_scan is not null
`);

if (!Array.isArray(rows)) {
  console.error("Unexpected response:", rows);
  process.exit(1);
}

console.log(`Inspecting ${rows.length} comparable food_scans rows.`);

const mismatches = [];
for (const r of rows) {
  const correct = computeMatch(r.predicted_level, r.prescribed_level_at_scan);
  if (r.matches_prescribed !== correct) {
    mismatches.push({
      id: r.id,
      predicted: r.predicted_level,
      prescribed: r.prescribed_level_at_scan,
      stored: r.matches_prescribed,
      correct,
    });
  }
}

if (mismatches.length === 0) {
  console.log("\nAll rows already consistent. Nothing to do.");
  process.exit(0);
}

console.log(`\nFound ${mismatches.length} mismatched row(s):\n`);
for (const m of mismatches) {
  console.log(
    `  ${m.id}  predicted=L${m.predicted} prescribed=L${m.prescribed}  ` +
      `${m.stored} → ${m.correct}`,
  );
}

if (dryRun) {
  console.log("\nDry-run complete. Re-run without --dry-run to apply.");
  process.exit(0);
}

console.log("\nApplying fixes…");
// Group by target value to do bulk updates (one round-trip per enum value).
const byTarget = new Map();
for (const m of mismatches) {
  if (!byTarget.has(m.correct)) byTarget.set(m.correct, []);
  byTarget.get(m.correct).push(m.id);
}

for (const [target, ids] of byTarget.entries()) {
  const inClause = ids.map((id) => `'${id}'`).join(", ");
  await q(
    `update public.food_scans set matches_prescribed = '${target}' where id in (${inClause})`,
  );
  console.log(`  set ${ids.length} row(s) → ${target}`);
}

console.log(`\nDone. Updated ${mismatches.length} row(s).`);
