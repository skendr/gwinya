/**
 * Compile-time guard: the hand-authored shared row types in
 * `@gwinya/shared/db-types` must stay structurally identical to the Drizzle
 * `$inferSelect` types in `./schema`. Mobile can't import the Drizzle schema
 * (importing it runs `pgTable(...)` and pulls drizzle-orm into the RN bundle),
 * so it relies on the hand-authored mirror — and this file is what stops that
 * mirror from silently drifting.
 *
 * If the schema gains/changes a column and the shared mirror doesn't (or vice
 * versa), one of the assignments below fails and `pnpm typecheck` breaks with
 * a pointer to exactly which type diverged.
 *
 * Type-only module — fully erased at build; ships nothing.
 */
import type { ClinicalPlan as SchemaClinicalPlan } from "./schema";
import type { ClinicalPlan as SharedClinicalPlan } from "@gwinya/shared/db-types";

/** Compiles only when `B` is assignable to `A`. */
type AssertAssignable<A, B extends A> = B;

// Mutual assignability ⇒ the two ClinicalPlan shapes are structurally equal.
export type _SharedPlanMatchesSchema = AssertAssignable<SchemaClinicalPlan, SharedClinicalPlan>;
export type _SchemaPlanMatchesShared = AssertAssignable<SharedClinicalPlan, SchemaClinicalPlan>;
