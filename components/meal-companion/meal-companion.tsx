"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Mic,
  Loader2,
  PhoneOff,
  Camera,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  LineChart,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { recordCheckIn, saveAfterMealCheck } from "@/lib/storage/actions";
import {
  SAVE_AFTER_MEAL_TOOL_NAME,
  type AfterMealCheckInput,
} from "@/lib/ai/after-meal-tool";

type Phase = "idle" | "connecting" | "live" | "ended" | "error";

type Line = { id: string; text: string };

/** Tracks the voice after-meal check once the companion calls the save tool. */
type Check = { status: "saving" | "saved" | "noted"; yeses: string[] };

/**
 * "full"  — the whole meal arc, ending in the voice after-meal check (/before).
 * "after" — go straight to the after-meal check (/after).
 */
export type MealCompanionMode = "full" | "after";

// Human labels for the after-meal tool fields, for the "what we noted" card.
// Keys must match afterMealLogTool's parameters (lib/ai/after-meal-tool.ts).
const CHECK_LABELS: Record<string, string> = {
  coughed: "Coughed during the meal",
  wetVoice: "Voice felt wet or gurgly",
  tiredBeforeFinishing: "Felt tired before finishing",
  avoidedFoodOrDrink: "Avoided a usual food or drink",
  usedStrategy: "Used a strategy",
};

const COPY = {
  full: {
    idleTitle: "Talk it through together",
    idleBody:
      "Tap to start. Gwinya will talk with you, one calm step at a time — and check in with you after the meal. You can just speak back.",
    startLabel: "Start meal companion",
    endLabel: "End companion",
    endedTitle: "Nice work. Enjoy the rest of your day.",
    endedBody: "Small bites, slow and steady.",
  },
  after: {
    idleTitle: "Let's see how that went",
    idleBody:
      "Tap to start. Gwinya will ask a few gentle questions about your meal, then note it for you. You can just speak back.",
    startLabel: "Start after-meal check",
    endLabel: "Done",
    endedTitle: "All noted. Well done.",
    endedBody: "Patterns over time are what matter.",
  },
} as const;

/**
 * Voice meal companion. Opens an OpenAI Realtime session over WebRTC:
 *   1. POST /api/realtime/session mints a short-lived ephemeral key (and picks
 *      the flow: the full meal arc, or just the after-meal check).
 *   2. We capture the mic, create an RTCPeerConnection, and exchange SDP
 *      directly with OpenAI using that ephemeral key.
 *   3. The companion's voice plays through an <audio> element; its spoken
 *      words are mirrored as live captions from the data-channel events.
 *
 * The companion's persona + the meal arc live in the server-side session
 * instructions (lib/ai/companion.ts), derived from the hardcoded profile. At
 * the end of the meal it runs a spoken version of the after-meal checklist and
 * calls the `save_after_meal_log` tool; we fulfil that here by persisting a
 * SymptomLog (best-effort) and handing the result back to the model.
 */
