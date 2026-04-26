import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/engineering/hs20",
        destination: "/engineering/hs20-updated",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
