import { iddsi, type IddsiLevel } from "@/lib/content/iddsi";
import { cn } from "@/lib/utils";

/**
 * Level badges use a small ramp from soft (level 7 = regular) to most-modified
 * (level 0 = thin). Visually each looks like a museum specimen tag.
 */
const palette: Record<IddsiLevel, { bg: string; ink: string }> = {
  0: { bg: "var(--color-moss-soft)", ink: "var(--color-moss-deep)" },
  1: { bg: "var(--color-moss-soft)", ink: "var(--color-moss-deep)" },
  2: { bg: "var(--color-honey-soft)", ink: "#7a5300" },
  3: { bg: "var(--color-honey-soft)", ink: "#7a5300" },
  4: { bg: "var(--color-clay-soft)", ink: "var(--color-clay-deep)" },
  5: { bg: "var(--color-clay-soft)", ink: "var(--color-clay-deep)" },
  6: { bg: "var(--color-linen-2)", ink: "var(--color-ink)" },
  7: { bg: "var(--color-linen-2)", ink: "var(--color-ink)" },
};

export function IddsiLevelBadge({
  level,
  size = "md",
  className,
}: {
  level: IddsiLevel | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (level === null) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-[var(--color-linen-2)] px-3 py-1 text-sm font-medium text-[var(--color-ink-soft)]",
          className,
        )}
      >
        Unclear image
      </span>
    );
  }
  const meta = iddsi[level];
  const tone = palette[level];
  const isLg = size === "lg";
  const isSm = size === "sm";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full font-semibold",
        isLg ? "px-4 py-1.5 text-base" : isSm ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className,
      )}
      style={{ background: tone.bg, color: tone.ink }}
    >
      <span className="num font-bold tabular-nums opacity-70">L{level}</span>
      <span>{meta.name}</span>
    </span>
  );
}
