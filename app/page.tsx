import Link from "next/link";
import { ArrowRight, Sparkles, ClipboardCheck } from "lucide-react";
import {
  PageHeader,
  SectionHeading,
  StaggeredReveal,
  RevealItem,
} from "@/components/layout";
import { StreakPill } from "@/components/streak-pill";
import { LessonCard } from "@/components/lesson-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { lessons } from "@/lib/content/lessons";

export default function HomePage() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const nextLesson = lessons[0];

  return (
    <main className="flex-1 px-5">
      <StaggeredReveal>
        <RevealItem>
          <PageHeader
            eyebrow={today}
            title={
              <>
                Good day.{" "}
                <span
                  className="squiggle italic text-[var(--color-clay-deep)]"
                  style={{ fontVariationSettings: '"WONK" 1, "SOFT" 100' }}
                >
                  How&apos;s your swallow?
                </span>
              </>
            }
            subtitle="A small check-in builds the habit. Tap when you're ready."
            right={<StreakPill days={3} />}
          />
        </RevealItem>

        <RevealItem>
          {/* Daily check-in card — the hero. Asymmetric clay wash bleeds in
              from the top-right corner; a tiny "Day 47" date stamp anchors
              the journal feel. */}
          <Card className="relative mt-2 overflow-hidden p-6">
            <div
              aria-hidden
              className="absolute -right-16 -top-16 h-52 w-52 rounded-full"
              style={{
                background:
                  "radial-gradient(closest-side, var(--color-clay-soft), transparent 70%)",
              }}
            />
            <span
              aria-hidden
              className="num absolute right-4 top-4 rotate-3 rounded-md border border-[var(--color-clay)]/40 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.2em] text-[var(--color-clay-deep)]/80"
            >
              day · 47
            </span>
            <div className="relative space-y-4 pt-6">
              <p className="font-display text-[1.65rem] font-semibold leading-[1.1] tracking-tight text-balance text-[var(--color-ink)]">
                About to eat or drink?
              </p>
              <p className="text-pretty text-[0.95rem] leading-relaxed text-[var(--color-ink-soft)]">
                Run through your readiness check — five short questions, under a minute.
              </p>
              <Button asChild size="lg" className="w-full">
                <Link href="/before">
                  <ClipboardCheck className="h-5 w-5" />
                  Start readiness check
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </Card>
        </RevealItem>

        <RevealItem>
          <div className="mt-10 space-y-4">
            <SectionHeading
              eyebrow="Today's lesson"
              title="Two minutes, no pressure"
              trailing={
                <Link
                  href="/learn"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-clay-deep)]"
                >
                  All lessons <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
            <LessonCard lesson={nextLesson} />
          </div>
        </RevealItem>

        <RevealItem>
          <div className="mt-10 space-y-4">
            <SectionHeading eyebrow="Just for you" title="Ask Gwinya" />
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-[var(--color-clay-deep)]"
                  style={{ background: "var(--color-clay-soft)" }}
                >
                  <Sparkles className="h-5 w-5" />
                </span>
                <div className="flex-1 space-y-3">
                  <p className="text-sm leading-relaxed text-[var(--color-ink)]">
                    Anything on your mind about meals, strategies, or what to ask your SLT?
                    I&apos;ll help you put it into words.
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/learn/what-is-dysphagia">Open a lesson with chat</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </RevealItem>
      </StaggeredReveal>
    </main>
  );
}
