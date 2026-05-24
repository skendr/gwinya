import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout";
import { ScanFlow } from "@/components/food-scan";
import { getUser } from "@/lib/auth/server";

export const metadata = { title: "Scan food" };

export default async function ScanPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in?next=/scan");

  return (
    <main className="flex-1 px-5 pb-10">
      <PageHeader
        eyebrow="Food check"
        title={
          <>
            What does this{" "}
            <span
              className="squiggle italic text-[var(--color-clay-deep)]"
              style={{ fontVariationSettings: '"WONK" 1, "SOFT" 100' }}
            >
              look like
            </span>
            ?
          </>
        }
        subtitle="A quick visual comparison against your prescribed texture. Never a yes/no on safety."
      />
      <ScanFlow />
    </main>
  );
}
