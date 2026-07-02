import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: "/api/jpl-proxy",
        destination: "https://ssd-api.jpl.nasa.gov/sbdb.api",
      },
    ];
  },
};

export default nextConfig;
