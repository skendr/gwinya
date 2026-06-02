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
 *    (see lib/content/iddsi.ts:computeMatchesPrescribed). Peter is prescribed
 *    Level 7 EASY TO CHEW — softer-cooked everyday foods (a soft cream-filled
 *    biscuit, not a hard biscotti). IDDSI numbers Easy to Chew and Regular
 *    both as level 7, so the scanner — which compares numbers only — still
 *    reads every food as safe today and cannot tell the two level-7 variants
 *    apart. Lower this number (e.g. 4) and firmer meals will genuinely come
 *    back UNSAFE.
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
  name: "Peter",
  age: 27,
  sex: "male",
  diagnosis: "Traumatic brain injury with dysphagia",
  // Level 7 Easy to Chew (softer-cooked everyday foods). Numerically still
  // level 7, so the food check reads every food as safe — see the note above.
  textureLevel: 7,
  // Thin fluids, no thickener → Level 0 (Thin).
  fluidLevel: 0,
  planSummary:
    "Softer everyday foods. Small mouthfuls, slow pace, and clear your mouth before the next bite.",
  posture: "Head lowered slightly — a gentle chin tuck.",
  strategies: [
    "Small mouthfuls, every time.",
    "Slow pace — no rushing.",
    "Finish each mouthful before the next.",
    "A sip of water every few mouthfuls.",
    "Calm and quiet at mealtimes — TV off.",
  ],
  cognitiveNotes:
    "Keep language simple and concrete. One small step at a time. " +
    "Repeat gently when needed. Never sound rushed or frustrated. " +
    "He can be impulsive and may rush — eating quickly or taking big " +
    "mouthfuls, which can make him cough or choke. If he speeds up, warmly " +
    "and gently remind him to slow down, take a small mouthful, and finish " +
    "it before the next. Keep mealtimes calm with few distractions: stay " +
    "quiet while he is actually chewing and swallowing, and encourage the TV off.",
  afterMealCare:
    "When he's finished, check his mouth is empty — no food left in his " +
    "cheeks or under his tongue. Then a rinse, or gentle mouth care with a soft brush.",
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
    redFlags: [
      "Watch for increased coughing during eating or drinking.",
      "Report any true choking incident to the SLT team urgently.",
      "Choking means the airway is completely blocked — unable to breathe or cough. It may need back slaps or abdominal thrusts to clear.",
    ],
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
