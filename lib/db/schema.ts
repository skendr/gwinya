import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  date,
  timestamp,
  jsonb,
  primaryKey,
  index,
  pgEnum,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { VisualRedFlagId } from "@/lib/content/iddsi";

/**
 * Drizzle schema for Gwinya.
 *
 * NOTES:
 *  - `auth.users` lives in Supabase's auth schema. We reference its uuid
 *    primary key but don't recreate the table here.
 *  - Every row that holds user data has a `user_id uuid not null` column
 *    that we'll gate via Row Level Security (`auth.uid() = user_id`).
 *    See lib/db/migrations/0001_rls.sql.
 *  - We keep field shapes close to lib/domain/types.ts so the UI doesn't
 *    have to translate.
 */

/* ----------------------------------------------------------------------- */
/* Enums                                                                   */
/* ----------------------------------------------------------------------- */

export const promptStyleEnum = pgEnum("prompt_style", [
  "gentle",
  "direct",
  "minimal",
]);

export const matchesPrescribedEnum = pgEnum("matches_prescribed", [
  "matches",
  "more-modified",
  "less-modified",
  "unknown",
]);

/* ----------------------------------------------------------------------- */
/* Profile                                                                 */
/* ----------------------------------------------------------------------- */

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey(),
  displayName: text("display_name"),
  languagePref: text("language_pref").default("en"),
  promptStyle: promptStyleEnum("prompt_style").default("gentle"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ----------------------------------------------------------------------- */
/* Clinical plan (entered by the user from their SLT's instructions)       */
/* ----------------------------------------------------------------------- */

export type EducationalLink = { label: string; url: string };

export const clinicalPlan = pgTable(
  "clinical_plan",
  {
    userId: uuid("user_id").primaryKey(),
    textureLevel: integer("texture_level"), // IDDSI 0-7
    fluidLevel: integer("fluid_level"), // IDDSI 0-4
    strategies: jsonb("strategies").$type<string[]>().default(sql`'[]'::jsonb`),
    exercises: jsonb("exercises").$type<string[]>().default(sql`'[]'::jsonb`),
    foodsToAvoid: jsonb("foods_to_avoid").$type<string[]>().default(sql`'[]'::jsonb`),
    /** SLT-personalised flags (handwritten in the PLAN box). Treated more
     * urgently in chat than the standard printed warning list. */
    redFlags: jsonb("red_flags").$type<string[]>().default(sql`'[]'::jsonb`),
    /** Printed posture instruction from the slip header. */
    posture: text("posture"),
    /** Only checkboxes that were actually ticked on the slip. */
    specialPrecautions: jsonb("special_precautions").$type<string[]>().default(sql`'[]'::jsonb`),
    /** Standard form printed warning list. Kept separate from `redFlags` —
     * see lib/ai/slt-slip-schema.ts for the rationale. */
    warningSigns: jsonb("warning_signs").$type<string[]>().default(sql`'[]'::jsonb`),
    educationalLinks: jsonb("educational_links")
      .$type<EducationalLink[]>()
      .default(sql`'[]'::jsonb`),
    /** Verbatim handwriting from the PLAN box. Preserved for audit so
     * neither us nor the model can paraphrase a clinician's words. */
    rawPlanText: text("raw_plan_text"),
    /** Storage key under the clinical-plans bucket: "<user_id>/<scan_id>.<ext>". */
    sourceImagePath: text("source_image_path"),
    parsedConfidence: text("parsed_confidence"), // 'low'|'medium'|'high'
    parsedAt: timestamp("parsed_at", { withTimezone: true }),
    sltName: text("slt_name"),
    sltContact: text("slt_contact"),
    reviewDate: date("review_date"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    textureRange: check(
      "clinical_plan_texture_range",
      sql`${t.textureLevel} is null or (${t.textureLevel} between 0 and 7)`,
    ),
    fluidRange: check(
      "clinical_plan_fluid_range",
      sql`${t.fluidLevel} is null or (${t.fluidLevel} between 0 and 4)`,
    ),
  }),
);

/* ----------------------------------------------------------------------- */
/* Streak                                                                  */
/* ----------------------------------------------------------------------- */

export const streak = pgTable("streak", {
  userId: uuid("user_id").primaryKey(),
  count: integer("count").default(0).notNull(),
  lastCheckIn: date("last_check_in"),
});

/* ----------------------------------------------------------------------- */
/* Symptom logs                                                            */
/* ----------------------------------------------------------------------- */

export const symptomLogs = pgTable(
  "symptom_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    date: date("date").notNull(),
    coughing: boolean("coughing").default(false).notNull(),
    wetVoice: boolean("wet_voice").default(false).notNull(),
    fatigue: integer("fatigue").default(0).notNull(), // 0-3
    confidence: integer("confidence").default(3).notNull(), // 1-5
    usedStrategy: boolean("used_strategy").default(false).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userDateIdx: index("symptom_logs_user_date_idx").on(t.userId, t.date),
    fatigueRange: check(
      "symptom_logs_fatigue_range",
      sql`${t.fatigue} between 0 and 3`,
    ),
    confidenceRange: check(
      "symptom_logs_confidence_range",
      sql`${t.confidence} between 1 and 5`,
    ),
  }),
);

