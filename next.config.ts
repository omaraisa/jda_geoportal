import type { NextConfig } from "next";
const nextConfig: NextConfig = {
    reactStrictMode: true,
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || "/geoportal",
    // experimental: {
    //     esmExternals: true,
    //   },
};

export default nextConfig;