export function MealCompanion({ mode = "full" }: { mode?: MealCompanionMode }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [partial, setPartial] = useState("");
  const [recorded, setRecorded] = useState(false);
  const [check, setCheck] = useState<Check | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const partialRef = useRef("");
  // Guards against saving the after-meal check twice if the model calls the
  // tool more than once in a session (the DB write is idempotent per day, but
  // we keep the UI honest too).
  const savedRef = useRef(false);
  // True while a session is establishing or live. Guards against a second
  // start() (double-click / dev double-render) opening a parallel session,
  // which would fire a second greeting.
  const activeRef = useRef(false);

  const copy = COPY[mode];

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
    if (audioRef.current) {
      audioRef.current.srcObject = null;
      audioRef.current = null;
    }
    activeRef.current = false;
  }, []);

  // Stop everything if the component unmounts mid-session.
  useEffect(() => () => teardown(), [teardown]);

  const finalizePartial = useCallback((text: string) => {
    const clean = text.trim();
    partialRef.current = "";
    setPartial("");
    if (!clean) return;
    setLines((prev) => [...prev, { id: `${prev.length}-${clean.slice(0, 8)}`, text: clean }]);
  }, []);

  // The companion called save_after_meal_log: persist what it heard (best
  // effort), reflect it in the UI, then hand the result back so the model can
  // confirm warmly and move on to mouth care.
  const handleToolCall = useCallback((callId: string, rawArgs: string) => {
    if (savedRef.current) return;
    savedRef.current = true;

    let args: AfterMealCheckInput = {};
    try {
      args = JSON.parse(rawArgs || "{}") as AfterMealCheckInput;
    } catch {
      /* keep empty args — we still acknowledge the tool call */
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
        // Nudge the model to speak its confirmation now that the tool returned.
        dcRef.current?.send(JSON.stringify({ type: "response.create" }));
      } catch {
        /* channel closed — the model will move on anyway */
      }
    };

    saveAfterMealCheck(args)
      .then((r) => respond(r.saved))
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
      if (process.env.NODE_ENV !== "production") console.debug("[companion] event", t);
      // Assistant (companion) speech transcript. Handles both the GA event
      // name (response.output_audio_transcript.*) and the preview name
      // (response.audio_transcript.*).
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
        // The done event carries the fully-accumulated arguments string.
        handleToolCall(msg.item.call_id, msg.item.arguments ?? "{}");
      } else if (t === "error") {
        const m = msg.error?.message ?? "The voice service reported an error.";
        console.error("[companion] realtime error", msg.error);
        toast.error("Companion error", { description: m });
      }
    },
    [finalizePartial, handleToolCall],
  );

  const start = useCallback(async () => {
    // Ignore re-entry while a session is already establishing or live.
    if (activeRef.current) return;
    activeRef.current = true;
    setError(null);
    setLines([]);
    setPartial("");
    setCheck(null);
    partialRef.current = "";
    savedRef.current = false;
    setPhase("connecting");

    try {
      // getUserMedia is only exposed in a secure context (HTTPS or localhost).
      // Opening the dev server via its LAN IP over http disables it — point
      // the user back to localhost rather than blaming the browser.
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        const onLocalhost = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
        throw new Error(
          onLocalhost
            ? "This browser can't capture audio. Try the latest Chrome."
            : `Microphone needs a secure page. Open this on http://localhost:${location.port || "3000"} (not the network IP), or serve over HTTPS.`,
        );
      }

      // 1. Mint an ephemeral key (and tell the server which flow to run).
      const tokenRes = await fetch("/api/realtime/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (!tokenRes.ok) {
        const data = (await tokenRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Couldn't start the companion (${tokenRes.status}).`);
      }
      const { value: ephemeralKey, model } = (await tokenRes.json()) as {
        value: string;
        model: string;
      };

      // 2. Mic + peer connection.
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      micRef.current = mic;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const audioEl = new Audio();
      audioEl.autoplay = true;
      audioRef.current = audioEl;
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
        // Autoplay can be blocked when the element isn't tied to the click
        // gesture; play() right after we get the track is more reliable.
        audioEl.play().catch(() => {});
      };

      pc.addTrack(mic.getTracks()[0], mic);

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onmessage = (e) => handleEvent(e.data);
      dc.onopen = () => {
        setPhase("live");
        // The model waits for a turn before speaking (server-VAD). Nudge it to
        // deliver the opening greeting from its instructions right away, so the
        // companion speaks first instead of sitting silent until the user does.
        try {
          dc.send(JSON.stringify({ type: "response.create" }));
        } catch {
          /* channel not ready — the user speaking will trigger a turn anyway */
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          setPhase((p) => (p === "ended" ? p : "error"));
        }
      };

      // 3. SDP offer/answer directly with OpenAI using the ephemeral key.
      const offer = await pc.createOffer();
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
        throw new Error(`Connection refused (${sdpRes.status}). Check the model: ${model}.`);
      }
      const answerSdp = await sdpRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    } catch (e) {
      teardown();
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
      setPhase("error");
      toast.error("Couldn't start the companion", { description: msg });
    }
  }, [handleEvent, teardown, mode]);

  const stop = useCallback(() => {
    finalizePartial(partialRef.current);
    teardown();
    setPhase("ended");
    // Preserve the streak behaviour the tap checklist used to have.
    if (!recorded) {
      setRecorded(true);
      recordCheckIn()
        .then(({ count }) => {
          if (count > 0)
            toast.success("Check-in saved", { description: `${count}-day streak` });
        })
        .catch(() => {});
    }
  }, [finalizePartial, teardown, recorded]);

  return (
    <section className="space-y-4">
      {/* Idle / error: the start affordance */}
      {(phase === "idle" || phase === "error") && (
        <Card className="grid place-items-center gap-3 p-8 text-center">
          <span
            className="grid h-16 w-16 place-items-center rounded-full text-[var(--color-clay-deep)]"
            style={{ background: "var(--color-clay-soft)" }}
            aria-hidden
          >
            <Mic className="h-7 w-7" />
          </span>
          <p className="font-display text-lg font-semibold tracking-tight">{copy.idleTitle}</p>
          <p className="max-w-[28ch] text-sm leading-relaxed text-[var(--color-ink-soft)]">
            {copy.idleBody}
          </p>
          <Button size="lg" className="mt-1 w-full" onClick={start}>
            <Mic className="h-5 w-5" />
            {copy.startLabel}
          </Button>
          {phase === "error" && error ? (
            <p className="flex items-center gap-1.5 text-sm text-[var(--color-rose)]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          ) : (
            <p className="text-xs text-[var(--color-muted)]">
              Works best in Chrome. We&apos;ll ask for your microphone.
            </p>
          )}
        </Card>
      )}

      {/* Connecting */}
      {phase === "connecting" && (
        <Card className="grid place-items-center gap-3 p-10 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-clay-deep)]" />
          <p className="text-sm text-[var(--color-ink-soft)]">Waking your companion…</p>
        </Card>
      )}

      {/* Live session */}
      {phase === "live" && (
        <>
          <Card className="space-y-3 p-5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-moss-deep)] opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--color-moss-deep)]" />
              </span>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                Listening — just talk
              </p>
            </div>
            <Transcript lines={lines} partial={partial} />
          </Card>

          {check ? <CheckCard check={check} /> : null}

          {/* The food-check nudge only belongs to the full pre/during-meal flow. */}
          {mode === "full" && !check && (
            <Card className="flex items-center justify-between gap-3 p-4">
              <div className="space-y-0.5">
                <p className="font-semibold text-[var(--color-ink)]">Check your food</p>
                <p className="text-xs text-[var(--color-ink-soft)]">
                  Point the camera at your plate.
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/scan">
                  <Camera className="h-4 w-4" />
                  Food check
                </Link>
              </Button>
            </Card>
          )}

          <Button variant="outline" size="lg" className="w-full" onClick={stop}>
            <PhoneOff className="h-5 w-5" />
            {copy.endLabel}
          </Button>
        </>
      )}

      {/* Ended */}
      <AnimatePresence>
        {phase === "ended" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="space-y-4"
          >
            {lines.length > 0 && (
              <Card className="p-5">
                <p className="mb-2 text-[0.7rem] font-medium uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  What Gwinya said
                </p>
                <Transcript lines={lines} partial="" />
              </Card>
            )}
            {check ? <CheckCard check={check} /> : null}
            <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-moss-soft)] p-4 text-[#0a6e63]">
              <CheckCircle2 className="h-6 w-6 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">{copy.endedTitle}</p>
                <p className="text-sm opacity-80">{copy.endedBody}</p>
              </div>
              <Button variant="teal" size="sm" onClick={start}>
                Again
              </Button>
            </div>
            {check ? (
              <Card className="flex items-center justify-between gap-3 p-4">
                <p className="text-sm text-[var(--color-ink)]">See how your meals trend.</p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/progress">
                    <LineChart className="h-4 w-4" />
                    Patterns
                  </Link>
                </Button>
              </Card>
            ) : mode === "full" ? (
              // The session ended without an in-flow voice check (e.g. the user
              // stepped out to the food check, which tears the session down).
              // Offer the standalone after-meal voice check so the flow still
              // completes.
              <Card className="flex items-center justify-between gap-3 p-4">
                <div className="space-y-0.5">
                  <p className="font-semibold text-[var(--color-ink)]">Finished eating?</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    Talk through a quick after-meal check.
                  </p>
                </div>
                <Button asChild variant="teal" size="sm">
                  <Link href="/after">
                    After-meal check
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function CheckCard({ check }: { check: Check }) {
  const saving = check.status === "saving";
  return (
    <Card className="space-y-2 p-4">
      <div className="flex items-center gap-2">
        {saving ? (
          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-clay-deep)]" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-[#0a6e63]" />
        )}
        <p className="font-semibold text-[var(--color-ink)]">
          {saving ? "Noting your check…" : "After-meal check noted"}
        </p>
      </div>
      {check.yeses.length > 0 ? (
        <ul className="ml-7 list-disc space-y-0.5 text-sm text-[var(--color-ink-soft)]">
          {check.yeses.map((y) => (
            <li key={y}>{y}</li>
          ))}
        </ul>
      ) : (
        <p className="ml-7 text-sm text-[var(--color-ink-soft)]">
          A smooth meal — nothing to flag.
        </p>
      )}
    </Card>
  );
}

function Transcript({ lines, partial }: { lines: Line[]; partial: string }) {
  if (lines.length === 0 && !partial) {
    return (
      <p className="text-sm italic leading-relaxed text-[var(--color-muted)]">
        Gwinya will speak first…
      </p>
    );
  }
  return (
    <div className="space-y-2 text-[0.95rem] leading-relaxed text-[var(--color-ink)]">
      {lines.map((l) => (
        <p key={l.id}>{l.text}</p>
      ))}
      {partial ? <p className="text-[var(--color-ink-soft)]">{partial}</p> : null}
    </div>
  );
}
