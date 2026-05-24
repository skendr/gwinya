"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";

const DISMISS_KEY = "gwinya:no-plan-banner-dismissed";

/** Dismissed-per-session no-plan onboarding banner. Server-rendered parent
 *  gates on whether the plan exists. */
export function NoPlanBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (dismissed) return null;

  return (
    <Card className="flex items-start gap-3 p-4">
      <div className="flex-1 space-y-0.5">
        <p className="font-semibold text-[var(--color-ink)]">
          Add your SLT plan to personalise Gwinya
        </p>
        <p className="text-xs text-[var(--color-ink-soft)]">
          Scan and edit in under a minute — every scan and chat will be grounded in your plan.
        </p>
      </div>
      <Link
        href="/plan/scan"
        className="inline-flex h-9 shrink-0 items-center rounded-full bg-[var(--color-clay)] px-3 text-xs font-semibold text-white"
      >
        Scan slip
      </Link>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          sessionStorage.setItem(DISMISS_KEY, "1");
          setDismissed(true);
        }}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--color-muted)] hover:text-[var(--color-ink)]"
      >
        <X className="h-4 w-4" />
      </button>
    </Card>
  );
}
