"use client";

import React from "react";
import { speakWord } from "@/lib/dictionary";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Volume2, Sparkles, Film, CheckCircle2, Trash2 } from "lucide-react";

export interface WordItem {
    id: string;
    word: string;
    part_of_speech?: string | null;
    definition: string;
    context_sentence?: string | null;
    source?: string | null;
    category?: string | null;
    mnemonic?: string | null;
    is_mastered: boolean;
    created_at: string;
}

interface WordCardProps {
    word: WordItem;
    onToggleMastered: (id: string, currentStatus: boolean) => void;
    onDelete: (id: string) => void;
}

export function WordCard({ word, onToggleMastered, onDelete }: WordCardProps) {
    return (
        <Card
            className={`transition-all duration-200 hover:shadow-md border ${
                word.is_mastered
                    ? "bg-muted/30 border-dashed opacity-75"
                    : "bg-card"
            }`}
        >
            <CardContent className="p-5 space-y-3">
                {/* Top row: Word title, part of speech, audio */}
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3
                                className={`text-xl font-bold tracking-tight capitalize ${
                                    word.is_mastered
                                        ? "line-through text-muted-foreground"
                                        : "text-foreground"
                                }`}
                            >
                                {word.word}
                            </h3>

                            {word.part_of_speech && (
                                <Badge
                                    variant="secondary"
                                    className="text-[11px] font-medium capitalize"
                                >
                                    {word.part_of_speech}
                                </Badge>
                            )}

                            {word.category && word.category !== "General" && (
                                <Badge
                                    variant="outline"
                                    className="text-[11px]"
                                >
                                    {word.category}
                                </Badge>
                            )}
                        </div>

                        {/* Source tag if present */}
                        {word.source && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                <Film className="h-3 w-3 text-primary" />
                                <span>{word.source}</span>
                            </div>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0"
                        onClick={() => speakWord(word.word)}
                        title="Listen to pronunciation"
                    >
                        <Volume2 className="h-4 w-4" />
                    </Button>
                </div>

                {/* Definition */}
                <p className="text-sm text-foreground/90 leading-relaxed">
                    {word.definition}
                </p>

                {/* Context sentence where the user saw it */}
                {word.context_sentence && (
                    <div className="text-xs italic text-muted-foreground bg-muted/40 p-2.5 rounded-md border-l-2 border-primary/50">
                        `{word.context_sentence}`
                    </div>
                )}

                {/* AI Mnemonic / Memory Hook */}
                {word.mnemonic && (
                    <div className="flex items-start gap-2 text-xs bg-violet-500/10 text-violet-700 dark:text-violet-300 p-2.5 rounded-md border border-violet-500/20">
                        <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>
                            <strong>Memory Trick:</strong> {word.mnemonic}
                        </span>
                    </div>
                )}

                {/* Bottom actions: Mark Mastered & Delete */}
                <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                    <span>
                        {new Date(word.created_at).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-2 gap-1 text-xs ${
                                word.is_mastered
                                    ? "text-emerald-600 font-medium"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                            onClick={() =>
                                onToggleMastered(word.id, word.is_mastered)
                            }
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {word.is_mastered ? "Mastered" : "Mark Mastered"}
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive transition-colors"
                            onClick={() => onDelete(word.id)}
                            title="Delete word"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
