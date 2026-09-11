// lib/auth-server.ts
//
// Server-side verification of a Supabase access token. The browser client in
// lib/supabase.ts is a singleton that carries the signed-in session, so it must
// never be reused on the server where requests from different users share the
// same module instance.

import { createClient, User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Reads the bearer token off an incoming request and asks Supabase to verify
 * it. Returns the authenticated user, or null when the header is missing or
 * the token is expired/invalid.
 */
export async function getUserFromRequest(req: Request): Promise<User | null> {
    const header = req.headers.get("authorization");
    if (!header?.startsWith("Bearer ")) return null;

    const token = header.slice("Bearer ".length).trim();
    if (!token) return null;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;

    return data.user;
}
