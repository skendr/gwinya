"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { afterMeal } from "@/lib/content/checklists";
import { appendLog } from "@/lib/storage/actions";
import { isoDay } from "@/lib/format/dates";

/**
 * Post-meal log form. Reuses the static `afterMeal` checklist for its
 * items so the prompt copy stays consistent, but submits to the
 * symptom_logs table via the appendLog server action instead of the
 * lightweight ReadinessChecklist client-only path.
 *
 * Mapping (afterMeal item id → symptom_logs column):
 *   cough  → coughing
 *   wet    → wetVoice
 *   tired  → fatigue (0 untracked, 2 if ticked — a single bit can't
 *                    distinguish 0..3, but ticking "I felt tired" is a
 *                    meaningful "yes, this was a thing today")
 *   avoid  → notes (concatenated; no DB column for it)
 *   used   → usedStrategy
 *
 * confidence is left at the default (3) since this form doesn't ask
 * about it — the Progress sparkline shows "blank = no log" for that
 * dimension when only after-meal data was submitted.
 */
export function AfterMealLog() {
  const router = useRouter();
  const [state, setState] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  const checked = afterMeal.items.filter((i) => state[i.id]).length;
  const total = afterMeal.items.length;
  const progress = total === 0 ? 0 : Math.round((checked / total) * 100);

  function onSubmit() {
    startTransition(async () => {
      try {
        const avoid = state.avoid ? "Avoided something I usually have." : null;
        const composedNotes = [avoid, notes.trim() || null].filter(Boolean).join("\n") || undefined;
        await appendLog({
          date: isoDay(),
          coughing: !!state.cough,
          wetVoice: !!state.wet,
          fatigue: state.tired ? 2 : 0,
          confidence: 3,
          usedStrategy: !!state.used,
          notes: composedNotes,
        });
        toast.success("Logged", { description: "Your patterns just got a little clearer." });
        router.push("/progress");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Couldn't save";
        toast.error("Save failed", { description: msg });
      }
    });
  }

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <p className="text-pretty text-sm leading-relaxed text-[var(--color-ink-soft)]">
          {afterMeal.intro}
        </p>
        <div className="flex items-center gap-3">
          <Progress value={progress} tone="teal" className="flex-1" />
          <span className="text-xs font-medium tabular-nums text-[var(--color-muted)]">
            {checked}/{total}
          </span>
        </div>
      </div>

      <ul className="space-y-2">
        {afterMeal.items.map((item) => (
          <li key={item.id}>
            <label
              htmlFor={item.id}
              className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[var(--color-paper)] p-4 shadow-[0_1px_0_0_rgba(28,36,51,0.04)] transition-shadow hover:shadow-[0_8px_22px_-16px_rgba(28,36,51,0.18)]"
            >
              <Checkbox
                id={item.id}
                checked={!!state[item.id]}
                onCheckedChange={(value) =>
                  setState((prev) => ({ ...prev, [item.id]: value === true }))
                }
                className="mt-0.5"
              />
              <span className="flex flex-col gap-1">
                <span className="font-medium leading-snug text-[var(--color-ink)]">
                  {item.prompt}
                </span>
                {item.helper ? (
                  <span className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
                    {item.helper}
                  </span>
                ) : null}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <Card className="space-y-2 p-4">
        <label
          htmlFor="notes"
          className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-[var(--color-muted)]"
        >
          Anything to remember? (optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="A meal that felt different, a strategy that helped, a question for your SLT."
          className="flex w-full resize-none rounded-2xl border border-[var(--input)] bg-[var(--color-paper)] px-4 py-3 text-base leading-relaxed"
        />
      </Card>

      <Button variant="teal" size="lg" className="w-full" disabled={pending} onClick={onSubmit}>
        {pending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <Send className="h-5 w-5" />
            Save log
          </>
        )}
      </Button>

      <AnimatePresence>
        {checked === total && total > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="rounded-2xl bg-[var(--color-honey-soft)] p-3 text-xs text-[#7a5300]"
          >
            That&apos;s a lot of yeses — if today felt unsafe, take a quick look at the warning signs on your plan.
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
