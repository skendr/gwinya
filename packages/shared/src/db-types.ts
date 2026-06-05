/**
 * Hand-authored, framework-agnostic row types shared by web and mobile.
 *
 * These mirror the Drizzle `$inferSelect` shapes in the web app's
 * `lib/db/schema.ts` WITHOUT importing drizzle-orm — importing that schema
 * runs `pgTable(...)` at module load, which must never enter the React Native
 * bundle. The web side keeps a compile-time drift guard
 * (`lib/db/schema-drift-guard.ts`) that fails `pnpm typecheck` if these types
 * and the real Drizzle types ever diverge.
 *
 * Note on dates: timestamp columns are typed as `Date` here to match the
 * Drizzle row shape used across the web app (and `getDemoPlan()`). When the
 * mobile data layer reads rows via supabase-js it receives ISO strings on the
 * wire and adapts them in its own data layer.
 */

export type EducationalLink = { label: string; url: string };

/** Mirror of `typeof clinicalPlan.$inferSelect`. */
export type ClinicalPlan = {
  userId: string;
  textureLevel: number | null;
  fluidLevel: number | null;
  strategies: string[] | null;
  exercises: string[] | null;
  foodsToAvoid: string[] | null;
  redFlags: string[] | null;
  posture: string | null;
  specialPrecautions: string[] | null;
  warningSigns: string[] | null;
  educationalLinks: EducationalLink[] | null;
  rawPlanText: string | null;
  sourceImagePath: string | null;
  parsedConfidence: string | null;
  parsedAt: Date | null;
  sltName: string | null;
  sltContact: string | null;
  reviewDate: string | null;
  updatedAt: Date;
};
