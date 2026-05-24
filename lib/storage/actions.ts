"use server";

import { revalidatePath } from "next/cache";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { streak, symptomLogs, lessonProgress, profiles, foodScans } from "@/lib/db/schema";
import { getUser } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
/* Food scans                                                              */
/* ----------------------------------------------------------------------- */

type RecentScansOpts = {
  /** When true, only rows the user has flagged as saved meals (default false). */
  savedOnly?: boolean;
  limit?: number;
};

export async function getRecentScans(arg: number | RecentScansOpts = 5) {
  const user = await getUser();
  if (!user) return [];
  const opts: Required<RecentScansOpts> =
    typeof arg === "number"
      ? { savedOnly: false, limit: arg }
      : { savedOnly: !!arg.savedOnly, limit: arg.limit ?? 5 };

  // Saved meals sort by eaten_at (falls back to createdAt when null);
  // drafts sort by createdAt because they don't have an eaten_at yet.
  const orderCol = opts.savedOnly ? foodScans.eatenAt : foodScans.createdAt;
  const where = opts.savedOnly
    ? and(eq(foodScans.userId, user.id), eq(foodScans.saved, true))
    : eq(foodScans.userId, user.id);

  return db
    .select()
    .from(foodScans)
    .where(where)
    .orderBy(desc(orderCol), desc(foodScans.createdAt))
    .limit(opts.limit);
}

/**
 * Convert a scan into a saved meal. Writes `meal_name`, `eaten_at`, and
 * flips `saved=true` on the user's own row.
 *
 * RLS double-checks ownership via the `food_scans_owner_update` policy
 * (see 0002_meals.sql) — the application-level `eq(userId, user.id)` clause
 * is the early-failure guard. Both must agree before the row updates.
 */
export async function saveMeal({
  scanId,
  mealName,
  eatenAt,
}: {
  scanId: string;
  mealName: string;
  eatenAt: Date;
}) {
  const user = await getUser();
  if (!user) throw new Error("unauthorised");

  const trimmed = mealName.trim();
  if (!trimmed) throw new Error("meal-name-required");
  if (trimmed.length > 120) throw new Error("meal-name-too-long");

  const updated = await db
    .update(foodScans)
    .set({ mealName: trimmed, saved: true, eatenAt })
    .where(and(eq(foodScans.id, scanId), eq(foodScans.userId, user.id)))
    .returning({ id: foodScans.id });

  if (updated.length === 0) throw new Error("not-found");

  revalidatePath("/meals");
  revalidatePath("/progress");
  return { id: updated[0].id };
}

/**
 * Delete a saved meal (and its image). Used by the /meals delete affordance.
 * We delete the storage object first so RLS-less admin-bucket access stays
 * scoped to "rows the user actually owns".
 */
export async function deleteMeal(scanId: string) {
  const user = await getUser();
  if (!user) throw new Error("unauthorised");

  const [row] = await db
    .select({ imagePath: foodScans.imagePath })
    .from(foodScans)
    .where(and(eq(foodScans.id, scanId), eq(foodScans.userId, user.id)))
    .limit(1);
  if (!row) throw new Error("not-found");

  const admin = createAdminClient();
  await admin.storage.from("food-scans").remove([row.imagePath]);
  await db
    .delete(foodScans)
    .where(and(eq(foodScans.id, scanId), eq(foodScans.userId, user.id)));

  revalidatePath("/meals");
  revalidatePath("/progress");
}

/**
 * Sign image paths for the meal log so the browser can render thumbnails
 * directly from the private `food-scans` bucket without exposing the
 * service role. Falls back gracefully — a missing/expired signature
 * results in `url: null`, and the UI shows a placeholder.
 */
export async function getSignedScanUrls(
  paths: string[],
  expiresIn = 60 * 30,
): Promise<Record<string, string | null>> {
  if (paths.length === 0) return {};
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("food-scans")
    .createSignedUrls(paths, expiresIn);
  if (error || !data) return Object.fromEntries(paths.map((p) => [p, null]));
  return Object.fromEntries(data.map((row) => [row.path ?? "", row.signedUrl ?? null]));
}
