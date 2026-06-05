/**
 * The food-scan structured-output schema now lives in @gwinya/shared so the
 * mobile client can type the /api/scan response from the same source.
 * Re-exported here so existing `@/lib/ai/scan-schema` imports keep working.
 */
export * from "@gwinya/shared/ai/scan-schema";
