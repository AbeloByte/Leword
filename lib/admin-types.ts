// lib/admin-types.ts
//
// Shapes returned by the /api/admin endpoints. Kept apart from lib/admin.ts so
// the admin page can import them without pulling in the service-role client.

export interface AdminUserRow {
    id: string;
    email: string | null;
    name: string | null;
    provider: string;
    createdAt: string;
    lastSignInAt: string | null;
    confirmed: boolean;
    suspended: boolean;
    words: number;
    mastered: number;
    lastWordAt: string | null;
}

export interface AdminDay {
    /** YYYY-MM-DD, UTC. */
    date: string;
    signups: number;
    words: number;
}

export interface AdminCount {
    name: string;
    count: number;
}

export interface AdminOverview {
    generatedAt: string;
    totals: {
        users: number;
        newUsers7d: number;
        /** Users who saved at least one word in the last 7 days. */
        activeUsers7d: number;
        words: number;
        words7d: number;
        mastered: number;
    };
    /** The last 90 days, oldest first. */
    daily: AdminDay[];
    /** Accounts created before the first day in `daily`. */
    usersBefore: number;
    categories: AdminCount[];
    sources: AdminCount[];
    users: AdminUserRow[];
}

export type AdminUserAction = "suspend" | "restore";
