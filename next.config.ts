import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  distDir: process.env.FORGENT_NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),
  serverExternalPackages: ["ws", "@neondatabase/serverless", "@prisma/adapter-neon"],
};

export default nextConfig;
