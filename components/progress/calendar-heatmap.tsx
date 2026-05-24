import { isoDay } from "@/lib/format/dates";

/**
 * 30-day check-in heatmap. Renders as a single row of small rounded squares;
 * each dot is filled clay when there's a check-in that day, faint linen
 * otherwise. The most recent day sits on the right.
 */
export function CalendarHeatmap({
  checkInDays,
}: {
  /** ISO yyyy-mm-dd strings — the days the user checked in. */
  checkInDays: string[];
}) {
  const set = new Set(checkInDays);
  const today = isoDay();
  const days: { date: string; checked: boolean; isToday: boolean }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    days.push({ date: iso, checked: set.has(iso), isToday: iso === today });
  }
  return (
    <div className="flex items-end gap-[2px]" aria-label="Check-in history, last 30 days">
      {days.map(({ date, checked, isToday }) => (
        <div
          key={date}
          title={date}
          className="h-7 flex-1 rounded-[3px]"
          style={{
            background: checked
              ? "var(--color-clay)"
              : "color-mix(in oklab, var(--color-ink-soft) 12%, transparent)",
            outline: isToday ? "2px solid var(--color-honey)" : "none",
            outlineOffset: "1px",
          }}
        />
      ))}
    </div>
  );
}
