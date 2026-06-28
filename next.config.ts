import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Monorepo-ready: server external packages that should not be bundled.
  serverExternalPackages: ["bullmq", "ioredis"],
  experimental: {
    // Optimize common heavy client imports.
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  typescript: {
    // Type errors should fail the build in CI.
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
