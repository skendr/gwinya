/**
 * The red-flag detector now lives in @gwinya/shared so web and mobile run the
 * identical check. Re-exported here so existing `@/lib/domain/red-flags`
 * imports keep working unchanged.
 */
export * from "@gwinya/shared/domain/red-flags";
