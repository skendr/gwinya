"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail } from "@/lib/email/welcome";

/**
 * Server Actions for auth.
 *
 * Two flows are wired:
 *  - Magic link: handled client-side in app/sign-in/sign-in-form.tsx via
 *    @supabase/ssr's browser client. Server-action variants had Next 15's
 *    Set-Cookie propagation issue with the PKCE verifier; plus magic links
 *    are fragile across email-app cross-browser opens.
 *  - Password sign-in / sign-up: handled here as a server action. Same-
 *    request session creation means cookie propagation is clean (we
 *    return redirect() which carries Set-Cookie headers).
 *
 * Password flow:
 *  1. signInWithPassword — if it works, redirect.
 *  2. If it fails, try to admin-create the user with email_confirm: true
 *     so they don't have to verify by email.
 *  3. If creation says "already registered", the password was wrong on a
 *     pre-existing account.
 *  4. After creation, signInWithPassword again to mint a session.
 */

function safeReturnPath(raw: string | null) {
  if (!raw) return "/";
  // Reject absolute URLs to prevent open redirect.
  if (raw.startsWith("//") || /^https?:/i.test(raw)) return "/";
  return raw.startsWith("/") ? raw : "/";
}

function backToSignIn(error: string, mode: "password" | "magic", next: string) {
  const params = new URLSearchParams({ error, mode, next });
  redirect(`/sign-in?${params.toString()}`);
}

export async function passwordSignIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeReturnPath(String(formData.get("next") ?? "/"));

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    backToSignIn("Please type a complete email address.", "password", next);
  }
  if (password.length < 8) {
    backToSignIn("Password must be at least 8 characters.", "password", next);
  }

  const supabase = await createClient();

  // 1) Existing account, correct password?
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (!signInError) {
    redirect(next);
  }

  // 2) Try to create — server-side, no email verification required.
  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    const msg = (createError.message ?? "").toLowerCase();
    const alreadyRegistered =
      msg.includes("already") ||
      msg.includes("registered") ||
      msg.includes("exists") ||
      msg.includes("duplicate");
    backToSignIn(
      alreadyRegistered
        ? "Wrong password — or this email signed up via magic link before and hasn't set a password yet. Use the magic-link option below, then set a password from your account."
        : createError.message ?? "Couldn't create account.",
      "password",
      next,
    );
  }

  // 3) Brand-new account — fire the welcome email and sign in.
  sendWelcomeEmail({ to: email }).catch(() => {});

  const { error: postCreateError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (postCreateError) {
    backToSignIn(postCreateError.message, "password", next);
  }

  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

/**
 * Called from the magic-link callback once we know the OTP verification
 * succeeded. Fires a welcome email exactly once per user (best-effort).
 */
export async function maybeSendWelcomeEmail() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return;

  const createdMs = user.created_at ? new Date(user.created_at).getTime() : 0;
  const isFresh = Date.now() - createdMs < 60_000;
  if (!isFresh) return;

  await sendWelcomeEmail({ to: user.email });
}
