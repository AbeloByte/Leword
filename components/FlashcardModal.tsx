"use client";

import React, { useEffect, useRef, useState } from "react";
import { WordItem } from "./WordCard";
import { speakWord } from "@/lib/dictionary";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Parrot, useSpeakingWord } from "@/components/Parrot";
import {
    playChirp,
    preloadChirp,
    isChirpEnabled,
    setChirpEnabled,
} from "@/lib/chirp";
import { Badge } from "@/components/ui/badge";
import {
    Layers,
    RotateCw,
    ArrowRight,
    ArrowLeft,
    Volume2,
    CircleCheck,
    Lightbulb,
    Film,
    Volume1,
    VolumeX,
} from "lucide-react";

/** Half of the .flip-card transition in globals.css, i.e. the edge-on moment. */
const FLIP_HALF_MS = 310;

interface FlashcardModalProps {
    words: WordItem[];
    onToggleMastered: (id: string, currentStatus: boolean) => void;
}

export function FlashcardModal({
    words,
    onToggleMastered,
}: FlashcardModalProps) {
    const [open, setOpen] = useState(false);
    const [deck, setDeck] = useState<WordItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    // Lazy initialiser, not an effect: DialogContent is only mounted once the
    // dialog opens, so this never renders during SSR and cannot mismatch.
    const [soundOn, setSoundOn] = useState(isChirpEnabled);

    /**
     * A deliberate flip by the user -- chirps. Navigation also flips the card
     * back (see `step`), but that is incidental and stays silent, otherwise
     * every next/prev would squawk.
     */
    const toggleFlip = () => {
        playChirp();
        setIsFlipped((f) => !f);
    };

    // Initialize randomized deck of unmastered words
    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            preloadChirp();
            const unmastered = words.filter((w) => !w.is_mastered);
            // Shuffle array randomly
            const shuffled = [
                ...(unmastered.length > 0 ? unmastered : words),
            ].sort(() => Math.random() - 0.5);
            setDeck(shuffled);
            setCurrentIndex(0);
            setIsFlipped(false);
        }
    };

    const currentWord = deck[currentIndex];

    const speaking = useSpeakingWord();
    const [cheering, setCheering] = useState(false);
    const cheerTimer = useRef<number | undefined>(undefined);
    const stepTimer = useRef<number | undefined>(undefined);

    // Drop pending timers if the dialog closes mid-flip or mid-celebration.
    useEffect(
        () => () => {
            window.clearTimeout(cheerTimer.current);
            window.clearTimeout(stepTimer.current);
        },
        [],
    );

    /**
     * Both faces are mounted at all times now, so changing the word while the
     * card is face-up would visibly swap the text. When the answer is showing,
     * flip back first and change the word at the half-way point, where the
     * card is edge-on and the change cannot be seen.
     */
    const step = (delta: number) => {
        const advance = () =>
            setCurrentIndex(
                (prev) => (prev + delta + deck.length) % deck.length,
            );

        window.clearTimeout(stepTimer.current);

        if (isFlipped) {
            setIsFlipped(false);
            stepTimer.current = window.setTimeout(advance, FLIP_HALF_MS);
        } else {
            advance();
        }
    };

    const handleNext = () => step(1);
    const handlePrev = () => step(-1);

    const handleMaster = () => {
        if (!currentWord) return;
        onToggleMastered(currentWord.id, currentWord.is_mastered);
        setCheering(true);
        window.clearTimeout(cheerTimer.current);
        cheerTimer.current = window.setTimeout(() => setCheering(false), 1400);
        handleNext();
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
                render={
                    <Button
                        variant="outline"
                        className="gap-2 px-2.5 font-medium sm:px-4"
                        aria-label="Review flashcards"
                    />
                }
            >
                <Layers className="h-4 w-4 text-accent-ink" />
                <span className="hidden sm:inline">Review Flashcards</span>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[460px] p-6">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-base font-semibold flex items-center gap-2">
                            <Layers className="h-4 w-4 text-accent-ink" />
                            Review your words
                        </DialogTitle>
                        <div className="flex items-center gap-1">
                            {deck.length > 0 && (
                                <span className="font-mono text-xs text-muted-foreground">
                                    {currentIndex + 1} / {deck.length}
                                </span>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                    const next = !soundOn;
                                    setChirpEnabled(next);
                                    setSoundOn(next);
                                    // Confirm the new setting audibly.
                                    if (next) playChirp();
                                }}
                                aria-pressed={soundOn}
                                aria-label={
                                    soundOn
                                        ? "Turn flip sound off"
                                        : "Turn flip sound on"
                                }
                                title={
                                    soundOn
                                        ? "Flip sound on"
                                        : "Flip sound off"
                                }
                            >
                                {soundOn ? (
                                    <Volume1 className="h-4 w-4" />
                                ) : (
                                    <VolumeX className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {deck.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                        <Parrot state="rest" size={88} perch />
                        <p className="text-sm text-muted-foreground">
                            You&rsquo;ve mastered every word. Nothing left to
                            review.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-5 pt-2">
                        {/* 3D Flip Card */}
                        <div className="flip-scene select-none">
                            <div
                                className="flip-card cursor-pointer"
                                data-flipped={isFlipped}
                                onClick={toggleFlip}
                            >
                                {/* ---------- FRONT: the prompt ---------- */}
                                <div
                                    className="flip-face flip-face-front flex min-h-[280px] flex-col justify-between rounded-2xl border-2 border-border/80 bg-card p-6 shadow-md"
                                    aria-hidden={isFlipped}
                                >
                                    <div className="flex items-center justify-between">
                                        <Badge
                                            variant="secondary"
                                            className="text-xs capitalize"
                                        >
                                            {currentWord.part_of_speech ||
                                                "Word"}
                                        </Badge>
                                        {/* A real button, so the card can be
                                            flipped from the keyboard without
                                            nesting controls inside a
                                            clickable region. */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                playChirp();
                                                setIsFlipped(true);
                                            }}
                                            className="flex cursor-pointer items-center gap-1 rounded text-[11px] text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                                        >
                                            <RotateCw className="h-3 w-3" /> Tap
                                            to flip
                                        </button>
                                    </div>

                                    <div className="my-auto space-y-2 text-center">
                                        {/* stopPropagation: the whole card is
                                            a flip target, and hearing the word
                                            must not also reveal the answer. */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                speakWord(currentWord.word);
                                            }}
                                            aria-label={`Hear ${currentWord.word} pronounced`}
                                            title="Tap the parrot to hear it"
                                            className="mx-auto block cursor-pointer rounded-lg transition-transform hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                                        >
                                            <Parrot
                                                size={72}
                                                state={
                                                    cheering
                                                        ? "cheer"
                                                        : speaking ===
                                                            currentWord.word
                                                          ? "talking"
                                                          : "idle"
                                                }
                                            />
                                        </button>
                                        <h3 className="text-3xl font-extrabold tracking-tight text-foreground capitalize">
                                            {currentWord.word}
                                        </h3>
                                        {currentWord.source && (
                                            <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
                                                <Film className="h-3 w-3 text-accent-ink" />
                                                <span>
                                                    Clue: {currentWord.source}
                                                </span>
                                            </div>
                                        )}
                                        <p className="pt-4 text-xs text-muted-foreground">
                                            Do you remember what this means?
                                        </p>
                                    </div>

                                    <div className="pt-2 text-center text-[11px] text-muted-foreground">
                                        Tap card to reveal answer
                                    </div>
                                </div>

                                {/* ---------- BACK: the answer ---------- */}
                                <div
                                    className="flip-face flip-face-back flex min-h-[280px] flex-col justify-between rounded-2xl border-2 border-border/80 bg-card p-6 shadow-md"
                                    aria-hidden={!isFlipped}
                                >
                                    <div className="my-auto space-y-3">
                                        <div className="flex items-center justify-between border-b pb-2">
                                            <span className="text-lg font-bold capitalize">
                                                {currentWord.word}
                                            </span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-9 w-9 p-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    speakWord(currentWord.word);
                                                }}
                                                aria-label={`Hear ${currentWord.word} pronounced`}
                                            >
                                                <Volume2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <p className="text-sm leading-relaxed font-medium text-foreground/90">
                                            {currentWord.definition}
                                        </p>

                                        {currentWord.context_sentence && (
                                            <blockquote className="rounded-r border-l-2 border-border bg-muted/40 px-2.5 py-2 text-xs text-muted-foreground italic">
                                                &ldquo;
                                                {currentWord.context_sentence}
                                                &rdquo;
                                            </blockquote>
                                        )}

                                        {currentWord.mnemonic && (
                                            <div className="flex items-start gap-1.5 rounded border bg-muted/40 p-2 text-xs text-foreground/85">
                                                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-ink" />
                                                <span>
                                                    {currentWord.mnemonic}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2 text-center text-[11px] text-muted-foreground">
                                        Tap card to hide answer
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation and Action Controls */}
                        <div className="flex items-center justify-between gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handlePrev}
                                disabled={deck.length <= 1}
                                className="gap-1 text-xs"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" /> Prev
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleMaster}
                                className="gap-1.5 text-xs font-medium text-accent-ink hover:text-accent-ink"
                            >
                                <CircleCheck className="h-3.5 w-3.5" />{" "}
                                Mastered
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleNext}
                                disabled={deck.length <= 1}
                                className="gap-1 text-xs"
                            >
                                Next <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
