import Link from "next/link";
import { ArrowRight, Camera } from "lucide-react";
import { PageHeader, SectionHeading } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MealRow } from "@/components/meals/meal-row";
import { requireUser } from "@/lib/auth/server";
import { getRecentScans, getSignedScanUrls } from "@/lib/storage/actions";
import { isoDay, relativeDay } from "@/lib/format/dates";

export const metadata = { title: "Meal log" };

export default async function MealsPage() {
  await requireUser("/meals");

  // 90 days of saved meals is plenty for a personal log; the index covers
  // the (saved=true, eaten_at desc) read.
  const meals = await getRecentScans({ savedOnly: true, limit: 200 });

  // Pull signed thumbnail URLs in one round-trip so the page server-renders.
  const urlMap = await getSignedScanUrls(meals.map((m) => m.imagePath));

  // Group by ISO day for the date headers. Falls back to created_at when
  // eaten_at is null (legacy saved scans pre-A.1).
  const groups = new Map<
    string,
    Array<(typeof meals)[number] & { eatenAtResolved: Date }>
  >();
  for (const m of meals) {
    const when = m.eatenAt ?? m.createdAt;
    const day = isoDay(when);
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push({ ...m, eatenAtResolved: when });
  }

  return (
    <main className="flex-1 space-y-6 px-5 pb-10">
      <PageHeader
        eyebrow="Meal log"
        title="What you've been eating"
        subtitle="Saved scans only. Open the camera to log a new one."
      />

      {meals.length === 0 ? (
        <Card className="space-y-3 p-6">
          <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
            No saved meals yet. After a scan, tap{" "}
            <span className="font-semibold text-[var(--color-ink)]">Save meal</span>{" "}
            to add it here.
          </p>
          <Button asChild className="w-full">
            <Link href="/scan">
              <Camera className="h-5 w-5" />
              Scan a meal
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([day, rows]) => (
            <section key={day} className="space-y-2">
              <SectionHeading
                eyebrow={relativeDay(day)}
                title={new Date(day + "T00:00:00").toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              />
              <ul className="space-y-2">
                {rows.map((m) => (
                  <li key={m.id}>
                    <MealRow
                      id={m.id}
                      mealName={m.mealName ?? "Untitled meal"}
                      predictedLevel={m.predictedLevel}
                      matchesPrescribed={m.matchesPrescribed}
                      prescribedLevelAtScan={m.prescribedLevelAtScan}
                      eatenAt={m.eatenAtResolved}
                      imageUrl={urlMap[m.imagePath] ?? null}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
