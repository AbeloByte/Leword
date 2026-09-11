"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Parrot } from "@/components/Parrot";
import { LogoMark } from "@/components/LogoMark";
import { ArrowLeft, Loader2 } from "lucide-react";

// Crisp SVG Google Logo
function GoogleIcon() {
  return (
    <svg className="mr-2.5 h-[18px] w-[18px]" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

/**
 * The origin OAuth should return to. NEXT_PUBLIC_SITE_URL wins when present
 * (set it to the production URL in the host's env), otherwise fall back to
 * whatever host the browser is on, which is right for local dev.
 */
function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
    window.location.origin
  );
}

/** Supabase throws plain Errors; anything else gets a generic fallback. */
function messageFor(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const busy = submitting || googleLoading;

  // 1. Google OAuth Handshake
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Pinned to the deployed origin when set, so preview domains and
          // any other host still land back on the real site. Supabase falls
          // back to the project's Site URL when this is not allowlisted.
          redirectTo: `${siteOrigin()}/`,
        },
      });
      if (error) throw error;
    } catch (error) {
      toast.error(messageFor(error, "Failed to sign in with Google"));
      setGoogleLoading(false);
    }
  };

  // 2. Email/Password Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Account created successfully");
        router.push("/");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back");
        router.push("/");
      }
    } catch (error) {
      toast.error(messageFor(error, "An authentication error occurred"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ---------- Brand panel ----------
                Hidden below lg, where the form takes the full width and the
                compact logo above it carries the branding instead. */}
      <aside className="relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex xl:p-14">
        {/* objectPosition keeps the bird (about 73% across a 3:2
                    frame) inside a tall half-viewport crop -- the default
                    centre would cut it off. */}
        <Image
          src="/Images/login.png"
          alt="A green Amazon parrot perched on a branch in the rainforest"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 0px"
          className="object-cover"
          style={{ objectPosition: "72% center" }}
        />

        {/* Scrim. The photo's left side is bright, so the text needs a
                    real gradient under it, not a flat tint. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/65 to-black/40"
        />
        <Link
          href="/"
          className="relative z-10 flex w-fit items-center gap-2.5 rounded-md transition-opacity hover:opacity-80"
        >
          <LogoMark onDark />
          <span className="text-lg font-bold">Leword</span>
        </Link>

        {/* ===================================================================
            POSITION DIAL — edit `mb-20` on the line below.

            The panel is a flex column with `justify-between`, so the logo sits
            at the top and this block sits at the bottom. The bottom margin is
            what lifts it off the floor:

              mb-0    flush with the panel padding (lowest)
              mb-10   40px up
              mb-20   80px up   <-- current
              mb-32   128px up
              mb-48   192px up  (roughly centred)

            To centre it instead, swap `justify-between` for `justify-center`
            on the <aside> above and make the logo `absolute top-10 left-10`.

            Bird too big or small? That is `size={104}` on the next line.
            =================================================================== */}
        <div className="relative z-10 mb-20 max-w-md space-y-5">
          <Parrot state="idle" size={104} perch onDark />

          <h2 className="text-4xl leading-[1.15] font-extrabold tracking-tight xl:text-5xl">
            Never forget a word you hear in{" "}
            <span className="marker">movies or books</span> again.
          </h2>

          <p className="text-base leading-relaxed text-white/80">
            Save a word the moment you hear it. Leword tells you what it
            means, says it out loud so you know how it sounds, and brings it
            back later until you remember it.
          </p>
        </div>
      </aside>

      {/* ---------- Form panel ---------- */}
      <main className="flex flex-col justify-center px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-sm">
          {/* Mobile-only branding, since the panel is hidden there. */}
          <Link
            href="/"
            className="mb-8 flex w-fit items-center gap-2.5 lg:hidden"
          >
            <LogoMark />
            <span className="text-lg font-bold">Leword</span>
          </Link>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSignUp
                ? "Start saving the words you want to remember."
                : "Sign in to pick up where you left off."}
            </p>
          </div>

          <div className="mt-7 space-y-4">
            {/* Google SSO */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full bg-card font-medium"
              onClick={handleGoogleSignIn}
              disabled={busy}
            >
              {googleLoading ? (
                <Loader2 className="mr-2.5 h-[18px] w-[18px] animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 font-medium text-muted-foreground">
                  Or with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={busy}
                  className="h-12 bg-card text-[15px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={busy}
                  className="h-12 bg-card text-[15px]"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="mt-2 w-full font-semibold"
                disabled={busy}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2.5 h-[18px] w-[18px] animate-spin" />
                    {isSignUp ? "Creating account…" : "Signing in…"}
                  </>
                ) : isSignUp ? (
                  "Create account"
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <p className="pt-1 text-center text-sm">
              <span className="text-muted-foreground">
                {isSignUp
                  ? "Already have an account?"
                  : "Don't have an account yet?"}{" "}
              </span>
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="cursor-pointer font-semibold text-accent-ink hover:underline"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </div>

          <Link
            href="/"
            className="mt-10 flex items-center justify-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
