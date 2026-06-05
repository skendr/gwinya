/**
 * Checklists + `buildBeforeMeal` now live in @gwinya/shared so web and mobile
 * use the identical content and personalisation logic. Re-exported here so
 * existing `@/lib/content/checklists` imports keep working unchanged.
 */
export * from "@gwinya/shared/content/checklists";
