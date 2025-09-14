import type { NextConfig } from "next";
const nextConfig: NextConfig = {
    reactStrictMode: true,
    generateBuildId: async () => {
        // Use timestamp to ensure unique build IDs
        return `build-${Date.now()}`;
    },
    async headers() {
        return [
            {
                source: '/_next/static/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
