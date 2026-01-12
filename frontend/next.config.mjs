/** @type {import('next').NextConfig} */
const nextConfig = {
    // รองรับ Images จาก external sources
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    // Environment variables ที่ต้องการใช้ใน client
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
        NEXT_PUBLIC_LINE_LIFF_ID: process.env.NEXT_PUBLIC_LINE_LIFF_ID || '',
    },
};

export default nextConfig;
