import type { StreakState, SymptomLog } from "../domain/types";
import { isoDay, daysBetween } from "../format/dates";

/**
 * Pure streak transition, shared by the web (localStorage + Drizzle Server
 * Action) and mobile (direct Supabase) data layers so the rule lives in
 * exactly one place:
 *
 *   - checking in again on the same day is a no-op (returns `current`),
 *   - a check-in on the day after the last one extends the streak (+1),
 *   - any larger gap (or the first ever check-in) resets it to 1.
 */
export function computeNextStreak(
  current: StreakState,
  today = isoDay(),
): StreakState {
  if (current.lastCheckIn === today) return current;
  const gap = current.lastCheckIn ? daysBetween(current.lastCheckIn, today) : null;
  const count = gap === 1 ? current.count + 1 : 1;
  return { count, lastCheckIn: today };
}

/**
 * Enforce the "one symptom log per date" contract: the latest submission for
 * a date replaces any earlier one. Used by both storage layers so /progress
 * aggregations stay honest.
 */
export function upsertLogByDate(
  logs: SymptomLog[],
  log: SymptomLog,
): SymptomLog[] {
  return [...logs.filter((l) => l.date !== log.date), log];
}
