"use client";

import React from "react";
import { Parrot } from "@/components/Parrot";

interface LogoMarkProps {
    /** Tile edge in px. The parrot is drawn slightly inset from it. */
    size?: number;
    /**
     * Render for a dark ground (the auth photo panel). Swaps the tint tile
     * for a light one and pins the parrot's dark green to its on-dark value.
     */
    onDark?: boolean;
    className?: string;
    /** Describes the mark to assistive tech. Omit to mark it decorative. */
    label?: string;
}

/**
 * The Leword mark: the mascot on a soft tinted tile.
 *
 * The tile keeps the old lockup's geometry -- a 36px rounded square ahead of
 * the wordmark -- while the bird itself is the real parrot rather than a
 * generic glyph. It is a tint rather than a solid fill because the parrot is
 * already drawn in `--primary`, and primary-on-primary reads as a smudge.
 */
export function LogoMark({
    size = 36,
    onDark = false,
    className,
    label,
}: LogoMarkProps) {
    return (
        <span
            className={`flex shrink-0 items-center justify-center rounded-xl ${
                onDark ? "bg-white/15" : "bg-primary/10"
            } ${className ?? ""}`}
            style={{ width: size, height: size }}
        >
            <Parrot
                state="idle"
                size={Math.round(size * 0.86)}
                onDark={onDark}
                label={label}
            />
        </span>
    );
}
