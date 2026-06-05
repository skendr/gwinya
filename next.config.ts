import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // @gwinya/shared ships raw TypeScript (no build step); let Next transpile it.
  transpilePackages: ["@gwinya/shared"],
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
};

export default nextConfig;
