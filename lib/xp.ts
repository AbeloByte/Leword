// lib/xp.ts
//
// The rank ladder and the arithmetic behind it. Pure data and pure functions:
// no React, no Supabase, so the rules can be read (and reasoned about) in one
// place, and the same numbers drive the badge, the progress card and the
// dialog without any of them recomputing things their own way.

/** Where XP comes from. Every value is deliberately small: the ladder should
 *  take weeks of real use to climb, not an evening of clicking. */
export const XP = {
    /** Capturing a word -- the core habit, so it pays the most per action. */
    perWord: 10,
    /** Marking one mastered, on top of the capture. */
    perMastered: 25,
    /** Revealing a flashcard. Cheap, because it is the easiest thing to do. */
    perReview: 2,
    /** Each distinct calendar day with at least one capture. Rewards showing
     *  up repeatedly rather than dumping fifty words in one sitting. */
    perActiveDay: 5,
} as const;

export type RankKey =
    | "novice"
    | "reader"
    | "wordsmith"
    | "scholar"
    | "master"
    | "grandmaster";

export type AccentId =
    | "parrot"
    | "ember"
    | "indigo"
    | "rose"
    | "gold"
    | "voltage";

/** Names a Lucide glyph; the mapping lives in components/RankIcon.tsx, so this
 *  file stays free of React and can be imported from the server. */
export type RankIconKey = "sprout" | "book" | "pen" | "grad" | "crown" | "bolt";

export interface Rank {
    key: RankKey;
    name: string;
    icon: RankIconKey;
    /** XP at which this rank begins. The first is always 0. */
    minXp: number;
    blurb: string;
    /** The accent theme this rank unlocks. */
    accent: AccentId;
}

/** Ordered low to high. Index in this array *is* the rank's level. */
export const RANKS: readonly Rank[] = [
    {
        key: "novice",
        name: "Novice",
        icon: "sprout",
        minXp: 0,
        blurb: "Just started your journey",
        accent: "parrot",
    },
    {
        key: "reader",
        name: "Reader",
        icon: "book",
        minXp: 100,
        blurb: "Habit is forming",
        accent: "ember",
    },
    {
        key: "wordsmith",
        name: "Wordsmith",
        icon: "pen",
        minXp: 300,
        blurb: "Active vocabulary builder",
        accent: "indigo",
    },
    {
        key: "scholar",
        name: "Scholar",
        icon: "grad",
        minXp: 700,
        blurb: "Deep appreciation of language",
        accent: "rose",
    },
    {
        key: "master",
        name: "Master",
        icon: "crown",
        minXp: 1500,
        blurb: "High-level vocabulary retention",
        accent: "gold",
    },
    {
        key: "grandmaster",
        name: "Grandmaster",
        icon: "bolt",
        minXp: 3000,
        blurb: "True language connoisseur",
        accent: "voltage",
    },
] as const;

export interface Accent {
    id: AccentId;
    name: string;
    /** Must match the `--brand-*` triple for this theme in globals.css --
     *  the swatch in the theme picker is painted from this string. */
    swatch: string;
    /** The rank that unlocks it. */
    rank: RankKey;
}

export const ACCENTS: readonly Accent[] = [
    { id: "parrot", name: "Parrot", swatch: "oklch(0.72 0.175 146)", rank: "novice" },
    { id: "ember", name: "Ember", swatch: "oklch(0.76 0.16 62)", rank: "reader" },
    { id: "indigo", name: "Indigo", swatch: "oklch(0.7 0.15 285)", rank: "wordsmith" },
    { id: "rose", name: "Rose", swatch: "oklch(0.7 0.17 18)", rank: "scholar" },
    { id: "gold", name: "Gold", swatch: "oklch(0.82 0.15 92)", rank: "master" },
    { id: "voltage", name: "Voltage", swatch: "oklch(0.75 0.13 200)", rank: "grandmaster" },
] as const;

export const DEFAULT_ACCENT: AccentId = "parrot";

/** Where the accent is stored, and what the inline script in the root layout
 *  reads to paint the right theme before first paint. Keep the two in sync. */
export const ACCENT_STORAGE_KEY = "leword.accent";

/** Per-user progress lives under this prefix plus the user id, so two accounts
 *  on one browser do not share a review count. */
export const PROGRESS_STORAGE_PREFIX = "leword.progress.";

export function isAccentId(value: unknown): value is AccentId {
    return ACCENTS.some((a) => a.id === value);
}

export function isRankKey(value: unknown): value is RankKey {
    return RANKS.some((r) => r.key === value);
}

/** 0-based level. -1 for anything that is not a known rank. */
export function rankLevel(key: string | null | undefined): number {
    return RANKS.findIndex((r) => r.key === key);
}

/** What the word bank contributes. Derived from `words`, never stored. */
export interface WordStats {
    total: number;
    mastered: number;
    /** Distinct local calendar days on which at least one word was captured. */
    activeDays: number;
}

/** What the word bank cannot tell us, kept on the device. */
export interface ProgressStats {
    reviews: number;
}

export interface XpBreakdown {
    words: number;
    mastered: number;
    reviews: number;
    days: number;
}

export function xpBreakdown(
    words: WordStats,
    progress: ProgressStats,
): XpBreakdown {
    return {
        words: words.total * XP.perWord,
        mastered: words.mastered * XP.perMastered,
        reviews: progress.reviews * XP.perReview,
        days: words.activeDays * XP.perActiveDay,
    };
}

export function totalXp(breakdown: XpBreakdown): number {
    return (
        breakdown.words +
        breakdown.mastered +
        breakdown.reviews +
        breakdown.days
    );
}

export function rankForXp(xp: number): Rank {
    // Walk down so the highest satisfied threshold wins.
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (xp >= RANKS[i].minXp) return RANKS[i];
    }
    return RANKS[0];
}

export function nextRankAfter(rank: Rank): Rank | null {
    return RANKS[rankLevel(rank.key) + 1] ?? null;
}

export interface RankStanding {
    xp: number;
    rank: Rank;
    /** null once the top rank is reached. */
    next: Rank | null;
    /** 0-1 through the current band. 1 at the top rank. */
    fraction: number;
    /** XP still needed for `next`. 0 at the top rank. */
    remaining: number;
}

export function standingFor(xp: number): RankStanding {
    const rank = rankForXp(xp);
    const next = nextRankAfter(rank);

    if (!next) {
        return { xp, rank, next: null, fraction: 1, remaining: 0 };
    }

    const span = next.minXp - rank.minXp;
    const into = xp - rank.minXp;

    return {
        xp,
        rank,
        next,
        fraction: Math.min(1, Math.max(0, into / span)),
        remaining: Math.max(0, next.minXp - xp),
    };
}

/** Every accent earned at or below `rank`. Always includes the default. */
export function unlockedAccents(rank: Rank): AccentId[] {
    const level = rankLevel(rank.key);
    return ACCENTS.filter((a) => rankLevel(a.rank) <= level).map((a) => a.id);
}

/** Local calendar day as YYYY-MM-DD, so a day turns over at the user's
 *  midnight rather than UTC's. */
export function localDayKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/** The XP-relevant shape of a saved word. Kept structural rather than
 *  importing WordItem, so this file stays free of component imports. */
interface CapturedWord {
    is_mastered: boolean;
    created_at: string;
}

export function deriveWordStats(words: readonly CapturedWord[]): WordStats {
    const days = new Set<string>();
    let mastered = 0;

    for (const w of words) {
        days.add(localDayKey(new Date(w.created_at)));
        if (w.is_mastered) mastered++;
    }

    return { total: words.length, mastered, activeDays: days.size };
}
