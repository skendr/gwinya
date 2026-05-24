"use client";

import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IddsiLevelBadge } from "./iddsi-level-badge";
import { ScanRedFlagList } from "./red-flag-list";
import type { ScanResult } from "@/lib/ai/scan-schema";
import type { IddsiLevel } from "@/lib/content/iddsi";

type MatchTone = {
  /** teal = green (above plan, safer); gold = yellow (at plan, threshold);
   *  rose = red (below plan, outside). */
  badge: "teal" | "gold" | "rose" | "cream";
  label: string;
  blurb: string;
};

function describeMatch(
  match: ScanResult["matchesPrescribed"],
  prescribed: number | null,
  predicted: number | null,
): MatchTone | null {
  // Three states mapped to the user-facing "above / at / below plan"
  // vocabulary. See lib/content/iddsi.ts:planComparison for the rule.
  //   above plan (more-modified) → green, within plan
  //   at plan    (matches)       → yellow, within plan (right at threshold)
  //   below plan (less-modified) → red, outside plan
  if (match === "unknown" || prescribed == null || predicted == null) return null;
  if (match === "more-modified") {
    return {
      badge: "teal",
      label: "Above plan",
      blurb: `Reads like Level ${predicted} — softer than your prescribed Level ${prescribed}. That's above your plan (more modified than you need), so it sits well within what's safe.`,
    };
  }
  if (match === "matches") {
    return {
      badge: "gold",
      label: "At plan",
      blurb: `Reads like Level ${prescribed} — exactly your prescribed level. Right at your plan, so it's within plan — just take your usual care.`,
    };
  }
  return {
    badge: "rose",
    label: "Below plan",
    blurb: `Reads like Level ${predicted} — less modified than your prescribed Level ${prescribed}. That's below your plan (outside what your SLT said is safe). You might mash it more or cut it smaller first.`,
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
                  : match.badge === "gold"
                    ? "var(--color-honey-soft)"
                    : match.badge === "rose"
                      ? "var(--color-rose-soft)"
                      : "var(--color-linen-2)",
              color:
                match.badge === "teal"
                  ? "var(--color-moss-deep)"
                  : match.badge === "gold"
                    ? "#7a5300"
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
