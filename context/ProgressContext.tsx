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
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { RankIcon } from "@/components/RankIcon";
import {
    ACCENT_STORAGE_KEY,
    AccentId,
    DEFAULT_ACCENT,
    PROGRESS_STORAGE_PREFIX,
    Rank,
    RankKey,
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

/** An empty bank, used while the words are still loading. */
const NO_WORDS: WordStats = { total: 0, mastered: 0, activeDays: 0 };

/**
 * Everything the word bank cannot derive.
 *
 * This deliberately lives on the device rather than in Supabase. Most of a
 * user's XP comes from the `words` table, which is already synced and cannot
 * drift; the rest is a review tally, a theme choice and a "highest rank already
 * celebrated" marker -- none of which is worth a table, an RLS policy and a
 * migration step. Signing in on a second device starts its review count at
 * zero, which costs a little XP and nothing else.
 *
 * If per-word review history ever matters (spaced repetition), that belongs on
 * `words` as a column, not here.
 */
interface ProgressRecord {
    reviews: number;
    accent: AccentId;
    rankSeen: RankKey | null;
}

const EMPTY: ProgressRecord = {
    reviews: 0,
    accent: DEFAULT_ACCENT,
    rankSeen: null,
};

interface ProgressContextValue {
    /** True once this user's record has been read. */
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

// ---------------------------------------------------------------- storage
//
// Every read and write is wrapped: in a private window, or with site data
// blocked, the accessors throw. Losing the tally is survivable; crashing the
// dashboard over it is not.

function readRecord(userId: string): ProgressRecord {
    try {
        const raw = window.localStorage.getItem(
            PROGRESS_STORAGE_PREFIX + userId,
        );
        if (!raw) return EMPTY;

        const parsed = JSON.parse(raw) as Partial<ProgressRecord>;
        return {
            reviews:
                typeof parsed.reviews === "number" && parsed.reviews >= 0
                    ? Math.floor(parsed.reviews)
                    : 0,
            accent: isAccentId(parsed.accent) ? parsed.accent : DEFAULT_ACCENT,
            rankSeen: isRankKey(parsed.rankSeen) ? parsed.rankSeen : null,
        };
    } catch {
        return EMPTY;
    }
}

function writeRecord(userId: string, record: ProgressRecord) {
    try {
        window.localStorage.setItem(
            PROGRESS_STORAGE_PREFIX + userId,
            JSON.stringify(record),
        );
    } catch {
        // Nothing to do but carry on with the value held in memory.
    }
}

/** Applies the accent to <html>, where the CSS variables are scoped, and
 *  mirrors it to the key the root layout's pre-paint script reads. */
function paintAccent(id: AccentId) {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.accent = id;
    try {
        window.localStorage.setItem(ACCENT_STORAGE_KEY, id);
    } catch {
        // Only the pre-paint shortcut is lost; the theme still applies.
    }
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const userId = user?.id;

    const [record, setRecord] = useState<ProgressRecord>(EMPTY);
    const [loadedFor, setLoadedFor] = useState<string | null>(null);
    const [wordStats, setWordStats] = useState<WordStats | null>(null);
    const [ranksOpen, setRanksOpen] = useState(false);

    // The rank already celebrated this session, so a level-up toast can fire
    // once without a state update and the re-render that would cause. Tagged
    // with the user it belongs to, so switching accounts needs no reset --
    // a marker from the previous user simply stops matching.
    const celebrated = useRef<{ userId: string; rank: RankKey } | null>(null);

    // Load during render rather than in an effect. The read is synchronous, so
    // an effect would render one frame at zero XP first -- and `userId` is null
    // until auth resolves on the client, so this branch never runs on the
    // server and cannot cause a hydration mismatch.
    if (userId && loadedFor !== userId) {
        setLoadedFor(userId);
        setRecord(readRecord(userId));
    }

    const ready = Boolean(userId) && loadedFor === userId;

    // ----------------------------------------------------------- standing

    // Signed out, or mid-switch between accounts: show a blank slate rather
    // than the previous user's totals.
    const activeRecord = ready ? record : EMPTY;
    const activeWordStats = ready ? wordStats : null;

    const breakdown = useMemo(
        () =>
            xpBreakdown(activeWordStats ?? NO_WORDS, {
                reviews: activeRecord.reviews,
            }),
        [activeWordStats, activeRecord.reviews],
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
        settled && !unlocked.includes(activeRecord.accent)
            ? DEFAULT_ACCENT
            : activeRecord.accent;

    useEffect(() => {
        // Signed out, the brand goes back to parrot green.
        if (!userId) {
            paintAccent(DEFAULT_ACCENT);
            return;
        }
        paintAccent(effectiveAccent);
    }, [userId, effectiveAccent]);

    // ------------------------------------------------------------- writes

    // One place syncs the record out to storage: the updaters below stay pure,
    // and nothing can change the record without it being saved. Re-writing
    // what was just read on load is idempotent and not worth guarding against.
    useEffect(() => {
        if (!ready || !userId) return;
        writeRecord(userId, record);
    }, [ready, userId, record]);

    const update = useCallback((patch: Partial<ProgressRecord>) => {
        setRecord((prev) => ({ ...prev, ...patch }));
    }, []);

    const recordReview = useCallback(() => {
        setRecord((prev) => ({ ...prev, reviews: prev.reviews + 1 }));
    }, []);

    const chooseAccent = useCallback(
        (id: AccentId) => {
            if (!unlocked.includes(id)) return;
            paintAccent(id);
            update({ accent: id });
        },
        [unlocked, update],
    );

    // --------------------------------------------------------- level-ups

    useEffect(() => {
        // Wait for both halves of the total: the stored record and the word
        // bank. Celebrating off a half-loaded XP figure would fire on every
        // page load.
        if (!ready || !userId || activeWordStats === null) return;

        const current = standing.rank;
        const now = rankLevel(current.key);
        // What this session has already handled wins over what was stored, so
        // a second level-up does not re-read a stale marker.
        const thisSession =
            celebrated.current?.userId === userId
                ? celebrated.current.rank
                : null;
        const seen = rankLevel(thisSession ?? activeRecord.rankSeen);

        if (seen === now) return;

        celebrated.current = { userId, rank: current.key };
        update({ rankSeen: current.key });

        // First sight of this user, or a drop after deleting words: record
        // where they stand, silently. An existing collection should not throw
        // six toasts on its first load.
        if (seen !== -1 && seen < now) celebrate(current);
    }, [
        ready,
        userId,
        activeWordStats,
        standing.rank,
        activeRecord.rankSeen,
        update,
    ]);

    const reportWordStats = useCallback((stats: WordStats | null) => {
        setWordStats(stats);
    }, []);

    const value = useMemo<ProgressContextValue>(
        () => ({
            ready,
            pending: !ready || activeWordStats === null,
            standing,
            breakdown,
            reviews: activeRecord.reviews,
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
            activeRecord.reviews,
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
