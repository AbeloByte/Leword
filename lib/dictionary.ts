// lib/dictionary.ts

export interface DictionaryResult {
    word: string;
    phonetic?: string;
    partOfSpeech?: string;
    definition: string;
}

// 1. Native Browser Audio Pronunciation (Never goes down, zero latency)
export function speakWord(text: string) {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel(); // Stop any existing speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = 0.85; // Slightly slower for crisp educational pronunciation
        window.speechSynthesis.speak(utterance);
    }
}

// 2. High-uptime definition lookup via Datamuse
export async function lookupWord(
    term: string,
): Promise<DictionaryResult | null> {
    const cleanTerm = term.trim().toLowerCase();
    if (!cleanTerm) return null;

    try {
        // Request definition and part of speech metadata
        const response = await fetch(
            `https://api.datamuse.com/words?sp=${encodeURIComponent(cleanTerm)}&md=dp&max=1`,
        );

        if (!response.ok) return null;

        const data = await response.json();

        if (
            !data ||
            data.length === 0 ||
            !data[0].defs ||
            data[0].defs.length === 0
        ) {
            return null;
        }

        const item = data[0];
        // Datamuse formats defs like: "n\ta greeting or expression of goodwill"
        const rawDef = item.defs[0];
        const parts = rawDef.split("\t");

        let partOfSpeech = "noun";
        let definition = rawDef;

        if (parts.length > 1) {
            const code = parts[0];
            definition = parts[1];

            if (code === "n") partOfSpeech = "noun";
            else if (code === "v") partOfSpeech = "verb";
            else if (code === "adj") partOfSpeech = "adjective";
            else if (code === "adv") partOfSpeech = "adverb";
            else partOfSpeech = code;
        }

        return {
            word: item.word || cleanTerm,
            partOfSpeech,
            definition:
                definition.charAt(0).toUpperCase() + definition.slice(1),
        };
    } catch (error) {
        console.error("Datamuse lookup error:", error);
        return null;
    }
}
