import type { ClinicalPlan } from "@/lib/db/schema";

/**
 * Hardcoded demo patient profile ("Jordan").
 *
 * This is the single source of truth that drives BOTH the voice meal
 * companion (lib/ai/companion.ts) and the food check (app/api/scan/route.ts).
 * In the demo we skip the SLT-slip scan and inject this profile instead — see
 * getClinicalPlan() in app/plan/actions.ts.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  EVERYTHING DEMO-TUNABLE LIVES HERE. Edit freely.
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  • textureLevel drives the food check verdict. The scan is a GENUINE IDDSI
 *    analysis: a photo is "safe" when its predicted level <= textureLevel
 *    (see lib/content/iddsi.ts:computeMatchesPrescribed). Level 7 ("Regular")
 *    means every food reads as safe today — that is how "all textures
 *    allowed" is expressed, without faking the analysis. Lower this number
 *    (e.g. 4) and firmer meals will genuinely come back UNSAFE.
 *
 *  • The conversational rules (planSummary / cognitiveNotes / posture / pace)
 *    are for the voice companion ONLY. The companion must keep language
 *    simple, never call a food "forbidden", and never mention IDDSI levels or
 *    numbers. The food check is a separate surface and may say safe/unsafe.
 */
export type PatientProfile = {
  name: string;
  age: number;
  sex: "male" | "female" | "other";
  diagnosis: string;
  /** IDDSI food texture level, 0-7. Drives the food-check verdict. */
  textureLevel: number;
  /** IDDSI fluid level, 0-4. Informational (the scanner compares texture only). */
  fluidLevel: number;
  /** Plain-language plan the companion may repeat. No IDDSI jargon. */
  planSummary: string;
  /** Posture cue spoken before the meal. */
  posture: string;
  /** Short before-meal reminders. */
  strategies: string[];
  /** How the companion should talk, given cognitive impairment. */
  cognitiveNotes: string;
  /** What to prompt once the meal is finished. */
  afterMealCare: string;
  /** OpenAI Realtime voice id (alloy, echo, shimmer, …). */
  voice: string;
};

export const JORDAN_PROFILE: PatientProfile = {
  name: "Jordan",
  age: 27,
  sex: "male",
  diagnosis: "Dysphagia with cognitive impairment",
  // All textures allowed → Level 7 (Regular / Easy to Chew).
  textureLevel: 7,
  // All drinks allowed → Level 0 (Thin).
  fluidLevel: 0,
  planSummary: "Small bites, all textures.",
  posture: "Head lowered slightly — a gentle chin tuck.",
  strategies: ["Small bites, every time.", "Slow pace — no hurry."],
  cognitiveNotes:
    "Keep language simple and concrete. One small step at a time. " +
    "Repeat gently when needed. Never sound rushed or frustrated.",
  afterMealCare: "Prompt gentle oral care — a soft brush and a rinse.",
  voice: "alloy",
};

/**
 * Map the hardcoded profile onto the shape the rest of the app expects for a
 * stored clinical plan (typeof clinicalPlan.$inferSelect). Used by
 * getClinicalPlan() so the home strategies card, /plan, /before and the food
 * check all read Jordan without a DB row. The companion-only fields above are
 * NOT part of ClinicalPlan; they are consumed directly by lib/ai/companion.ts.
 */
export function getDemoPlan(): ClinicalPlan {
  const now = new Date();
  return {
    userId: "demo-jordan",
    textureLevel: JORDAN_PROFILE.textureLevel,
    fluidLevel: JORDAN_PROFILE.fluidLevel,
    strategies: JORDAN_PROFILE.strategies,
    exercises: [],
    foodsToAvoid: [],
    redFlags: [],
    posture: JORDAN_PROFILE.posture,
    specialPrecautions: [],
    warningSigns: [],
    educationalLinks: [],
    rawPlanText: JORDAN_PROFILE.planSummary,
    sourceImagePath: null,
    parsedConfidence: "high",
    parsedAt: now,
    sltName: null,
    sltContact: null,
    reviewDate: null,
    updatedAt: now,
  };
}
