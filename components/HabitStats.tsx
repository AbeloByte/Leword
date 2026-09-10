"use client";

import React, { useMemo } from "react";
import { WordItem } from "./WordCard";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, CheckCircle, BookOpen } from "lucide-react";

interface HabitStatsProps {
    words: WordItem[];
}

export function HabitStats({ words }: HabitStatsProps) {
    // 1. Calculate consecutive day streak
    const streak = useMemo(() => {
        if (words.length === 0) return 0;

        // Get all unique active dates (YYYY-MM-DD)
        const dateStrings = Array.from(
            new Set(
                words.map(
                    (w) => new Date(w.created_at).toISOString().split("T")[0],
                ),
            ),
        )
            .sort()
            .reverse(); // Most recent first

        if (dateStrings.length === 0) return 0;

        const today = new Date().toISOString().split("T")[0];
        const yesterdayDate = new Date(today);
        yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
        const yesterday = yesterdayDate.toISOString().split("T")[0];

        // Check if the habit is still alive (active today or yesterday)
        let currentStreak = 0;
        let expectedDate = dateStrings.includes(today)
            ? new Date(today)
            : new Date(yesterday);

        if (!dateStrings.includes(today) && !dateStrings.includes(yesterday)) {
            return 0; // Streak broken
        }

        for (const dateStr of dateStrings) {
            const entryDate = new Date(dateStr);
            const diffDays = Math.round(
                (expectedDate.getTime() - entryDate.getTime()) /
                    (1000 * 60 * 60 * 24),
            );

            if (diffDays === 0) {
                currentStreak++;
                // Move expected date 1 day back
                expectedDate = new Date(expectedDate.getTime() - 86400000);
            } else if (diffDays > 0) {
                break; // Gap detected, streak ends
            }
        }

        return currentStreak;
    }, [words]);

    // 2. Calculate mastery percentage
    const stats = useMemo(() => {
        const total = words.length;
        const mastered = words.filter((w) => w.is_mastered).length;
        const rate = total > 0 ? Math.round((mastered / total) * 100) : 0;
        return { total, mastered, rate };
    }, [words]);

    return (
        <div className="grid grid-cols-3 gap-3">
            {/* Streak */}
            <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
                <CardContent className="p-3.5 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                        <Flame className="h-5 w-5 fill-orange-500 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-xl font-extrabold leading-tight">
                            {streak}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-medium">
                            Day Streak
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Total Words */}
            <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
                <CardContent className="p-3.5 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xl font-extrabold leading-tight">
                            {stats.total}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-medium">
                            Collected
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Mastery Rate */}
            <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
                <CardContent className="p-3.5 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xl font-extrabold leading-tight">
                            {stats.rate}%
                        </p>
                        <p className="text-[11px] text-muted-foreground font-medium">
                            Mastered
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
