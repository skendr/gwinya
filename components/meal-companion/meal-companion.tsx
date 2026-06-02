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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { recordCheckIn } from "@/lib/storage/actions";

type Phase = "idle" | "connecting" | "live" | "ended" | "error";

type Line = { id: string; text: string };

/**
 * Voice meal companion. Opens an OpenAI Realtime session over WebRTC:
 *   1. POST /api/realtime/session mints a short-lived ephemeral key.
 *   2. We capture the mic, create an RTCPeerConnection, and exchange SDP
 *      directly with OpenAI using that ephemeral key.
 *   3. The companion's voice plays through an <audio> element; its spoken
 *      words are mirrored as live captions from the data-channel events.
 *
 * The companion's persona + the meal arc live in the server-side session
 * instructions (lib/ai/companion.ts), derived from the hardcoded profile.
 */
export function MealCompanion() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [partial, setPartial] = useState("");
  const [recorded, setRecorded] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const partialRef = useRef("");
  // True while a session is establishing or live. Guards against a second
  // start() (double-click / dev double-render) opening a parallel session,
  // which would fire a second greeting.
  const activeRef = useRef(false);

  const teardown = useCallback(() => {
    try {
      pcRef.current?.getSenders().forEach((s) => s.track?.stop());
      pcRef.current?.close();
    } catch {
      /* ignore */
    }
    pcRef.current = null;
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

  const handleEvent = useCallback(
    (raw: string) => {
      let msg: { type?: string; delta?: string; transcript?: string; error?: { message?: string } };
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
      } else if (t === "error") {
        const m = msg.error?.message ?? "The voice service reported an error.";
        console.error("[companion] realtime error", msg.error);
        toast.error("Companion error", { description: m });
      }
    },
    [finalizePartial],
  );

  const start = useCallback(async () => {
    // Ignore re-entry while a session is already establishing or live.
    if (activeRef.current) return;
    activeRef.current = true;
    setError(null);
    setLines([]);
    setPartial("");
    partialRef.current = "";
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

      // 1. Mint an ephemeral key.
      const tokenRes = await fetch("/api/realtime/session", { method: "POST" });
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
  }, [handleEvent, teardown]);

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
          <p className="font-display text-lg font-semibold tracking-tight">
            Talk it through together
          </p>
          <p className="max-w-[28ch] text-sm leading-relaxed text-[var(--color-ink-soft)]">
            Tap to start. Gwinya will talk with you, one calm step at a time. You
            can just speak back.
          </p>
          <Button size="lg" className="mt-1 w-full" onClick={start}>
            <Mic className="h-5 w-5" />
            Start meal companion
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

          <Button variant="outline" size="lg" className="w-full" onClick={stop}>
            <PhoneOff className="h-5 w-5" />
            End companion
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
            <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-moss-soft)] p-4 text-[#0a6e63]">
              <CheckCircle2 className="h-6 w-6 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Nice work. Enjoy your meal.</p>
                <p className="text-sm opacity-80">Small bites, slow and steady.</p>
              </div>
              <Button variant="teal" size="sm" onClick={start}>
                Again
              </Button>
            </div>
            <Card className="flex items-center justify-between gap-3 p-4">
              <p className="text-sm text-[var(--color-ink)]">Ready to check your food?</p>
              <Button asChild variant="outline" size="sm">
                <Link href="/scan">
                  Food check
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
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
