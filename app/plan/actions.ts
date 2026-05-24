"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { clinicalPlan, clinicalPlanHistory } from "@/lib/db/schema";
import { getUser } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EducationalLink } from "@/lib/db/schema";

/**
 * Upsert the user's clinical_plan from a /plan/review submission.
 *
 * Application-level ownership gate is `getUser()` here; defence-in-depth
 * is the `clinical_plan_owner_all` RLS policy (see 0001_rls.sql) which
 * blocks any cross-user write even if this function shipped with a bug.
 *
 * After-write contract:
 *  - revalidates /, /plan, /scan, /chat surfaces (Block C reads the plan
 *    from there for cached chat context, today's strategies, etc.).
 *  - redirects to /plan so the user sees the saved result.
 */
export type SaveClinicalPlanInput = {
  textureLevel: number | null;
  fluidLevel: number | null;
  posture: string;
  specialPrecautions: string[];
  warningSigns: string[];
  strategies: string[];
  exercises: string[];
  foodsToAvoid: string[];
  redFlags: string[];
  educationalLinks: EducationalLink[];
  sltName: string | null;
  reviewDate: string | null; // ISO yyyy-mm-dd
  rawPlanText: string;
  parsedConfidence: "low" | "medium" | "high";
  sourceImagePath: string | null;
};

function clampLevel(v: number | null, max: number): number | null {
  if (v == null) return null;
  if (!Number.isInteger(v)) return null;
  if (v < 0 || v > max) return null;
  return v;
}

function cleanStrings(xs: unknown): string[] {
  if (!Array.isArray(xs)) return [];
  return xs
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter((x) => x.length > 0 && x.length < 600);
}

function cleanLinks(xs: unknown): EducationalLink[] {
  if (!Array.isArray(xs)) return [];
  const out: EducationalLink[] = [];
  for (const raw of xs) {
    if (!raw || typeof raw !== "object") continue;
    const label = typeof (raw as { label?: unknown }).label === "string" ? (raw as { label: string }).label.trim() : "";
    const url = typeof (raw as { url?: unknown }).url === "string" ? (raw as { url: string }).url.trim() : "";
    if (!url) continue;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") continue;
      out.push({ label: label || parsed.hostname, url: parsed.toString() });
    } catch {
      // drop invalid URLs silently — the prompt told the model to do the same
    }
  }
  return out;
}

export async function saveClinicalPlan(input: SaveClinicalPlanInput) {
  const user = await getUser();
  if (!user) throw new Error("unauthorised");

  const review = input.reviewDate?.match(/^\d{4}-\d{2}-\d{2}$/) ? input.reviewDate : null;

  // Snapshot the existing row (if any) into the history table before we
  // overwrite. The history insert and the upsert aren't transactional
  // here — if the upsert fails afterwards, we'd be left with a snapshot
  // that wasn't actually replaced. Acceptable for v1 audit purposes.
  const [existing] = await db
    .select()
    .from(clinicalPlan)
    .where(eq(clinicalPlan.userId, user.id))
    .limit(1);

  if (existing) {
    await db.insert(clinicalPlanHistory).values({
      userId: user.id,
      snapshot: existing as unknown as Record<string, unknown>,
    });
  }

  await db
    .insert(clinicalPlan)
    .values({
      userId: user.id,
      textureLevel: clampLevel(input.textureLevel, 7),
      fluidLevel: clampLevel(input.fluidLevel, 4),
      posture: input.posture.trim() || null,
      specialPrecautions: cleanStrings(input.specialPrecautions),
      warningSigns: cleanStrings(input.warningSigns),
      strategies: cleanStrings(input.strategies),
      exercises: cleanStrings(input.exercises),
      foodsToAvoid: cleanStrings(input.foodsToAvoid),
      redFlags: cleanStrings(input.redFlags),
      educationalLinks: cleanLinks(input.educationalLinks),
      rawPlanText: input.rawPlanText,
      sourceImagePath: input.sourceImagePath,
      parsedConfidence: input.parsedConfidence,
      parsedAt: new Date(),
      sltName: input.sltName?.trim() || null,
      reviewDate: review,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: clinicalPlan.userId,
      set: {
        textureLevel: clampLevel(input.textureLevel, 7),
        fluidLevel: clampLevel(input.fluidLevel, 4),
        posture: input.posture.trim() || null,
        specialPrecautions: cleanStrings(input.specialPrecautions),
        warningSigns: cleanStrings(input.warningSigns),
        strategies: cleanStrings(input.strategies),
        exercises: cleanStrings(input.exercises),
        foodsToAvoid: cleanStrings(input.foodsToAvoid),
        redFlags: cleanStrings(input.redFlags),
        educationalLinks: cleanLinks(input.educationalLinks),
        rawPlanText: input.rawPlanText,
        sourceImagePath: input.sourceImagePath,
        parsedConfidence: input.parsedConfidence,
        parsedAt: new Date(),
        sltName: input.sltName?.trim() || null,
        reviewDate: review,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/");
  revalidatePath("/plan");
  revalidatePath("/scan");
  revalidatePath("/before");
  redirect("/plan?saved=1");
}

/**
 * Read the active plan for the current user. Used by /plan, by chat for
 * cached system-message injection (Block C), and by the home page card.
 */
export async function getClinicalPlan() {
  const user = await getUser();
  if (!user) return null;
  const [row] = await db
    .select()
    .from(clinicalPlan)
    .where(eq(clinicalPlan.userId, user.id))
    .limit(1);
  return row ?? null;
}

/** Sign the source-image path for /plan's "your original slip" preview. */
export async function getSignedPlanImageUrl(
  imagePath: string | null,
  expiresIn = 60 * 30,
): Promise<string | null> {
  if (!imagePath) return null;
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("clinical-plans")
    .createSignedUrl(imagePath, expiresIn);
  if (error || !data) return null;
  return data.signedUrl;
}
