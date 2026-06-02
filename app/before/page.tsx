import { PageHeader } from "@/components/layout";
import { MealCompanion } from "@/components/meal-companion";

export const metadata = {
  title: "Meal companion",
};

export default function BeforePage() {
  return (
    <main className="flex-1 px-5">
      <PageHeader
        eyebrow="Meal companion"
        title="Let's eat together"
        subtitle="A calm voice to talk you through it — one small step at a time."
      />
      <MealCompanion />
    </main>
  );
}
