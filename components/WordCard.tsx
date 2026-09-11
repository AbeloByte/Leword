"use client";

import React from "react";
import { speakWord } from "@/lib/dictionary";
import { useSpeakingWord } from "@/components/Parrot";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Volume2, Lightbulb, Film, CircleCheck, Trash2 } from "lucide-react";

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
    const added = new Date(word.created_at);
    const isTalking = useSpeakingWord() === word.word;

    return (
        <Card
            className={`group relative [--card-spacing:--spacing(5)] transition-[box-shadow,transform,opacity] duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                word.is_mastered ? "opacity-70 hover:opacity-100" : ""
            }`}
        >
            {/* Mastery is signalled by an edge stripe rather than by fading the
                whole card, so mastered words stay readable. */}
            <span
                aria-hidden
                className={`absolute inset-y-0 left-0 w-1 transition-colors ${
                    word.is_mastered ? "bg-primary" : "bg-transparent"
                }`}
            />

            <CardContent className="space-y-3.5">
                {/* Top row: word, part of speech, audio */}
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3
                                className={`text-xl font-bold capitalize ${
                                    word.is_mastered
                                        ? "text-muted-foreground line-through decoration-2"
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

                        {word.source && (
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Film className="h-3 w-3 shrink-0" />
                                <span className="truncate">{word.source}</span>
                            </div>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-9 w-9 shrink-0 p-0 transition-colors ${
                            isTalking
                                ? "bg-primary/15 text-accent-ink"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => speakWord(word.word)}
                        aria-label={`Hear ${word.word} pronounced`}
                        aria-pressed={isTalking}
                        title="Listen to pronunciation"
                    >
                        <Volume2
                            className={`h-4 w-4 ${isTalking ? "animate-pulse" : ""}`}
                        />
                    </Button>
                </div>

                {/* Definition */}
                <p className="text-sm leading-relaxed text-foreground/90">
                    {word.definition}
                </p>

                {/* Context sentence where the user saw it */}
                {word.context_sentence && (
                    <blockquote className="rounded-r-md border-l-2 border-border bg-muted/40 px-3 py-2 text-xs italic text-muted-foreground">
                        &ldquo;{word.context_sentence}&rdquo;
                    </blockquote>
                )}

                {/* Mnemonic / memory hook */}
                {word.mnemonic && (
                    <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-2.5 text-xs text-foreground/85">
                        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-ink" />
                        <span>
                            <strong className="font-semibold text-foreground">
                                Memory trick:
                            </strong>{" "}
                            {word.mnemonic}
                        </span>
                    </div>
                )}

                {/* Bottom actions */}
                <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                    <time
                        dateTime={word.created_at}
                        title={added.toLocaleString()}
                    >
                        {added.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year:
                                added.getFullYear() === new Date().getFullYear()
                                    ? undefined
                                    : "numeric",
                        })}
                    </time>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 gap-1.5 px-2.5 text-xs ${
                                word.is_mastered
                                    ? "font-medium text-accent-ink hover:text-accent-ink"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                            onClick={() =>
                                onToggleMastered(word.id, word.is_mastered)
                            }
                            aria-pressed={word.is_mastered}
                        >
                            <CircleCheck
                                className={`h-3.5 w-3.5 ${
                                    word.is_mastered ? "fill-accent-ink/15" : ""
                                }`}
                            />
                            {word.is_mastered ? "Mastered" : "Mark mastered"}
                        </Button>

                        {/* Hidden until hover on pointer devices so the card
                            reads calmly; always visible on touch. */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                            onClick={() => onDelete(word.id)}
                            aria-label={`Delete ${word.word}`}
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
