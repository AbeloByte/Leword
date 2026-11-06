// app/api/admin/overview/route.ts
//
// Everything the admin dashboard shows, in one round trip. Reports counts and
// account metadata only -- never the words, definitions or context sentences
// people saved, which stay private to them.

import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";
import type {
    AdminCount,
    AdminDay,
    AdminOverview,
    AdminUserRow,
} from "@/lib/admin-types";

const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE = 1000;
const TOP_N = 8;
const DAYS = 90;

interface WordRow {
    user_id: string;
    is_mastered: boolean;
    created_at: string;
    category: string | null;
    source: string | null;
}

async function allUsers(db: SupabaseClient): Promise<User[]> {
    const users: User[] = [];
    for (let page = 1; ; page++) {
        const { data, error } = await db.auth.admin.listUsers({
            page,
            perPage: PAGE,
        });
        if (error) throw error;
        users.push(...data.users);
        if (data.users.length < PAGE) return users;
    }
}

// PostgREST caps a single response, so read the table in pages.
async function allWords(db: SupabaseClient): Promise<WordRow[]> {
    const rows: WordRow[] = [];
    for (let from = 0; ; from += PAGE) {
        const { data, error } = await db
            .from("words")
            .select("user_id, is_mastered, created_at, category, source")
            .order("created_at", { ascending: true })
            .range(from, from + PAGE - 1);
        if (error) throw error;
        rows.push(...(data as WordRow[]));
        if (data.length < PAGE) return rows;
    }
}

function topCounts(values: (string | null)[]): AdminCount[] {
    const counts = new Map<string, { name: string; count: number }>();
    for (const raw of values) {
        const name = raw?.trim();
        if (!name) continue;
        const key = name.toLowerCase();
        const entry = counts.get(key);
        if (entry) entry.count++;
        else counts.set(key, { name, count: 1 });
    }
    return [...counts.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, TOP_N);
}

const dayKey = (iso: string) => iso.slice(0, 10);

function isSuspended(user: User): boolean {
    const until = (user as User & { banned_until?: string | null })
        .banned_until;
    return !!until && new Date(until).getTime() > Date.now();
}

export async function GET(req: Request) {
    const guard = await requireAdmin(req);
    if (!guard.ok) return guard.response;

    try {
        const [users, words] = await Promise.all([
            allUsers(guard.db),
            allWords(guard.db),
        ]);

        const now = Date.now();
        const weekAgo = now - 7 * DAY_MS;

        // Per-user word tallies.
        const perUser = new Map<
            string,
            { words: number; mastered: number; lastWordAt: string | null }
        >();
        const activeThisWeek = new Set<string>();
        let mastered = 0;
        let words7d = 0;

        for (const w of words) {
            const t = perUser.get(w.user_id) ?? {
                words: 0,
                mastered: 0,
                lastWordAt: null,
            };
            t.words++;
            if (w.is_mastered) {
                t.mastered++;
                mastered++;
            }
            // Rows arrive oldest first, so the last one seen is the newest.
            t.lastWordAt = w.created_at;
            perUser.set(w.user_id, t);

            if (new Date(w.created_at).getTime() >= weekAgo) {
                words7d++;
                activeThisWeek.add(w.user_id);
            }
        }

        // The last DAYS days, oldest first.
        const daily: AdminDay[] = [];
        const dayIndex = new Map<string, AdminDay>();
        for (let i = DAYS - 1; i >= 0; i--) {
            const date = new Date(now - i * DAY_MS).toISOString().slice(0, 10);
            const day = { date, signups: 0, words: 0 };
            daily.push(day);
            dayIndex.set(date, day);
        }
        const firstDay = daily[0].date;
        let usersBefore = 0;
        for (const u of users) {
            const key = dayKey(u.created_at);
            const day = dayIndex.get(key);
            if (day) day.signups++;
            else if (key < firstDay) usersBefore++;
        }
        for (const w of words) {
            const day = dayIndex.get(dayKey(w.created_at));
            if (day) day.words++;
        }

        const rows: AdminUserRow[] = users
            .map((u) => {
                const t = perUser.get(u.id);
                return {
                    id: u.id,
                    email: u.email ?? null,
                    name:
                        u.user_metadata?.full_name ||
                        u.user_metadata?.name ||
                        null,
                    provider: u.app_metadata?.provider ?? "email",
                    createdAt: u.created_at,
                    lastSignInAt: u.last_sign_in_at ?? null,
                    confirmed: !!u.email_confirmed_at,
                    suspended: isSuspended(u),
                    words: t?.words ?? 0,
                    mastered: t?.mastered ?? 0,
                    lastWordAt: t?.lastWordAt ?? null,
                };
            })
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

        const overview: AdminOverview = {
            generatedAt: new Date(now).toISOString(),
            totals: {
                users: users.length,
                newUsers7d: users.filter(
                    (u) => new Date(u.created_at).getTime() >= weekAgo,
                ).length,
                activeUsers7d: activeThisWeek.size,
                words: words.length,
                words7d,
                mastered,
            },
            daily,
            usersBefore,
            categories: topCounts(words.map((w) => w.category)),
            sources: topCounts(words.map((w) => w.source)),
            users: rows,
        };

        return NextResponse.json(overview, {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        console.error("Admin overview failed:", error);
        return NextResponse.json(
            { error: "Could not load the admin overview" },
            { status: 500 },
        );
    }
}
