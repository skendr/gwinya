import Image from "next/image";
import { Card } from "@/components/ui/card";

/**
 * Signed-URL preview of the original slip photograph. Shown on /plan so
 * the user (or a friend / another clinician) can verify the parsed
 * fields against the source. URL is signed for ~30 min and unoptimized
 * to dodge Next image-loader allowlist config.
 */
export function PlanImage({
  signedUrl,
  caption = "Your original slip",
}: {
  signedUrl: string | null;
  caption?: string;
}) {
  if (!signedUrl) return null;
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative aspect-[3/4] w-full bg-[var(--color-linen-2)]">
        <Image
          src={signedUrl}
          alt={caption}
          fill
          sizes="(max-width: 28rem) 100vw, 28rem"
          className="object-contain"
          unoptimized
        />
      </div>
      <p className="px-4 py-2 text-xs text-[var(--color-muted)]">{caption}</p>
    </Card>
  );
}
