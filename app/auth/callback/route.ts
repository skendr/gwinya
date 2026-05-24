import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { maybeSendWelcomeEmail } from "@/lib/auth/actions";

/**
 * Supabase magic-link callback. The email link from Supabase Auth hits this
 * route with `?code=…`. We exchange it for a session, fire the welcome
 * email if this is the user's first sign-in, then bounce to the intended
 * destination (`next` query param, defaulting to home).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?error=missing-code", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  // Best-effort welcome email — never blocks the redirect.
  maybeSendWelcomeEmail().catch(() => {});

  return NextResponse.redirect(new URL(next, url.origin));
}
