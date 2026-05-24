"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email/welcome";

/**
 * Server Actions for auth.
 *
 * Sign-in itself is handled client-side in app/sign-in/sign-in-form.tsx so
 * the Supabase browser client writes the PKCE verifier cookie via
 * document.cookie — that cookie is what our server-side /auth/callback then
 * reads to exchange the code for a session. The server-action path tripped
 * Next 15's flaky Set-Cookie propagation.
 */

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

/**
 * Called from the auth callback once we know the magic-link verification
 * succeeded. Fires a welcome email exactly once per user (best-effort).
 */
export async function maybeSendWelcomeEmail() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return;

  // Heuristic: if `created_at` is within the last 60 seconds, treat as new.
  const createdMs = user.created_at ? new Date(user.created_at).getTime() : 0;
  const isFresh = Date.now() - createdMs < 60_000;
  if (!isFresh) return;

  await sendWelcomeEmail({ to: user.email });
}
