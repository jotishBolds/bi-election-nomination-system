import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["@prisma/client"],
  // Empty turbopack config to acknowledge we're using Turbopack
  turbopack: {},
  // Enable standalone output for Docker
  output: "standalone",
  // Disable image optimization for local election symbol images
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
