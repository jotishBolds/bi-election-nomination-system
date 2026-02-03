import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["@prisma/client"],
  // Empty turbopack config to acknowledge we're using Turbopack
  turbopack: {},
  // Enable standalone output for Docker
  output: "standalone",
  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

export default nextConfig;
