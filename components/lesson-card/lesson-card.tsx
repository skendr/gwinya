import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Lesson } from "@/lib/domain/types";

const levelTone = {
  awareness: "cream",
  everyday: "teal",
  confidence: "gold",
} as const;

export function LessonCard({ lesson }: { lesson: Lesson }) {
  return (
    <Link href={`/learn/${lesson.slug}`} className="group block">
      <Card className="relative p-5 transition-transform group-hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge tone={levelTone[lesson.level]}>{lesson.level}</Badge>
              <span className="inline-flex items-center gap-1 text-xs text-[var(--color-muted)]">
                <Clock3 className="h-3.5 w-3.5" />
                {lesson.minutes} min
              </span>
            </div>
            <h3 className="font-display text-lg font-semibold leading-tight text-[var(--color-ink)]">
              {lesson.title}
            </h3>
            <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">{lesson.blurb}</p>
          </div>
          <ArrowUpRight
            className="h-5 w-5 shrink-0 text-[var(--color-muted)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--color-clay)]"
            strokeWidth={2}
          />
        </div>
      </Card>
    </Link>
  );
}
