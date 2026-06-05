// Metro config for the Gwinya mobile app inside the pnpm monorepo.
//
// pnpm uses a symlinked, non-hoisted node_modules layout, and our shared code
// lives outside this package (packages/shared). Metro needs to (1) watch the
// workspace root so changes to @gwinya/shared hot-reload, (2) resolve modules
// from both this app and the workspace root store, and (3) honour the shared
// package's "exports" map (subpath -> raw .ts).
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// @gwinya/shared exposes its modules through the package.json "exports" field.
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
