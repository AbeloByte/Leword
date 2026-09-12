"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { lookupWord, speakWord, DictionaryResult } from "@/lib/dictionary";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Parrot, useSpeakingWord } from "@/components/Parrot";
import { toast } from "sonner";
import {
    Plus,
    Search,
    Loader2,
    Lightbulb,
    Wand2,
    Check,
} from "lucide-react";

interface AddWordDialogProps {
    onWordAdded?: () => void;
}

/** One tap instead of typing the same handful of categories every time. */
const QUICK_CATEGORIES = [
    "General",
    "Cinema",
    "Books",
    "Music",
    "Work",
    "Slang",
];

export function AddWordDialog({ onWordAdded }: AddWordDialogProps) {
    const { user, session } = useAuth();
    const [open, setOpen] = useState(false);

    // Search & Auto-lookup state
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [dictData, setDictData] = useState<DictionaryResult | null>(null);

    // User input states
    const [contextSentence, setContextSentence] = useState("");
    const [source, setSource] = useState("");
    const [category, setCategory] = useState("General");
    const [mnemonic, setMnemonic] = useState("");
    const [saving, setSaving] = useState(false);

    const speaking = useSpeakingWord();
    const busy = searching || aiLoading || saving;
    const canSave = Boolean(dictData?.word && dictData?.definition) && !saving;

    const resetForm = () => {
        setQuery("");
        setDictData(null);
        setMnemonic("");
        setContextSentence("");
        setSource("");
        setCategory("General");
    };

    // Clearing on close means reopening never shows the last word's leftovers.
    const handleOpenChange = (next: boolean) => {
        setOpen(next);
        if (!next) resetForm();
    };

    // 1. Standard Dictionary Lookup
    const handleStandardLookup = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setSearching(true);
        const result = await lookupWord(query);
        setSearching(false);

        if (!result) {
            toast.info(
                "Not in the dictionary. Try the Explain button instead.",
            );
            setDictData({
                word: query.trim(),
                definition: "",
                partOfSpeech: "custom",
            });
            return;
        }

        setDictData(result);
        toast.success("Definition loaded");
    };

    // 2. Smart explanation for the saved word
    const handleAiLookup = async () => {
        if (!query.trim()) {
            toast.error("Type a word first");
            return;
        }

        if (!session) {
            toast.error("You must be signed in to explain a word");
            return;
        }

        setAiLoading(true);

        try {
            const res = await fetch("/api/ai/explain", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    word: query.trim(),
                    context: contextSentence.trim(),
                    source: source.trim(),
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Lookup failed");
            }

            const data = await res.json();

            setDictData({
                word: data.word,
                partOfSpeech: data.partOfSpeech,
                definition: data.definition,
            });

            if (data.mnemonic) {
                setMnemonic(data.mnemonic);
            }

            toast.success("Added a definition and a memory trick");
        } catch (err) {
            console.error(err);
            toast.error(
                err instanceof Error && err.message
                    ? err.message
                    : "Could not explain that word",
            );
        } finally {
            setAiLoading(false);
        }
    };

    // 3. Save to Supabase
    const handleSave = async () => {
        if (!user) {
            toast.error("You must be signed in to save words");
            return;
        }

        if (!dictData?.word || !dictData?.definition) {
            toast.error("Add the word and what it means first");
            return;
        }

        setSaving(true);

        try {
            const { error } = await supabase.from("words").insert({
                user_id: user.id,
                word: dictData.word,
                part_of_speech: dictData.partOfSpeech || null,
                definition: dictData.definition,
                mnemonic: mnemonic.trim() || null,
                context_sentence: contextSentence.trim() || null,
                source: source.trim() || null,
                category: category.trim() || "General",
                is_mastered: false,
            });

            if (error) throw error;

            toast.success(`"${dictData.word}" saved`);
            resetForm();
            setOpen(false);

            if (onWordAdded) onWordAdded();
        } catch (error) {
            toast.error(
                error instanceof Error && error.message
                    ? error.message
                    : "Could not save that word",
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
                render={
                    <Button
                        className="gap-2 px-2.5 font-medium sm:px-4"
                        aria-label="Add word"
                    />
                }
            >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Word</span>
            </DialogTrigger>

            {/* p-0 + an internal scroll region: the header and the save bar
                stay pinned while a long form scrolls between them. */}
            <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-135">
                <DialogHeader className="shrink-0 border-b px-5 py-4 pr-12">
                    <DialogTitle className="text-lg">Add a word</DialogTitle>
                    <DialogDescription className="text-sm">
                        Type a word you heard or read, and Leword will fill in
                        the rest.
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5">
                    {/* ---- Step 1: the word ---- */}
                    <section className="space-y-2.5">
                        <Label
                            htmlFor="word"
                            className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                        >
                            The word
                        </Label>

                        <form onSubmit={handleStandardLookup}>
                            <Input
                                id="word"
                                placeholder="catharsis"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                disabled={busy}
                                autoFocus
                                autoComplete="off"
                                className="h-12 px-4 text-lg font-semibold"
                            />
                        </form>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                className="h-10 flex-1 gap-1.5 font-semibold"
                                onClick={handleAiLookup}
                                disabled={busy || !query.trim()}
                            >
                                {aiLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Wand2 className="h-4 w-4" />
                                )}
                                {aiLoading ? "Working…" : "Explain this word"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-10 gap-1.5 bg-card"
                                onClick={() => handleStandardLookup()}
                                disabled={busy || !query.trim()}
                                title="Look it up in the dictionary instead"
                            >
                                {searching ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                                <span className="hidden sm:inline">
                                    Dictionary
                                </span>
                            </Button>
                        </div>
                    </section>

                    {/* ---- Step 2: where it came from ---- */}
                    <section className="space-y-3">
                        <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            Where you found it
                            <span className="ml-1.5 font-normal normal-case opacity-70">
                                optional, but it makes the explanation better
                            </span>
                        </Label>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Input
                                id="source"
                                placeholder="Film, book or show"
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                className="h-10"
                                aria-label="Film, book or show"
                            />
                            <Input
                                id="category"
                                placeholder="Category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="h-10"
                                aria-label="Category"
                            />
                        </div>

                        {/* Tap instead of typing the usual few. */}
                        <div className="flex flex-wrap gap-1.5">
                            {QUICK_CATEGORIES.map((c) => {
                                const active = category === c;
                                return (
                                    <Badge
                                        key={c}
                                        render={
                                            <button
                                                type="button"
                                                aria-pressed={active}
                                            />
                                        }
                                        variant={
                                            active ? "default" : "secondary"
                                        }
                                        onClick={() => setCategory(c)}
                                        className="h-8 cursor-pointer px-3 text-xs"
                                    >
                                        {c}
                                    </Badge>
                                );
                            })}
                        </div>

                        <Textarea
                            id="context"
                            placeholder="The sentence you heard it in…"
                            value={contextSentence}
                            onChange={(e) => setContextSentence(e.target.value)}
                            rows={2}
                            aria-label="The sentence you heard it in"
                        />
                    </section>

                    {/* ---- Step 3: the result ---- */}
                    {dictData ? (
                        <section className="animate-in fade-in-50 slide-in-from-bottom-1 space-y-3 rounded-xl border bg-muted/40 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                    <h3 className="text-xl font-bold capitalize">
                                        {dictData.word}
                                    </h3>
                                    {dictData.partOfSpeech && (
                                        <Badge
                                            variant="secondary"
                                            className="text-[11px] capitalize"
                                        >
                                            {dictData.partOfSpeech}
                                        </Badge>
                                    )}
                                </div>

                                {/* The parrot doubles as the pronounce button
                                    here, same as everywhere else. */}
                                <button
                                    type="button"
                                    onClick={() => speakWord(dictData.word)}
                                    aria-label={`Hear ${dictData.word} pronounced`}
                                    title="Tap the parrot to hear it"
                                    className="-m-1 shrink-0 cursor-pointer rounded-lg p-1 transition-transform hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                                >
                                    <Parrot
                                        size={40}
                                        state={
                                            speaking === dictData.word
                                                ? "talking"
                                                : "idle"
                                        }
                                    />
                                </button>
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="definition"
                                    className="text-xs text-muted-foreground"
                                >
                                    What it means
                                </Label>
                                <Textarea
                                    id="definition"
                                    value={dictData.definition}
                                    onChange={(e) =>
                                        setDictData({
                                            ...dictData,
                                            definition: e.target.value,
                                        })
                                    }
                                    placeholder="Write what it means, in your own words"
                                    rows={2}
                                    className="bg-background"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="mnemonic"
                                    className="flex items-center gap-1 text-xs text-muted-foreground"
                                >
                                    <Lightbulb className="h-3 w-3 text-accent-ink" />
                                    Memory trick
                                </Label>
                                <Textarea
                                    id="mnemonic"
                                    value={mnemonic}
                                    onChange={(e) => setMnemonic(e.target.value)}
                                    placeholder="Something that helps it stick"
                                    rows={2}
                                    className="bg-background"
                                />
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Everything here is editable — change anything
                                before you save.
                            </p>
                        </section>
                    ) : (
                        /* Idle state: says what happens next instead of
                           leaving a blank gap above a dead button. */
                        <section className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-8 text-center">
                            <Parrot state="rest" size={72} perch />
                            <p className="text-sm font-medium">
                                Nothing to save yet
                            </p>
                            <p className="max-w-[15rem] text-xs text-muted-foreground">
                                Type a word above and press Explain. You can
                                edit whatever comes back.
                            </p>
                        </section>
                    )}
                </div>

                {/* Pinned action bar */}
                <div className="flex shrink-0 items-center gap-3 border-t bg-card px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                    <p className="flex-1 text-xs text-muted-foreground">
                        {canSave
                            ? "Looks good — save it to your words."
                            : "Add a word and what it means to save."}
                    </p>
                    <Button
                        onClick={handleSave}
                        disabled={!canSave}
                        className="h-10 gap-1.5 px-5 font-semibold"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving…
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4" />
                                Save word
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
