"use client";

import React, { useMemo } from "react";
import { WordItem } from "./WordCard";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, CircleCheck, BookOpen } from "lucide-react";

interface HabitStatsProps {
    words: WordItem[];
}

/** Local calendar day as YYYY-MM-DD, so a streak turns over at the user's
 *  midnight rather than UTC's. */
function localDayKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

export function HabitStats({ words }: HabitStatsProps) {
    // 1. Consecutive-day streak, counted backwards from today (or yesterday,
    //    so the streak survives a day that has not been used yet).
    const streak = useMemo(() => {
        if (words.length === 0) return 0;

        const activeDays = new Set(
            words.map((w) => localDayKey(new Date(w.created_at))),
        );

        const cursor = new Date();
        if (!activeDays.has(localDayKey(cursor))) {
            cursor.setDate(cursor.getDate() - 1);
            if (!activeDays.has(localDayKey(cursor))) return 0;
        }

        let count = 0;
        while (activeDays.has(localDayKey(cursor))) {
            count++;
            cursor.setDate(cursor.getDate() - 1);
        }

        return count;
    }, [words]);

    // 2. Mastery progress
    const stats = useMemo(() => {
        const total = words.length;
        const mastered = words.filter((w) => w.is_mastered).length;
        const rate = total > 0 ? Math.round((mastered / total) * 100) : 0;
        return { total, mastered, rate };
    }, [words]);

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile
                icon={<Flame className="h-4.5 w-4.5" />}
                value={String(streak)}
                label="Day streak"
                hint={
                    streak === 0
                        ? "Add a word to start one"
                        : "Add a word to keep it going"
                }
            />

            <StatTile
                icon={<BookOpen className="h-4.5 w-4.5" />}
                value={String(stats.total)}
                label="Collected"
                hint={
                    stats.total === 0
                        ? "Add your first word"
                        : `${stats.total - stats.mastered} left to learn`
                }
            />

            {/* Spans both columns on mobile so the progress bar has room. */}
            <Card className="col-span-2 sm:col-span-1 [--card-spacing:--spacing(3.5)]">
                <CardContent className="space-y-2.5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <CircleCheck className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                            <p className="tabular text-xl leading-tight font-bold">
                                {stats.rate}%
                            </p>
                            <p className="text-[11px] font-medium text-muted-foreground">
                                Mastered
                            </p>
                        </div>
                        <p className="tabular ml-auto shrink-0 text-[11px] text-muted-foreground">
                            {stats.mastered}/{stats.total}
                        </p>
                    </div>

                    {/* The only colored fill on the dashboard. */}
                    <div
                        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-valuenow={stats.rate}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="How many of your words you've mastered"
                    >
                        <div
                            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                            style={{ width: `${stats.rate}%` }}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

interface StatTileProps {
    icon: React.ReactNode;
    value: string;
    label: string;
    hint: string;
}

function StatTile({ icon, value, label, hint }: StatTileProps) {
    return (
        <Card className="[--card-spacing:--spacing(3.5)]">
            <CardContent className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="tabular text-xl leading-tight font-bold">
                        {value}
                    </p>
                    <p className="text-[11px] font-medium text-muted-foreground">
                        {label}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground/70">
                        {hint}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
