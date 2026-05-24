import Link from "next/link";
import { PageHeader, SectionHeading } from "@/components/layout";
import { CalendarHeatmap, Sparkline } from "@/components/progress";
import { IddsiLevelBadge } from "@/components/food-scan";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth/server";
import { getLogs, getStreak, getRecentScans } from "@/lib/storage/actions";
import { isoDay, daysBetween, relativeDay } from "@/lib/format/dates";
import type { IddsiLevel } from "@/lib/content/iddsi";

export const metadata = { title: "Progress" };

function aggregateLast14(logs: Awaited<ReturnType<typeof getLogs>>) {
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const byDate = new Map(logs.map((l) => [l.date, l]));
  const confidence: (number | null)[] = days.map((d) => byDate.get(d)?.confidence ?? null);
  const coughingFlags: (number | null)[] = days.map((d) => {
    const l = byDate.get(d);
    return l ? (l.coughing ? 1 : 0) : null;
  });
  const fatigue: (number | null)[] = days.map((d) => byDate.get(d)?.fatigue ?? null);
  return { confidence, coughingFlags, fatigue };
}

export default async function ProgressPage() {
  const user = await getUser();
  if (!user) {
    return (
      <main className="flex-1 px-5">
        <PageHeader
          eyebrow="Over time"
          title="Your patterns"
          subtitle="Sign in to see your check-ins, symptoms, and food scans over time."
        />
        <Card className="space-y-3 p-6">
          <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
            Gwinya keeps your data on your account, not just this device, so your streak
            survives a phone change.
          </p>
          <Button asChild className="w-full">
            <Link href="/sign-in?next=/progress">Sign in</Link>
          </Button>
        </Card>
      </main>
    );
  }

  const [{ count, lastCheckIn }, logs, scans] = await Promise.all([
    getStreak(),
    getLogs(),
    getRecentScans(6),
  ]);

  const today = isoDay();
  const daysSince = lastCheckIn ? daysBetween(lastCheckIn, today) : null;
  const checkInDays = logs.map((l) => l.date);
  const { confidence, coughingFlags, fatigue } = aggregateLast14(logs);
  const matchCount = scans.filter((s) => s.matchesPrescribed === "matches").length;
  const matchRate = scans.length ? Math.round((matchCount / scans.length) * 100) : null;

  return (
    <main className="flex-1 space-y-6 px-5">
      <PageHeader
        eyebrow="Over time"
        title="Your patterns"
        subtitle="The point isn't perfection — it's noticing what helps."
      />

      <Card className="space-y-4 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Streak
            </p>
            <p className="font-display text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
              <span className="num tabular-nums">{count}</span>{" "}
              <span className="text-base font-medium text-[var(--color-ink-soft)]">
                day{count === 1 ? "" : "s"}
              </span>
            </p>
          </div>
          <p className="text-xs text-[var(--color-muted)]">
            {lastCheckIn ? `Last: ${relativeDay(lastCheckIn)}` : "No check-ins yet"}
          </p>
        </div>
        <CalendarHeatmap checkInDays={checkInDays} />
        {daysSince != null && daysSince > 1 ? (
          <p className="text-xs text-[var(--color-ink-soft)]">
            It&apos;s been {daysSince} days — a tiny check-in today re-starts the streak.
          </p>
        ) : null}
      </Card>

      <div>
        <SectionHeading eyebrow="Last two weeks" title="Symptom trends" />
        <div className="grid grid-cols-1 gap-3">
          <Card className="space-y-2 p-4">
            <div className="flex items-baseline justify-between">
              <p className="font-medium">Confidence (1–5)</p>
              <span className="text-xs text-[var(--color-muted)]">
                higher = better
              </span>
            </div>
            <Sparkline values={confidence} tone="moss" />
          </Card>
          <Card className="space-y-2 p-4">
            <div className="flex items-baseline justify-between">
              <p className="font-medium">Coughing days</p>
              <span className="text-xs text-[var(--color-muted)]">
                blank = no log
              </span>
            </div>
            <Sparkline values={coughingFlags} tone="clay" />
          </Card>
          <Card className="space-y-2 p-4">
            <div className="flex items-baseline justify-between">
              <p className="font-medium">Fatigue (0–3)</p>
              <span className="text-xs text-[var(--color-muted)]">
                lower = better
              </span>
            </div>
            <Sparkline values={fatigue} tone="honey" />
          </Card>
        </div>
      </div>

      <div>
        <SectionHeading
          eyebrow="Food scans"
          title="Recent scans"
          trailing={
            matchRate != null ? (
              <Badge tone={matchRate >= 70 ? "teal" : matchRate >= 40 ? "gold" : "coral"}>
                {matchRate}% match
              </Badge>
            ) : null
          }
        />
        {scans.length ? (
          <ul className="space-y-2">
            {scans.map((s) => (
              <li key={s.id}>
                <Card className="flex items-center justify-between gap-3 p-3 px-4">
                  <div className="space-y-0.5">
                    <IddsiLevelBadge
                      level={(s.predictedLevel ?? null) as IddsiLevel | null}
                      size="sm"
                    />
                    <p className="text-xs text-[var(--color-muted)]">
                      {relativeDay(s.createdAt.toISOString().slice(0, 10))}
                      {s.prescribedLevelAtScan != null
                        ? ` · prescribed L${s.prescribedLevelAtScan}`
                        : null}
                    </p>
                  </div>
                  <Badge
                    tone={
                      s.matchesPrescribed === "matches"
                        ? "teal"
                        : s.matchesPrescribed === "less-modified"
                          ? "coral"
                          : s.matchesPrescribed === "more-modified"
                            ? "gold"
                            : "cream"
                    }
                  >
                    {s.matchesPrescribed === "matches" ? "match" : s.matchesPrescribed}
                  </Badge>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <Card className="p-5">
            <p className="text-sm text-[var(--color-ink-soft)]">
              No scans yet. Tap the camera button at the bottom of the screen the next time
              you&apos;re unsure of a meal.
            </p>
          </Card>
        )}
      </div>
    </main>
  );
}
