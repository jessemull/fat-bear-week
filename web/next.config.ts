import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "explore.org",
        pathname: "/**",
        protocol: "https",
      },
      {
        hostname: "*.explore.org",
        pathname: "/**",
        protocol: "https",
      },
      {
        hostname: "fatbearweek.org",
        pathname: "/**",
        protocol: "https",
      },
      {
        hostname: "*.fatbearweek.org",
        pathname: "/**",
        protocol: "https",
      },
    ],
  },
  reactStrictMode: true,
};

export default nextConfig;
