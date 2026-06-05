import "react-native-url-polyfill/auto";
import { AppState } from "react-native";
import { createClient } from "@supabase/supabase-js";
import { SecureStoreAdapter } from "./secure-store";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./env";

/**
 * Supabase client for React Native. Mirrors the web's browser client
 * (lib/supabase/client.ts) but stores the session in the device keychain and
 * uses PKCE so the magic-link callback's `exchangeCodeForSession` works
 * on-device — matching the web auth callback's flow.
 *
 * Placeholder URL/key keep `createClient` from throwing when env is unset; the
 * UI checks `isSupabaseConfigured` and shows a setup hint instead of crashing.
 */
export const supabase = createClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY || "placeholder-anon-key",
  {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // RN has no URL bar; we handle deep links
      flowType: "pkce",
    },
  },
);

// The browser refreshes tokens on focus automatically; RN does not, so drive
// it from AppState — refresh while foregrounded, pause in the background.
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
