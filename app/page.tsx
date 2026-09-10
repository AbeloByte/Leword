"use client";

import { useState } from "react";
import { lookupWord, DictionaryResult } from "@/lib/dictionary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TestPage() {
    const [query, setQuery] = useState("");
    const [result, setResult] = useState<DictionaryResult | null>(null);
    const [loading, setLoading] = useState(false);

    const handleTest = async () => {
        setLoading(true);
        const data = await lookupWord(query);
        setResult(data);
        setLoading(false);
    };

    return (
        <div className="p-8 max-w-md mx-auto space-y-4">
            <h1 className="text-xl font-bold">Dictionary Service Test</h1>
            <div className="flex gap-2">
                <Input
                    placeholder="Type a word (e.g. serendipity)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <Button onClick={handleTest} disabled={loading}>
                    {loading ? "Searching..." : "Lookup"}
                </Button>
            </div>

            {result && (
                <pre className="p-4 bg-muted rounded-md text-xs overflow-auto">
                    {JSON.stringify(result, null, 2)}
                </pre>
            )}
        </div>
    );
}
