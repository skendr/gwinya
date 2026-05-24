"use client";

import { useState } from "react";
import { Mail, Check, ArrowRight, KeyRound, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { passwordSignIn } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

/**
 * Two sign-in paths share this form.
 *
 *  - Password (primary). A Server Action — same-request session create,
 *    bullet-proof cookie propagation. Auto-creates the account if the
 *    email doesn't exist yet, no email verification needed.
 *  - Magic link (fallback). Client-side OTP — opens the user's email
 *    client, fragile across email apps that open links in a separate
 *    browser. Kept for users who don't want to choose a password.
 */
type Mode = "password" | "magic";
type Status =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; error: string };

export function SignInForm({
  next,
  initialError,
  initialMode = "password",
}: {
  next: string;
  initialError?: string;
  initialMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>(
    initialError ? { kind: "error", error: initialError } : { kind: "idle" },
  );

  async function sendMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus({ kind: "error", error: "Please type a complete email address." });
      return;
    }
    setStatus({ kind: "pending" });
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setStatus({ kind: "error", error: error.message });
      return;
    }
    setStatus({ kind: "sent", email: trimmed });
  }

  if (status.kind === "sent") {
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
          We sent a sign-in link to <strong>{status.email}</strong>. Open it on the same
          device and browser you&apos;re using now — magic links break across browsers.
        </p>
        <p className="text-xs opacity-80">
          Some email apps open links in their own in-app browser, which won&apos;t see your
          sign-in. If clicking the link gives an error, switch to{" "}
          <button
            onClick={() => {
              setStatus({ kind: "idle" });
              setMode("password");
            }}
            className="underline"
          >
            password sign-in
          </button>
          .
        </p>
      </div>
    );
  }

  const pending = status.kind === "pending";

  /* ────────────────────────────────────────────────────────────────── */
  /* Password mode (primary)                                             */
  /* ────────────────────────────────────────────────────────────────── */
  if (mode === "password") {
    return (
      <div className="space-y-5">
        <form action={passwordSignIn} className="space-y-4">
          <input type="hidden" name="next" value={next} />

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
              className="h-14 w-full rounded-2xl border border-[var(--input)] bg-[var(--color-paper)] pl-12 pr-4 text-base placeholder:text-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
            />
          </div>

          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-muted)]"
              strokeWidth={2}
            />
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              aria-label="Password"
              className="h-14 w-full rounded-2xl border border-[var(--input)] bg-[var(--color-paper)] pl-12 pr-4 text-base placeholder:text-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
            />
          </div>

          {status.kind === "error" ? (
            <p className="text-pretty text-sm leading-relaxed text-[var(--color-rose)]">
              {status.error}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full">
            <KeyRound className="h-5 w-5" />
            Sign in · or create account
            <ArrowRight className="h-5 w-5" />
          </Button>

          <p className="text-center text-xs text-[var(--color-ink-soft)]">
            New here? Just type a password and we&apos;ll set up your account.
          </p>
        </form>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">or</span>
          <span className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <button
          type="button"
          onClick={() => {
            setMode("magic");
            setStatus({ kind: "idle" });
          }}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-paper)] py-3 text-sm font-medium text-[var(--color-ink)]",
            "shadow-[0_2px_0_0_rgba(31,24,18,0.08)] transition active:translate-y-[1px]",
          )}
        >
          <Sparkles className="h-4 w-4 text-[var(--color-clay-deep)]" />
          Send me a magic link instead
        </button>
      </div>
    );
  }

  /* ────────────────────────────────────────────────────────────────── */
  /* Magic-link mode                                                     */
  /* ────────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-5">
      <form onSubmit={sendMagicLink} className="space-y-4">
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
        {status.kind === "error" ? (
          <p className="text-sm text-[var(--color-rose)]">{status.error}</p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Sending…" : "Send me a sign-in link"}
          <ArrowRight className="h-5 w-5" />
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">or</span>
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <button
        type="button"
        onClick={() => {
          setMode("password");
          setStatus({ kind: "idle" });
        }}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-paper)] py-3 text-sm font-medium text-[var(--color-ink)]",
          "shadow-[0_2px_0_0_rgba(31,24,18,0.08)] transition active:translate-y-[1px]",
        )}
      >
        <KeyRound className="h-4 w-4 text-[var(--color-clay-deep)]" />
        Use a password instead
      </button>
    </div>
  );
}
