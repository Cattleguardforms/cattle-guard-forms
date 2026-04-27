import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: "/engineering/hs20",
        destination: "/engineering/hs20-updated",
        permanent: true,
      },
      {
        source: "/reseller",
        destination: "/distributor",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
