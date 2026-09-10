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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Search, Volume2, Loader2, Sparkles, Wand2 } from "lucide-react";

interface AddWordDialogProps {
    onWordAdded?: () => void;
}

export function AddWordDialog({ onWordAdded }: AddWordDialogProps) {
    const { user } = useAuth();
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

    // 1. Standard Dictionary Lookup
    const handleStandardLookup = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setSearching(true);
        const result = await lookupWord(query);
        setSearching(false);

        if (!result) {
            toast.info(
                "Not found in standard dictionary. Try the 'AI Explain' button!",
            );
            setDictData({
                word: query.trim(),
                definition: "",
                partOfSpeech: "custom",
            });
            return;
        }

        setDictData(result);
        toast.success("Standard definition loaded!");
    };

    // 2. Gemini AI Smart Explanation
    const handleAiLookup = async () => {
        if (!query.trim()) {
            toast.error("Please enter a word first");
            return;
        }

        setAiLoading(true);

        try {
            const res = await fetch("/api/ai/explain", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    word: query.trim(),
                    context: contextSentence.trim(),
                    source: source.trim(),
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "AI request failed");
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

            toast.success("AI generated explanation and memory trick!");
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to get AI explanation");
        } finally {
            setAiLoading(false);
        }
    };

    // 3. Save to Supabase
    const handleSave = async () => {
        if (!user) {
            toast.error("You must be logged in to save words");
            return;
        }

        if (!dictData?.word || !dictData?.definition) {
            toast.error("Please provide both the word and its definition");
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

            toast.success(`"${dictData.word}" saved to your lexicon!`);

            // Reset
            setQuery("");
            setDictData(null);
            setMnemonic("");
            setContextSentence("");
            setSource("");
            setCategory("General");
            setOpen(false);

            if (onWordAdded) onWordAdded();
        } catch (error: any) {
            toast.error(error.message || "Failed to save word");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 shadow-sm font-medium">
                    <Plus className="h-4 w-4" />
                    Add Word
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Capture New Word
                    </DialogTitle>
                    <DialogDescription>
                        Type a word you saw or heard. Use AI to get contextual
                        definitions and memory tricks.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {/* Word Search Bar with AI action */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="e.g. catharsis, red-handed..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            disabled={searching || aiLoading || saving}
                            autoFocus
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleStandardLookup}
                            disabled={searching || aiLoading || !query.trim()}
                            title="Quick dictionary lookup"
                        >
                            {searching ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                        </Button>
                        <Button
                            type="button"
                            className="gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-sm"
                            onClick={handleAiLookup}
                            disabled={searching || aiLoading || !query.trim()}
                        >
                            {aiLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Wand2 className="h-4 w-4" />
                                    AI Explain
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Source & Context Sentence */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="source" className="text-xs">
                                Source (Movie/Book)
                            </Label>
                            <Input
                                id="source"
                                placeholder="e.g. Oppenheimer"
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                className="text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="category" className="text-xs">
                                Category
                            </Label>
                            <Input
                                id="category"
                                placeholder="e.g. Cinema, Tech"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="text-xs"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="context" className="text-xs">
                            Context sentence where you heard it
                        </Label>
                        <Input
                            id="context"
                            placeholder="e.g. The character felt an overwhelming sense of catharsis."
                            value={contextSentence}
                            onChange={(e) => setContextSentence(e.target.value)}
                            className="text-xs"
                        />
                    </div>

                    {/* Auto-filled Preview Area */}
                    {dictData && (
                        <div className="rounded-lg border bg-muted/40 p-3.5 space-y-2.5 text-sm animate-in fade-in-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-base capitalize">
                                        {dictData.word}
                                    </span>
                                    {dictData.partOfSpeech && (
                                        <span className="text-xs italic bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
                                            {dictData.partOfSpeech}
                                        </span>
                                    )}
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 gap-1 text-xs"
                                    onClick={() => speakWord(dictData.word)}
                                >
                                    <Volume2 className="h-3.5 w-3.5" />
                                    Listen
                                </Button>
                            </div>

                            <div>
                                <Label className="text-xs text-muted-foreground">
                                    Definition
                                </Label>
                                <Input
                                    value={dictData.definition}
                                    onChange={(e) =>
                                        setDictData({
                                            ...dictData,
                                            definition: e.target.value,
                                        })
                                    }
                                    className="mt-1 bg-background text-xs"
                                />
                            </div>

                            {mnemonic && (
                                <div className="pt-1">
                                    <Label className="text-xs text-violet-600 dark:text-violet-400 font-semibold flex items-center gap-1">
                                        <Sparkles className="h-3 w-3" /> Memory
                                        Trick (Mnemonic)
                                    </Label>
                                    <p className="text-xs italic text-muted-foreground mt-0.5 bg-background/60 p-2 rounded border border-violet-200/50">
                                        {mnemonic}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <Button
                        onClick={handleSave}
                        disabled={
                            saving || !dictData?.word || !dictData?.definition
                        }
                        className="w-full mt-2 font-medium"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving to Lexicon...
                            </>
                        ) : (
                            "Save Word"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
