"use client";

import React from "react";
import { useProgress } from "@/context/ProgressContext";
import { Skeleton } from "@/components/ui/skeleton";
import { RankIcon } from "@/components/RankIcon";

/**
 * The rank chip in the header, under the wordmark.
 *
 * Deliberately plain text rather than a Badge: it sits inside the green bar
 * next to the word count, and a filled pill there would compete with the Add
 * Word button for the eye.
 */
export function RankBadge() {
    const { standing, pending, setRanksOpen } = useProgress();

    if (pending) return <Skeleton className="mt-1 h-3 w-28" />;

    const { rank, xp } = standing;

    return (
        <button
            type="button"
            onClick={() => setRanksOpen(true)}
            className="-mx-1 flex max-w-full cursor-pointer items-center gap-1.5 rounded px-1 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            aria-label={`${rank.name}, ${xp} XP. Open ranks and themes`}
            title="Ranks and themes"
        >
            <RankIcon icon={rank.icon} className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate font-medium">{rank.name}</span>
            <span aria-hidden className="opacity-50">
                ·
            </span>
            <span className="tabular shrink-0">{xp.toLocaleString()} XP</span>
        </button>
    );
}
