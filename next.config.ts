import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/health',
        destination: '/api/health',
      },
      {
        source: '/proxy',
        destination: '/api/proxy',
      },
    ]
  },
};

export default nextConfig;
