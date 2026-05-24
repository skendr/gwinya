"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Reads the anon key. Used inside "use client"
 * components — for example, the magic-link form posts via this client and
 * the auth state changes propagate through the same cookies our middleware
 * refreshes.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
