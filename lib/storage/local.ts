"use client";

import type { StreakState, SymptomLog } from "@/lib/domain/types";
import { computeNextStreak, upsertLogByDate } from "@gwinya/shared/logic/streak";

/**
 * Tiny localStorage wrapper. The real app will sync with a backend (Supabase,
 * Convex, etc.); for the scaffold we keep daily state on-device so the home
 * screen feels alive without auth.
 *
 * The streak/log transition rules live in @gwinya/shared so the on-device
 * path here and the Drizzle Server Action path (lib/storage/actions.ts) — and
 * the mobile direct-Supabase path — all behave identically.
 */

const KEY_STREAK = "gwinya:streak";
const KEY_LOGS = "gwinya:logs";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exhausted or private mode — silently no-op */
  }
}

export function getStreak(): StreakState {
  return read<StreakState>(KEY_STREAK, { count: 0, lastCheckIn: null });
}

export function recordCheckIn(): StreakState {
  const next = computeNextStreak(getStreak());
  write(KEY_STREAK, next);
  return next;
}

export function getLogs(): SymptomLog[] {
  return read<SymptomLog[]>(KEY_LOGS, []);
}

export function appendLog(log: SymptomLog): void {
  write(KEY_LOGS, upsertLogByDate(getLogs(), log));
}
