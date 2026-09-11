// lib/dictionary.ts

export interface DictionaryResult {
    word: string;
    phonetic?: string;
    partOfSpeech?: string;
    definition: string;
}

/* ------------------------------------------------------------------ *
 * Speech state
 *
 * speakWord used to be fire-and-forget, so nothing in the UI could tell
 * whether the browser was mid-utterance. The parrot mascot needs that, so
 * the module keeps a tiny observable store: which word is being spoken, or
 * null. Subscribers are plain callbacks, shaped for useSyncExternalStore.
 * ------------------------------------------------------------------ */

const listeners = new Set<() => void>();
let speakingWord: string | null = null;

/** The utterance we actually care about. cancel() can fire `onend` for a
 *  previous utterance *after* the next one starts, so every callback checks
 *  that it still owns the slot before clearing it. */
let activeUtterance: SpeechSynthesisUtterance | null = null;
let failsafeTimer: number | undefined;

function setSpeaking(word: string | null) {
    if (speakingWord === word) return;
    speakingWord = word;
    listeners.forEach((notify) => notify());
}

export function subscribeToSpeech(notify: () => void): () => void {
    listeners.add(notify);
    return () => {
        listeners.delete(notify);
    };
}

export function getSpeakingWord(): string | null {
    return speakingWord;
}

/** Server snapshot for useSyncExternalStore: nothing is ever speaking on the
 *  server, and this must be a stable reference. */
export function getSpeakingWordServer(): string | null {
    return null;
}

// 1. Native Browser Audio Pronunciation (Never goes down, zero latency)
export function speakWord(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.clearTimeout(failsafeTimer);
    activeUtterance = null;
    window.speechSynthesis.cancel(); // Stop any existing speech
    setSpeaking(null);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85; // Slightly slower for crisp educational pronunciation

    const release = () => {
        if (activeUtterance !== utterance) return;
        window.clearTimeout(failsafeTimer);
        activeUtterance = null;
        setSpeaking(null);
    };

    utterance.onstart = () => {
        if (activeUtterance !== utterance) return;
        setSpeaking(text);
    };
    utterance.onend = release;
    utterance.onerror = release;

    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);

    // Some browsers drop `onend` entirely for short utterances. Without this
    // the parrot would keep talking forever. ~180ms per character, floored.
    failsafeTimer = window.setTimeout(release, 2000 + text.length * 180);
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
