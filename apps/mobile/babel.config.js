/**
 * Reproduces the Expo default Babel setup and adds one surgical fix:
 *
 * @supabase/supabase-js lazily probes for OpenTelemetry with a dynamic
 * `import(OTEL_PKG)` that carries inline webpack/vite-ignore magic comments.
 * Hermes' parser rejects that expression (comments + non-literal specifier),
 * which breaks both `expo export` and the Hermes runtime. The hook is inert
 * for us (we never install @opentelemetry/api), so we rewrite that exact
 * dynamic import to `Promise.resolve(null)` — the trailing `.catch(() => null)`
 * still works. Pattern-based (matches the OTEL_PKG identifier), so it survives
 * supabase-js patch bumps.
 */
module.exports = function babelConfig(api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [stripSupabaseOtelDynamicImport],
  };
};

function stripSupabaseOtelDynamicImport({ types: t }) {
  return {
    name: "strip-supabase-otel-dynamic-import",
    visitor: {
      CallExpression(path) {
        const { callee, arguments: args } = path.node;
        if (
          callee.type === "Import" &&
          args.length === 1 &&
          t.isIdentifier(args[0], { name: "OTEL_PKG" })
        ) {
          path.replaceWith(
            t.callExpression(
              t.memberExpression(
                t.identifier("Promise"),
                t.identifier("resolve"),
              ),
              [t.nullLiteral()],
            ),
          );
          path.skip();
        }
      },
    },
  };
}
