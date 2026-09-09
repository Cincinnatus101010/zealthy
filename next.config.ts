import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@troisi/ui"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
