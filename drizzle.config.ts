import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Pull from .env.local first (where `vercel env pull` writes), then .env.
config({ path: ".env.local" });
config();

// `drizzle-kit generate` runs offline and only needs a non-empty URL.
// `drizzle-kit push` / `pull` actually open the connection — set the value
// before running those commands (Vercel injects it on deploy; for local use
// paste a direct-connection string from the Supabase dashboard).
const url =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  "postgres://offline";

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
