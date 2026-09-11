"use client";

import React, { useSyncExternalStore } from "react";
import {
    getSpeakingWord,
    getSpeakingWordServer,
    subscribeToSpeech,
} from "@/lib/dictionary";

/**
 * Returns the word the browser is currently pronouncing, or null.
 * useSyncExternalStore rather than useEffect + setState: no cascading render,
 * and it stays correct through concurrent re-renders.
 */
export function useSpeakingWord(): string | null {
    return useSyncExternalStore(
        subscribeToSpeech,
        getSpeakingWord,
        getSpeakingWordServer,
    );
}

export type ParrotState =
    /** Breathing, blinking, occasional crest twitch. */
    | "idle"
    /** Beak working, head bobbing -- mirrors speechSynthesis. */
    | "talking"
    /** Wing flap and a hop. For mastering a word. */
    | "cheer"
    /** Eyes closed, slow breath. For empty and loading states. */
    | "rest";

interface ParrotProps {
    state?: ParrotState;
    /** Rendered size in px. The art is a 64-unit square. */
    size?: number;
    /** Draws a perch bar and feet gripping it. */
    perch?: boolean;
    className?: string;
    /** Describes the mascot to assistive tech. Omit to mark it decorative. */
    label?: string;
    /**
     * Render for a dark ground (a photo, a scrim). --accent-ink is a deep
     * green in the light theme, which disappears against dark; this pins it to
     * the light-on-dark value regardless of the active theme.
     */
    onDark?: boolean;
}

/**
 * The Leword parrot.
 *
 * Flat geometric art built from theme tokens, so it recolours with the design
 * system instead of shipping fixed hex values. All motion is CSS keyframes
 * driven by the `data-state` attribute -- the global prefers-reduced-motion
 * block flattens every one of them, and the bird stays perfectly legible
 * standing still.
 */
export function Parrot({
    state = "idle",
    size = 64,
    perch = false,
    className,
    label,
    onDark = false,
}: ParrotProps) {
    const resting = state === "rest";

    return (
        <svg
            viewBox="0 0 64 64"
            width={size}
            height={size}
            className={`parrot ${className ?? ""}`}
            data-state={state}
            style={
                onDark
                    ? ({
                          "--accent-ink": "oklch(0.78 0.15 148)",
                      } as React.CSSProperties)
                    : undefined
            }
            role={label ? "img" : undefined}
            aria-label={label}
            aria-hidden={label ? undefined : true}
        >
            {/* Whole-bird motion: breathing, bobbing, hopping. */}
            <g className="parrot-body">
                {/* Tail feathers, layered behind everything. */}
                <g className="parrot-tail">
                    <path
                        d="M24 44 L10 60 L18 60 L28 50 Z"
                        fill="var(--accent-ink)"
                    />
                    <path
                        d="M26 45 L16 60 L24 60 L31 51 Z"
                        fill="var(--primary)"
                    />
                </g>

                {/* Perch and feet. */}
                {perch && (
                    <>
                        <rect
                            x="8"
                            y="55"
                            width="48"
                            height="3"
                            rx="1.5"
                            fill="var(--accent-ink)"
                            opacity="0.45"
                        />
                        <path
                            d="M32 50 L32 56 M36 50 L36 56"
                            stroke="var(--accent-ink)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />
                    </>
                )}

                {/* Body. */}
                <ellipse
                    cx="34"
                    cy="38"
                    rx="13"
                    ry="14"
                    fill="var(--primary)"
                />

                {/* Wing -- the part that flaps. */}
                <g className="parrot-wing">
                    <path
                        d="M30 30 C24 32 22 40 26 46 C31 46 35 41 35 34 Z"
                        fill="var(--accent-ink)"
                    />
                </g>

                {/* Head group: tilts and bobs independently of the body. */}
                <g className="parrot-head">
                    {/* Crest feathers. */}
                    <g className="parrot-crest">
                        <path
                            d="M30 14 L27 5 L33 11 Z"
                            fill="var(--accent-ink)"
                        />
                        <path
                            d="M34 12 L34 3 L39 11 Z"
                            fill="var(--primary)"
                        />
                    </g>

                    <circle cx="36" cy="20" r="12" fill="var(--primary)" />

                    {/* Cheek patch, for a bit of parrot face structure. */}
                    <circle
                        cx="41"
                        cy="24"
                        r="3.5"
                        fill="var(--accent-ink)"
                        opacity="0.25"
                    />

                    {/* Eye. The lid scales down over the pupil to blink. */}
                    <circle cx="40" cy="17" r="4.5" fill="#fff" />
                    <circle cx="41" cy="17" r="2.2" fill="var(--ink-dark)" />
                    <g className="parrot-lid">
                        <circle
                            cx="40"
                            cy="17"
                            r="4.8"
                            fill="var(--primary)"
                        />
                    </g>
                    {resting && (
                        <path
                            d="M36.5 17.5 Q40 20 43.5 17.5"
                            stroke="var(--ink-dark)"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            fill="none"
                        />
                    )}

                    {/* Beak: fixed upper mandible, hinged lower one. */}
                    <path
                        d="M47 16 C53 17 54 22 49 25 C47 23 46 20 46 17 Z"
                        fill="var(--ink-dark)"
                    />
                    <g className="parrot-jaw">
                        <path
                            d="M47 24 C51 25 52 27 49 28.5 C47.5 27.5 47 26 47 24 Z"
                            fill="var(--ink-dark)"
                            opacity="0.85"
                        />
                    </g>
                </g>
            </g>
        </svg>
    );
}
