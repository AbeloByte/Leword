"use client";

import { useAuth } from "@/context/AuthContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AddWordDialog } from "@/components/AddWordDialog";
import { WordCard, WordItem } from "@/components/WordCard";
import { WordCardSkeleton } from "@/components/WordCardSkeleton";
import { WordOfTheDay } from "@/components/WordOfTheDay";
import { DailyWordNotification } from "@/components/DailyWordNotification";
import { FlashcardModal } from "@/components/FlashcardModal";
import { LandingPage } from "@/components/LandingPage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HabitStats } from "@/components/HabitStats";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Search,
    X,
    Library,
    ArrowDown,
    BookOpen,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { LogoMark } from "@/components/LogoMark";
import { Parrot } from "@/components/Parrot";
import { toast } from "sonner";
import { UserNav } from "@/components/UserNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { RankBadge } from "@/components/RankBadge";
import { RankProgress } from "@/components/RankProgress";
import { RanksDialog } from "@/components/RanksDialog";
import { useReportWordStats } from "@/context/ProgressContext";
import { deriveWordStats } from "@/lib/xp";

const WORDS_PER_PAGE = 12;

export default function HomePage() {
    const { user, loading } = useAuth();

    const [words, setWords] = useState<WordItem[]>([]);
    const [fetchingWords, setFetchingWords] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [currentPage, setCurrentPage] = useState(1);

    // The word awaiting delete confirmation. One dialog serves the whole grid.
    const [pendingDelete, setPendingDelete] = useState<WordItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    // The word just saved: scrolled into view once, then ringed briefly.
    const [highlightId, setHighlightId] = useState<string | null>(null);
    const pendingScrollId = useRef<string | null>(null);

    // Depend on the id, not the user object: the object identity changes on
    // every token refresh, which would re-run the fetch effect.
    const userId = user?.id;

    // Which user the list has already been fetched for, so a refetch does not
    // blank the grid back to skeletons.
    const loadedForUser = useRef<string | null>(null);

    const loadWords = useCallback(async () => {
        if (!userId) return;

        // Show the skeleton grid only the first time for this user. Later
        // refetches (after a save or a failed delete) keep the current cards
        // on screen and swap the data in underneath.
        const firstLoad = loadedForUser.current !== userId;
        if (firstLoad) setFetchingWords(true);

        try {
            const { data, error } = await supabase
                .from("words")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setWords((data as WordItem[]) || []);
            loadedForUser.current = userId;
        } catch (err) {
            console.error("Error loading words:", err);
            toast.error("Couldn't load your words");
        } finally {
            if (firstLoad) setFetchingWords(false);
        }
    }, [userId]);

    useEffect(() => {
        if (!userId) return;

        const timeoutId = window.setTimeout(() => {
            void loadWords();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [userId, loadWords]);

    // After a save: refetch, drop any filter that would hide the new word,
    // then let the effect below scroll to it once its card is on screen.
    const handleWordAdded = useCallback(
        async (id: string) => {
            setSearchQuery("");
            setSelectedCategory("All");
            setCurrentPage(1);
            await loadWords();
            pendingScrollId.current = id;
            setHighlightId(id);
        },
        [loadWords],
    );

    useEffect(() => {
        if (!highlightId) return;

        let frame = 0;
        let settleTimer = 0;
        let clearTimer = 0;
        const startedAt = performance.now();
        const html = document.documentElement;

        // The dialog locks page scroll while open and, on close, snaps the
        // page back to where it was (and returns focus to its trigger). Any
        // scroll issued before that finishes gets undone, so wait until the
        // dialog is fully gone and the card has rendered.
        const dialogGone = () =>
            !html.hasAttribute("data-base-ui-scroll-locked") &&
            getComputedStyle(html).overflowY !== "hidden" &&
            getComputedStyle(document.body).overflowY !== "hidden" &&
            !document.querySelector('[role="dialog"]');

        const scrollToCard = (el: HTMLElement, smooth: boolean) => {
            const rect = el.getBoundingClientRect();
            const top =
                window.scrollY +
                rect.top -
                Math.max(96, (window.innerHeight - rect.height) / 2);
            window.scrollTo({
                top: Math.max(0, top),
                behavior: smooth ? "smooth" : "auto",
            });
        };

        const tryScroll = () => {
            if (pendingScrollId.current !== highlightId) return;
            const el = document.getElementById(`word-${highlightId}`);

            const waited = performance.now() - startedAt;
            if (!el || (!dialogGone() && waited < 4000)) {
                // Stop polling eventually rather than running forever.
                if (waited < 8000) frame = requestAnimationFrame(tryScroll);
                return;
            }

            pendingScrollId.current = null;
            const reduceMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)",
            ).matches;
            scrollToCard(el, !reduceMotion);

            // If something still knocked the page back mid-scroll, jump.
            settleTimer = window.setTimeout(() => {
                const r = el.getBoundingClientRect();
                if (r.bottom < 80 || r.top > window.innerHeight) {
                    scrollToCard(el, false);
                }
            }, 900);

            // Keep the ring on long enough to be seen after arriving.
            clearTimer = window.setTimeout(() => setHighlightId(null), 3500);
        };

        frame = requestAnimationFrame(tryScroll);

        return () => {
            cancelAnimationFrame(frame);
            window.clearTimeout(settleTimer);
            window.clearTimeout(clearTimer);
        };
    }, [highlightId]);

    const handleToggleMastered = async (id: string, currentStatus: boolean) => {
        try {
            const newStatus = !currentStatus;
            setWords((prev) =>
                prev.map((w) =>
                    w.id === id ? { ...w, is_mastered: newStatus } : w,
                ),
            );

            const { error } = await supabase
                .from("words")
                .update({ is_mastered: newStatus })
                .eq("id", id);

            if (error) throw error;

            toast.success(
                newStatus
                    ? "Marked as mastered"
                    : "Moved back to your learning list",
            );
        } catch {
            toast.error("Couldn't update that word");
            loadWords();
        }
    };

    // The card's delete button only asks; the dialog does the deleting.
    const requestDelete = (id: string) => {
        setPendingDelete(words.find((w) => w.id === id) ?? null);
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        const { id, word } = pendingDelete;
        setDeleting(true);

        try {
            const { error } = await supabase
                .from("words")
                .delete()
                .eq("id", id);
            if (error) throw error;

            setWords((prev) => prev.filter((w) => w.id !== id));
            toast.success(`"${word}" deleted`);
            setPendingDelete(null);
        } catch {
            toast.error("Couldn't delete that word");
            loadWords();
        } finally {
            setDeleting(false);
        }
    };

    // What the XP system needs from the word bank. null while the first fetch
    // is still running, so the rank badge shows a skeleton rather than a
    // Novice that immediately jumps -- and so no level-up fires off a zero.
    const wordStats = useMemo(
        () => (fetchingWords ? null : deriveWordStats(words)),
        [words, fetchingWords],
    );
    useReportWordStats(wordStats);

    const categories = useMemo(() => {
        const set = new Set<string>();
        words.forEach((w) => {
            if (w.category) set.add(w.category);
        });
        return ["All", ...Array.from(set)];
    }, [words]);

    const filteredWords = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();

        return words.filter((w) => {
            const matchesSearch =
                !q ||
                w.word.toLowerCase().includes(q) ||
                w.definition.toLowerCase().includes(q) ||
                (w.source?.toLowerCase().includes(q) ?? false);

            const matchesCategory =
                selectedCategory === "All" || w.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [words, searchQuery, selectedCategory]);

    const isFiltering = searchQuery.trim() !== "" || selectedCategory !== "All";
    const pageCount = Math.max(
        1,
        Math.ceil(filteredWords.length / WORDS_PER_PAGE),
    );
    const page = Math.min(currentPage, pageCount);
    const pageStart = (page - 1) * WORDS_PER_PAGE;
    const visibleWords = filteredWords.slice(
        pageStart,
        pageStart + WORDS_PER_PAGE,
    );

    const changePage = (next: number) => {
        setCurrentPage(Math.max(1, Math.min(next, pageCount)));
        document.getElementById("word-library")?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                .matches
                ? "instant"
                : "smooth",
            block: "start",
        });
    };

    // 1. Initial auth loading state
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Parrot state="rest" size={88} perch />
                    <p className="text-sm text-muted-foreground">
                        Waking the parrot…
                    </p>
                </div>
            </div>
        );
    }

    // 2. If visitor is NOT logged in: Render the Landing Page
    if (!user) {
        return <LandingPage />;
    }

    // 3. If user IS logged in: Render the complete Dashboard
    return (
        <main className="min-h-screen pb-20">
            {/* Header */}
            <header className="nav-green sticky top-0 z-20 border-b backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <LogoMark className="nav-logo" />
                        <div className="min-w-0">
                            <h1 className="text-lg leading-tight font-bold">
                                Leword
                            </h1>
                            {fetchingWords ? (
                                <Skeleton className="mt-1 h-3 w-24" />
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    {words.length}{" "}
                                    {words.length === 1 ? "word" : "words"}{" "}
                                    collected
                                </p>
                            )}
                            <RankBadge />
                        </div>
                    </div>

                    {/* Actions: Flashcards, Add Word, Theme, and User Profile */}
                    <div className="flex shrink-0 items-center gap-1">
                        <DailyWordNotification
                            key={user.id}
                            userId={user.id}
                            words={words}
                            loaded={!fetchingWords}
                        />
                        <ThemeToggle />
                        <UserNav />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="relative mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                <section
                    aria-labelledby="dashboard-title"
                    className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center mt-5"
                >
                    <div className="space-y-2">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent-ink">
                            <BookOpen className="size-4" aria-hidden="true" />{" "}
                            Your daily practice
                        </p>
                        <h2
                            id="dashboard-title"
                            className="text-3xl font-extrabold tracking-tight sm:text-4xl"
                        >
                            A little practice. More words that stick.
                        </h2>
                        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                            Collect something new, revisit a familiar word, and
                            keep your vocabulary growing.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <FlashcardModal
                            words={words}
                            onToggleMastered={handleToggleMastered}
                        />
                        <a
                            href="#word-library"
                            className="inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                            Your collection{" "}
                            <ArrowDown className="size-4" aria-hidden="true" />
                        </a>
                    </div>
                </section>

                {fetchingWords ? (
                    <div
                        className="grid grid-cols-3 gap-3"
                        aria-label="Loading your progress"
                    >
                        {Array.from({ length: 3 }).map((_, index) => (
                            <Skeleton key={index} className="h-24 rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <HabitStats words={words} />
                )}

                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
                    <section
                        id="word-library"
                        aria-labelledby="library-title"
                        className="order-1 min-w-0 scroll-mt-28 space-y-5 lg:order-none"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2
                                    id="library-title"
                                    className="flex items-center gap-2 text-xl font-bold"
                                >
                                    <Library
                                        className="size-5 text-accent-ink"
                                        aria-hidden="true"
                                    />{" "}
                                    Your word collection
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    The words you found worth keeping.
                                </p>
                            </div>
                            <AddWordDialog onWordAdded={handleWordAdded} />
                        </div>

                        {/* Search & Category Filter Bar */}
                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search a word, its meaning, or where you found it"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    aria-label="Search your words"
                                    className="h-12 bg-card pr-11 pl-10"
                                />
                                {searchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 p-0 text-muted-foreground hover:text-foreground"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setCurrentPage(1);
                                        }}
                                        aria-label="Clear search"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>

                            {categories.length > 1 && (
                                <div className="scrollbar-none -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1">
                                    {categories.map((cat) => {
                                        const active = selectedCategory === cat;
                                        return (
                                            <Badge
                                                key={cat}
                                                render={
                                                    <button
                                                        type="button"
                                                        aria-pressed={active}
                                                    />
                                                }
                                                variant={
                                                    active
                                                        ? "default"
                                                        : "secondary"
                                                }
                                                onClick={() => {
                                                    setSelectedCategory(cat);
                                                    setCurrentPage(1);
                                                }}
                                                className="h-8 shrink-0 cursor-pointer px-3.5 text-xs font-medium transition-all hover:opacity-80"
                                            >
                                                {cat}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Result count */}
                            {!fetchingWords && isFiltering && (
                                <p className="text-xs text-muted-foreground">
                                    {filteredWords.length}{" "}
                                    {filteredWords.length === 1
                                        ? "match"
                                        : "matches"}
                                    {selectedCategory !== "All" &&
                                        ` in ${selectedCategory}`}
                                </p>
                            )}
                        </div>

                        {/* Word Feed Grid */}
                        {fetchingWords ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <WordCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : filteredWords.length === 0 ? (
                            <div className="space-y-3 rounded-xl border border-dashed py-16 text-center">
                                <Parrot
                                    state={isFiltering ? "idle" : "rest"}
                                    size={96}
                                    perch={!isFiltering}
                                    className="mx-auto"
                                    label={
                                        isFiltering
                                            ? "The Leword parrot, looking around"
                                            : "The Leword parrot, dozing on its perch"
                                    }
                                />
                                <p className="text-base font-semibold">
                                    {isFiltering
                                        ? "Nothing matched that search"
                                        : "You haven't saved any words yet"}
                                </p>
                                <p className="mx-auto max-w-xs text-xs text-muted-foreground">
                                    {isFiltering
                                        ? "Try another word, or clear the filters."
                                        : "Next time a word catches your ear in a film or a book, add it here. Leword will explain it and help you remember it."}
                                </p>
                                {isFiltering ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setSelectedCategory("All");
                                            setCurrentPage(1);
                                        }}
                                    >
                                        Clear filters
                                    </Button>
                                ) : (
                                    <div className="flex justify-center">
                                        <AddWordDialog
                                            onWordAdded={handleWordAdded}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {visibleWords.map((item) => (
                                    <WordCard
                                        key={item.id}
                                        word={item}
                                        onToggleMastered={handleToggleMastered}
                                        onDelete={requestDelete}
                                        highlighted={item.id === highlightId}
                                    />
                                ))}
                            </div>
                        )}
                        {!fetchingWords && filteredWords.length > 0 && (
                            <nav
                                aria-label="Word collection pagination"
                                className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"
                            >
                                <p
                                    className="text-xs text-muted-foreground"
                                    role="status"
                                >
                                    Showing {pageStart + 1}–
                                    {Math.min(
                                        pageStart + WORDS_PER_PAGE,
                                        filteredWords.length,
                                    )}{" "}
                                    of {filteredWords.length} words
                                </p>
                                {pageCount > 1 && (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page === 1}
                                            onClick={() => changePage(page - 1)}
                                            aria-label="Previous page"
                                        >
                                            <ChevronLeft
                                                className="size-4"
                                                aria-hidden="true"
                                            />{" "}
                                            Previous
                                        </Button>
                                        <span className="text-xs tabular-nums text-muted-foreground">
                                            {page} / {pageCount}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page === pageCount}
                                            onClick={() => changePage(page + 1)}
                                            aria-label="Next page"
                                        >
                                            Next{" "}
                                            <ChevronRight
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                        </Button>
                                    </div>
                                )}
                            </nav>
                        )}
                    </section>
                    <aside
                        aria-label="Daily word and learning progress"
                        className="contents lg:sticky lg:top-28 lg:block lg:min-w-0 lg:space-y-5"
                    >
                        <div className="order-2 space-y-3">
                            <h2 className="text-sm font-semibold text-muted-foreground">
                                Your next milestone
                            </h2>
                            <RankProgress />
                        </div>
                        {!fetchingWords && words.length > 0 && (
                            <div className="order-first min-w-0">
                                <WordOfTheDay words={words} />
                            </div>
                        )}
                        {!fetchingWords && words.length === 0 && (
                            <div className="order-2 rounded-xl border bg-card p-5">
                                <BookOpen
                                    className="mb-3 size-5 text-accent-ink"
                                    aria-hidden="true"
                                />
                                <h3 className="font-semibold">
                                    Start with what caught your ear.
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                    A line from a film, a phrase from a book, or
                                    a word from a conversation. Save it with its
                                    context to make it easier to remember.
                                </p>
                            </div>
                        )}
                    </aside>
                </div>
            </div>

            <RanksDialog />

            <ConfirmDialog
                open={pendingDelete !== null}
                onOpenChange={(next) => {
                    if (!next) setPendingDelete(null);
                }}
                destructive
                busy={deleting}
                title="Delete this word?"
                description={
                    <>
                        <strong className="font-semibold text-foreground capitalize">
                            {pendingDelete?.word}
                        </strong>{" "}
                        will be removed from your words, along with its
                        definition and memory trick. This can&rsquo;t be undone.
                    </>
                }
                confirmLabel={deleting ? "Deleting…" : "Delete word"}
                cancelLabel="Keep it"
                onConfirm={confirmDelete}
            />
        </main>
    );
}
