
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.118"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
