// lib/rate-limit.ts
//
// Fixed-window, in-memory rate limiter keyed by user id. This lives in the
// process, so it resets on a cold start and is not shared between serverless
// instances — it is a cost guardrail against a single abusive client, not a
// hard quota. Move it to a `ai_usage` table if it needs to be exact.

interface Window {
    count: number;
    resetAt: number;
}

const windows = new Map<string, Window>();

// Keep the map from growing without bound on a long-lived server.
const MAX_TRACKED_KEYS = 10_000;

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    /** Seconds until the current window resets. */
    retryAfter: number;
}

export function rateLimit(
    key: string,
    limit: number,
    windowMs: number,
): RateLimitResult {
    const now = Date.now();
    const existing = windows.get(key);

    if (!existing || now >= existing.resetAt) {
        if (windows.size >= MAX_TRACKED_KEYS) {
            for (const [k, w] of windows) {
                if (now >= w.resetAt) windows.delete(k);
            }
        }
        const resetAt = now + windowMs;
        windows.set(key, { count: 1, resetAt });
        return {
            allowed: true,
            remaining: limit - 1,
            retryAfter: Math.ceil(windowMs / 1000),
        };
    }

    existing.count++;
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000);

    return {
        allowed: existing.count <= limit,
        remaining: Math.max(0, limit - existing.count),
        retryAfter,
    };
}
