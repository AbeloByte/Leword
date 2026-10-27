"use client";

import { useEffect, useRef } from "react";

const POSITIONS = ["top-left", "top-center", "top-right"];

/** A front-facing peek that moves to a fresh spot on each interaction. */
export function ButtonParrot() {
    const artRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const peek = artRef.current?.parentElement;
        const button = peek?.closest(".parrot-button");
        if (!peek || !button) return;

        const choosePosition = () => {
            const options = POSITIONS.filter(position => position !== peek.dataset.position);
            peek.dataset.position = options[Math.floor(Math.random() * options.length)];
        };
        button.addEventListener("pointerenter", choosePosition);
        button.addEventListener("focus", choosePosition);
        return () => {
            button.removeEventListener("pointerenter", choosePosition);
            button.removeEventListener("focus", choosePosition);
        };
    }, []);

    return (
        <svg ref={artRef} className="button-parrot-art" viewBox="0 0 48 48" width="42" height="42" aria-hidden="true">
            <path d="M12 43V28a12 12 0 0 1 24 0v15" fill="var(--accent-ink)" />
            <path d="M17 41V29a7 7 0 0 1 14 0v12" fill="var(--primary)" />
            <path d="M19 10 17 3l7 5 5-6 1 10" fill="var(--accent-ink)" />
            <ellipse cx="24" cy="21" rx="15" ry="16" fill="var(--primary)" />
            <ellipse cx="17" cy="21" rx="6" ry="7" fill="#fff9e9" />
            <ellipse cx="31" cy="21" rx="6" ry="7" fill="#fff9e9" />
            <circle cx="18" cy="22" r="2.5" fill="var(--ink-dark)" />
            <circle cx="30" cy="22" r="2.5" fill="var(--ink-dark)" />
            <circle cx="18.7" cy="21.2" r="0.8" fill="white" />
            <circle cx="30.7" cy="21.2" r="0.8" fill="white" />
            <path d="M19 27Q24 22 29 27L24 35Z" fill="var(--ink-dark)" />
            <path d="M24 25Q28 25 29 27L24 31Z" fill="#e8b564" />
            <path d="M9 39q5-4 10 0v5H9Zm20 0q5-4 10 0v5H29Z" fill="var(--accent-ink)" />
            <path d="M12 41v3m4-3v3m16-3v3m4-3v3" stroke="var(--ink-dark)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}
