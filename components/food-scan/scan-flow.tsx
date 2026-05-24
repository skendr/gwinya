"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { CameraCapture } from "./camera-capture";
import { ScanResultCard } from "./scan-result-card";
import { SaveMealCard } from "./save-meal-card";
import type { ScanResult } from "@/lib/ai/scan-schema";

type ScanResponse = {
  id: string | null;
  analysis: ScanResult;
  prescribed: number | null;
};

type Phase = "idle" | "ready" | "scanning" | "done";

export function ScanFlow() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setPhase("idle");
    setImageDataUrl(null);
    setNote("");
    setResult(null);
    setError(null);
  }

  async function analyse() {
    if (!imageDataUrl) return;
    setPhase("scanning");
    setError(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl, userNote: note || undefined }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Scan failed (${res.status})`);
      }
      const data = (await res.json()) as ScanResponse;
      setResult(data);
      setPhase("done");
      toast.success("Scan analysed", { description: "Save it as a meal below if you'd like." });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      setPhase("ready");
      toast.error("Scan failed", { description: msg });
    }
  }

  return (
    <div className="space-y-5">
      {imageDataUrl ? (
        <Card className="overflow-hidden p-0">
          <div className="relative aspect-[4/3] w-full bg-[var(--color-linen-2)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageDataUrl}
              alt="Your meal"
              className="h-full w-full object-cover"
            />
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
            Take a photo of your meal
          </p>
          <p className="max-w-[24ch] text-sm leading-relaxed text-[var(--color-ink-soft)]">
            Bright lighting, square on, from above. I&apos;ll compare it to your prescribed level.
          </p>
        </Card>
      )}

      <CameraCapture
        hasImage={!!imageDataUrl}
        onCapture={(d) => {
          setImageDataUrl(d);
          setPhase("ready");
          setResult(null);
          setError(null);
        }}
        onReset={reset}
      />

      {imageDataUrl && phase !== "done" ? (
        <div className="space-y-3">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything to add? e.g. 'mashed potato with stew, sauce thinned'"
            rows={2}
            disabled={phase === "scanning"}
          />
          <Button
            size="lg"
            className="w-full"
            disabled={phase === "scanning"}
            onClick={analyse}
          >
            {phase === "scanning" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Looking carefully…
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Analyse
              </>
            )}
          </Button>
          {error ? (
            <p className="text-center text-sm text-[var(--color-rose)]">{error}</p>
          ) : null}
        </div>
      ) : null}

      {phase === "done" && result ? (
        <>
          <ScanResultCard result={result.analysis} prescribed={result.prescribed} />
          {result.id ? (
            <SaveMealCard
              scanId={result.id}
              suggestedName={result.analysis.suggestedItemName}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
