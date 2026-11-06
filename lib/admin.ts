// lib/admin.ts
//
// Server-only helpers for the admin area. Nothing here may be imported from a
// client component: the service-role key bypasses row-level security and can
// read and delete every user's data.
//
// Who counts as an admin is decided by the ADMIN_EMAILS env var (comma
// separated), checked on the server against a freshly verified token. It is
// deliberately not a NEXT_PUBLIC_ variable, so the list never ships to the
// browser.

import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth-server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function adminEmails(): Set<string> {
    return new Set(
        (process.env.ADMIN_EMAILS ?? "")
            .split(",")
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean),
    );
}

/**
 * True when this user may use the admin area. The email must be confirmed:
 * otherwise anyone who signed up first with an admin's address (while email
 * confirmation is off) would inherit admin rights.
 */
export function isAdmin(user: User | null): boolean {
    if (!user?.email || !user.email_confirmed_at) return false;
    return adminEmails().has(user.email.toLowerCase());
}

let serviceClient: SupabaseClient | null = null;

/** A Supabase client that bypasses RLS. Null when the key is not set. */
export function getServiceClient(): SupabaseClient | null {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) return null;
    if (!serviceClient) {
        serviceClient = createClient(supabaseUrl, key, {
            auth: { persistSession: false, autoRefreshToken: false },
        });
    }
    return serviceClient;
}

type AdminGuard =
    | { ok: true; user: User; db: SupabaseClient }
    | { ok: false; response: NextResponse };

/**
 * Verifies the caller is a signed-in admin and that the server is configured
 * for admin work. Non-admins get a 404 rather than a 403 so the endpoints do
 * not advertise themselves.
 */
export async function requireAdmin(req: Request): Promise<AdminGuard> {
    const user = await getUserFromRequest(req);
    if (!user) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: "Sign in first" },
                { status: 401 },
            ),
        };
    }

    if (!isAdmin(user)) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: "Not found" },
                { status: 404 },
            ),
        };
    }

    const db = getServiceClient();
    if (!db) {
        return {
            ok: false,
            response: NextResponse.json(
                {
                    error: "SUPABASE_SERVICE_ROLE_KEY is not configured in .env.local",
                },
                { status: 500 },
            ),
        };
    }

    return { ok: true, user, db };
}
