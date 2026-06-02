import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Server-only Drizzle handle.
 *
 * On Vercel, the Supabase Marketplace integration injects `POSTGRES_URL`
 * at runtime. We use that. For local dev `vercel env pull` brings it
 * down to .env.local.
 *
 * The handle is exposed as a Proxy that lazily constructs the underlying
 * client on first property access. Two reasons:
 *
 *   1. External CI (GitHub Actions) doesn't see Vercel Marketplace
 *      integration envs even after `vercel pull` — those are runtime-only.
 *      Eager construction at module load would crash `next build`'s
 *      page-data collection phase for any route that imports `db`.
 *   2. Page-data collection in general shouldn't open DB connections.
 *      Lazy keeps build clean.
 *
 * Connection errors still surface — they just surface on the first query,
 * not at module load.
 */

declare global {
  var __gwinyaDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

/**
 * Whether a database connection string is configured. Lets server actions
 * degrade gracefully (return safe defaults) instead of crashing when no
 * Postgres is wired — e.g. local dev before `vercel env pull`. On Vercel the
 * Supabase Marketplace integration provides POSTGRES_URL, so this is true.
 */
export function isDbConfigured(): boolean {
  return !!(
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL
  );
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

// Module-level cache. Prod gets one client per cold start (serverless
// container) and reuses it for every request the container handles.
// Dev additionally reuses across HMR reloads via globalThis so the
// connection survives `next dev` rebuilds.
let _client: ReturnType<typeof drizzle<typeof schema>> | undefined;

function ensure() {
  if (_client) return _client;
  if (process.env.NODE_ENV !== "production" && globalThis.__gwinyaDb) {
    _client = globalThis.__gwinyaDb;
    return _client;
  }
  _client = buildClient();
  if (process.env.NODE_ENV !== "production") {
    globalThis.__gwinyaDb = _client;
  }
  return _client;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    const target = ensure();
    const value = Reflect.get(target as object, prop, receiver);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(target)
      : value;
  },
  has(_target, prop) {
    return prop in (ensure() as object);
  },
});

export { schema };
