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
                        value: 'no-cache, no-store, must-revalidate',
                    },
                ],
            },
            {
                source: '/api/groups',
                headers: [
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3103/admin',
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'POST, OPTIONS',
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'Content-Type, Authorization',
                    },
                ],
            },
            {
                // Aggressive cache busting for development
                source: '/(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-cache, no-store, must-revalidate',
                    },
                    {
                        key: 'Pragma',
                        value: 'no-cache',
                    },
                    {
                        key: 'Expires',
                        value: '0',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
