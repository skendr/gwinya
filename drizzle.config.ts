import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url =
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "Set POSTGRES_URL_NON_POOLING (or POSTGRES_URL / DATABASE_URL) before running drizzle-kit. " +
      "On Vercel + Supabase Marketplace this is auto-injected; locally run `vercel env pull`.",
  );
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
  // Supabase auth lives in its own schema — don't try to manage it.
  schemaFilter: ["public"],
  verbose: true,
  strict: true,
});
