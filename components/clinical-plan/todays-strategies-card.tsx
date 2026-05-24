import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ClinicalPlan } from "@/lib/db/schema";

/**
 * Rotate strategies and exercises deterministically by ISO day so each
 * day the user opens the home screen they see a different subset — but
 * the same subset within a day (no jitter between mounts).
 */
function pickForToday<T>(xs: T[], count: number, isoDay: string): T[] {
  if (xs.length === 0) return [];
  const seed = isoDay
    .split("")
    .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 17);
  const start = seed % xs.length;
  const out: T[] = [];
  for (let i = 0; i < Math.min(count, xs.length); i++) {
    out.push(xs[(start + i) % xs.length]);
  }
  return out;
}

export function TodaysStrategiesCard({ plan }: { plan: ClinicalPlan }) {
  const isoDay = new Date().toISOString().slice(0, 10);
  const strategies = pickForToday(plan.strategies ?? [], 3, isoDay);
  const exercises = pickForToday(plan.exercises ?? [], 1, isoDay);

  if (strategies.length === 0 && exercises.length === 0) return null;

  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="grid h-9 w-9 place-items-center rounded-2xl text-[var(--color-clay-deep)]"
            style={{ background: "var(--color-clay-soft)" }}
            aria-hidden
          >
            <ClipboardList className="h-4 w-4" />
          </span>
          <p className="font-display text-lg font-semibold tracking-tight">
            Today&apos;s strategies
          </p>
        </div>
        <Link
          href="/plan"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-clay-deep)]"
        >
          Full plan <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <ul className="space-y-1.5 text-sm leading-relaxed text-[var(--color-ink)]">
        {strategies.map((s, i) => (
          <li key={`s-${i}`} className="flex items-start gap-2">
            <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
            <span>{s}</span>
          </li>
        ))}
        {exercises.map((e, i) => (
          <li key={`e-${i}`} className="flex items-start gap-2 text-[var(--color-ink-soft)]">
            <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
            <span>
              <span className="font-semibold text-[var(--color-ink)]">Exercise:</span> {e}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
