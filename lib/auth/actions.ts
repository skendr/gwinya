"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email/welcome";
import { headers } from "next/headers";

/**
 * Server Actions for auth.
 */

export type SignInState = { ok: true; email: string } | { ok: false; error: string } | null;

export async function signInWithEmail(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = String(formData.get("next") ?? "/");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please type a complete email address." };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, email };
}

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
