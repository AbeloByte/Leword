// lib/chirp.ts
//
// Plays a short parrot squawk when a flashcard is flipped.
//
// The file is decoded once into an AudioBuffer and replayed through Web Audio
// rather than with an <audio> element. That matters here: <audio> has tens of
// milliseconds of start latency and cannot overlap with itself, so flipping
// quickly would drop or clip sounds. A buffer source starts sample-accurate
// and any number can run at once.

/**
 * Drop your sound file here. Short is better -- under ~400ms, so it does not
 * outlast the card's flip animation.
 *
 * Free, licence-clean sources: pixabay.com/sound-effects (no attribution) or
 * freesound.org filtered to CC0.
 */
export const CHIRP_URL = "/sounds/parrot.mp3";

/** Trim a hot sample down; 1 = the file's own level. */
const VOLUME = 0.55;

let ctx: AudioContext | null = null;
let buffer: AudioBuffer | null = null;
let loading: Promise<AudioBuffer | null> | null = null;
let warned = false;

/** One shared context. Browsers cap how many a page may create. */
function audioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
    if (!Ctor) return null;

    if (!ctx) ctx = new Ctor();
    return ctx;
}

/**
 * Fetches and decodes the sample, once. Concurrent callers share the same
 * in-flight promise rather than each starting their own download.
 */
function load(context: AudioContext): Promise<AudioBuffer | null> {
    if (buffer) return Promise.resolve(buffer);
    if (loading) return loading;

    loading = (async () => {
        try {
            const res = await fetch(CHIRP_URL);
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            buffer = await context.decodeAudioData(await res.arrayBuffer());
            return buffer;
        } catch (err) {
            if (!warned) {
                warned = true;
                console.warn(
                    `[leword] No flip sound at ${CHIRP_URL}. ` +
                        "Add a short parrot squawk there to enable it.",
                    err,
                );
            }
            // Null out so a later call can retry (e.g. after the file is added
            // during development), but keep the warning to one line.
            loading = null;
            return null;
        }
    })();

    return loading;
}

/**
 * Warms the cache so the very first flip is not silent while the file
 * downloads. Call when the review dialog opens.
 */
export function preloadChirp() {
    if (!isChirpEnabled()) return;
    const context = audioContext();
    if (context) void load(context);
}

/**
 * Plays the squawk. Safe to call on every flip: never throws, and silently
 * does nothing if the sound is muted or the file is missing.
 *
 * The first call must come from a user gesture, or the browser's autoplay
 * policy leaves the context suspended.
 */
export function playChirp() {
    if (!isChirpEnabled()) return;

    const context = audioContext();
    if (!context) return;

    // resume() needs the gesture we are already inside.
    if (context.state === "suspended") void context.resume();

    void load(context)
        .then((buf) => {
            if (!buf || !isChirpEnabled()) return;

            const source = context.createBufferSource();
            source.buffer = buf;

            const gain = context.createGain();
            gain.gain.value = VOLUME;

            source.connect(gain).connect(context.destination);
            source.start();
        })
        .catch(() => {
            // Audio is decoration; a failure must never break the flip.
        });
}

/* ------------------------------------------------------------------ *
 * Mute preference
 *
 * A sound on every flip needs an off switch. Kept here rather than in
 * component state so the setting survives closing the review dialog.
 * ------------------------------------------------------------------ */

const STORAGE_KEY = "leword:chirp";

/** Defaults to on. Any storage failure (private mode, blocked) reads as on. */
export function isChirpEnabled(): boolean {
    if (typeof window === "undefined") return true;
    try {
        return window.localStorage.getItem(STORAGE_KEY) !== "off";
    } catch {
        return true;
    }
}

export function setChirpEnabled(enabled: boolean) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
    } catch {
        // Preference simply will not persist; the in-page toggle still works.
    }
}
