export interface DictionaryResult {
    word: string;
    phonetic?: string;
    partOfSpeech?: string;
    definition: string;
    audioUrl?: string;
    example?: string;
}

export async function lookupWord(
    term: string,
): Promise<DictionaryResult | null> {
    const cleanTerm = term.trim().toLowerCase();
    if (!cleanTerm) return null;

    try {
        const response = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanTerm)}`,
        );

        if (!response.ok) {
            // 404 means the word wasn't found in the dictionary
            return null;
        }

        const data = await response.json();
        const entry = data[0];

        // 1. Extract the best phonetic audio (skip items without an mp3)
        let audioUrl: string | undefined;
        if (entry.phonetics && Array.isArray(entry.phonetics)) {
            const validAudio = entry.phonetics.find(
                (p: { audio?: string }) => p.audio && p.audio.trim().length > 0,
            );
            if (validAudio) {
                audioUrl = validAudio.audio;
            }
        }

        // 2. Extract the primary meaning and first definition
        const firstMeaning = entry.meanings?.[0];
        const firstDefinition = firstMeaning?.definitions?.[0];

        return {
            word: entry.word,
            phonetic: entry.phonetic || entry.phonetics?.[0]?.text,
            partOfSpeech: firstMeaning?.partOfSpeech,
            definition: firstDefinition?.definition || "No definition found.",
            example: firstDefinition?.example,
            audioUrl: audioUrl,
        };
    } catch (error) {
        console.error("Dictionary lookup failed:", error);
        return null;
    }
}
