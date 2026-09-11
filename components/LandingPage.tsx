"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { speakWord } from "@/lib/dictionary";
import { Parrot } from "@/components/Parrot";
import { LogoMark } from "@/components/LogoMark";
import {
    Bird,
    Sparkles,
    ArrowRight,
    Volume2,
    Film,
    Layers,
    Flame,
    CircleCheck,
    BookPlus,
    Repeat2,
    Smartphone,
    Search,
    ShieldCheck,
    ChevronDown,
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

export function LandingPage() {
    return (
        <div className="flex min-h-screen flex-col text-foreground selection:bg-primary selection:text-primary-foreground">
            {/* ---------------- Navigation ---------------- */}
            <nav className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2.5">
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

                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link href="/auth">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-sm font-medium"
                            >
                                Sign in
                            </Button>
                        </Link>
                        <Link href="/auth">
                            <Button
                                size="sm"
                                className="gap-1 text-sm font-medium"
                            >
                                Get started
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ---------------- Hero ---------------- */}
            <section className="relative overflow-hidden px-4 pt-16 pb-16 md:pt-24 md:pb-24">
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
                                className="h-12 w-full gap-2 px-8 text-base font-semibold sm:w-auto"
                            >
                                Start collecting words — free
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <a href="#how-it-works" className="w-full sm:w-auto">
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-12 w-full gap-2 bg-card px-8 text-base font-semibold sm:w-auto"
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

                {/* Live preview of a real word card */}
                <div className="mx-auto mt-14 max-w-xl">
                    <p className="mb-3 text-center text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        A word, the way Leword saves it
                    </p>
                    <Card className="relative bg-card/90 shadow-2xl backdrop-blur-sm">
                        <CardContent className="space-y-4 p-6">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-2xl font-bold tracking-tight">
                                            Serendipity
                                        </h3>
                                        <Badge
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            noun
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            Cinema
                                        </Badge>
                                    </div>
                                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Film className="h-3 w-3 shrink-0" />
                                        <span>Movie: Good Will Hunting</span>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0 gap-1.5 text-xs"
                                    onClick={() => speakWord("Serendipity")}
                                    title="Test pronunciation"
                                >
                                    <Volume2 className="h-3.5 w-3.5 text-accent-ink" />
                                    Listen
                                </Button>
                            </div>

                            <p className="text-sm leading-relaxed text-foreground/90">
                                The occurrence of events by chance in a happy or
                                beneficial way; a pleasant surprise.
                            </p>

                            <blockquote className="rounded-r-md border-l-2 border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground italic">
                                &ldquo;It was pure serendipity that Sean and Will
                                met at that exact moment in their lives.&rdquo;
                            </blockquote>

                            <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-2.5 text-xs text-foreground/85">
                                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-ink" />
                                <span>
                                    <strong className="font-semibold">
                                        Memory trick:
                                    </strong>{" "}
                                    Think of <em>serene discovery</em> — a calm,
                                    unexpected discovery that brings happiness.
                                </span>
                            </div>
                        </CardContent>
                    </Card>
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
                                <Card className="h-full">
                                    <CardContent className="space-y-3 p-6">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                                                {i + 1}
                                            </span>
                                            <Icon className="h-5 w-5 text-accent-ink" />
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
                            <Card key={title} className="h-full">
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
                            researcher Irene Pepperberg for thirty years, learned
                            to use more than a hundred English words to describe
                            real things: colors, shapes and numbers. He was not
                            just echoing them back.
                        </p>
                        <p className="leading-relaxed text-muted-foreground">
                            There&rsquo;s a big difference between repeating a word
                            and really knowing it. That gap is what Leword is
                            built to close. Hearing a word is easy. Keeping it
                            takes a bit of practice.
                        </p>
                    </div>

                    <div className="order-1 flex justify-center md:order-2">
                        <Parrot state="idle" size={200} perch />
                    </div>
                </div>
            </section>

            {/* ---------------- FAQ ---------------- */}
            <section id="faq" className="scroll-mt-20 px-4 py-20">
                <div className="mx-auto max-w-2xl space-y-10">
                    <div className="space-y-3 text-center">
                        <p className="text-xs font-semibold tracking-wider text-accent-ink uppercase">
                            FAQ
                        </p>
                        <h2 className="text-3xl font-extrabold tracking-tight">
                            Common questions
                        </h2>
                    </div>

                    {/* Native <details>: keyboard accessible and works without
                        JavaScript, so no accordion component is needed. */}
                    <div className="divide-y rounded-xl border bg-card">
                        {FAQS.map(({ q, a }) => (
                            <details key={q} className="group px-5">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                                    {q}
                                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                                </summary>
                                <p className="pb-4 text-sm leading-relaxed text-muted-foreground">
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
                    <Parrot
                        state="idle"
                        size={96}
                        className="mx-auto"
                        label="The Leword parrot"
                    />
                    <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                        Start saving words today.
                    </h2>
                    <p className="mx-auto max-w-md text-muted-foreground">
                        Sign up with Google in about ten seconds, then save
                        the first word you hear today.
                    </p>
                    <Link href="/auth" className="inline-block">
                        <Button
                            size="lg"
                            className="h-12 gap-2 px-8 text-base font-semibold"
                        >
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

            {/* ---------------- Footer ---------------- */}
            <footer className="mt-auto border-t bg-muted/30 px-4 py-14">
                <div className="mx-auto max-w-5xl">
                    <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
                        {/* Brand column, wider than the link columns. */}
                        <div className="space-y-3 md:col-span-2">
                            <Link
                                href="/"
                                className="flex w-fit items-center gap-2.5"
                            >
                                <LogoMark />
                                <span className="text-xl font-bold tracking-tight">
                                    Leword
                                </span>
                            </Link>
                            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                                A home for the words you hear and mean to
                                remember. Save them, hear them, and come back to
                                them until they stick.
                            </p>
                        </div>

                        {FOOTER_LINKS.map(({ heading, links }) => (
                            <div key={heading} className="space-y-3">
                                <h3 className="text-sm font-semibold">
                                    {heading}
                                </h3>
                                <ul className="space-y-2">
                                    {links.map(({ label, href }) => (
                                        <li key={label}>
                                            <Link
                                                href={href}
                                                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                            >
                                                {label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row">
                        <p className="text-xs text-muted-foreground">
                            © {new Date().getFullYear()} Leword. For film
                            lovers, avid readers, and anyone who collects good
                            words.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Made for people who collect words.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
