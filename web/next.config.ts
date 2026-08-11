import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prefer repo-root CONTEXT.md / AGENTS.md over Next-generated agent files
  agentRules: false,
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
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
