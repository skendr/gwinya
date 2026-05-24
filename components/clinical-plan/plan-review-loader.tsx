"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlanReviewForm } from "./plan-review-form";
import { PLAN_DRAFT_KEY } from "./plan-scan-flow";
import type { SLTSlipResult } from "@/lib/ai/slt-slip-schema";

type Draft = {
  scanId: string;
  imagePath: string | null;
  parsed: SLTSlipResult;
  prescribedNow: { textureLevel: number | null; fluidLevel: number | null } | null;
};

/**
 * Bridges the scan → review navigation. Picks the draft up out of
 * sessionStorage (where PlanScanFlow stashed it) and hands it to the
 * server-action-backed review form.
 *
 * Refresh / direct navigation loses the draft — sessionStorage is
 * per-tab and we don't persist drafts to the DB in v1. When that
 * happens we show a "scan again" CTA rather than try to fake state.
 */
export function PlanReviewLoader({ scanId }: { scanId: string }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(`${PLAN_DRAFT_KEY}:${scanId}`);
    if (!raw) {
      setMissing(true);
      return;
    }
    try {
      setDraft(JSON.parse(raw) as Draft);
    } catch {
      setMissing(true);
    }
  }, [scanId]);

  if (missing) {
    return (
      <Card className="space-y-3 p-6">
        <p className="font-semibold text-[var(--color-ink)]">No draft to review</p>
        <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
          We couldn&apos;t find a parsed slip for this session — usually because
          the page was refreshed. Scan the slip again and you&apos;ll come straight
          back here.
        </p>
        <Button asChild className="w-full">
          <Link href="/plan/scan">
            <Camera className="h-5 w-5" />
            Scan slip again
          </Link>
        </Button>
      </Card>
    );
  }

  if (!draft) {
    return (
      <Card className="p-6">
        <p className="text-sm text-[var(--color-ink-soft)]">Loading your draft…</p>
      </Card>
    );
  }

  return (
    <PlanReviewForm
      scanId={draft.scanId}
      imagePath={draft.imagePath}
      parsed={draft.parsed}
      prescribedNow={draft.prescribedNow}
    />
  );
}
