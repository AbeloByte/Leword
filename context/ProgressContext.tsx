"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { supabase } from "@/lib/supabase";
import type { PostgrestError } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { RankIcon } from "@/components/RankIcon";
import {
    ACCENT_STORAGE_KEY,
    AccentId,
    DEFAULT_ACCENT,
    ProgressStats,
    Rank,
    RankStanding,
    WordStats,
    XpBreakdown,
    isAccentId,
    isRankKey,
    rankLevel,
    standingFor,
    totalXp,
    unlockedAccents,
    xpBreakdown,
} from "@/lib/xp";

/**
 * Reviews are counted optimistically and written back in one batch. Flipping
 * through a deck fires this several times a second; without the wait each flip
 * would be its own round trip.
 */
const FLUSH_DELAY_MS = 1200;

/** An empty bank, used while the words are still loading. */
const NO_WORDS: WordStats = { total: 0, mastered: 0, activeDays: 0 };

interface ProgressContextValue {
    /** True once the progress row has been read (or found missing). */
    ready: boolean;
    /** True until the dashboard reports its word stats. Everything XP-shaped
     *  reads as zero before then, so callers can show a skeleton instead. */
    pending: boolean;

    standing: RankStanding;
    breakdown: XpBreakdown;
    reviews: number;

    accent: AccentId;
    unlocked: AccentId[];
    chooseAccent: (id: AccentId) => void;

    /** Count one revealed flashcard. */
    recordReview: () => void;
    /** The dashboard hands its derived word stats up; null while loading. */
    reportWordStats: (stats: WordStats | null) => void;

