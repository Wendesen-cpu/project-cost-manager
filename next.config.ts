import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  distDir:
    process.env.INSTANCE_NAME === "secondary" ? ".next-secondary" : ".next",
};

export default nextConfig;
