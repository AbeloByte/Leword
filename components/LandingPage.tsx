"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { speakWord } from "@/lib/dictionary";
import { Parrot } from "@/components/Parrot";
import { LogoMark } from "@/components/LogoMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
    Bird,
    Sparkles,
    ArrowRight,
    Volume2,
    Layers,
    Flame,
    CircleCheck,
    BookPlus,
    Repeat2,
    Smartphone,
    Search,
    ShieldCheck,
    Plus,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 * Content lives in arrays so each section is one map instead of a wall
 * of near-identical JSX. Edit the copy here, not in the markup below.
 * ------------------------------------------------------------------ */

const STEPS = [
    {
        icon: BookPlus,
        title: "Save the word",
        body: "Hear something in a film, a podcast or a book? Type it in, along with the sentence you heard it in. It takes a few seconds.",
    },
    {
        icon: Sparkles,
        title: "Get it explained",
        body: "You get a plain definition, what kind of word it is, and a memory trick based on where you heard it. No dictionary jargon.",
    },
    {
        icon: Repeat2,
        title: "Come back to it",
        body: "Your words turn into flashcards. Hear each one out loud, test yourself, and mark it mastered once you've got it.",
    },
];

const FEATURES = [
    {
        icon: Sparkles,
        title: "Explanations that fit the moment",
        body: "Slang, idioms and odd turns of phrase get explained the way you actually heard them, plus a memory trick to help it stick.",
    },
    {
        icon: Volume2,
        title: "Hear any word out loud",
        body: "Tap the parrot and it says the word back to you, so you never have to guess how something sounds.",
    },
    {
        icon: Layers,
        title: "Flashcard review",
        body: "Flip through your own words, check if you remember, and mark the ones you know. Mastered words step aside so you practice the rest.",
    },
    {
        icon: Search,
        title: "Find any word fast",
        body: "Search by the word, by what it means, or by the film you took it from. Group them however makes sense to you.",
    },
    {
        icon: Flame,
        title: "A gentle nudge to keep going",
        body: "A daily streak, a word count and a progress bar. Enough to bring you back tomorrow, without the guilt trip.",
    },
    {
        icon: Smartphone,
        title: "Installs like an app",
        body: "Add Leword to your home screen straight from your browser. No app store, no download. Works on iPhone and Android.",
    },
];

const FAQS = [
    {
        q: "Is Leword free?",
        a: "Yes. Saving words, hearing them spoken and reviewing them are all free, and you don't need a card to sign up.",
    },
    {
        q: "Do I need to install anything?",
        a: "No, it runs in your browser. If you want it on your phone like a normal app, use your browser's Add to Home Screen option and it'll behave like one.",
    },
    {
        q: "Where do the definitions come from?",
        a: "Leword explains each word around the sentence you saved with it, so you get something written for a learner instead of a dictionary entry.",
    },
    {
        q: "What if an explanation looks wrong?",
        a: "Just change it. Every explanation is a starting point, not the final word, and you can edit any field before you save.",
    },
    {
        q: "Can I use it for another language?",
        a: "Words are read aloud in English, so Leword works best for English vocabulary. You can still save words in any language and write your own definitions.",
    },
];

/** The floating nav's surface: hairline border, frosted fill, soft shadow.
 *  The landing page's boxes share it so the page reads as one set. */
const SURFACE =
    "border bg-background/75 shadow-lg shadow-black/5 backdrop-blur-md";

const FOOTER_LINKS = [
    {
        heading: "Product",
        links: [
            { label: "How it works", href: "#how-it-works" },
            { label: "Features", href: "#features" },
            { label: "Why a parrot", href: "#why-a-parrot" },
            { label: "FAQ", href: "#faq" },
        ],
    },
    {
        heading: "Get started",
        links: [
            { label: "Create an account", href: "/auth" },
            { label: "Sign in", href: "/auth" },
        ],
    },
];

const DECK_WORDS = [
    {
        word: "Serendipity",
        partOfSpeech: "noun",
        source: "Cinema · Good Will Hunting",
        definition: "Finding something good without looking for it.",
        trick: "Serene discovery: a calm, lucky find.",
    },
    {
        word: "Gaslight",
        partOfSpeech: "verb",
        source: "Cinema · Gaslight (1944)",
        definition:
            "To make someone doubt their own memory or sense of what is real.",
        trick: "In the film, a husband dims the gas lamps and swears nothing changed.",
    },
    {
        word: "Ephemeral",
        partOfSpeech: "adjective",
        source: "Music · a song lyric",
        definition: "Lasting for only a very short time.",
        trick: "Like a mayfly: here today, gone tomorrow.",
    },
    {
        word: "Rizz",
        partOfSpeech: "noun",
        source: "Slang · a podcast",
        definition: "The ability to charm or attract someone.",
        trick: "It's the middle of chaRISma.",
    },
];

