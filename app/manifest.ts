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
                src: "/icon.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/icon.png",
                sizes: "512x512",
                type: "image/png",
            },
        ],
    };
}
