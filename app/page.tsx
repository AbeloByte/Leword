"use client";

import { useAuth } from "@/context/AuthContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AddWordDialog } from "@/components/AddWordDialog";
import { WordCard, WordItem } from "@/components/WordCard";
import { WordCardSkeleton } from "@/components/WordCardSkeleton";
import { WordOfTheDay } from "@/components/WordOfTheDay";
import { FlashcardModal } from "@/components/FlashcardModal";
import { LandingPage } from "@/components/LandingPage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HabitStats } from "@/components/HabitStats";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X } from "lucide-react";
import { LogoMark } from "@/components/LogoMark";
import { Parrot } from "@/components/Parrot";
import { toast } from "sonner";
import { UserNav } from "@/components/UserNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function HomePage() {
    const { user, loading } = useAuth();

    const [words, setWords] = useState<WordItem[]>([]);
    const [fetchingWords, setFetchingWords] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("All");

    // The word awaiting delete confirmation. One dialog serves the whole grid.
    const [pendingDelete, setPendingDelete] = useState<WordItem | null>(null);
    const [deleting, setDeleting] = useState(false);

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
            <header className="sticky top-0 z-20 border-b bg-background/75 backdrop-blur-xl">
                <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 p-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <LogoMark />
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
                        </div>
                    </div>

                    {/* Actions: Flashcards, Add Word, Theme, and User Profile */}
                    <div className="flex shrink-0 items-center gap-1">
                        <FlashcardModal
                            words={words}
                            onToggleMastered={handleToggleMastered}
                        />
                        <AddWordDialog onWordAdded={loadWords} />
                        <ThemeToggle />
                        <UserNav />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="relative mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
                {/* Habit Stats Tracker */}
                <HabitStats words={words} />

                {/* Word of the Day Hero */}
                <WordOfTheDay words={words} />

                {/* Search & Category Filter Bar */}
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search a word, its meaning, or where you found it"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Search your words"
                            className="h-11 bg-card pr-10 pl-9"
                        />
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-1/2 right-1.5 h-7 w-7 -translate-y-1/2 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => setSearchQuery("")}
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
                                            active ? "default" : "secondary"
                                        }
                                        onClick={() => setSelectedCategory(cat)}
                                        className="h-7 shrink-0 cursor-pointer px-3 text-xs font-medium transition-all hover:opacity-80"
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
                            {filteredWords.length === 1 ? "match" : "matches"}
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
                                }}
                            >
                                Clear filters
                            </Button>
                        ) : (
                            <div className="flex justify-center">
                                <AddWordDialog onWordAdded={loadWords} />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {filteredWords.map((item) => (
                            <WordCard
                                key={item.id}
                                word={item}
                                onToggleMastered={handleToggleMastered}
                                onDelete={requestDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

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
