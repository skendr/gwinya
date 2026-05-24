import { PageHeader } from "@/components/layout";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Progress" };

export default function ProgressPage() {
  return (
    <main className="flex-1 px-5">
      <PageHeader
        eyebrow="Over time"
        title="Your patterns"
        subtitle="The point isn't perfection — it's noticing what helps."
      />
      <Card className="p-6">
        <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
          Once you've logged a few meals, your progress map will appear here — coughing,
          confidence, fatigue, strategies used. Patterns over weeks, not pressure for today.
        </p>
      </Card>
    </main>
  );
}
