import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  className,
  right,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className={cn("flex items-end justify-between gap-4 pt-8 pb-6", className)}>
      <div className="space-y-1.5">
        {eyebrow ? (
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-[var(--color-muted)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-balance font-display text-[2.15rem] font-semibold leading-[1.05] tracking-tight text-[var(--color-ink)]">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-pretty text-sm leading-relaxed text-[var(--color-ink-soft)]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {right}
    </header>
  );
}
