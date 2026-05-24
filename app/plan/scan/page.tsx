import { PageHeader } from "@/components/layout";
import { PlanScanFlow } from "@/components/clinical-plan";
import { requireUser } from "@/lib/auth/server";

export const metadata = { title: "Scan SLT slip" };

export default async function PlanScanPage() {
  await requireUser("/plan/scan");

  return (
    <main className="flex-1 px-5 pb-10">
      <PageHeader
        eyebrow="Plan setup"
        title={
          <>
            Scan your{" "}
            <span
              className="squiggle italic text-[var(--color-clay-deep)]"
              style={{ fontVariationSettings: '"WONK" 1, "SOFT" 100' }}
            >
              SLT slip
            </span>
          </>
        }
        subtitle="One clear photo. You'll get to edit every field before saving."
      />
      <PlanScanFlow />
    </main>
  );
}
