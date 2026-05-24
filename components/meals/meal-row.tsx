"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IddsiLevelBadge } from "@/components/food-scan";
import { deleteMeal } from "@/lib/storage/actions";
import type { IddsiLevel } from "@/lib/content/iddsi";

type Match = "matches" | "more-modified" | "less-modified" | "unknown";

type Props = {
  id: string;
  mealName: string;
  predictedLevel: number | null;
  matchesPrescribed: Match | null;
  prescribedLevelAtScan: number | null;
  eatenAt: Date;
  imageUrl: string | null;
};

// Binary verdict: a meal is either within the user's SLT-prescribed
// plan (the prescribed IDDSI level, or anything more modified than
// it) or outside that plan. See lib/content/iddsi.ts:isWithinPlan.
// Foods more modified than prescribed are within plan because that's
// always safer than what the SLT said is necessary.
const matchTone: Record<Match, { tone: "teal" | "rose" | "cream"; label: string }> = {
  "more-modified": { tone: "teal", label: "within plan" },
  matches: { tone: "teal", label: "within plan" },
  "less-modified": { tone: "rose", label: "outside plan" },
  unknown: { tone: "cream", label: "no plan saved" },
};

/**
 * One row in the /meals log. Server-rendered list parent passes the
 * signed thumbnail URL down so we don't expose the service role here.
 */
export function MealRow({
  id,
  mealName,
  predictedLevel,
  matchesPrescribed,
  prescribedLevelAtScan,
  eatenAt,
  imageUrl,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);
  const match = matchesPrescribed ? matchTone[matchesPrescribed] : matchTone.unknown;
  const time = eatenAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  if (removed) return null;

  function onDelete() {
    if (!confirm("Delete this meal? This also removes the photo.")) return;
    startTransition(async () => {
      try {
        await deleteMeal(id);
        setRemoved(true);
        toast.success("Meal deleted");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Couldn't delete";
        toast.error("Delete failed", { description: msg });
      }
    });
  }

  return (
    <Card className="flex items-center gap-3 p-3 pr-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--color-linen-2)]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={mealName}
            fill
            sizes="64px"
            className="object-cover"
            unoptimized
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate font-medium text-[var(--color-ink)]">{mealName}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <IddsiLevelBadge level={(predictedLevel ?? null) as IddsiLevel | null} size="sm" />
          <Badge tone={match.tone}>{match.label}</Badge>
        </div>
        <p className="text-xs text-[var(--color-muted)]">
          {time}
          {prescribedLevelAtScan != null ? ` · prescribed L${prescribedLevelAtScan}` : null}
        </p>
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        aria-label="Delete meal"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[var(--color-muted)] transition-colors hover:bg-[var(--color-linen-2)] hover:text-[var(--color-rose)] disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
    </Card>
  );
}
