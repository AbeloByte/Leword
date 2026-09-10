"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { AddWordDialog } from "@/components/AddWordDialog";
import { WordCard, WordItem } from "@/components/WordCard";
import { WordOfTheDay } from "@/components/WordOfTheDay";
import { FlashcardModal } from "@/components/FlashcardModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HabitStats } from "@/components/HabitStats";
import { Badge } from "@/components/ui/badge";
import { BookOpen, LogOut, Search, Sparkles, Filter } from "lucide-react";
import { toast } from "sonner";

export default function HomePage() {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();

    const [words, setWords] = useState<WordItem[]>([]);
    const [fetchingWords, setFetchingWords] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("All");

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth");
        }
    }, [user, loading, router]);

    const loadWords = async () => {
        if (!user) return;
        setFetchingWords(true);

        try {
            const { data, error } = await supabase
                .from("words")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setWords((data as WordItem[]) || []);
        } catch (err: any) {
            console.error("Error loading words:", err);
            toast.error("Failed to load your vocabulary");
        } finally {
            setFetchingWords(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadWords();
        }
    }, [user]);

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
                    ? "Marked as mastered! 🎉"
                    : "Moved back to active learning",
            );
        } catch (err) {
            toast.error("Could not update word status");
            loadWords();
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setWords((prev) => prev.filter((w) => w.id !== id));
            const { error } = await supabase
                .from("words")
                .delete()
                .eq("id", id);
            if (error) throw error;
            toast.success("Word removed from collection");
        } catch (err) {
            toast.error("Failed to delete word");
            loadWords();
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
        return words.filter((w) => {
            const matchesSearch =
                w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
                w.definition
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                (w.source &&
                    w.source.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCategory =
                selectedCategory === "All" || w.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [words, searchQuery, selectedCategory]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground animate-pulse text-sm">
                    Loading...
                </p>
            </div>
        );
    }

    if (!user) return null;

    return (
        <main className="min-h-screen bg-background pb-16">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b">
                <div className="max-w-4xl mx-auto p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">
                                Leword
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                {words.length}{" "}
                                {words.length === 1 ? "word" : "words"}{" "}
                                collected
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <FlashcardModal
                            words={words}
                            onToggleMastered={handleToggleMastered}
                        />
                        <AddWordDialog onWordAdded={loadWords} />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => signOut()}
                            title="Sign Out"
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
                {/* Habit Stats Tracker */}
                <HabitStats words={words} />

                {/* Word of the Day Hero */}
                <WordOfTheDay words={words} />

                {/* Search & Category Filter Bar */}
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by word, definition, or movie/book..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 bg-muted/30"
                        />
                    </div>

                    {categories.length > 1 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0 mr-1" />
                            {categories.map((cat) => (
                                <Badge
                                    key={cat}
                                    variant={
                                        selectedCategory === cat
                                            ? "default"
                                            : "secondary"
                                    }
                                    onClick={() => setSelectedCategory(cat)}
                                    className="cursor-pointer text-xs font-medium px-3 py-1 transition-all shrink-0 hover:opacity-80"
                                >
                                    {cat}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* Word Feed Grid */}
                {fetchingWords ? (
                    <div className="text-center py-16 text-muted-foreground text-sm">
                        Fetching your words...
                    </div>
                ) : filteredWords.length === 0 ? (
                    <div className="text-center py-16 border border-dashed rounded-xl space-y-3 bg-muted/10">
                        <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/60" />
                        <p className="font-semibold text-base">
                            {searchQuery
                                ? "No matching words found"
                                : "No words in your lexicon yet"}
                        </p>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                            {searchQuery
                                ? "Try searching for a different keyword."
                                : "Add words you encounter while watching movies or reading."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredWords.map((item) => (
                            <WordCard
                                key={item.id}
                                word={item}
                                onToggleMastered={handleToggleMastered}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
