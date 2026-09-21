"use client";

import { useEffect, useState } from "react";
import type { WordItem } from "@/components/WordCard";

/* ------------------------------------------------------------------ *
 * Picking the word
 *
 * Shared by the dashboard card and the notification bell so the two can
 * never disagree about which word is today's.
 * ------------------------------------------------------------------ */

/** Local calendar date as YYYY-MM-DD. Local, not UTC, so the word turns
 *  over at the user's midnight rather than somewhere mid-afternoon. */
export function dateKey(now: Date = new Date()): string {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/** Today's unmastered word, chosen deterministically from the date. */
export function pickWordOfTheDay(
    words: WordItem[],
    now: Date = new Date(),
): WordItem | null {
    const unmastered = words.filter((w) => !w.is_mastered);
    if (unmastered.length === 0) return null;

    // Day of the year, 1 to 366
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

    return unmastered[dayOfYear % unmastered.length];
}

/**
 * Today's date key, kept current while the tab stays open. It re-checks at
 * local midnight and whenever the tab comes back into view, since a timer
 * in a backgrounded or sleeping tab can fire late or not at all.
 */
export function useToday(): string {
    const [today, setToday] = useState(dateKey);

    useEffect(() => {
        const refresh = () => setToday(dateKey());

        const now = new Date();
        const midnight = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1,
        );
        // A second past midnight, so the refresh lands on the new day.
        const timeoutId = window.setTimeout(
            refresh,
            midnight.getTime() - now.getTime() + 1000,
        );

        const onVisible = () => {
            if (document.visibilityState === "visible") refresh();
        };
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            window.clearTimeout(timeoutId);
            document.removeEventListener("visibilitychange", onVisible);
        };
        // Re-arm the midnight timer each time the day changes.
    }, [today]);

    return today;
}

/* ------------------------------------------------------------------ *
 * Notification state
 *
 * Per user, per device: which day's word has been announced with a toast,
 * and which day's word has been read. Both wrapped, as elsewhere -- in a
 * private window the accessors throw, and the worst outcome of losing this
 * is seeing today's notification twice.
 * ------------------------------------------------------------------ */

const NOTIFY_STORAGE_PREFIX = "leword:wotd:";

export interface WordNotifyRecord {
    /** Date key of the last day a toast was shown. */
    announced: string | null;
    /** Date key of the last day the notification was opened. */
    seen: string | null;
}

const EMPTY_RECORD: WordNotifyRecord = { announced: null, seen: null };

export function readNotifyRecord(userId: string): WordNotifyRecord {
    try {
        const raw = window.localStorage.getItem(NOTIFY_STORAGE_PREFIX + userId);
        if (!raw) return EMPTY_RECORD;

        const parsed = JSON.parse(raw) as Partial<WordNotifyRecord>;
        return {
            announced:
                typeof parsed.announced === "string" ? parsed.announced : null,
            seen: typeof parsed.seen === "string" ? parsed.seen : null,
        };
    } catch {
        return EMPTY_RECORD;
    }
}

export function writeNotifyRecord(userId: string, record: WordNotifyRecord) {
    try {
        window.localStorage.setItem(
            NOTIFY_STORAGE_PREFIX + userId,
            JSON.stringify(record),
        );
    } catch {
        // Carry on with the value held in memory.
    }
}

/** Anchor id of the Word of the Day card, the target of "See it". */
export const WORD_OF_THE_DAY_ID = "word-of-the-day";

export function scrollToWordOfTheDay() {
    document
        .getElementById(WORD_OF_THE_DAY_ID)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
}
