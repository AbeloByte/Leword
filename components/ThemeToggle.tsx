"use client";

import React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

/**
 * Toggles between light and dark.
 *
 * Both icons are always rendered and swapped by the `dark:` variant rather than
 * by a mounted flag. next-themes sets the class on <html> before first paint, so
 * the correct icon is right from the first frame with no hydration mismatch and
 * no post-mount flicker.
 */
export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle light or dark theme"
            title="Toggle theme"
        >
            <Moon className="h-4.5 w-4.5 dark:hidden" />
            <Sun className="hidden h-4.5 w-4.5 dark:block" />
        </Button>
    );
}
