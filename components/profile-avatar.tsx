"use client";

import {
    Bird,
    BookOpen,
    Feather,
    GraduationCap,
    Library,
    PenLine,
    Quote,
    type LucideIcon,
} from "lucide-react";

/**
 * Avatar presets are Lucide glyphs rather than remotely generated images.
 * They are stored in `avatar_url` as "icon:<key>" so the existing Supabase
 * field keeps working, and anything else is still treated as a plain URL.
 */
const AVATAR_ICONS: Record<string, LucideIcon> = {
    parrot: Bird,
    book: BookOpen,
    feather: Feather,
    quote: Quote,
    pen: PenLine,
    grad: GraduationCap,
    library: Library,
};

const AVATAR_ICON_PREFIX = "icon:";

export const AVATAR_PRESETS = Object.keys(AVATAR_ICONS).map(
    (key) => `${AVATAR_ICON_PREFIX}${key}`,
);

/** True when the stored value names a preset glyph rather than an image URL. */
export function isAvatarIcon(value: string | undefined | null): boolean {
    if (!value?.startsWith(AVATAR_ICON_PREFIX)) return false;
    return value.slice(AVATAR_ICON_PREFIX.length) in AVATAR_ICONS;
}

/** Human-readable name for a preset, used for the picker's accessible label. */
export function avatarIconName(value: string): string {
    return value.slice(AVATAR_ICON_PREFIX.length);
}

interface AvatarGlyphProps {
    value: string | undefined | null;
    className?: string;
}

/**
 * Renders the glyph for an "icon:" avatar value. Kept as a component (rather
 * than a function returning an icon) so nothing looks like a component being
 * constructed during render.
 */
export function AvatarGlyph({ value, className }: AvatarGlyphProps) {
    if (!isAvatarIcon(value)) return null;
    const Icon = AVATAR_ICONS[avatarIconName(value as string)];
    return <Icon className={className} />;
}
