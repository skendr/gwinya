"use client";

import { AlertTriangle, Phone } from "lucide-react";
import type { RedFlag } from "@/lib/domain/red-flags";

export function RedFlagBanner({ flag }: { flag: RedFlag }) {
  const emergency = flag.severity === "emergency";
  return (
    <div
      role="alert"
      className="space-y-2 rounded-2xl border-2 p-4"
      style={{
        background: emergency ? "var(--color-rose-soft)" : "var(--color-honey-soft)",
        borderColor: emergency ? "var(--color-rose)" : "var(--color-honey)",
        color: emergency ? "#9b2c2c" : "#7a5300",
      }}
    >
      <div className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        {emergency ? "This sounds urgent." : "This may need same-day attention."}
      </div>
      <p className="text-sm leading-relaxed">
        {emergency ? (
          <>
            If someone is choking, can't breathe, or in serious distress, call emergency
            services <strong>now</strong> — 999 (UK), 112 (EU), 911 (US/CA). Don't wait for
            an app reply.
          </>
        ) : (
          <>
            Please contact your GP, SLT, or same-day service (NHS 111 in the UK) today.
            Gwinya isn't a substitute for a clinician.
          </>
        )}
      </p>
      <a
        href={emergency ? "tel:999" : "tel:111"}
        className="press inline-flex !min-h-[2.75rem] !px-4 text-sm"
        data-tone={emergency ? undefined : "ghost"}
      >
        <Phone className="h-4 w-4" />
        {emergency ? "Call 999 now" : "Call 111"}
      </a>
    </div>
  );
}
