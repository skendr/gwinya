import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  className,
  trailing,
}: {
  eyebrow?: string;
  title: string;
  className?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-3 pb-3", className)}>
      <div className="space-y-0.5">
        {eyebrow ? (
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-[var(--color-muted)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-xl font-semibold tracking-tight text-[var(--color-ink)]">
          {title}
        </h2>
      </div>
      {trailing}
    </div>
  );
}
