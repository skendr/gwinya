"use client";

import { motion } from "motion/react";
import { Flame } from "lucide-react";

/**
 * The streak chip is rendered as a *sticker* — tilted a few degrees off-axis,
 * with a small drop-shadow so it feels stuck to the page rather than rendered
 * by a UI library. This is one of the screen's signature personality moments.
 */
export function StreakPill({ days }: { days: number }) {
  return (
    <motion.div
      initial={{ scale: 0.85, rotate: -10, opacity: 0 }}
      animate={{ scale: 1, rotate: -3, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.2 }}
      className="sticker bg-[var(--color-honey-soft)] text-[#7a5300]"
      aria-label={`${days}-day check-in streak`}
    >
      <Flame
        className="h-4 w-4 fill-[var(--color-honey)] text-[var(--color-honey)]"
        strokeWidth={1.5}
      />
      <span className="num text-sm font-bold tabular-nums">
        {days}
        <span className="ml-0.5 text-[0.7em] font-medium opacity-70">d</span>
      </span>
    </motion.div>
  );
}