/* ----------------------------------------------------------------------- */
/* Lesson progress                                                         */
/* ----------------------------------------------------------------------- */

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    userId: uuid("user_id").notNull(),
    slug: text("slug").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.slug] }),
  }),
);

/* ----------------------------------------------------------------------- */
/* Food scans (camera → IDDSI vision analysis)                             */
/* ----------------------------------------------------------------------- */

export type FoodScanAnalysis = {
  predictedLevel: number | null; // 0-7, or null when uncertain
  levelName: string;
  visualReasoning: string;
  caveats: string[];
  redFlagIds: VisualRedFlagId[];
  suggestion: string;
  confidence: "low" | "medium" | "high";
};

export const foodScans = pgTable(
  "food_scans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    imagePath: text("image_path").notNull(),
    predictedLevel: integer("predicted_level"),
    levelName: text("level_name"),
    visualReasoning: text("visual_reasoning"),
    matchesPrescribed: matchesPrescribedEnum("matches_prescribed").default("unknown"),
    caveats: jsonb("caveats").$type<string[]>().default(sql`'[]'::jsonb`),
    redFlags: jsonb("red_flags").$type<VisualRedFlagId[]>().default(sql`'[]'::jsonb`),
    suggestion: text("suggestion"),
    confidence: text("confidence"), // low | medium | high
    prescribedLevelAtScan: integer("prescribed_level_at_scan"),
    userNote: text("user_note"),
    /** AI's guess at what the food is. Drives the default meal_name. */
    suggestedItemName: text("suggested_item_name"),
    /** User-confirmed item name; editable on save. */
    mealName: text("meal_name"),
    /** True once the user has hit "Save meal" on this scan. Scans default to draft. */
    saved: boolean("saved").default(false).notNull(),
    /** Separable from created_at so the user can back-date a meal. */
    eatenAt: timestamp("eaten_at", { withTimezone: true }),
    modelId: text("model_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userCreatedIdx: index("food_scans_user_created_idx").on(t.userId, t.createdAt),
    userSavedIdx: index("food_scans_user_saved_idx").on(t.userId, t.saved, t.eatenAt),
    predictedRange: check(
      "food_scans_predicted_range",
      sql`${t.predictedLevel} is null or (${t.predictedLevel} between 0 and 7)`,
    ),
  }),
);

/* ----------------------------------------------------------------------- */
/* Inferred types                                                          */
/* ----------------------------------------------------------------------- */

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type ClinicalPlan = typeof clinicalPlan.$inferSelect;
export type NewClinicalPlan = typeof clinicalPlan.$inferInsert;

export type Streak = typeof streak.$inferSelect;
export type NewSymptomLog = typeof symptomLogs.$inferInsert;
export type SymptomLog = typeof symptomLogs.$inferSelect;

export type FoodScan = typeof foodScans.$inferSelect;
export type NewFoodScan = typeof foodScans.$inferInsert;
