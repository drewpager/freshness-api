import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "s-maxage=2592000, stale-while-revalidate=3600"
          },
        ],
      },
    ];
  },
};

export default nextConfig;
