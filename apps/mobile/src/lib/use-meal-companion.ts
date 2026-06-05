import { useCallback, useEffect, useRef, useState } from "react";
import {
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
  type MediaStream,
} from "react-native-webrtc";
import InCallManager from "react-native-incall-manager";
import {
  SAVE_AFTER_MEAL_TOOL_NAME,
  afterMealCheckToSymptomLog,
  type AfterMealCheckInput,
} from "@gwinya/shared/ai/after-meal-tool";
import { useSession } from "@/lib/auth";
import { appendLog, recordCheckIn } from "@/lib/data";
import { API_BASE_URL, isApiConfigured } from "@/lib/env";

export type CompanionMode = "full" | "after";
export type CompanionPhase = "idle" | "connecting" | "live" | "ended" | "error";
export type Line = { id: string; text: string };
export type CheckResult = { status: "saving" | "saved" | "noted"; yeses: string[] };

// Human labels for the after-meal tool fields (keys match afterMealLogTool).
const CHECK_LABELS: Record<string, string> = {
  coughed: "Coughed during the meal",
  wetVoice: "Voice felt wet or gurgly",
  tiredBeforeFinishing: "Felt tired before finishing",
  avoidedFoodOrDrink: "Avoided a usual food or drink",
  usedStrategy: "Used a strategy",
};

/**
 * react-native-webrtc extends event-target-shim's EventTarget; its event types
 * don't surface under our tsconfig, so wire events through addEventListener
 * (supported at runtime) via this small typed helper.
 */
function on(target: object, event: string, cb: (e: any) => void): void {
  (target as { addEventListener(t: string, c: (e: any) => void): void }).addEventListener(
    event,
    cb,
  );
}

/**
 * Voice meal companion over OpenAI Realtime + WebRTC, ported from the web
 * component (components/meal-companion/meal-companion.tsx). The data-channel
 * JSON protocol is identical; only transport (react-native-webrtc), audio
 * routing (InCallManager → loudspeaker), and persistence (direct Supabase via
 * the mobile data layer) differ.
 */
