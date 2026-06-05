/**
 * Public runtime config. Only EXPO_PUBLIC_* values are readable on-device and
 * shipped in the bundle — so ONLY non-secret values live here (Supabase URL +
 * anon key, the web API base URL). The Anthropic/OpenAI keys stay server-side
 * on the Next.js app and are never referenced from mobile.
 *
 * Expo inlines `process.env.EXPO_PUBLIC_*` at build time, so these must be
 * referenced as static property accesses (not computed) to be replaced.
 */

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Base URL of the deployed Next.js app, e.g. https://gwinya.vercel.app */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

export const isApiConfigured = API_BASE_URL.length > 0;
