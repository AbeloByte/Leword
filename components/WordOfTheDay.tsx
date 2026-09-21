"use client";

import React, { useMemo } from "react";
import { WordItem } from "./WordCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { speakWord } from "@/lib/dictionary";
import { Parrot, useSpeakingWord } from "@/components/Parrot";
import { CalendarDays, Volume2, Film, Lightbulb } from "lucide-react";
import {
    pickWordOfTheDay,
    useToday,
    WORD_OF_THE_DAY_ID,
} from "@/lib/word-of-the-day";

interface WordOfTheDayProps {
    words: WordItem[];
}

export function WordOfTheDay({ words }: WordOfTheDayProps) {
    const speaking = useSpeakingWord();
    const today = useToday();
    // Re-picks when the date turns over, not only when the words change.
    const todayWord = useMemo(
        () => pickWordOfTheDay(words),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [words, today],
    );

    if (!todayWord) return null;

    // Only react to this card's own word, not to a WordCard elsewhere.
    const isTalking = speaking === todayWord.word;

    return (
        <Card
            id={WORD_OF_THE_DAY_ID}
            // Clears the sticky header when scrolled to from a notification.
            className="scroll-mt-28 [--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]"
        >
            <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-accent-ink uppercase">
                        <CalendarDays className="h-4 w-4" />
                        <span>Word of the Day</span>
                    </div>

                    <button
                        type="button"
                        onClick={() => speakWord(todayWord.word)}
                        aria-label={`Hear ${todayWord.word} pronounced`}
                        title="Tap the parrot to hear it"
                        className="group -m-1 flex cursor-pointer items-center gap-1 rounded-lg p-1 transition-transform hover:scale-105 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                        <Volume2 className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-accent-ink" />
                        <Parrot
                            state={isTalking ? "talking" : "idle"}
                            size={44}
                        />
                    </button>
                </div>

                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-extrabold capitalize sm:text-3xl">
                            <span className="marker">{todayWord.word}</span>
                        </h2>
                        {todayWord.part_of_speech && (
                            <Badge
                                variant="outline"
                                className="text-xs capitalize"
                            >
                                {todayWord.part_of_speech}
                            </Badge>
                        )}
                    </div>

                    {todayWord.source && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Film className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                                Learned from: {todayWord.source}
                            </span>
                        </div>
                    )}
                </div>

                <p className="text-sm leading-relaxed font-medium text-foreground/90 sm:text-base">
                    {todayWord.definition}
                </p>

                {todayWord.mnemonic && (
                    <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-2.5 text-xs text-foreground/85">
                        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-ink" />
                        <span>
                            <strong className="font-semibold text-foreground">
                                Memory hook:
                            </strong>{" "}
                            {todayWord.mnemonic}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
