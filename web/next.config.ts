import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://admin:password@mongodb:27017/exoexplorer?authSource=admin',
    NEXT_PUBLIC_FASTAPI_URL: process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://api:3001',
  },
};

export default nextConfig;
