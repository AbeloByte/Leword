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

/* ------------------------------------------------------------------ *
 * Pronunciation
 *
 * A real human recording from the Free Dictionary API comes first: it
 * sounds the same on every device, unlike the browser's voices. Words it
 * has no recording for -- rarer words, phrases, slang -- fall back to the
 * browser voice, which never goes down.
 * ------------------------------------------------------------------ */

/** Recording URL per word, or null when the API has none. Network failures
 *  are not cached, so a flaky connection does not lose a word for good. */
const recordingCache = new Map<string, string | null>();

let activeAudio: HTMLAudioElement | null = null;
/** Bumped on every speakWord call, so a lookup that resolves after the user
 *  has already pressed play on another word does not start talking. */
let speakToken = 0;

/** Single words, allowing inner hyphens and apostrophes ("well-being",
 *  "o'clock"). Anything else goes straight to the browser voice. */
const SINGLE_WORD = /^[a-z]+(?:['-][a-z]+)*$/;

async function fetchRecording(word: string): Promise<string | null> {
    if (recordingCache.has(word)) return recordingCache.get(word) ?? null;

    try {
        const response = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
            // Better a quick browser voice than a long silence.
            { signal: AbortSignal.timeout(2500) },
        );
        if (response.status === 404) {
            recordingCache.set(word, null);
            return null;
        }
        if (!response.ok) return null;

        const entries: {
            phonetics?: { audio?: string; sourceUrl?: string }[];
        }[] = await response.json();
        const recorded = entries
            .flatMap((entry) => entry.phonetics ?? [])
            .filter((phonetic) => !!phonetic.audio);
        // Files are named like "word-us.mp3"; prefer US, then UK, then any.
        const pick =
            recorded.find((p) => p.audio!.includes("-us.")) ??
            recorded.find((p) => p.audio!.includes("-uk.")) ??
            recorded[0];
        if (!pick) {
            recordingCache.set(word, null);
            return null;
        }

        // The API's own media host is unreliable (it has been answering 502),
        // but every recording is a Wikimedia Commons file the entry links to.
        // Play Commons' copy when it can be found, the API's otherwise.
        const fallback = pick.audio!.startsWith("//")
            ? `https:${pick.audio}`
            : pick.audio!;
        const url = (await commonsMp3(pick.sourceUrl)) ?? fallback;

        recordingCache.set(word, url);
        return url;
    } catch {
        return null;
    }
}

/** The MP3 rendition of a Commons file, from the `curid` in its source URL.
 *  Commons stores these as Ogg, which older Safari cannot play, so the MP3
 *  transcode is preferred, then the original. */
async function commonsMp3(sourceUrl?: string): Promise<string | null> {
    const pageId = sourceUrl?.match(/[?&]curid=(\d+)/)?.[1];
    if (!pageId) return null;

    try {
        const response = await fetch(
            `https://commons.wikimedia.org/w/api.php?action=query&pageids=${pageId}&prop=imageinfo|videoinfo&iiprop=url&viprop=derivatives&format=json&origin=*`,
            { signal: AbortSignal.timeout(2500) },
        );
        if (!response.ok) return null;

        const data = await response.json();
        const page = data?.query?.pages?.[pageId];
        const derivatives: { src: string; type: string }[] =
            page?.videoinfo?.[0]?.derivatives ?? [];
        return (
            derivatives.find((d) => d.type === "audio/mpeg")?.src ??
            page?.imageinfo?.[0]?.url ??
            null
        );
    } catch {
        return null;
    }
}

function stopSpeaking() {
    window.clearTimeout(failsafeTimer);
    activeUtterance = null;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (activeAudio) {
        activeAudio.pause();
        activeAudio = null;
    }
    setSpeaking(null);
}

function playRecording(url: string, text: string, token: number) {
    const audio = new Audio(url);

    const release = () => {
        if (activeAudio !== audio) return;
        window.clearTimeout(failsafeTimer);
        activeAudio = null;
        setSpeaking(null);
    };

    audio.onplaying = () => {
        if (activeAudio === audio) setSpeaking(text);
    };
    audio.onended = release;
    audio.onerror = () => {
        release();
        if (token === speakToken) speakWithBrowser(text);
    };

    activeAudio = audio;
    audio.play().catch(() => {
        // Blocked autoplay or a dead file: the browser voice still answers.
        release();
        if (token === speakToken) speakWithBrowser(text);
    });

    failsafeTimer = window.setTimeout(release, 8000);
}

export function speakWord(text: string) {
    if (typeof window === "undefined") return;

    stopSpeaking();
    const token = ++speakToken;

    const word = text.trim().toLowerCase();
    if (!SINGLE_WORD.test(word) || recordingCache.get(word) === null) {
        speakWithBrowser(text);
        return;
    }

    const cached = recordingCache.get(word);
    if (cached) {
        playRecording(cached, text, token);
        return;
    }

    void fetchRecording(word).then((url) => {
        if (token !== speakToken) return;
        if (url) playRecording(url, text, token);
        else speakWithBrowser(text);
    });
}

// Native browser voice: the fallback that never goes down.
function speakWithBrowser(text: string) {
    if (!("speechSynthesis" in window)) return;

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

// High-uptime definition lookup via Datamuse
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
