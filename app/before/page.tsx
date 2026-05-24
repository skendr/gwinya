import { PageHeader } from "@/components/layout";
import { ReadinessChecklist } from "@/components/readiness-checklist";
import { buildBeforeMeal } from "@/lib/content/checklists";
import { getClinicalPlan } from "@/app/plan/actions";

export const metadata = {
  title: "Before I eat",
};

export default async function BeforePage() {
  // Personalises the standard 5-item checklist with up to 3 plan-derived
  // strategy items. Anonymous users (and signed-in users without a plan)
  // see the base list unchanged.
  const plan = await getClinicalPlan();
  const checklist = buildBeforeMeal(plan);

  return (
    <main className="flex-1 px-5">
      <PageHeader
        eyebrow="Readiness check"
        title="Before I eat"
        subtitle="Five gentle prompts to set you up for a safer meal."
      />
      <ReadinessChecklist checklist={checklist} />
    </main>
  );
}
