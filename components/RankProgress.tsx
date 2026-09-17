"use client";

import React from "react";
import { useProgress } from "@/context/ProgressContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ChevronRight } from "lucide-react";
import { XP } from "@/lib/xp";
import { RankIcon } from "@/components/RankIcon";

/**
 * The XP card: where you are, how far to the next rank, and what earned it.
 *
 * The bar is hand-rolled for the same reason HabitStats' is -- one div and an
 * aria-valuenow is less code than a primitive, and it inherits the accent
 * theme for free.
 */
export function RankProgress() {
    const { standing, breakdown, pending, setRanksOpen } = useProgress();

    if (pending) {
        return (
            <Card className="[--card-spacing:--spacing(4)]">
                <CardContent className="space-y-3">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-3 w-52" />
                </CardContent>
            </Card>
        );
    }

    const { rank, next, xp, fraction, remaining } = standing;
    const percent = Math.round(fraction * 100);

    return (
        <Card className="[--card-spacing:--spacing(4)] sm:[--card-spacing:--spacing(5)]">
            <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-accent-ink">
                            <RankIcon icon={rank.icon} className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <p className="font-heading text-base leading-tight font-bold">
                                {rank.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {rank.blurb}
                            </p>
                        </div>
                    </div>

                    <div className="shrink-0 text-right">
                        <p className="tabular text-lg leading-tight font-bold">
                            {xp.toLocaleString()}
                        </p>
                        <p className="text-[11px] font-medium text-muted-foreground">
                            XP
                        </p>
                    </div>
                </div>

                <div
                    className="h-2 w-full overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={
                        next
                            ? `Progress towards ${next.name}`
                            : "Top rank reached"
                    }
                >
                    <div
                        className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
                        style={{ width: `${percent}%` }}
                    />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                        {next ? (
                            <>
                                <span className="tabular font-semibold text-foreground">
                                    {remaining.toLocaleString()} XP
                                </span>{" "}
                                to
                                <RankIcon
                                    icon={next.icon}
                                    className="mx-1 inline h-3.5 w-3.5 align-text-bottom text-accent-ink"
                                />
                                {next.name}
                            </>
                        ) : (
                            <>
                                Top rank. {xp.toLocaleString()} XP and still
                                collecting.
                            </>
                        )}
                    </p>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRanksOpen(true)}
                        className="-mr-2 h-8 gap-1 text-xs font-medium text-accent-ink hover:text-accent-ink"
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        Ranks &amp; themes
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                </div>

                {/* Where the XP came from. Zero-value rows are dropped rather
                    than shown as 0, so a new account sees one line, not five. */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 border-t pt-2.5 text-[11px] text-muted-foreground">
                    <Earned
                        amount={breakdown.words}
                        label={`words · ${XP.perWord} each`}
                    />
                    <Earned
                        amount={breakdown.mastered}
                        label={`mastered · ${XP.perMastered} each`}
                    />
                    <Earned
                        amount={breakdown.reviews}
                        label={`reviews · ${XP.perReview} each`}
                    />
                    <Earned
                        amount={breakdown.days}
                        label={`days active · ${XP.perActiveDay} each`}
                    />
                    <Earned amount={breakdown.bonus} label="bonus" />
                </div>
            </CardContent>
        </Card>
    );
}

function Earned({ amount, label }: { amount: number; label: string }) {
    if (amount <= 0) return null;

    return (
        <span className="whitespace-nowrap">
            <span className="tabular font-semibold text-foreground/80">
                +{amount.toLocaleString()}
            </span>{" "}
            {label}
        </span>
    );
}
