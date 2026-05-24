import { PageHeader } from "@/components/layout";
import { AfterMealLog } from "@/components/after-meal-log";
import { requireUser } from "@/lib/auth/server";

export const metadata = { title: "After I ate" };

export default async function AfterPage() {
  await requireUser("/after");

  return (
    <main className="flex-1 px-5 pb-10">
      <PageHeader
        eyebrow="Post-meal log"
        title="How did that go?"
        subtitle="Five quick taps. The point is the pattern over time, not any single day."
      />
      <AfterMealLog />
    </main>
  );
}
