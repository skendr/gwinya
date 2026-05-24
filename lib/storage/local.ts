"use client";

import type { StreakState, SymptomLog } from "@/lib/domain/types";
import { isoDay, daysBetween } from "@/lib/format/dates";

/**
 * Tiny localStorage wrapper. The real app will sync with a backend (Supabase,
 * Convex, etc.); for the scaffold we keep daily state on-device so the home
 * screen feels alive without auth.
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
  const today = isoDay();
  const current = getStreak();
  if (current.lastCheckIn === today) return current;
  const gap = current.lastCheckIn ? daysBetween(current.lastCheckIn, today) : null;
  const count = gap === 1 ? current.count + 1 : 1;
  const next: StreakState = { count, lastCheckIn: today };
  write(KEY_STREAK, next);
  return next;
}

export function getLogs(): SymptomLog[] {
  return read<SymptomLog[]>(KEY_LOGS, []);
}

export function appendLog(log: SymptomLog): void {
  const logs = getLogs();
  const filtered = logs.filter((l) => l.date !== log.date);
  write(KEY_LOGS, [...filtered, log]);
}
