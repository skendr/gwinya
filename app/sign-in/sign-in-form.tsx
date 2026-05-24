"use client";

import { useActionState } from "react";
import { Mail, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInWithEmail, type SignInState } from "@/lib/auth/actions";

export function SignInForm({
  next,
  initialError,
}: {
  next: string;
  initialError?: string;
}) {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(
    signInWithEmail,
    initialError ? { ok: false, error: initialError } : null,
  );

  if (state?.ok) {
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
          device to finish signing in. The link works for 60 minutes.
        </p>
        <p className="text-xs opacity-75">
          Can&apos;t find it? Check spam, or try again.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
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
          placeholder="you@example.com"
          aria-label="Email address"
          className="h-14 w-full rounded-2xl border border-[var(--input)] bg-[var(--color-paper)] pl-12 pr-4 text-base placeholder:text-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
        />
      </div>
      {state && !state.ok ? (
        <p className="text-sm text-[var(--color-rose)]">{state.error}</p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send me a sign-in link"}
        <ArrowRight className="h-5 w-5" />
      </Button>
    </form>
  );
}
