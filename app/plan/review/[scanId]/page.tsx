import { PageHeader } from "@/components/layout";
import { PlanReviewLoader } from "@/components/clinical-plan";
import { requireUser } from "@/lib/auth/server";

export const metadata = { title: "Review your plan" };

export default async function PlanReviewPage({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  await requireUser("/plan/scan");
  const { scanId } = await params;

  return (
    <main className="flex-1 space-y-2 px-5 pb-10">
      <PageHeader
        eyebrow="Confirm before saving"
        title="Did I get this right?"
        subtitle="Every field is editable. Amber-bordered fields are the ones I was unsure about."
      />
      <PlanReviewLoader scanId={scanId} />
    </main>
  );
}
