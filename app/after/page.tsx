import { PageHeader } from "@/components/layout";
import { MealCompanion } from "@/components/meal-companion";
import { AfterMealLog } from "@/components/after-meal-log";
import { requireUser } from "@/lib/auth/server";

export const metadata = { title: "After I ate" };

export default async function AfterPage() {
  await requireUser("/after");

  return (
    <main className="flex-1 px-5 pb-10">
      <PageHeader
        eyebrow="Post-meal check"
        title="How did that go?"
        subtitle="Talk it through with Gwinya — a few gentle questions, then it's noted for you."
      />

      {/* Same voice companion as the meal flow, but it starts straight at the
          after-meal check and saves what it hears. */}
      <MealCompanion mode="after" />

      {/* A no-mic fallback: the original tap form writes the same SymptomLog. */}
      <details className="group mt-6">
        <summary className="cursor-pointer list-none text-sm font-medium text-[var(--color-clay-deep)]">
          Rather not talk? Tap it in instead
        </summary>
        <div className="mt-4">
          <AfterMealLog />
        </div>
      </details>
    </main>
  );
}
