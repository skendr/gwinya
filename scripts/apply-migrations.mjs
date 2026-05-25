#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Apply hand-written SQL migrations against the configured Supabase
 * project using the Management API. Useful when .env.local doesn't
 * carry direct Postgres URLs (Vercel-pulled envs sometimes don't).
 *
 * Requires SUPABASE_PAT (a Personal Access Token) and either
 * SUPABASE_PROJECT_REF or NEXT_PUBLIC_SUPABASE_URL so we can derive
 * the project ref.
 *
 * Idempotent for most statements (CREATE/ALTER ... IF NOT EXISTS).
 * "create policy" doesn't support IF NOT EXISTS — we treat "already
 * exists" as success so re-runs are safe.
 *
 *   node scripts/apply-migrations.mjs 0002_meals.sql 0003_slt_slip.sql 0004_plan_history.sql
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

const pat = process.env.SUPABASE_PAT;
const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ref = process.env.SUPABASE_PROJECT_REF || projectUrl?.match(/^https?:\/\/([a-z0-9]+)\./)?.[1];

if (!pat) {
  console.error("Missing SUPABASE_PAT");
  process.exit(1);
}
if (!ref) {
  console.error("Missing SUPABASE_PROJECT_REF (or NEXT_PUBLIC_SUPABASE_URL we can derive it from)");
  process.exit(1);
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node scripts/apply-migrations.mjs <file>...");
  process.exit(1);
}

/** Run a single SQL statement through the Management API's /database/query endpoint. */
async function runQuery(stmt) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: stmt }),
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  if (!res.ok) {
    const err = new Error(
      typeof body === "object" && body && "message" in body
        ? String(body.message)
        : `HTTP ${res.status}: ${text.slice(0, 200)}`,
    );
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

// Split a SQL file into individual statements on semicolons that sit
// outside of string literals or dollar-quoted blocks. Line comments
// (-- ...) are stripped first so a comment-then-statement file
// doesn't see its real SQL discarded as "starts with --".
function splitStatements(text) {
  const stripped = text
    .split("\n")
    .map((line) => {
      // Strip "-- ..." comments unless they sit inside a single-quoted
      // string. Migrations here don't contain SQL strings with --
      // inside them, so a naive strip is safe.
      const idx = line.indexOf("--");
      return idx === -1 ? line : line.slice(0, idx);
    })
    .join("\n");

  const out = [];
  let buf = "";
  let inSingle = false;
  let inDollar = false;
  for (let i = 0; i < stripped.length; i++) {
    const c = stripped[i];
    const next = stripped[i + 1];
    if (!inDollar && c === "'" && stripped[i - 1] !== "\\") inSingle = !inSingle;
    if (!inSingle && c === "$" && next === "$") {
      inDollar = !inDollar;
      buf += c;
      continue;
    }
    if (!inSingle && !inDollar && c === ";") {
      const trimmed = buf.trim();
      if (trimmed) out.push(trimmed);
      buf = "";
      continue;
    }
    buf += c;
  }
  const tail = buf.trim();
  if (tail) out.push(tail);
  return out;
}

function isBenign(err) {
  const msg = ((err.message || "") + JSON.stringify(err.body || {})).toLowerCase();
  return msg.includes("already exists") || msg.includes("duplicate");
}

console.log(`Applying migrations to project ${ref} via Supabase Management API.`);
let totalRan = 0;
let totalSkipped = 0;

for (const arg of files) {
  const path = resolve("lib/db/migrations", arg);
  const text = readFileSync(path, "utf8");
  const stmts = splitStatements(text);
  console.log(`\n=== ${arg} — ${stmts.length} statements ===`);
  for (const [i, stmt] of stmts.entries()) {
    const preview = stmt.replace(/\s+/g, " ").slice(0, 80);
    try {
      await runQuery(stmt);
      totalRan++;
      console.log(`  [${i + 1}] ✓  ${preview}${preview.length === 80 ? "…" : ""}`);
    } catch (err) {
      if (isBenign(err)) {
        totalSkipped++;
        console.log(`  [${i + 1}] •  (already applied) ${preview}${preview.length === 80 ? "…" : ""}`);
      } else {
        console.error(`  [${i + 1}] ✗  ${preview}`);
        console.error(`        ${err.message}`);
        process.exit(1);
      }
    }
  }
}

console.log(`\nDone. ${totalRan} applied, ${totalSkipped} skipped (already present).`);
