"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { Checklist } from "@/lib/domain/types";
import { ReadinessItem } from "./readiness-item";
import { CheckCircle2 } from "lucide-react";

export function ReadinessChecklist({ checklist }: { checklist: Checklist }) {
  const [state, setState] = useState<Record<string, boolean>>({});

  const checked = useMemo(
    () => checklist.items.filter((i) => state[i.id]).length,
    [state, checklist.items]
  );
  const total = checklist.items.length;
  const progress = total === 0 ? 0 : Math.round((checked / total) * 100);
  const complete = checked === total;

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <p className="text-pretty text-sm leading-relaxed text-[var(--color-ink-soft)]">
          {checklist.intro}
        </p>
        <div className="flex items-center gap-3">
          <Progress value={progress} tone={complete ? "teal" : "coral"} className="flex-1" />
          <span className="text-xs font-medium tabular-nums text-[var(--color-muted)]">
            {checked}/{total}
          </span>
        </div>
      </div>

      <ul className="space-y-2">
        {checklist.items.map((item) => (
          <li key={item.id}>
            <ReadinessItem
              item={item}
              checked={!!state[item.id]}
              onChange={(next) => setState((prev) => ({ ...prev, [item.id]: next }))}
            />
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {complete && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="flex items-center gap-3 rounded-2xl bg-[var(--color-moss-soft)] p-4 text-[#0a6e63]"
          >
            <CheckCircle2 className="h-6 w-6 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">You're set. Enjoy your meal.</p>
              <p className="text-sm opacity-80">Slow and steady. We'll be here after.</p>
            </div>
            <Button variant="teal" size="sm" asChild>
              <a href="/">Done</a>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
