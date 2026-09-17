"use client";

import React from "react";
import { useProgress } from "@/context/ProgressContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, Lock, Palette, Trophy } from "lucide-react";
import { ACCENTS, RANKS, Rank, rankLevel } from "@/lib/xp";
import { RankIcon } from "@/components/RankIcon";

/**
 * The whole ladder in one place: every rank, where you stand on it, and the
 * themes each one unlocks.
 *
 * Open state lives in ProgressContext rather than here, because two very
 * different places open it -- the header chip and the profile menu -- and
 * neither should have to own a dialog the other also renders.
 */
export function RanksDialog() {
    const { ranksOpen, setRanksOpen, standing, accent, unlocked, chooseAccent } =
        useProgress();

    const currentLevel = rankLevel(standing.rank.key);

    return (
        <Dialog open={ranksOpen} onOpenChange={setRanksOpen}>
            <DialogContent className="sm:max-w-[480px] p-6">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                        <Trophy className="h-4 w-4 text-accent-ink" />
                        Ranks &amp; milestones
                    </DialogTitle>
                    <DialogDescription>
                        You are
                        <RankIcon
                            icon={standing.rank.icon}
                            className="mx-1 inline h-3.5 w-3.5 align-text-bottom text-accent-ink"
                        />
                        <strong className="font-semibold text-foreground">
                            {standing.rank.name}
                        </strong>{" "}
                        with {standing.xp.toLocaleString()} XP.
                        {standing.next
                            ? ` ${standing.remaining.toLocaleString()} more to ${standing.next.name}.`
                            : " Nothing left above you."}
                    </DialogDescription>
                </DialogHeader>

                {/* ---------------- The ladder ---------------- */}
                <ol className="space-y-1">
                    {RANKS.map((rank, level) => (
                        <RankRow
                            key={rank.key}
                            rank={rank}
                            state={
                                level < currentLevel
                                    ? "passed"
                                    : level === currentLevel
                                      ? "current"
                                      : "locked"
                            }
                            fraction={
                                level === currentLevel ? standing.fraction : 0
                            }
                        />
                    ))}
                </ol>

                {/* ---------------- Theme picker ---------------- */}
                <div className="space-y-2.5 border-t pt-4">
                    <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-accent-ink" />
                        <h3 className="text-sm font-semibold">App theme</h3>
                        <Badge variant="secondary" className="text-[11px]">
                            {unlocked.length} of {ACCENTS.length}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {ACCENTS.map((option) => {
                            const isUnlocked = unlocked.includes(option.id);
                            const active = accent === option.id;
                            const needed = RANKS[rankLevel(option.rank)];

                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    disabled={!isUnlocked}
                                    onClick={() => chooseAccent(option.id)}
                                    aria-pressed={active}
                                    title={
                                        isUnlocked
                                            ? `Use the ${option.name} theme`
                                            : `Unlocks at ${needed.name}`
                                    }
                                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-colors ${
                                        active
                                            ? "border-primary bg-primary/10"
                                            : "border-border"
                                    } ${
                                        isUnlocked
                                            ? "cursor-pointer hover:bg-muted"
                                            : "cursor-not-allowed opacity-45"
                                    }`}
                                >
                                    <span
                                        aria-hidden
                                        className="relative flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-foreground/10"
                                        style={{
                                            backgroundColor: option.swatch,
                                        }}
                                    >
                                        {active && (
                                            <Check className="h-3.5 w-3.5 text-black/75" />
                                        )}
                                        {!isUnlocked && (
                                            <Lock className="h-3 w-3 text-black/60" />
                                        )}
                                    </span>
                                    <span className="text-[11px] font-medium">
                                        {option.name}
                                    </span>
                                    {!isUnlocked && (
                                        <span className="text-[10px] leading-none text-muted-foreground">
                                            {needed.name}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

interface RankRowProps {
    rank: Rank;
    state: "passed" | "current" | "locked";
    /** How far through this band, 0-1. Only meaningful when current. */
    fraction: number;
}

function RankRow({ rank, state, fraction }: RankRowProps) {
    const current = state === "current";

    return (
        <li
            className={`relative overflow-hidden rounded-lg border px-3 py-2.5 ${
                current ? "border-primary bg-primary/5" : "border-transparent"
            } ${state === "locked" ? "opacity-55" : ""}`}
        >
            {/* Fill behind the current rank's row, showing progress through
                the band without needing a second progress bar. */}
            {current && (
                <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 bg-primary/10 transition-[width] duration-700 ease-out"
                    style={{ width: `${Math.round(fraction * 100)}%` }}
                />
            )}

            <div className="relative flex items-center gap-3">
                <RankIcon
                    icon={rank.icon}
                    className={`h-4 w-4 shrink-0 ${
                        current ? "text-accent-ink" : "text-muted-foreground"
                    }`}
                />

                <div className="min-w-0 flex-1">
                    <p className="text-sm leading-tight font-semibold">
                        {rank.name}
                        {current && (
                            <span className="ml-2 text-[10px] font-bold tracking-wider text-accent-ink uppercase">
                                You
                            </span>
                        )}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                        {rank.blurb}
                    </p>
                </div>

                <div className="shrink-0 text-right">
                    <p className="tabular text-xs font-semibold">
                        {rank.minXp.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">XP</p>
                </div>

                {state === "passed" && (
                    <Check
                        className="h-4 w-4 shrink-0 text-accent-ink"
                        aria-label="Reached"
                    />
                )}
                {state === "locked" && (
                    <Lock
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                        aria-label="Locked"
                    />
                )}
                {current && <span className="w-4 shrink-0" aria-hidden />}
            </div>
        </li>
    );
}
