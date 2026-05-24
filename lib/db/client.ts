import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Server-only Drizzle handle.
 *
 * On Vercel, the Supabase Marketplace integration sets `POSTGRES_URL` to the
 * pooled connection string. We use that. For local dev `vercel env pull`
 * brings it down to .env.local.
 *
 * We deliberately use the `postgres` driver (not `pg`) so this stays edge-
 * compatible — though most of our DB-touching routes run on the Node runtime
 * to play nicely with Supabase Auth cookies.
 */

declare global {
  var __gwinyaDb: ReturnType<typeof drizzle> | undefined;
}

function buildClient() {
  const url =
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "Database URL missing. Set POSTGRES_URL (Vercel Marketplace wires this) or DATABASE_URL.",
    );
  }

  const client = postgres(url, {
    prepare: false, // pgbouncer compatibility
    max: 1, // serverless: one socket per cold start
  });

  return drizzle(client, { schema });
}

export const db = globalThis.__gwinyaDb ?? buildClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__gwinyaDb = db;
}

export { schema };
