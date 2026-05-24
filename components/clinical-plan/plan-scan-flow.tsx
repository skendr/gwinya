"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CameraCapture } from "@/components/food-scan";
import type { SLTSlipResult } from "@/lib/ai/slt-slip-schema";

type PlanScanResponse = {
  scanId: string;
  imagePath: string | null;
  parsed: SLTSlipResult;
  prescribedNow: { textureLevel: number | null; fluidLevel: number | null } | null;
};

type Phase = "idle" | "ready" | "scanning";

/** Key used to bridge scan→review across navigations. */
export const PLAN_DRAFT_KEY = "gwinya:plan-draft";

export function PlanScanFlow() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setPhase("idle");
    setImageDataUrl(null);
    setError(null);
  }

  async function analyse() {
    if (!imageDataUrl) return;
    setPhase("scanning");
    setError(null);
    try {
      const res = await fetch("/api/plan/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Plan scan failed (${res.status})`);
      }
      const data = (await res.json()) as PlanScanResponse;
      // Stash the parse keyed by scanId so /plan/review/[scanId] can pick
      // it up. We don't persist into clinical_plan until the user confirms.
      sessionStorage.setItem(
        `${PLAN_DRAFT_KEY}:${data.scanId}`,
        JSON.stringify(data),
      );
      toast.success("Slip parsed", { description: "Review the fields and save." });
      router.push(`/plan/review/${data.scanId}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      setPhase("ready");
      toast.error("Couldn't parse slip", { description: msg });
    }
  }

  return (
    <div className="space-y-5">
      {imageDataUrl ? (
        <Card className="overflow-hidden p-0">
          <div className="relative aspect-[3/4] w-full bg-[var(--color-linen-2)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageDataUrl} alt="Your slip" className="h-full w-full object-contain" />
          </div>
        </Card>
      ) : (
        <Card className="grid place-items-center gap-2 p-10 text-center">
          <span
            className="grid h-14 w-14 place-items-center rounded-full text-[var(--color-clay-deep)]"
            style={{ background: "var(--color-clay-soft)" }}
            aria-hidden
          >
            <Sparkles className="h-6 w-6" />
          </span>
          <p className="font-display text-lg font-semibold tracking-tight">
            Photograph the full slip
          </p>
          <p className="max-w-[30ch] text-sm leading-relaxed text-[var(--color-ink-soft)]">
            Flat surface, good light, the whole sheet in frame so the handwriting reads cleanly.
          </p>
        </Card>
      )}

      <CameraCapture
        hasImage={!!imageDataUrl}
        onCapture={(d) => {
          setImageDataUrl(d);
          setPhase("ready");
          setError(null);
        }}
        onReset={reset}
      />

      {imageDataUrl ? (
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full"
            disabled={phase === "scanning"}
            onClick={analyse}
          >
            {phase === "scanning" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Reading the slip…
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Parse this slip
              </>
            )}
          </Button>
          {error ? (
            <p className="text-center text-sm text-[var(--color-rose)]">{error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
