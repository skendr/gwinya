import Link from "next/link";
import { ArrowRight, Camera, ClipboardList } from "lucide-react";
import { PageHeader, SectionHeading } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlanSummary, PlanImage } from "@/components/clinical-plan";
import { requireUser } from "@/lib/auth/server";
import { getClinicalPlan, getSignedPlanImageUrl } from "@/app/plan/actions";

export const metadata = { title: "Your plan" };

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireUser("/plan");
  const plan = await getClinicalPlan();
  const justSaved = (await searchParams).saved === "1";
  const signedUrl = plan ? await getSignedPlanImageUrl(plan.sourceImagePath) : null;

  return (
    <main className="flex-1 space-y-6 px-5 pb-10">
      <PageHeader
        eyebrow="Your plan"
        title="What your SLT prescribed"
        subtitle="Read it any time. Update it whenever your SLT gives you a new slip."
      />

      {justSaved ? (
        <Card className="p-4 text-sm text-[var(--color-moss-deep)]">
          Saved. Your plan now drives scan matching, chat context, and the before-meal checklist.
        </Card>
      ) : null}

      {plan && plan.textureLevel != null ? (
        <>
          <PlanSummary plan={plan} />
          <PlanImage signedUrl={signedUrl} />
          <SectionHeading eyebrow="When it changes" title="Update from a new slip" />
          <Card className="space-y-3 p-5">
            <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
              New review with your SLT? Scan the latest slip — it replaces the active plan.
            </p>
            <Button asChild className="w-full">
              <Link href="/plan/scan">
                <Camera className="h-5 w-5" />
                Scan new slip
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </Card>
        </>
      ) : (
        <Card className="space-y-3 p-6">
          <span
            className="grid h-12 w-12 place-items-center rounded-2xl text-[var(--color-clay-deep)]"
            style={{ background: "var(--color-clay-soft)" }}
            aria-hidden
          >
            <ClipboardList className="h-6 w-6" />
          </span>
          <p className="font-display text-lg font-semibold tracking-tight">
            No plan saved yet
          </p>
          <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
            Scan your SLT&apos;s eating-and-drinking recommendations slip and Gwinya will
            ground every scan, chat, and reminder in your actual plan.
          </p>
          <Button asChild className="w-full">
            <Link href="/plan/scan">
              <Camera className="h-5 w-5" />
              Scan your slip
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </Card>
      )}
    </main>
  );
}
