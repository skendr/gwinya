import type { SymptomLog, StreakState } from "@gwinya/shared/domain/types";
import { computeNextStreak, upsertLogByDate } from "@gwinya/shared/logic/streak";
import { isoDay } from "@gwinya/shared/format/dates";
import { supabase } from "./supabase";

/**
 * Mobile data layer. The web persists via Next.js Server Actions
 * (lib/storage/actions.ts), which RN can't call — so we talk directly to
 * Supabase. RLS (`for all` owner policies on streak/symptom_logs/
 * lesson_progress, gated by auth.uid() = user_id) makes this safe: the
 * authenticated anon client can only read/write the signed-in user's rows.
 *
 * The streak/log transition RULES come from @gwinya/shared so this stays
 * identical to the web Server Actions; only the DB I/O differs.
 */

/* -------------------------------- Lessons -------------------------------- */

export async function markLessonComplete(userId: string, slug: string): Promise<void> {
  await supabase
    .from("lesson_progress")
    .upsert({ user_id: userId, slug }, { onConflict: "user_id,slug", ignoreDuplicates: true });
}

export async function getCompletedSlugs(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("slug")
    .eq("user_id", userId);
  if (error || !data) return new Set();
  return new Set(data.map((r) => r.slug as string));
}

/* -------------------------------- Streak --------------------------------- */

export async function getStreak(userId: string): Promise<StreakState> {
  const { data } = await supabase
    .from("streak")
    .select("count,last_check_in")
    .eq("user_id", userId)
    .maybeSingle();
  return {
    count: data?.count ?? 0,
    lastCheckIn: (data?.last_check_in as string | null) ?? null,
  };
}

export async function recordCheckIn(userId: string): Promise<StreakState> {
  const today = isoDay();
  const current = await getStreak(userId);
  if (current.lastCheckIn === today) return current;
  const next = computeNextStreak(current, today);
  await supabase
    .from("streak")
    .upsert(
      { user_id: userId, count: next.count, last_check_in: next.lastCheckIn },
      { onConflict: "user_id" },
    );
  return next;
}

/* ----------------------------- Symptom logs ------------------------------ */

export async function getLogs(userId: string): Promise<SymptomLog[]> {
  const { data, error } = await supabase
    .from("symptom_logs")
    .select("date,coughing,wet_voice,fatigue,confidence,used_strategy,notes")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(180);
  if (error || !data) return [];
  return data.map((r) => ({
    date: r.date as string,
    coughing: r.coughing as boolean,
    wetVoice: r.wet_voice as boolean,
    fatigue: r.fatigue as 0 | 1 | 2 | 3,
    confidence: r.confidence as 1 | 2 | 3 | 4 | 5,
    usedStrategy: r.used_strategy as boolean,
    notes: (r.notes as string | null) ?? undefined,
  }));
}

/**
 * One symptom log per date (matches the web contract): the latest submission
 * for a date replaces any earlier one. We delete-then-insert like the web
 * Server Action does, and reuse the shared upsert rule for any in-memory list.
 */
export async function appendLog(userId: string, log: SymptomLog): Promise<void> {
  await supabase
    .from("symptom_logs")
    .delete()
    .eq("user_id", userId)
    .eq("date", log.date);
  await supabase.from("symptom_logs").insert({
    user_id: userId,
    date: log.date,
    coughing: log.coughing,
    wet_voice: log.wetVoice,
    fatigue: log.fatigue,
    confidence: log.confidence,
    used_strategy: log.usedStrategy,
    notes: log.notes ?? null,
  });
}

/** Re-exported so callers can normalise an in-memory list the same way. */
export { upsertLogByDate };

/* --------------------------- Food scans / meals -------------------------- */

export type SavedMeal = {
  id: string;
  imagePath: string;
  mealName: string | null;
  predictedLevel: number | null;
  levelName: string | null;
  matchesPrescribed: string | null;
  eatenAt: string | null;
  createdAt: string;
};

/**
 * Turn a draft food_scans row into a saved meal (RLS food_scans_owner_update).
 * The row was created server-side by /api/scan; here we just flip saved=true
 * and set the user-confirmed name + eaten time.
 */
export async function saveMeal(
  userId: string,
  scanId: string,
  mealName: string,
  eatenAt: Date,
): Promise<boolean> {
  const { error } = await supabase
    .from("food_scans")
    .update({ meal_name: mealName.trim(), saved: true, eaten_at: eatenAt.toISOString() })
    .eq("id", scanId)
    .eq("user_id", userId);
  return !error;
}

export async function getSavedMeals(userId: string): Promise<SavedMeal[]> {
  const { data, error } = await supabase
    .from("food_scans")
    .select("id,image_path,meal_name,predicted_level,level_name,matches_prescribed,eaten_at,created_at")
    .eq("user_id", userId)
    .eq("saved", true)
    .order("eaten_at", { ascending: false, nullsFirst: false })
    .limit(200);
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id as string,
    imagePath: r.image_path as string,
    mealName: (r.meal_name as string | null) ?? null,
    predictedLevel: (r.predicted_level as number | null) ?? null,
    levelName: (r.level_name as string | null) ?? null,
    matchesPrescribed: (r.matches_prescribed as string | null) ?? null,
    eatenAt: (r.eaten_at as string | null) ?? null,
    createdAt: r.created_at as string,
  }));
}

/**
 * Delete the meal ROW (RLS food_scans_owner_delete). The storage object stays
 * (the food-scans bucket has no client delete policy — uploads/deletes are
 * server-side admin), so the image is orphaned; acceptable for now.
 */
export async function deleteMeal(userId: string, scanId: string): Promise<void> {
  await supabase.from("food_scans").delete().eq("id", scanId).eq("user_id", userId);
}

/** Sign thumbnail URLs for the private food-scans bucket (own-folder SELECT policy). */
export async function signMealThumbs(paths: string[]): Promise<Record<string, string | null>> {
  if (paths.length === 0) return {};
  const { data } = await supabase.storage.from("food-scans").createSignedUrls(paths, 60 * 30);
  const map: Record<string, string | null> = {};
  for (const row of data ?? []) map[row.path ?? ""] = row.signedUrl ?? null;
  return map;
}
