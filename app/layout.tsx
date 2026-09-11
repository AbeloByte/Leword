import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";

export const viewport: Viewport = {
    // Matches the light/dark page background so the mobile browser chrome
    // blends with the app instead of showing a dark bar in light mode.
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#f6f8f6" },
        { media: "(prefers-color-scheme: dark)", color: "#0d100d" },
    ],
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

/**
 * Lufga — the brand display face, used for headings only.
 *
 * The supplied files are the Fontspring trial ("FSP DEMO - Lufga"), whose
 * character set is 67 glyphs: letters, most digits, and , . : ; ? only.
 * There is no apostrophe, hyphen, %, @, / or digit 4. Geist is declared
 * beneath it in --font-heading so any glyph Lufga lacks falls back per
 * character rather than rendering as tofu. Swap in the licensed full-charset
 * files at the same paths and nothing else needs to change.
 */
const lufga = localFont({
    variable: "--font-lufga",
    display: "swap",
    src: [
        { path: "./fonts/lufga-clean/lufga-light.otf", weight: "300", style: "normal" },
        { path: "./fonts/lufga-clean/lufga-regular.otf", weight: "400", style: "normal" },
        { path: "./fonts/lufga-clean/lufga-italic.otf", weight: "400", style: "italic" },
        { path: "./fonts/lufga-clean/lufga-medium.otf", weight: "500", style: "normal" },
        { path: "./fonts/lufga-clean/lufga-semibold.otf", weight: "600", style: "normal" },
        { path: "./fonts/lufga-clean/lufga-bold.otf", weight: "700", style: "normal" },
        // No 800 weight ships with this set; map extrabold to bold so the
        // browser does not synthesise a smeared faux-bold.
        { path: "./fonts/lufga-clean/lufga-bold.otf", weight: "800", style: "normal" },
    ],
});

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html
            lang="en"
            // next-themes writes the class on <html> before paint; suppressing
            // the mismatch warning here is the documented requirement.
            suppressHydrationWarning
            className={`${geistSans.variable} ${geistMono.variable} ${lufga.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider>
                        {children}
                        <Toaster position="top-center" richColors />
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
