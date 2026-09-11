import localFont from "next/font/local";

/**
 * Lufga — the storefront typeface.
 *
 * These point at `lufga-clean/`, NOT at the `Demo_Fonts/` originals, and that
 * matters. The Fontspring DEMO cuts substitute a "DEMO" watermark logo for 28
 * codepoints — verified by hashing the CFF charstrings, where all 28 come back
 * byte-identical in every weight:
 *
 *     ! " # $ % & ' ( ) * + - / 4 < = > @ [ \ ] ^ _ ` { | } ~
 *
 * Rendering those was the bug: apostrophes, hyphens, slashes and the digit 4
 * all came out as a logo. The files in `lufga-clean/` are the same outlines
 * with those 28 entries removed from the `cmap`, so the browser sees a family
 * that genuinely does not cover them and falls back per-character to Schibsted
 * Grotesk via `--font-sans`. That is a font-level fix on purpose: the CSS-level
 * one (`unicode-range`) does not survive the build, because Turbopack's
 * Lightning CSS pass rewrites `U+0020` to `U20` and browsers then discard the
 * descriptor and use the font for everything — watermarks and all.
 *
 * Licensed cuts with full coverage make all of this go away: drop them in,
 * point `src` at them, delete `lufga-clean/`.
 *
 * Only the weights the app actually uses are declared. `font-light` (300)
 * through `font-bold` (700) covers every `font-*` utility in app/ and
 * components/; there is no `font-extrabold` or `font-black` anywhere. Italic
 * ships at 400 only, for the same reason.
 */
export const lufga = localFont({
  src: [
    { path: "./lufga-clean/lufga-light.otf", weight: "300", style: "normal" },
    { path: "./lufga-clean/lufga-regular.otf", weight: "400", style: "normal" },
    { path: "./lufga-clean/lufga-italic.otf", weight: "400", style: "italic" },
    { path: "./lufga-clean/lufga-medium.otf", weight: "500", style: "normal" },
    { path: "./lufga-clean/lufga-semibold.otf", weight: "600", style: "normal" },
    { path: "./lufga-clean/lufga-bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-lufga",
  display: "swap",
  /* Not a micro-optimisation — this one is structural.
     Left on, next/font appends a metric-adjusted `lufga Fallback` face to the
     family, so `--font-lufga` resolves to `"lufga", "lufga Fallback"` and that
     synthetic face lands BETWEEN Lufga and Schibsted in the chain. It is a
     local system font (Arial-class) with override metrics, and it claims every
     codepoint — including all 28 the cmap strip just removed. Every apostrophe
     and hyphen would be caught by it and never reach the Schibsted entry that
     exists precisely to catch them. */
  adjustFontFallback: false,
});
