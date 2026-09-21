"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Bell, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WordItem } from "@/components/WordCard";
import {
    pickWordOfTheDay,
    readNotifyRecord,
    scrollToWordOfTheDay,
    useToday,
    writeNotifyRecord,
    type WordNotifyRecord,
} from "@/lib/word-of-the-day";

interface DailyWordNotificationProps {
    userId: string;
    words: WordItem[];
    /** False until the first fetch finishes, so an empty list is not
     *  mistaken for "nothing to announce". */
    loaded: boolean;
}

/**
 * The header bell. Once per day it announces the Word of the Day with a
 * toast, and keeps an unread dot on the bell until the user opens it or
 * follows the toast. Rendered with a `key` of the user id, so the lazy
 * storage read below always belongs to the signed-in user.
 */
export function DailyWordNotification({
    userId,
    words,
    loaded,
}: DailyWordNotificationProps) {
    const today = useToday();
    const todayWord = useMemo(
        () => (loaded ? pickWordOfTheDay(words) : null),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [words, loaded, today],
    );

    // The dashboard only renders after auth resolves on the client, so
    // storage is readable on first render.
    const [record, setRecord] = useState<WordNotifyRecord>(() =>
        readNotifyRecord(userId),
    );

    const unread = todayWord !== null && record.seen !== today;

    const markSeen = () => {
        if (record.seen === today) return;
        const next = { ...readNotifyRecord(userId), seen: today };
        writeNotifyRecord(userId, next);
        setRecord(next);
    };

    // Announce once a day. Checked against storage rather than state so a
    // second open tab does not toast again.
    const announceWord = todayWord?.word;
    useEffect(() => {
        if (!announceWord) return;
        const stored = readNotifyRecord(userId);
        if (stored.announced === today || stored.seen === today) return;

        writeNotifyRecord(userId, { ...stored, announced: today });

        // Let the dashboard paint first so the toast does not arrive
        // alongside a wall of skeletons swapping out.
        const timeoutId = window.setTimeout(() => {
            toast(`Today's word: ${announceWord}`, {
                id: `wotd-${today}`,
                description: "Your Word of the Day is ready to review.",
                icon: <Bell className="h-4 w-4" />,
                duration: 8000,
                action: {
                    label: "See it",
                    onClick: () => {
                        scrollToWordOfTheDay();
                        const next = {
                            ...readNotifyRecord(userId),
                            seen: today,
                        };
                        writeNotifyRecord(userId, next);
                        setRecord(next);
                    },
                },
            });
        }, 600);

        return () => window.clearTimeout(timeoutId);
    }, [announceWord, userId, today]);

    return (
        <DropdownMenu
            onOpenChange={(open) => {
                if (open) markSeen();
            }}
        >
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="ghost"
                        size="sm"
                        className="relative h-10 w-10 p-0 text-muted-foreground hover:text-foreground"
                        aria-label={
                            unread
                                ? "Notifications, 1 unread"
                                : "Notifications"
                        }
                        title="Notifications"
                    />
                }
            >
                <Bell className="h-4.5 w-4.5" />
                {unread && (
                    <span
                        aria-hidden
                        className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background"
                    />
                )}
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-72 p-1.5" align="end">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Notifications
                </div>

                {todayWord ? (
                    <DropdownMenuItem
                        className="cursor-pointer items-start gap-2.5 rounded-md px-2 py-2"
                        onClick={scrollToWordOfTheDay}
                    >
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-accent-ink">
                            <CalendarDays className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 space-y-0.5">
                            <span className="block text-[11px] font-medium text-muted-foreground">
                                Word of the Day &middot; Today
                            </span>
                            <span className="block text-sm font-semibold capitalize">
                                {todayWord.word}
                            </span>
                            <span className="line-clamp-2 block text-xs text-muted-foreground">
                                {todayWord.definition}
                            </span>
                        </span>
                    </DropdownMenuItem>
                ) : (
                    <p className="px-2 pt-1 pb-3 text-xs text-muted-foreground">
                        {loaded
                            ? "You're all caught up. Add a new word to get a Word of the Day."
                            : "Checking for today's word…"}
                    </p>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
