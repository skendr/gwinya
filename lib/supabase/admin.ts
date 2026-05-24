import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses Row Level Security — use only on
 * the server, only when you have to (uploading a food-scan image to a
 * private bucket on behalf of the authenticated user, sending email, etc.).
 *
 * Never import this from a "use client" file.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
