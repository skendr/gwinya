"use server";

import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { streak, symptomLogs, lessonProgress, profiles, foodScans } from "@/lib/db/schema";
import { getUser } from "@/lib/auth/server";
import { isoDay, daysBetween } from "@/lib/format/dates";
import type { SymptomLog } from "@/lib/domain/types";

/**
 * Server-side mirror of the localStorage helpers. Each function requires an
 * authenticated user and writes through Drizzle. RLS guards the DB but we
 * also check at the application layer for early failure.
 */

async function ensureProfile(userId: string) {
  await db
    .insert(profiles)
    .values({ userId })
    .onConflictDoNothing({ target: profiles.userId });
}

/* ----------------------------------------------------------------------- */
/* Streak                                                                  */
/* ----------------------------------------------------------------------- */

export async function getStreak() {
  const user = await getUser();
  if (!user) return { count: 0, lastCheckIn: null as string | null };
  const [row] = await db
    .select()
    .from(streak)
    .where(eq(streak.userId, user.id))
    .limit(1);
  return {
    count: row?.count ?? 0,
    lastCheckIn: row?.lastCheckIn ?? null,
  };
}

export async function recordCheckIn() {
  const user = await getUser();
  if (!user) throw new Error("unauthorised");
  await ensureProfile(user.id);

  const today = isoDay();
  const current = await getStreak();
  if (current.lastCheckIn === today) return current;

  const gap = current.lastCheckIn ? daysBetween(current.lastCheckIn, today) : null;
  const count = gap === 1 ? current.count + 1 : 1;

  await db
    .insert(streak)
    .values({ userId: user.id, count, lastCheckIn: today })
    .onConflictDoUpdate({
      target: streak.userId,
      set: { count, lastCheckIn: today },
    });

  revalidatePath("/");
  revalidatePath("/progress");
  return { count, lastCheckIn: today };
}

/* ----------------------------------------------------------------------- */
/* Symptom logs                                                            */
/* ----------------------------------------------------------------------- */

export async function getLogs(): Promise<SymptomLog[]> {
  const user = await getUser();
  if (!user) return [];
  const rows = await db
    .select()
    .from(symptomLogs)
    .where(eq(symptomLogs.userId, user.id))
    .orderBy(desc(symptomLogs.date))
    .limit(180);
  return rows.map((r) => ({
    date: r.date,
    coughing: r.coughing,
    wetVoice: r.wetVoice,
    fatigue: r.fatigue as 0 | 1 | 2 | 3,
    confidence: r.confidence as 1 | 2 | 3 | 4 | 5,
    usedStrategy: r.usedStrategy,
    notes: r.notes ?? undefined,
  }));
}

export async function appendLog(log: SymptomLog) {
  const user = await getUser();
  if (!user) throw new Error("unauthorised");
  await ensureProfile(user.id);

  await db
    .insert(symptomLogs)
    .values({
      userId: user.id,
      date: log.date,
      coughing: log.coughing,
      wetVoice: log.wetVoice,
      fatigue: log.fatigue,
      confidence: log.confidence,
      usedStrategy: log.usedStrategy,
      notes: log.notes,
    });

  revalidatePath("/progress");
}

/* ----------------------------------------------------------------------- */
/* Lesson progress                                                         */
/* ----------------------------------------------------------------------- */

export async function markLessonComplete(slug: string) {
  const user = await getUser();
  if (!user) return;
  await ensureProfile(user.id);
  await db
    .insert(lessonProgress)
    .values({ userId: user.id, slug })
    .onConflictDoNothing({ target: [lessonProgress.userId, lessonProgress.slug] });
  revalidatePath("/learn");
  revalidatePath("/progress");
}

/* ----------------------------------------------------------------------- */
/* Food scans (read-only — writes happen inside /api/scan)                 */
/* ----------------------------------------------------------------------- */

export async function getRecentScans(limit = 5) {
  const user = await getUser();
  if (!user) return [];
  return db
    .select()
    .from(foodScans)
    .where(eq(foodScans.userId, user.id))
    .orderBy(desc(foodScans.createdAt))
    .limit(limit);
}
