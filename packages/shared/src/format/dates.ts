/**
 * Tiny date helpers. We avoid bringing in date-fns/dayjs for a handful of
 * functions — these are 30 lines and locale-safe.
 *
 * Pure and framework-agnostic — shared by web and mobile.
 */

export function isoDay(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function daysBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso + "T00:00:00Z").getTime();
  const b = new Date(bIso + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86_400_000);
}

export function relativeDay(iso: string, today = isoDay()): string {
  const diff = daysBetween(iso, today);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff > 1 && diff < 7) return `${diff} days ago`;
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
