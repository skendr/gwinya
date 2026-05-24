import { PageHeader } from "@/components/layout";
import { ReadinessChecklist } from "@/components/readiness-checklist";
import { beforeMeal } from "@/lib/content/checklists";

export const metadata = {
  title: "Before I eat",
};

export default function BeforePage() {
  return (
    <main className="flex-1 px-5">
      <PageHeader
        eyebrow="Readiness check"
        title="Before I eat"
        subtitle="Five gentle prompts to set you up for a safer meal."
      />
      <ReadinessChecklist checklist={beforeMeal} />
    </main>
  );
}
