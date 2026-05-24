import { NextRequest } from "next/server";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

/**
 * TEMPORARY one-shot migration endpoint.
 *
 * Token-gated. Runs every committed SQL file in lib/db/migrations/ in
 * lexical order (Drizzle names them 0000_…, 0001_…, etc.), splitting on
 * Drizzle's `--> statement-breakpoint` markers. Continues past per-
 * statement failures so policy/type "already exists" errors on re-run
 * don't abort progress.
 *
 * DELETE THIS FILE after the first successful run.
 */

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token || !process.env.MIGRATION_TOKEN || token !== process.env.MIGRATION_TOKEN) {
    return Response.json({ error: "unauthorised" }, { status: 401 });
  }

  const url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!url) return Response.json({ error: "POSTGRES_URL missing" }, { status: 500 });

  const sql = postgres(url, { prepare: false, max: 1, ssl: "require" });
  type StmtResult = { file: string; snippet: string; ok: boolean; error?: string };
  const results: StmtResult[] = [];

  try {
    const migDir = join(process.cwd(), "lib/db/migrations");
    const files = readdirSync(migDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const content = readFileSync(join(migDir, file), "utf8");
      const stmts = content
        .split(/--> statement-breakpoint/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      for (const stmt of stmts) {
        try {
          await sql.unsafe(stmt);
          results.push({ file, snippet: stmt.slice(0, 80).replace(/\s+/g, " "), ok: true });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          results.push({
            file,
            snippet: stmt.slice(0, 80).replace(/\s+/g, " "),
            ok: false,
            error: msg,
          });
        }
      }
    }
  } finally {
    await sql.end({ timeout: 5 });
  }

  const okCount = results.filter((r) => r.ok).length;
  const errCount = results.length - okCount;
  return Response.json({
    summary: `${okCount} ok / ${errCount} errors`,
    errors: results.filter((r) => !r.ok),
    ok: results.filter((r) => r.ok).map((r) => `${r.file}: ${r.snippet}`),
  });
}
