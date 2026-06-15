import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ioredis is a native Node client; keep it out of the bundler.
  serverExternalPackages: ["ioredis"],
};

export default nextConfig;
