import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        // Use a predictable budget instead of deriving it from filesystem reports.
        maximumDiskCacheSize: 128 * 1024 * 1024,
    },
};

export default nextConfig;
