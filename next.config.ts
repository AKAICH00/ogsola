import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. Don't do this in normal projects!
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
