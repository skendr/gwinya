"use client";

import { useState, useTransition, useId } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { saveMeal } from "@/lib/storage/actions";

type Props = {
  scanId: string;
  /** AI's guess at the item name. Pre-fills the input. */
  suggestedName: string;
  /** Default eaten-at time. Server treats null as "now"; UI defaults to now. */
  defaultEatenAt?: Date;
};

/**
 * Renders below ScanResultCard on /scan. The user can edit the AI's
 * item-name guess, optionally back-date the eaten-at time, and persist
 * the scan as a saved meal. Once saved we transition to a small "Saved"
 * confirmation so the same scan can't be saved twice.
 */
export function SaveMealCard({ scanId, suggestedName, defaultEatenAt }: Props) {
  const nameId = useId();
  const whenId = useId();
  const [name, setName] = useState(() => suggestedName.trim() || "");
  const [eatenAt, setEatenAt] = useState(() => toLocalInput(defaultEatenAt ?? new Date()));
  const [whenOpen, setWhenOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const trimmed = name.trim();
  const valid = trimmed.length > 0 && trimmed.length <= 120;

  function onSave() {
    if (!valid) return;
    startTransition(async () => {
      try {
        const parsed = parseLocalInput(eatenAt);
        await saveMeal({ scanId, mealName: trimmed, eatenAt: parsed });
        setSaved(true);
        toast.success("Meal saved", {
          description: "It's now in your meal log.",
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Something went wrong";
        toast.error("Couldn't save meal", { description: msg });
      }
    });
  }

  if (saved) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        className="space-y-3"
      >
        <Card className="flex items-center gap-3 p-4">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-[var(--color-moss-deep)]" />
          <div className="flex-1">
            <p className="font-semibold text-[var(--color-ink)]">Saved to your meal log</p>
            <p className="text-sm text-[var(--color-ink-soft)]">
              {trimmed} · {formatPretty(eatenAt)}
            </p>
          </div>
        </Card>

        {/* Hand the meal flow forward to the voice after-meal check. The scan
            navigation ended any live companion session, so this is how the
            post-meal check gets picked back up once eating is done. */}
        <Card className="flex items-center justify-between gap-3 p-4">
          <div className="space-y-0.5">
            <p className="font-semibold text-[var(--color-ink)]">When you&apos;ve finished eating</p>
            <p className="text-xs text-[var(--color-ink-soft)]">
              Talk through a quick after-meal check — Gwinya notes it for you.
            </p>
          </div>
          <Button asChild variant="teal" size="sm">
            <Link href="/after">
              After-meal check
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-center gap-2 text-[var(--color-ink)]">
        <UtensilsCrossed className="h-5 w-5 text-[var(--color-clay-deep)]" />
        <p className="font-semibold">Save as a meal</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={nameId} className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]">
          What was this?
        </label>
        <input
          id={nameId}
          type="text"
          inputMode="text"
          autoComplete="off"
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={pending}
          className="flex h-12 w-full rounded-2xl border border-[var(--input)] bg-[var(--color-paper)] px-4 text-base leading-relaxed placeholder:text-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => setWhenOpen((v) => !v)}
          aria-expanded={whenOpen}
          aria-controls={whenId}
          className="flex w-full items-center justify-between rounded-xl text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]"
        >
          <span>When? {formatPretty(eatenAt)}</span>
          {whenOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <AnimatePresence initial={false}>
          {whenOpen ? (
            <motion.div
              key="when"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <input
                id={whenId}
                type="datetime-local"
                value={eatenAt}
                onChange={(e) => setEatenAt(e.target.value)}
                max={toLocalInput(new Date())}
                disabled={pending}
                className="mt-2 flex h-12 w-full rounded-2xl border border-[var(--input)] bg-[var(--color-paper)] px-4 text-base leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <Button size="lg" className="w-full" disabled={!valid || pending} onClick={onSave}>
        {pending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Saving…
          </>
        ) : (
          "Save meal"
        )}
      </Button>
    </Card>
  );
}

/* ----------------------------------------------------------------------- */
/* Date helpers                                                            */
/* ----------------------------------------------------------------------- */

/** Convert a Date into the `YYYY-MM-DDTHH:mm` shape <input type="datetime-local"> wants. */
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/** Parse a `YYYY-MM-DDTHH:mm` local-time string back into a Date. */
function parseLocalInput(s: string): Date {
  // new Date("YYYY-MM-DDTHH:mm") parses as local time in all modern browsers.
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return new Date();
  return d;
}

/** "Today, 14:30" / "Yesterday, 09:15" / "Mar 14, 18:00" */
function formatPretty(localInput: string): string {
  const d = parseLocalInput(localInput);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const that = new Date(d);
  that.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - that.getTime()) / 86_400_000);
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (diff === 0) return `Today, ${time}`;
  if (diff === 1) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${time}`;
}
