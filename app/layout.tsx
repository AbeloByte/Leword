import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";

export const viewport: Viewport = {
    themeColor: "#09090b",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // Prevents accidental zoom on mobile input focus
};

export const metadata: Metadata = {
    title: "Leword — Smart Vocabulary Habit",
    description:
        "Capture, understand, and master new words you encounter everyday.",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Leword",
    },
};
const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col">
                <AuthProvider>
                    {children}
                    <Toaster position="top-center" richColors />
                </AuthProvider>
            </body>
        </html>
    );
}
