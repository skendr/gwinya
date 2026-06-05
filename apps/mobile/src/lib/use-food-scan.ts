import { useCallback, useState } from "react";
import { planVerdict, type PlanVerdict } from "@gwinya/shared/content/iddsi";
import type { ScanResult } from "@gwinya/shared/ai/scan-schema";
import { supabase } from "./supabase";
import { API_BASE_URL, isApiConfigured } from "./env";

export type ScanState = {
  id: string | null;
  analysis: ScanResult;
  prescribed: number | null;
  verdict: PlanVerdict;
};

/**
 * Calls the deployed /api/scan (gpt-4o vision) with a Bearer token. The route
 * computes matchesPrescribed deterministically; we collapse it to the binary
 * within/outside verdict with the shared planVerdict helper.
 */
export function useFoodScan() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanState | null>(null);

  const scan = useCallback(async (imageDataUrl: string, userNote?: string) => {
    if (!isApiConfigured) {
      setError("Set EXPO_PUBLIC_API_BASE_URL in apps/mobile/.env to use the food check.");
      return;
    }
    setError(null);
    setScanning(true);
    setResult(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`${API_BASE_URL}/api/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ imageDataUrl, userNote: userNote?.trim() || undefined }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? `Couldn't check that photo (${res.status}).`);
      }
      const data = (await res.json()) as {
        id: string | null;
        analysis: ScanResult;
        prescribed: number | null;
      };
      setResult({ ...data, verdict: planVerdict(data.analysis.matchesPrescribed) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setScanning(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { scanning, error, result, scan, reset };
}