    ranksOpen: boolean;
    setRanksOpen: (open: boolean) => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

/**
 * Supabase hands back a PostgrestError whose fields are non-enumerable, so
 * `console.error("...", error)` prints a bare `{}` and tells you nothing.
 * Pull the useful parts out by name.
 */
function describe(error: PostgrestError): string {
    return [error.message, error.details, error.hint]
        .filter(Boolean)
        .join(" — ");
}

/** PostgREST cannot see the table, or Postgres says it does not exist. Both
 *  mean the same thing here: the migration has not been run. */
function isMissingTable(error: PostgrestError): boolean {
    return error.code === "PGRST205" || error.code === "42P01";
}

const MISSING_TABLE_HELP =
    "Leword: the `user_progress` table is missing, so ranks cannot remember " +
    "flashcard reviews or your theme choice. XP from words you have saved " +
    "still works. Run supabase/migrations/0001_user_progress.sql in the " +
    "Supabase SQL editor to fix it.";

/** Applies the accent to <html>, where the CSS variables are scoped. */
function paintAccent(id: AccentId) {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.accent = id;
    try {
        window.localStorage.setItem(ACCENT_STORAGE_KEY, id);
    } catch {
        // Private mode, or storage disabled. The theme still applies for this
        // session; only the pre-paint shortcut is lost.
    }
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const userId = user?.id;

    // Whose progress row is currently in state. Signing out is not handled by
    // resetting every field -- the reads below simply fall back to zero when
    // this no longer matches, which keeps the effect free of setState calls.
    const [loadedFor, setLoadedFor] = useState<string | null>(null);
    const [stored, setStored] = useState<ProgressStats>({
        reviews: 0,
        bonusXp: 0,
    });
    const [accent, setAccent] = useState<AccentId>(DEFAULT_ACCENT);
    const [rankSeen, setRankSeen] = useState<string | null>(null);
    const [wordStats, setWordStats] = useState<WordStats | null>(null);
    const [ranksOpen, setRanksOpen] = useState(false);

    // Reviews are incremented far more often than they are saved. The ref is
    // the value the next flush will write; state is what the UI renders.
    const pendingReviews = useRef(0);
    const flushTimer = useRef<number | undefined>(undefined);
    // The rank already celebrated this session, so a level-up toast does not
    // need a state update (and the re-render it would cause) to fire once.
    const celebrated = useRef<string | null>(null);
    // Set when the progress table turns out to be unreachable. Writes are
    // skipped from then on, so a missing migration costs one warning rather
    // than a failed request per flashcard.
    const storageOff = useRef(false);

    const ready = Boolean(userId) && loadedFor === userId;

    // ---------------------------------------------------------------- load

    useEffect(() => {
        celebrated.current = null;
        storageOff.current = false;
        if (!userId) return;

        let cancelled = false;

        void (async () => {
            const { data, error } = await supabase
                .from("user_progress")
                .select("reviews, bonus_xp, accent, rank_seen")
                .eq("user_id", userId)
                .maybeSingle();

            if (cancelled) return;

            if (error) {
                // Worth logging rather than toasting: the app still works,
                // it just cannot remember reviews or theme choices.
                if (isMissingTable(error)) {
                    // Say it once, and stop writing -- otherwise every flip of
                    // a flashcard fires another doomed request.
                    storageOff.current = true;
                    console.warn(MISSING_TABLE_HELP);
                } else {
                    console.error(
                        "Couldn't load your progress:",
                        describe(error),
                    );
                }
                setLoadedFor(userId);
                return;
            }

            if (data) {
                setStored({
                    reviews: data.reviews ?? 0,
                    bonusXp: data.bonus_xp ?? 0,
                });
                setRankSeen(isRankKey(data.rank_seen) ? data.rank_seen : null);

                const saved = isAccentId(data.accent)
                    ? data.accent
                    : DEFAULT_ACCENT;
                setAccent(saved);
                paintAccent(saved);
            }

            setLoadedFor(userId);
        })();

        return () => {
            cancelled = true;
        };
    }, [userId]);

    // ----------------------------------------------------------- standing

    // Signed out, or mid-switch between accounts: show a blank slate rather
    // than the previous user's totals.
    const activeStored = useMemo<ProgressStats>(
        () => (ready ? stored : { reviews: 0, bonusXp: 0 }),
        [ready, stored],
    );
    const activeWordStats = ready ? wordStats : null;

    const breakdown = useMemo(
        () => xpBreakdown(activeWordStats ?? NO_WORDS, activeStored),
        [activeWordStats, activeStored],
    );

    const standing = useMemo(() => standingFor(totalXp(breakdown)), [breakdown]);

    const unlocked = useMemo(
        () => unlockedAccents(standing.rank),
        [standing.rank],
    );

    // A theme can fall out of reach if words are deleted. Rather than leave
    // the app in a colour the user no longer owns, drop back to the default --
    // but only once the XP is actually known. Judging `unlocked` off a
    // half-loaded total would strip a legitimately earned theme on every load.
    const settled = ready && wordStats !== null;
    const effectiveAccent =
        settled && !unlocked.includes(accent) ? DEFAULT_ACCENT : accent;

    useEffect(() => {
        // Signed out, the brand goes back to parrot green.
        if (!userId) {
            paintAccent(DEFAULT_ACCENT);
            return;
        }
        // Before the row is read, whatever the pre-paint script in the root
        // layout put on <html> is the best guess there is; repainting from
        // this side would flash the default green and then correct itself.
        if (!ready) return;

        paintAccent(effectiveAccent);
    }, [userId, ready, effectiveAccent]);

    // ------------------------------------------------------------- writes

    const persist = useCallback(
        async (patch: Record<string, unknown>) => {
            if (!userId || storageOff.current) return;

            const { error } = await supabase
                .from("user_progress")
                .upsert(
                    { user_id: userId, ...patch },
                    { onConflict: "user_id" },
                );

            if (!error) return;

            if (isMissingTable(error)) {
                storageOff.current = true;
                console.warn(MISSING_TABLE_HELP);
            } else {
                console.error("Couldn't save your progress:", describe(error));
            }
        },
        [userId],
    );

    const flushReviews = useCallback(() => {
        window.clearTimeout(flushTimer.current);
        const count = pendingReviews.current;
        if (count === 0) return;
        pendingReviews.current = 0;
        void persist({ reviews: count });
    }, [persist]);

    const recordReview = useCallback(() => {
        if (!userId) return;

        setStored((prev) => {
            const next = { ...prev, reviews: prev.reviews + 1 };
            pendingReviews.current = next.reviews;
            return next;
        });

        window.clearTimeout(flushTimer.current);
        flushTimer.current = window.setTimeout(flushReviews, FLUSH_DELAY_MS);
    }, [userId, flushReviews]);

    // Closing the tab mid-deck should not lose the last few flips.
    useEffect(() => {
        const onHide = () => {
            if (document.visibilityState === "hidden") flushReviews();
        };
        document.addEventListener("visibilitychange", onHide);
        return () => {
            document.removeEventListener("visibilitychange", onHide);
            flushReviews();
        };
    }, [flushReviews]);

    const chooseAccent = useCallback(
        (id: AccentId) => {
            if (!unlocked.includes(id)) return;
            setAccent(id);
            paintAccent(id);
            void persist({ accent: id });
        },
        [unlocked, persist],
    );

    // --------------------------------------------------------- level-ups

    useEffect(() => {
        // Wait for both halves of the total: the stored row and the word bank.
        // Celebrating off a half-loaded XP figure would fire on every refresh.
        if (!ready || activeWordStats === null) return;

        const current = standing.rank;
        const now = rankLevel(current.key);
        // What this session has already handled wins over what the row said,
        // so a second level-up does not re-read a stale rank_seen.
        const seen = rankLevel(celebrated.current ?? rankSeen);

        if (seen === now) return;

        celebrated.current = current.key;
        void persist({ rank_seen: current.key });

        // First sight of this user, or a drop after deleting words: record
        // where they stand, silently. An existing collection should not throw
        // six toasts on its first load.
        if (seen !== -1 && seen < now) celebrate(current);
    }, [ready, activeWordStats, standing.rank, rankSeen, persist]);

    const reportWordStats = useCallback((stats: WordStats | null) => {
        setWordStats(stats);
    }, []);

    const value = useMemo<ProgressContextValue>(
        () => ({
            ready,
            pending: !ready || activeWordStats === null,
            standing,
            breakdown,
            reviews: activeStored.reviews,
            accent: effectiveAccent,
            unlocked,
            chooseAccent,
            recordReview,
            reportWordStats,
            ranksOpen,
            setRanksOpen,
        }),
        [
            ready,
            activeWordStats,
            standing,
            breakdown,
            activeStored.reviews,
            effectiveAccent,
            unlocked,
            chooseAccent,
            recordReview,
            reportWordStats,
            ranksOpen,
        ],
    );

    return (
        <ProgressContext.Provider value={value}>
            {children}
        </ProgressContext.Provider>
    );
}

function celebrate(rank: Rank) {
    toast.success(rank.name, {
        icon: <RankIcon icon={rank.icon} className="h-4 w-4" />,
        description:
            rank.accent === DEFAULT_ACCENT
                ? rank.blurb
                : `${rank.blurb}. The ${rank.name} theme is now yours.`,
        duration: 6000,
    });
}

export function useProgress(): ProgressContextValue {
    const ctx = useContext(ProgressContext);
    if (!ctx) {
        throw new Error("useProgress must be used inside a ProgressProvider");
    }
    return ctx;
}

/**
 * Feeds the dashboard's word list into the XP calculation.
 *
 * The words are fetched in the page, not here, so this is the seam between the
 * two. Pass null while they are still loading -- the provider uses that to hold
 * off on level-up celebrations until it knows the real total.
 */
export function useReportWordStats(stats: WordStats | null) {
    const { reportWordStats } = useProgress();

    useEffect(() => {
        reportWordStats(stats);
    }, [stats, reportWordStats]);
}