/** How long each card stays on top before the deck moves on. */
const DECK_INTERVAL_MS = 6000;

/**
 * A stack of word cards that deals itself every few seconds. Hovering or
 * focusing it pauses the deck so the card can be read, and with reduced
 * motion it does not move on at all.
 */
function WordDeck() {
    const [index, setIndex] = React.useState(0);
    const [paused, setPaused] = React.useState(false);
    const current = DECK_WORDS[index];

    React.useEffect(() => {
        if (paused) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }
        const timer = window.setTimeout(
            () => setIndex((i) => (i + 1) % DECK_WORDS.length),
            DECK_INTERVAL_MS,
        );
        return () => window.clearTimeout(timer);
    }, [index, paused]);

    return (
        <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
        >
            {/* The stack: two cards fanned out behind the live one. */}
            <div className="relative">
                <div
                    aria-hidden
                    className="absolute inset-0 -translate-x-4 translate-y-4 -rotate-3 rounded-3xl border border-primary/40 bg-card/80 shadow-sm"
                />
                <div
                    aria-hidden
                    className="absolute inset-0 -translate-x-2 translate-y-2 rotate-[-1.5deg] rounded-3xl border border-primary/70 bg-card/90 shadow-sm"
                />

                <div className="relative flex min-h-60 flex-col rounded-3xl border border-primary bg-card p-6 text-left shadow-[0_20px_40px_-20px_oklch(0.3_0.06_150/0.4)] sm:p-7">
                    <div
                        key={current.word}
                        className="flex flex-1 flex-col animate-in fade-in-0 slide-in-from-right-3 duration-500"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-medium text-muted-foreground">
                                {current.source}
                            </span>
                            <button
                                type="button"
                                onClick={() => speakWord(current.word)}
                                aria-label={`Hear ${current.word} pronounced`}
                                title="Hear it"
                                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-accent-ink transition-colors hover:bg-primary/15 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                            >
                                <Volume2 className="h-4 w-4" />
                            </button>
                        </div>

                        <h3 className="mt-5 text-3xl font-extrabold tracking-tight">
                            {current.word}{" "}
                            <span className="text-sm font-medium text-muted-foreground italic">
                                {current.partOfSpeech}
                            </span>
                        </h3>
                        <p className="mt-2 text-base leading-relaxed text-foreground/90">
                            {current.definition}
                        </p>

                        <p className="mt-auto flex items-start gap-2 pt-6 text-xs text-muted-foreground">
                            <Sparkles className="mt-px h-3.5 w-3.5 shrink-0 text-accent-ink" />
                            <span>
                                <span className="font-semibold text-foreground">
                                    Memory trick:
                                </span>{" "}
                                {current.trick}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function LandingPage() {
    return (
        <div className="flex min-h-screen flex-col text-foreground selection:bg-primary selection:text-primary-foreground">
            {/* ---------------- Navigation ---------------- */}
            {/* A floating pill rather than a full-width strip. The outer nav
                is only spacing, so it lets clicks through to the page; the
                hero tucks up underneath it so the photo shows around the
                pill instead of stopping at a band of plain background. */}
            <nav className="pointer-events-none sticky top-0 z-30 px-3 pt-3 sm:px-4 sm:pt-4">
                {/* From md up, equal outer columns keep the section links on
                    the true centre line, whatever the widths of the logo and
                    buttons. Below that there are no links to centre, and equal
                    halves would push the buttons over the logo, so it is a
                    plain row that gives each side the room it needs. */}
                <div
                    className={`pointer-events-auto mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 rounded-full pr-2 pl-3 sm:pl-5 md:grid md:grid-cols-[1fr_auto_1fr] ${SURFACE}`}
                >
                    <Link
                        href="/"
                        className="flex shrink-0 items-center gap-2.5 justify-self-start"
                    >
                        <LogoMark />
                        <span className="text-xl font-bold tracking-tight">
                            Leword
                        </span>
                    </Link>

                    {/* Section links: hidden on small screens, where the page
                        is short enough to simply scroll. */}
                    <div className="hidden items-center gap-6 md:flex">
                        <a
                            href="#how-it-works"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            How it works
                        </a>
                        <a
                            href="#features"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Features
                        </a>
                        <a
                            href="#faq"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            FAQ
                        </a>
                    </div>

                    <div className="flex items-center gap-1 justify-self-end sm:gap-2">
                        <ThemeToggle />
                        {/* Both buttons open the same page, so on a phone the
                            one that fits is enough. */}
                        <Link href="/auth" className="hidden sm:block">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full text-sm font-medium"
                            >
                                Sign in
                            </Button>
                        </Link>
                        <Link href="/auth">
                            <Button
                                size="sm"
                                className="gap-1 rounded-full text-sm font-medium"
                            >
                                Get started
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ---------------- Hero ---------------- */}
            <section className="relative isolate -mt-18 overflow-hidden px-4 pt-34 pb-16 md:pt-42 md:pb-24">
                {/* ---- Backdrop ----
                    The same misty forest as the footer banner, earlier in the
                    morning: the page opens and closes in one place. The photo
                    keeps its middle empty for the copy and its parrot on the
                    right edge. It only spans the copy; the scrim melts it into
                    the page before the preview card.
                    Foliage frames both sides, so the photo is used as is in
                    light mode. In dark mode it is darkened rather than faded:
                    fading pale mist over a dark page only leaves grey haze,
                    while dimming it turns the mist into shadow and keeps the
                    leaves green, like the footer at dusk. */}
                <div
                    aria-hidden
                    className="absolute inset-x-0 top-0 -z-10 h-184 md:h-216"
                >
                    <Image
                        src="/Images/hero-forest.png"
                        alt=""
                        fill
                        sizes="100vw"
                        loading="eager"
                        fetchPriority="high"
                        className="object-cover object-center dark:brightness-[0.32] dark:saturate-[1.5] dark:contrast-[1.2]"
                    />
                    <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent via-75% to-background" />
                </div>

                <div className="mx-auto max-w-4xl space-y-6 text-center">
                    <Parrot
                        state="idle"
                        size={132}
                        perch
                        className="mx-auto"
                        label="The Leword parrot"
                    />

                    <div className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold tracking-wide text-primary-foreground">
                        <Bird className="h-3.5 w-3.5" />
                        <span>Hear it. Say it. Keep it.</span>
                    </div>

                    <h1 className="text-4xl leading-[1.15] font-extrabold tracking-tight sm:text-6xl">
                        Never forget a word you hear in{" "}
                        <span className="marker">movies or books</span> again.
                    </h1>

                    <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                        A parrot hears a word once and keeps it. Leword helps
                        you do the same: save a word in seconds, hear how it
                        sounds, and come back to it until you remember it.
                    </p>

                    <div className="flex flex-col items-center justify-center gap-3 pt-4 sm:flex-row">
                        <Link href="/auth" className="w-full sm:w-auto">
                            <Button
                                size="lg"
                                className="w-full gap-2 rounded-full px-8 font-semibold sm:w-auto"
                            >
                                Start collecting words
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <a href="#how-it-works" className="w-full sm:w-auto">
                            <Button
                                size="lg"
                                variant="outline"
                                className={`w-full gap-2 rounded-full px-8 font-semibold sm:w-auto ${SURFACE}`}
                            >
                                See how it works
                            </Button>
                        </a>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-6 text-xs text-muted-foreground">
                        {[
                            "Free forever",
                            "A memory trick for every word",
                            "Installs on your phone",
                        ].map((item) => (
                            <span
                                key={item}
                                className="flex items-center gap-1.5"
                            >
                                <CircleCheck className="h-4 w-4 text-accent-ink" />
                                {item}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Live preview: a small deck of word cards */}
                <div className="mx-auto mt-14 max-w-md">
                    <p className="mb-5 text-center text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        A word, the way Leword saves it
                    </p>
                    <WordDeck />
                </div>
            </section>

            {/* ---------------- How it works ---------------- */}
            <section
                id="how-it-works"
                className="scroll-mt-20 border-t border-b bg-muted/30 px-4 py-20"
            >
                <div className="mx-auto max-w-5xl space-y-12">
                    <div className="space-y-3 text-center">
                        <p className="text-xs font-semibold tracking-wider text-accent-ink uppercase">
                            How it works
                        </p>
                        <h2 className="text-3xl font-extrabold tracking-tight">
                            Three steps, start to finish.
                        </h2>
                        <p className="mx-auto max-w-lg text-sm text-muted-foreground sm:text-base">
                            Saving a word has to be quick, or you will not
                            bother. That moment right after you hear it is when
                            most words slip away.
                        </p>
                    </div>

                    <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {STEPS.map(({ icon: Icon, title, body }, i) => (
                            <li key={title}>
                                <Card className={`h-full rounded-3xl ring-0 ${SURFACE}`}>
                                    <CardContent className="space-y-3 p-6">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                                                {i + 1}
                                            </span>
                                            {/* <Icon className="h-5 w-5 text-accent-ink" /> */}
                                        </div>
                                        <h3 className="text-lg font-bold">
                                            {title}
                                        </h3>
                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                            {body}
                                        </p>
                                    </CardContent>
                                </Card>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* ---------------- Features ---------------- */}
            <section id="features" className="scroll-mt-20 px-4 py-20">
                <div className="mx-auto max-w-5xl space-y-12">
                    <div className="space-y-3 text-center">
                        <p className="text-xs font-semibold tracking-wider text-accent-ink uppercase">
                            Features
                        </p>
                        <h2 className="text-3xl font-extrabold tracking-tight">
                            Built around how words actually stick.
                        </h2>
                        <p className="mx-auto max-w-lg text-sm text-muted-foreground sm:text-base">
                            Hear it, say it, keep it. Everything here is built
                            around those three things.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                        {FEATURES.map(({ icon: Icon, title, body }) => (
                            <Card
                                key={title}
                                className={`h-full rounded-3xl ring-0 ${SURFACE}`}
                            >
                                <CardContent className="space-y-3 p-6">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold">
                                        {title}
                                    </h3>
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        {body}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---------------- Why a parrot ---------------- */}
            <section
                id="why-a-parrot"
                className="scroll-mt-20 border-t border-b bg-muted/30 px-4 py-20"
            >
                <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
                    <div className="order-2 space-y-5 md:order-1">
                        <p className="text-xs font-semibold tracking-wider text-accent-ink uppercase">
                            Why a parrot
                        </p>
                        <h2 className="text-3xl font-extrabold tracking-tight">
                            More than a mimic.
                        </h2>
                        <p className="leading-relaxed text-muted-foreground">
                            People write parrots off as copycats, which sells
                            them short. Alex, an African grey studied by
                            researcher Irene Pepperberg for thirty years,
                            learned to use more than a hundred English words to
                            describe real things: colors, shapes and numbers. He
                            was not just echoing them back.
                        </p>
                        <p className="leading-relaxed text-muted-foreground">
                            There&rsquo;s a big difference between repeating a
                            word and really knowing it. That gap is what Leword
                            is built to close. Hearing a word is easy. Keeping
                            it takes a bit of practice.
                        </p>
                    </div>

                    <div className="order-1 flex justify-center md:order-2">
                        <Parrot state="idle" size={200} perch />
                    </div>
                </div>
            </section>

            {/* ---------------- FAQ ---------------- */}
            <section
                id="faq"
                className="scroll-mt-20 border-t bg-muted/30 px-4 py-20"
            >
                <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:gap-14">
                    {/* The heading column sticks while the answers scroll, so
                        the reader never loses the section they are inside. */}
                    <div className="space-y-4 md:sticky md:top-24 md:self-start">
                        <p className="text-xs font-semibold tracking-wider text-accent-ink uppercase">
                            FAQ
                        </p>
                        <h2 className="text-3xl font-extrabold tracking-tight">
                            Common questions
                        </h2>
                        <p className="leading-relaxed text-muted-foreground">
                            The short answers to what people usually ask before
                            they sign up.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Still curious?{" "}
                            <Link
                                href="/auth"
                                className="font-semibold text-accent-ink underline underline-offset-4"
                            >
                                Try it free
                            </Link>{" "}
                            &mdash; it takes about ten seconds.
                        </p>
                    </div>

                    {/* Native <details>: keyboard accessible and works without
                        JavaScript, so no accordion component is needed. */}
                    <div className="space-y-3">
                        {FAQS.map(({ q, a }) => (
                            <details
                                key={q}
                                className={`group rounded-3xl px-5 transition-colors open:border-accent-ink/40 hover:border-accent-ink/40 ${SURFACE}`}
                            >
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                                    {q}
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors group-open:border-accent-ink/40 group-open:bg-accent-ink group-open:text-background">
                                        <Plus className="h-4 w-4 transition-transform duration-200 group-open:rotate-45" />
                                    </span>
                                </summary>
                                <p className="border-t pt-4 pb-5 text-sm leading-relaxed text-muted-foreground">
                                    {a}
                                </p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* ---------------- Final call to action ---------------- */}
            <section className="border-t px-4 py-20">
                <div className="mx-auto max-w-xl space-y-6 text-center">
                    {/* No mascot here any more: the footer banner directly
                        below is a photograph full of parrots, and the flat
                        mascot 150px above it read as the same beat twice. */}
                    <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                        Start saving words today.
                    </h2>
                    <p className="mx-auto max-w-md text-muted-foreground">
                        Sign up with Google in about ten seconds, then save the
                        first word you hear today.
                    </p>
                    <Link href="/auth" className="inline-block">
                        <Button size="lg" className="gap-2 rounded-full px-8 font-semibold">
                            Get started for free
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                    <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        No card required. Your words stay yours.
                    </p>
                </div>
            </section>

            {/* ---------------- Footer ----------------
                The banner photo and the link tier share one ink colour, set
                once on the <footer> below: the scrim fades into exactly that
                value, so the picture and the bar read as a single block
                instead of a photo sitting on top of a strip. The ink is a
                fixed dark in both themes -- a photograph does not invert, and
                a footer built around one should not either. */}
            <footer
                className="mt-auto"
                style={
                    {
                        "--footer-ink": "oklch(0.17 0.02 150)",
                    } as React.CSSProperties
                }
            >
                {/* ---- Banner band ----
                    The photo puts its parrots in the left and right thirds and
                    leaves a bright, near-empty valley up the middle. That
                    middle is the worst place for white text and the best place
                    for nothing, so the closing line runs along the bottom
                    instead, where the scrim is fully opaque -- and every bird
                    stays uncovered.
                    The photo is about 5:2, so the band grows with the width
                    (up to 36rem) instead of capping early: a short, wide band
                    cropped the birds at the top. What crop remains comes off
                    the bottom, which the scrim covers anyway. */}
                <div className="relative isolate flex h-[clamp(16rem,40vw,36rem)] items-end overflow-hidden">
                    <Image
                        src="/Images/footer.png"
                        alt="Green Amazon parrots perched on mossy branches and in flight above a misty rainforest valley"
                        fill
                        sizes="100vw"
                        className="object-cover"
                        style={{ objectPosition: "center 15%" }}
                    />

                    {/* A short fade from the page into the photo, so the band
                        starts softly instead of on a hard cut line. */}
                    <div
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-12 bg-linear-to-b from-background to-transparent sm:h-16"
                    />

                    {/* Scrim: solid at the foot, gone by just past halfway. */}
                    <div
                        aria-hidden
                        className="absolute inset-0 bg-linear-to-t from-[var(--footer-ink)] from-20% via-[var(--footer-ink)]/55 via-52% to-transparent"
                    />

                    {/* The page opens on this line in the nav badge and closes
                        on it here. */}
                    <p className="relative z-10 w-full px-4 pb-8 text-center text-2xl font-extrabold tracking-tight text-white sm:pb-10 sm:text-3xl">
                        Hear it. Say it.{" "}
                        <span className="marker">Keep it.</span>
                    </p>
                </div>

                {/* ---- Link tier ----
                    No top border: the scrim has already landed on this exact
                    colour, and a rule across the seam would put a line where
                    the eye reads continuous ground. */}
                <div className="bg-[var(--footer-ink)] px-4 pt-12 pb-8 text-white">
                    <div className="mx-auto max-w-5xl">
                        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
                            {/* Brand column, wider than the link columns. */}
                            <div className="space-y-3 md:col-span-2">
                                <Link
                                    href="/"
                                    className="flex w-fit items-center gap-2.5 rounded-md transition-opacity hover:opacity-80"
                                >
                                    <LogoMark onDark />
                                    <span className="text-xl font-bold tracking-tight">
                                        Leword
                                    </span>
                                </Link>
                                <p className="max-w-xs text-sm leading-relaxed text-white/65">
                                    A home for the words you hear and mean to
                                    remember. Save them, hear them, and come
                                    back to them until they stick.
                                </p>
                            </div>

                            {FOOTER_LINKS.map(({ heading, links }) => (
                                <div key={heading} className="space-y-3">
                                    <h3 className="text-xs font-semibold tracking-wider text-white/50 uppercase">
                                        {heading}
                                    </h3>
                                    <ul className="space-y-2">
                                        {links.map(({ label, href }) => (
                                            <li key={label}>
                                                <Link
                                                    href={href}
                                                    className="text-sm text-white/75 transition-colors hover:text-[var(--primary)]"
                                                >
                                                    {label}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
                            <p className="text-xs text-white/50">
                                &copy; {new Date().getFullYear()} Leword. For
                                film lovers, avid readers, and anyone who
                                collects good words.
                            </p>
                            <p className="text-xs text-white/50">
                                Made for people who collect words.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
