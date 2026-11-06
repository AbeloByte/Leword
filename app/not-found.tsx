import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Parrot } from "@/components/Parrot";
import { LogoMark } from "@/components/LogoMark";

export const metadata: Metadata = {
    title: "Page not found — Leword",
};

/**
 * The 404 page, styled as a dictionary entry for a word nobody has saved.
 *
 * The big numerals are set in Geist, not the Lufga heading face: the trial
 * Lufga files have no digit 4, so "404" would render as a mix of two fonts.
 * Headings here also avoid apostrophes for the same reason.
 */
export default function NotFound() {
    return (
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
            <Link
                href="/"
                className="mb-12 flex items-center gap-2.5"
                aria-label="Leword home"
            >
                <LogoMark />
                <span className="text-xl font-bold tracking-tight">Leword</span>
            </Link>

            <div className="flex w-full max-w-md flex-col items-center text-center">
                <div className="relative flex items-end justify-center">
                    <span
                        aria-hidden
                        className="font-sans text-[7rem] leading-none font-bold tracking-tighter text-primary/20 tabular-nums select-none sm:text-[9rem]"
                    >
                        404
                    </span>
                    {/* The parrot naps on top of the numerals: it went looking
                        for the page and gave up. */}
                    <Parrot
                        state="rest"
                        perch
                        size={88}
                        className="absolute -top-14 left-1/2 -translate-x-1/2 sm:-top-12"
                        label="The Leword parrot, asleep on its perch"
                    />
                </div>

                {/* A dictionary entry for the missing page, echoing the word
                    cards inside the app. */}
                <div className="mt-8 w-full rounded-2xl border bg-card p-6 text-left shadow-lg shadow-black/5">
                    <p className="flex items-baseline gap-2">
                        <span className="font-heading text-2xl font-bold">
                            not found
                        </span>
                        <span className="text-sm text-muted-foreground italic">
                            adjective
                        </span>
                    </p>
                    <p className="mt-3 text-base leading-relaxed">
                        A page that flew off before anyone could save it. The
                        link may be old, or the address may have a typo.
                    </p>
                    <p className="mt-4 border-l-2 border-primary pl-3 text-sm text-muted-foreground italic">
                        &ldquo;I looked everywhere, but that page was{" "}
                        <span className="font-medium text-accent-ink not-italic">
                            not found
                        </span>
                        .&rdquo;
                    </p>
                </div>

                <Link href="/" className="mt-8">
                    <Button parrotPeek className="gap-1.5 rounded-full">
                        <ArrowLeft className="h-4 w-4" />
                        Back to your words
                    </Button>
                </Link>
            </div>
        </main>
    );
}
