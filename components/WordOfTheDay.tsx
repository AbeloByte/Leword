"use client";

import React, { useMemo } from "react";
import { WordItem } from "./WordCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { speakWord } from "@/lib/dictionary";
import { Sparkles, Volume2, Film } from "lucide-react";

interface WordOfTheDayProps {
    words: WordItem[];
}

export function WordOfTheDay({ words }: WordOfTheDayProps) {
    // Pick today's unmastered word deterministically based on date
    const todayWord = useMemo(() => {
        const unmastered = words.filter((w) => !w.is_mastered);
        if (unmastered.length === 0) return null;

        const now = new Date();
        // Calculate day of the year (1 to 365)
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const diff = now.getTime() - startOfYear.getTime();
        const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

        return unmastered[dayOfYear % unmastered.length];
    }, [words]);

    if (!todayWord) return null;

    return (
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-violet-500/5 to-background shadow-sm">
            <CardContent className="p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                        <span>Word of the Day</span>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => speakWord(todayWord.word)}
                        title="Pronounce"
                    >
                        <Volume2 className="h-4 w-4" />
                    </Button>
                </div>

                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl sm:text-3xl font-extrabold capitalize tracking-tight">
                            {todayWord.word}
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
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                            <Film className="h-3 w-3 text-primary/70" />
                            <span>Learned from: {todayWord.source}</span>
                        </div>
                    )}
                </div>

                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed font-medium">
                    {todayWord.definition}
                </p>

                {todayWord.mnemonic && (
                    <p className="text-xs italic text-violet-700 dark:text-violet-300 bg-violet-500/10 p-2.5 rounded-md border border-violet-500/20">
                        💡 <strong>Memory Hook:</strong> {todayWord.mnemonic}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
