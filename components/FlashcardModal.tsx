"use client";

import React, { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
    Layers,
    RotateCw,
    ArrowRight,
    ArrowLeft,
    Volume2,
    CheckCircle2,
    Sparkles,
    Film,
} from "lucide-react";

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

    // Initialize randomized deck of unmastered words
    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
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

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % deck.length);
        }, 150);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + deck.length) % deck.length);
        }, 150);
    };

    const handleMaster = () => {
        if (!currentWord) return;
        onToggleMastered(currentWord.id, currentWord.is_mastered);
        handleNext();
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
                render={<Button variant="outline" className="gap-2 font-medium" />}
            >
                <Layers className="h-4 w-4 text-violet-600" />
                Review Flashcards
            </DialogTrigger>

            <DialogContent className="sm:max-w-[460px] p-6">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-base font-semibold flex items-center gap-2">
                            <Layers className="h-4 w-4 text-violet-600" />
                            Flashcard Review
                        </DialogTitle>
                        {deck.length > 0 && (
                            <span className="text-xs text-muted-foreground font-mono">
                                {currentIndex + 1} / {deck.length}
                            </span>
                        )}
                    </div>
                </DialogHeader>

                {deck.length === 0 ? (
                    <div className="text-center py-12 text-sm text-muted-foreground">
                        No words to review right now!
                    </div>
                ) : (
                    <div className="space-y-5 pt-2">
                        {/* 3D Flip Card Container */}
                        <div
                            className="w-full min-h-[260px] rounded-2xl border-2 border-border/80 bg-card p-6 shadow-md flex flex-col justify-between cursor-pointer transition-all duration-300 select-none hover:border-primary/50 relative"
                            onClick={() => setIsFlipped(!isFlipped)}
                        >
                            {/* Card Header */}
                            <div className="flex items-center justify-between">
                                <Badge
                                    variant="secondary"
                                    className="text-xs capitalize"
                                >
                                    {currentWord.part_of_speech || "Word"}
                                </Badge>
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    <RotateCw className="h-3 w-3" /> Tap to flip
                                </span>
                            </div>

                            {/* Card Center Content */}
                            {!isFlipped ? (
                                // FRONT OF CARD: Question / Prompt
                                <div className="text-center my-auto space-y-2">
                                    <h3 className="text-3xl font-extrabold capitalize tracking-tight text-foreground">
                                        {currentWord.word}
                                    </h3>
                                    {currentWord.source && (
                                        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
                                            <Film className="h-3 w-3 text-primary" />
                                            <span>
                                                Clue: {currentWord.source}
                                            </span>
                                        </div>
                                    )}
                                    <p className="text-xs text-muted-foreground pt-4">
                                        Do you remember what this means?
                                    </p>
                                </div>
                            ) : (
                                // BACK OF CARD: Definition & Memory Hook
                                <div className="my-auto space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <span className="font-bold text-lg capitalize">
                                            {currentWord.word}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                speakWord(currentWord.word);
                                            }}
                                        >
                                            <Volume2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <p className="text-sm font-medium text-foreground/90 leading-relaxed">
                                        {currentWord.definition}
                                    </p>

                                    {currentWord.context_sentence && (
                                        <p className="text-xs italic text-muted-foreground bg-muted/30 p-2 rounded border-l-2 border-primary">
                                            "{currentWord.context_sentence}"
                                        </p>
                                    )}

                                    {currentWord.mnemonic && (
                                        <div className="text-xs bg-violet-500/10 text-violet-700 dark:text-violet-300 p-2 rounded flex items-start gap-1.5 border border-violet-500/20">
                                            <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                            <span>{currentWord.mnemonic}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Bottom Cue */}
                            <div className="text-center text-[11px] text-muted-foreground pt-2">
                                {!isFlipped
                                    ? "Tap card to reveal answer"
                                    : "Tap card to hide answer"}
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
                                className="gap-1.5 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-medium"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" />{" "}
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
