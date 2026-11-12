import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  /**
   * Proxy /api/* requests to the API backend.
   *
   * The browser talks only to the Next.js server (port 3000).
   * The Next.js server forwards API calls to the backend using
   * the internal Docker service name ("api:4000").
   *
   * This avoids browser-side DNS issues and keeps the API URL
   * out of client-side bundles.
   */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL ?? "http://api:4000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
