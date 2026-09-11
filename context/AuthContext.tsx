"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signOut: async () => {},
});

/**
 * True when two snapshots describe the same user in the same state.
 *
 * onAuthStateChange fires on tab focus and on every token refresh, and hands
 * back a freshly parsed `user` object each time. Storing that object as-is
 * gives every consumer a new reference for an unchanged user, which re-runs
 * their effects -- that is what made the dashboard refetch and flash its
 * skeletons whenever you switched tabs and came back.
 *
 * `updated_at` is compared as well so a real profile change (name, avatar)
 * still propagates.
 */
function isSameUser(a: User | null, b: User | null): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    return a.id === b.id && a.updated_at === b.updated_at;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // The session itself must always be stored: its access_token rotates,
        // and API calls sign requests with it.
        const apply = (next: Session | null) => {
            setSession(next);
            setUser((prev) =>
                isSameUser(prev, next?.user ?? null)
                    ? prev
                    : (next?.user ?? null),
            );
            setLoading(false);
        };

        // checks if there is an active session on page load
        supabase.auth.getSession().then(({ data: { session } }) => {
            apply(session);
        });

        const {
            // used to listen for changes in the auth state (e.g., sign in, sign out)
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            apply(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
    }, []);

    const value = useMemo(
        () => ({ user, session, loading, signOut }),
        [user, session, loading, signOut],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
