"use client";

import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IddsiLevelBadge } from "./iddsi-level-badge";
import { ScanRedFlagList } from "./red-flag-list";
import type { ScanResult } from "@/lib/ai/scan-schema";
import type { IddsiLevel } from "@/lib/content/iddsi";

type MatchTone = {
  /** teal = green (within plan); rose = red (outside plan); cream = no plan. */
  badge: "teal" | "rose" | "cream";
  label: string;
  blurb: string;
};

function describeMatch(
  match: ScanResult["matchesPrescribed"],
  prescribed: number | null,
  predicted: number | null,
): MatchTone | null {
  // Binary verdict: a meal is either within the user's plan (the SLT-
  // prescribed IDDSI level, or anything more modified than it) or it is
  // outside that plan. See lib/content/iddsi.ts:planVerdict.
  if (match === "unknown" || prescribed == null || predicted == null) return null;
  if (match === "more-modified") {
    return {
      badge: "teal",
      label: "Within plan",
      blurb: `Your SLT prescribed Level ${prescribed}. This reads like Level ${predicted} — softer than the line your plan sets, so it's within plan.`,
    };
  }
  if (match === "matches") {
    return {
      badge: "teal",
      label: "Within plan",
      blurb: `Your SLT prescribed Level ${prescribed}, and this reads like Level ${prescribed}. Right at your plan — within plan.`,
    };
  }
  return {
    badge: "rose",
    label: "Outside plan",
    blurb: `Your SLT prescribed Level ${prescribed}. This reads like Level ${predicted} — less modified than your plan allows, so it's outside plan. You might mash it more or cut it smaller before tucking in.`,
  };
}

export function ScanResultCard({
  result,
  prescribed,
}: {
  result: ScanResult;
  prescribed: number | null;
}) {
  const match = describeMatch(result.matchesPrescribed, prescribed, result.predictedLevel);
  const level = (result.predictedLevel ?? null) as IddsiLevel | null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="space-y-4"
    >
      <Card className="space-y-4 p-5">
        <div className="space-y-2">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Looks like
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <IddsiLevelBadge level={level} size="lg" />
            <Badge tone={result.confidence === "high" ? "teal" : result.confidence === "low" ? "rose" : "gold"}>
              {result.confidence} confidence
            </Badge>
          </div>
        </div>

        <p className="text-pretty text-[0.95rem] leading-relaxed text-[var(--color-ink)]">
          {result.visualReasoning}
        </p>

        {match ? (
          <div
            className="space-y-1 rounded-2xl p-3.5"
            style={{
              background:
                match.badge === "teal"
                  ? "var(--color-moss-soft)"
                  : match.badge === "rose"
                    ? "var(--color-rose-soft)"
                    : "var(--color-linen-2)",
              color:
                match.badge === "teal"
                  ? "var(--color-moss-deep)"
                  : match.badge === "rose"
                    ? "#a23434"
                    : "var(--color-ink)",
            }}
          >
            <p className="text-sm font-semibold">{match.label}</p>
            <p className="text-sm leading-relaxed opacity-90">{match.blurb}</p>
          </div>
        ) : null}
      </Card>

      <ScanRedFlagList ids={result.redFlagIds} />

      {result.caveats.length ? (
        <Card className="p-5">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-[var(--color-muted)]">
            What this can&apos;t tell you
          </p>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-[var(--color-ink-soft)]">
            {result.caveats.map((c, i) => (
              <li key={i} className="flex items-start gap-2">
                <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
                {c}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="p-5">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-[var(--color-muted)]">
          One small next step
        </p>
        <p className="mt-2 text-pretty text-[0.95rem] leading-relaxed text-[var(--color-ink)]">
          {result.suggestion}
        </p>
      </Card>
    </motion.div>
  );
}
