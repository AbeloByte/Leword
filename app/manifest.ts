// app/manifest.ts

import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Leword — Smart Vocabulary Habit",
        short_name: "Leword",
        description:
            "Capture, understand, and master new words from movies and books.",
        start_url: "/",
        display: "standalone",
        background_color: "#f6f8f6",
        theme_color: "#4cc05c",
        icons: [
            {
                src: "/favicon/android-chrome-192x192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/favicon/android-chrome-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
            // Android masks this one to its own shape; it needs the icon's
            // content to sit inside the safe zone or the edges get cropped.
            {
                src: "/favicon/android-chrome-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
            {
                src: "/favicon/apple-touch-icon.png",
                sizes: "180x180",
                type: "image/png",
            },
        ],
    };
}
