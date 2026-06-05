/**
 * The after-meal voice tool now lives in @gwinya/shared so the web companion
 * and the mobile companion share the tool schema + mapping. Re-exported here
 * so existing `@/lib/ai/after-meal-tool` imports keep working unchanged.
 */
export * from "@gwinya/shared/ai/after-meal-tool";
