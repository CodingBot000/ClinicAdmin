import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      "tqyarvckzieoraneohvv.supabase.co",
      "localhost",
    ],
  },
};

export default nextConfig;
