/**
 * Shared domain types now live in @gwinya/shared so the web app and the
 * mobile (Expo) app consume the identical shapes. This file re-exports them
 * so existing `@/lib/domain/types` imports keep working unchanged.
 */
export * from "@gwinya/shared/domain/types";
