import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives in web/ beside the current site, which has its own lockfile
  turbopack: { root: path.resolve(import.meta.dirname) },
  async redirects() {
    return [
      { source: "/listing/:slug", destination: "/products/:slug", permanent: true },
      { source: "/listings/:slug", destination: "/products/:slug", permanent: true },
      { source: "/requests/create", destination: "/requests/new", permanent: true },
      { source: "/messages", destination: "/dashboard/messages", permanent: false },
      { source: "/profile", destination: "/dashboard/settings", permanent: false },
    ];
  },
};

export default nextConfig;
