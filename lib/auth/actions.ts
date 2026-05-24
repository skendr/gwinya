"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email/welcome";

/**
 * Server Actions for auth.
 */

export type SignInState = { ok: true; email: string } | { ok: false; error: string } | null;

/**
 * Build an absolute origin for the email-redirect URL.
 *
 * Vercel sits behind its edge proxy, so the original Host shows up in
 * `x-forwarded-host` rather than `host`. The `origin` request header is
 * unreliable for server actions. We layer fallbacks:
 *   1. Explicit env (`NEXT_PUBLIC_SITE_URL`) — set this when you have a
 *      custom domain so emails always send people there.
 *   2. Vercel's own production-URL env.
 *   3. The current request's forwarded host + proto.
 *   4. localhost as a dev safety net.
 *
 * IMPORTANT: even with a perfect origin here, Supabase still enforces an
 * allowlist of redirect URLs. Add the production URL under
 *   Supabase → Authentication → URL Configuration → Redirect URLs
 * and set the matching value as Site URL.
 */
async function resolveSiteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}

export async function signInWithEmail(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = String(formData.get("next") ?? "/");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please type a complete email address." };
  }

  const origin = await resolveSiteOrigin();
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const supabase = await createClient();
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
