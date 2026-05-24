"use client";

import { useState } from "react";
import { Mail, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

/**
 * Client-side sign-in. The Supabase browser client handles PKCE by storing
 * the code verifier as a cookie via document.cookie — same cookie our
 * server-side callback reads with `cookies()`. Doing it client-side avoids
 * the Next 15 server-action Set-Cookie quirk that broke the previous flow.
 */
type FormState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; error: string };

export function SignInForm({
  next,
  initialError,
}: {
  next: string;
  initialError?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>(
    initialError ? { kind: "error", error: initialError } : { kind: "idle" },
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setState({ kind: "error", error: "Please type a complete email address." });
      return;
    }

    setState({ kind: "pending" });

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setState({ kind: "error", error: error.message });
      return;
    }

    setState({ kind: "sent", email: trimmed });
  }

  if (state.kind === "sent") {
    return (
      <div className="space-y-4 rounded-2xl bg-[var(--color-moss-soft)] p-5 text-[var(--color-moss-deep)]">
        <div className="flex items-center gap-2.5 font-semibold">
          <span
            className="grid h-9 w-9 place-items-center rounded-full"
            style={{ background: "var(--color-moss)" }}
          >
            <Check className="h-5 w-5 text-white" strokeWidth={2.75} />
          </span>
          Check your inbox
        </div>
        <p className="text-sm leading-relaxed">
          We sent a sign-in link to <strong>{state.email}</strong>. Open it from this
          device — same browser — to finish signing in. The link works for 60 minutes.
        </p>
        <p className="text-xs opacity-75">
          Can&apos;t find it? Check spam, or try again.
        </p>
      </div>
    );
  }

  const pending = state.kind === "pending";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Mail
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-muted)]"
          strokeWidth={2}
        />
        <input
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          disabled={pending}
          className="h-14 w-full rounded-2xl border border-[var(--input)] bg-[var(--color-paper)] pl-12 pr-4 text-base placeholder:text-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:opacity-60"
        />
      </div>
      {state.kind === "error" ? (
        <p className="text-sm text-[var(--color-rose)]">{state.error}</p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send me a sign-in link"}
        <ArrowRight className="h-5 w-5" />
      </Button>
    </form>
  );
}
