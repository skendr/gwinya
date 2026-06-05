/**
 * The lesson catalog now lives in @gwinya/shared so web and mobile render the
 * identical content. Re-exported here so existing `@/lib/content/lessons`
 * imports keep working unchanged.
 *
 * Add a new lesson in `packages/shared/src/content/lessons.ts`.
 */
export * from "@gwinya/shared/content/lessons";
