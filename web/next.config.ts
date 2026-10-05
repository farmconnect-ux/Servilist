import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives in web/ beside the current site, which has its own lockfile
  turbopack: { root: path.resolve(import.meta.dirname) },
};

export default nextConfig;