export function useMealCompanion(mode: CompanionMode) {
  const { session } = useSession();
  const [phase, setPhase] = useState<CompanionPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [partial, setPartial] = useState("");
  const [check, setCheck] = useState<CheckResult | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<ReturnType<RTCPeerConnection["createDataChannel"]> | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const partialRef = useRef("");
  const savedRef = useRef(false);
  const activeRef = useRef(false);
  const recordedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = session?.user.id ?? null;

  const teardown = useCallback(() => {
    try {
      pcRef.current?.getSenders().forEach((s) => s.track?.stop());
      pcRef.current?.close();
    } catch {
      /* ignore */
    }
    pcRef.current = null;
    dcRef.current = null;
    micRef.current?.getTracks().forEach((t) => t.stop());
    micRef.current = null;
    try {
      InCallManager.setForceSpeakerphoneOn(false);
      InCallManager.setKeepScreenOn(false);
      InCallManager.stop();
    } catch {
      /* ignore */
    }
    activeRef.current = false;
  }, []);

  // Stop everything if the screen unmounts mid-session.
  useEffect(() => () => teardown(), [teardown]);

  const finalizePartial = useCallback((text: string) => {
    const clean = text.trim();
    partialRef.current = "";
    setPartial("");
    if (!clean) return;
    setLines((prev) => [...prev, { id: `${prev.length}-${clean.slice(0, 8)}`, text: clean }]);
  }, []);

  // The companion called save_after_meal_log: persist (best-effort) via the
  // mobile data layer, reflect it, then hand the result back to the model.
  const handleToolCall = useCallback((callId: string, rawArgs: string) => {
    if (savedRef.current) return;
    savedRef.current = true;

    let args: AfterMealCheckInput = {};
    try {
      args = JSON.parse(rawArgs || "{}") as AfterMealCheckInput;
    } catch {
      /* keep empty args — still acknowledge the tool call */
    }
    const yeses = Object.entries(CHECK_LABELS)
      .filter(([key]) => (args as Record<string, unknown>)[key] === true)
      .map(([, label]) => label);

    setCheck({ status: "saving", yeses });

    const respond = (saved: boolean) => {
      setCheck({ status: saved ? "saved" : "noted", yeses });
      try {
        dcRef.current?.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "function_call_output",
              call_id: callId,
              output: JSON.stringify({ saved }),
            },
          }),
        );
        dcRef.current?.send(JSON.stringify({ type: "response.create" }));
      } catch {
        /* channel closed — the model moves on anyway */
      }
    };

    const userId = userIdRef.current;
    if (!userId) {
      respond(false);
      return;
    }
    appendLog(userId, afterMealCheckToSymptomLog(args))
      .then(() => respond(true))
      .catch(() => respond(false));
  }, []);

  const handleEvent = useCallback(
    (raw: string) => {
      let msg: {
        type?: string;
        delta?: string;
        transcript?: string;
        error?: { message?: string };
        item?: { type?: string; name?: string; call_id?: string; arguments?: string };
      };
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }
      const t = msg.type ?? "";
      if (t.endsWith("audio_transcript.delta")) {
        partialRef.current += msg.delta ?? "";
        setPartial(partialRef.current);
      } else if (t.endsWith("audio_transcript.done")) {
        finalizePartial(msg.transcript ?? partialRef.current);
      } else if (
        t === "response.output_item.done" &&
        msg.item?.type === "function_call" &&
        msg.item.name === SAVE_AFTER_MEAL_TOOL_NAME &&
        msg.item.call_id
      ) {
        handleToolCall(msg.item.call_id, msg.item.arguments ?? "{}");
      } else if (t === "error") {
        setError(msg.error?.message ?? "The voice service reported an error.");
      }
    },
    [finalizePartial, handleToolCall],
  );

  const start = useCallback(async () => {
    if (activeRef.current) return;
    activeRef.current = true;
    setError(null);
    setLines([]);
    setPartial("");
    setCheck(null);
    partialRef.current = "";
    savedRef.current = false;
    recordedRef.current = false;
    setPhase("connecting");

    try {
      if (!isApiConfigured) {
        throw new Error("Set EXPO_PUBLIC_API_BASE_URL in apps/mobile/.env to use the companion.");
      }

      // Route audio to the loudspeaker (hands-free) and set play+record BEFORE
      // capturing the mic.
      InCallManager.start({ media: "audio" });
      InCallManager.setForceSpeakerphoneOn(true);
      InCallManager.setKeepScreenOn(true);

      // Capture mic FIRST (triggers the permission dialog), THEN mint the token
      // so the short-lived ephemeral key isn't burned while the user taps Allow.
      const mic = await mediaDevices.getUserMedia({ audio: true });
      micRef.current = mic;

      const tokenRes = await fetch(`${API_BASE_URL}/api/realtime/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (!tokenRes.ok) {
        const data = (await tokenRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Couldn't start the companion (${tokenRes.status}).`);
      }
      const { value: ephemeralKey } = (await tokenRes.json()) as { value: string; model: string };

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Remote audio auto-plays through the AVAudioSession InCallManager set up;
      // no audio element needed. Re-assert the loudspeaker when the track lands.
      // Remote audio auto-plays through the AVAudioSession; re-assert speaker.
      on(pc, "track", () => {
        try {
          InCallManager.setForceSpeakerphoneOn(true);
        } catch {
          /* ignore */
        }
      });

      pc.addTrack(mic.getTracks()[0], mic);

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      on(dc, "message", (e) => handleEvent(String(e.data)));
      on(dc, "open", () => {
        setPhase("live");
        // Nudge the model to deliver its opening greeting (server-VAD waits for
        // a turn otherwise), so the companion speaks first.
        try {
          dc.send(JSON.stringify({ type: "response.create" }));
        } catch {
          /* channel not ready — the user speaking triggers a turn anyway */
        }
      });

      on(pc, "connectionstatechange", () => {
        const st = pc.connectionState;
        if (st === "connected") {
          try {
            InCallManager.setForceSpeakerphoneOn(true);
          } catch {
            /* ignore */
          }
        } else if (st === "failed" || st === "closed") {
          setPhase((p) => (p === "ended" ? p : "error"));
        }
      });

      const offer = await pc.createOffer({});
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
      });
      if (!sdpRes.ok) {
        throw new Error(`Connection refused (${sdpRes.status}).`);
      }
      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: answerSdp }));
    } catch (e) {
      teardown();
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("error");
    }
  }, [handleEvent, teardown, mode]);

  const stop = useCallback(() => {
    finalizePartial(partialRef.current);
    teardown();
    setPhase("ended");
    // Preserve the streak behaviour the tap checklist had.
    const userId = userIdRef.current;
    if (!recordedRef.current && userId) {
      recordedRef.current = true;
      recordCheckIn(userId).catch(() => {});
    }
  }, [finalizePartial, teardown]);

  return { phase, error, lines, partial, check, start, stop };
}
