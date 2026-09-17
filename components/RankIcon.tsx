"use client";

import {
    BookOpen,
    Crown,
    GraduationCap,
    PenLine,
    Sprout,
    Zap,
    type LucideIcon,
} from "lucide-react";
import { RankIconKey } from "@/lib/xp";

/**
 * The glyph for each rank.
 *
 * The ladder itself lives in lib/xp.ts and names its icon with a key, the same
 * way the avatar presets do -- that keeps the rank data free of React so it can
 * be imported by the root layout without dragging icon components into the
 * server bundle.
 */
const RANK_ICONS: Record<RankIconKey, LucideIcon> = {
    sprout: Sprout,
    book: BookOpen,
    pen: PenLine,
    grad: GraduationCap,
    crown: Crown,
    bolt: Zap,
};

interface RankIconProps {
    icon: RankIconKey;
    className?: string;
}

export function RankIcon({ icon, className }: RankIconProps) {
    const Icon = RANK_ICONS[icon];
    return <Icon className={className} aria-hidden />;
}
