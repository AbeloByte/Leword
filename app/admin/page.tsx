"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
    ArrowLeft,
    BookOpen,
    CircleCheck,
    Ellipsis,
    RefreshCw,
    Search,
    ShieldCheck,
    Sparkles,
    Trash2,
    UserCheck,
    UserMinus,
    Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LogoMark } from "@/components/LogoMark";
import { Parrot } from "@/components/Parrot";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserNav } from "@/components/UserNav";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    ActivityTable,
    GrowthChart,
    WordsChart,
} from "@/components/admin/AdminCharts";
import type {
    AdminCount,
    AdminOverview,
    AdminUserRow,
} from "@/lib/admin-types";

type Status = "loading" | "denied" | "error" | "ready";
type SortKey = "newest" | "words" | "active";
type Range = 7 | 30 | 90;
const RANGES: Range[] = [7, 30, 90];

type Pending =
    | { kind: "suspend" | "restore" | "delete"; user: AdminUserRow }
    | null;

const dateFmt = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
});

function formatDate(iso: string | null): string {
    return iso ? dateFmt.format(new Date(iso)) : "—";
}

function timeAgo(iso: string | null): string {
    if (!iso) return "Never";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.round(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(iso);
}

/** Most recent of sign-in and last saved word. */
function lastActive(u: AdminUserRow): string | null {
    const a = u.lastSignInAt ? Date.parse(u.lastSignInAt) : 0;
    const b = u.lastWordAt ? Date.parse(u.lastWordAt) : 0;
    const max = Math.max(a, b);
    return max ? new Date(max).toISOString() : null;
}

export default function AdminPage() {
    const { user, session, loading } = useAuth();
    const token = session?.access_token;

    const [status, setStatus] = useState<Status>("loading");
    const [data, setData] = useState<AdminOverview | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<SortKey>("newest");
    const [range, setRange] = useState<Range>(30);

    const [pending, setPending] = useState<Pending>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(
        async (quiet = false) => {
            if (!token) return;
            if (quiet) setRefreshing(true);
            try {
                const res = await fetch("/api/admin/overview", {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                });
                if (res.status === 401 || res.status === 404) {
                    setStatus("denied");
                    return;
                }
                const body = await res.json();
                if (!res.ok) throw new Error(body?.error);
                setData(body as AdminOverview);
                setStatus("ready");
            } catch (err) {
                const message =
                    err instanceof Error && err.message
                        ? err.message
                        : "Could not load the admin overview";
                if (quiet) toast.error(message);
                else setStatus("error");
                console.error(err);
            } finally {
                if (quiet) setRefreshing(false);
            }
        },
        [token],
    );

    // Fetch once per signed-in user; the token rotating must not refetch.
    const userId = user?.id;
    useEffect(() => {
        if (!userId) return;
        const id = window.setTimeout(() => void load(), 0);
        return () => window.clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const users = useMemo(() => {
        if (!data) return [];
        const q = query.trim().toLowerCase();
        const list = q
            ? data.users.filter(
                  (u) =>
                      u.email?.toLowerCase().includes(q) ||
                      u.name?.toLowerCase().includes(q),
              )
            : [...data.users];
        if (sort === "words") list.sort((a, b) => b.words - a.words);
        else if (sort === "active")
            list.sort((a, b) =>
                (lastActive(b) ?? "").localeCompare(lastActive(a) ?? ""),
            );
        return list;
    }, [data, query, sort]);

    const runAction = async () => {
        if (!pending || !token) return;
        const { kind, user: target } = pending;
        setBusy(true);
        try {
            const res = await fetch(`/api/admin/users/${target.id}`, {
                method: kind === "delete" ? "DELETE" : "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body:
                    kind === "delete"
                        ? undefined
                        : JSON.stringify({ action: kind }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body?.error);

            const who = target.email ?? "That account";
            toast.success(
                kind === "delete"
                    ? `${who} was deleted`
                    : kind === "suspend"
                      ? `${who} is suspended`
                      : `${who} can sign in again`,
            );
            setPending(null);
            await load(true);
        } catch (err) {
            toast.error(
                err instanceof Error && err.message
                    ? err.message
                    : "That didn't work",
            );
        } finally {
            setBusy(false);
        }
    };

    // --- Gates -----------------------------------------------------------

    if (loading || (user && status === "loading")) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Parrot state="rest" size={88} perch />
                    <p className="text-sm text-muted-foreground">
                        Checking your access…
                    </p>
                </div>
            </div>
        );
    }

    if (!user || status === "denied") {
        return (
            <GateMessage
                title="Nothing to see here"
                body="This page is only for Leword admins."
            />
        );
    }

    if (status === "error" || !data) {
        return (
            <GateMessage
                title="The admin overview didn't load"
                body="Check that SUPABASE_SERVICE_ROLE_KEY is set on the server, then try again."
                action={
                    <Button onClick={() => void load()} className="gap-2">
                        <RefreshCw className="size-4" /> Try again
                    </Button>
                }
            />
        );
    }

    const t = data.totals;
    const masteryRate = t.words ? Math.round((t.mastered / t.words) * 100) : 0;

    // The range scopes both charts and the table, so their numbers agree.
    const shown = data.daily.slice(-range);
    const startCount =
        data.usersBefore +
        data.daily
            .slice(0, data.daily.length - shown.length)
            .reduce((n, d) => n + d.signups, 0);
    const wordsInRange = shown.reduce((n, d) => n + d.words, 0);
    const signupsInRange = shown.reduce((n, d) => n + d.signups, 0);

    return (
        <main className="min-h-screen pb-20">
            <header className="nav-green sticky top-0 z-20 border-b backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
                    <Link
                        href="/"
                        className="flex min-w-0 items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                        <LogoMark className="nav-logo" />
                        <h1 className="text-lg leading-tight font-bold">
                            Leword{" "}
                            <span className="font-medium opacity-70">
                                Admin
                            </span>
                        </h1>
                    </Link>
                    <div className="flex shrink-0 items-center gap-1">
                        <ThemeToggle />
                        <UserNav />
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                <section className="mt-5 flex flex-wrap items-end justify-between gap-4">
                    <div className="space-y-2">
                        <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent-ink uppercase">
                            <ShieldCheck className="size-4" aria-hidden />
                            Admin
                        </p>
                        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                            How Leword is doing
                        </h2>
                        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                            Accounts and activity across everyone. Saved words
                            stay private — only counts are shown here.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                            Updated {timeAgo(data.generatedAt)}
                        </span>
                        <Button
                            variant="outline"
                            className="h-9 gap-2"
                            onClick={() => void load(true)}
                            disabled={refreshing}
                        >
                            <RefreshCw
                                className={`size-4 ${refreshing ? "animate-spin" : ""}`}
                            />
                            Refresh
                        </Button>
                        <Link
                            href="/"
                            className="inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                            <ArrowLeft className="size-4" /> My words
                        </Link>
                    </div>
                </section>

                {/* Totals */}
                <section
                    aria-label="Totals"
                    className="grid grid-cols-2 gap-3 lg:grid-cols-4"
                >
                    <StatTile
                        icon={<Users className="size-4.5" />}
                        value={t.users}
                        label="Users"
                        hint={`${t.newUsers7d} joined this week`}
                    />
                    <StatTile
                        icon={<Sparkles className="size-4.5" />}
                        value={t.activeUsers7d}
                        label="Active this week"
                        hint="Saved at least one word"
                    />
                    <StatTile
                        icon={<BookOpen className="size-4.5" />}
                        value={t.words}
                        label="Words saved"
                        hint={`${t.words7d} in the last 7 days`}
                    />
                    <StatTile
                        icon={<CircleCheck className="size-4.5" />}
                        value={`${masteryRate}%`}
                        label="Mastered"
                        hint={`${t.mastered} of ${t.words} words`}
                    />
                </section>

                {/* Activity: one range control scopes everything in it. */}
                <section aria-labelledby="activity-title" className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2
                            id="activity-title"
                            className="text-xl font-bold"
                        >
                            Activity
                        </h2>
                        <div
                            role="group"
                            aria-label="Date range"
                            className="inline-flex rounded-lg border bg-background p-0.5"
                        >
                            {RANGES.map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    aria-pressed={range === r}
                                    onClick={() => setRange(r)}
                                    className={`h-8 rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                                        range === r
                                            ? "bg-muted text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    Last {r} days
                                </button>
                            ))}
                        </div>
                    </div>

                    <div
                        className={`grid grid-cols-1 gap-6 lg:grid-cols-2 transition-opacity ${refreshing ? "opacity-60" : ""}`}
                    >
                        <Card className="min-w-0">
                            <CardContent className="min-w-0 space-y-3">
                                <ChartHeading
                                    title="Words saved per day"
                                    figure={wordsInRange.toLocaleString()}
                                    caption={`saved in the last ${range} days`}
                                />
                                <WordsChart days={shown} />
                            </CardContent>
                        </Card>
                        <Card className="min-w-0">
                            <CardContent className="min-w-0 space-y-3">
                                <ChartHeading
                                    title="Total users"
                                    figure={`+${signupsInRange.toLocaleString()}`}
                                    caption={`joined in the last ${range} days`}
                                />
                                <GrowthChart
                                    days={shown}
                                    startCount={startCount}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <ActivityTable days={shown} startCount={startCount} />
                </section>

                <div className="grid gap-6 sm:grid-cols-2">
                    <TopList title="Top categories" items={data.categories} />
                    <TopList title="Top sources" items={data.sources} />
                </div>

                {/* Users */}
                <section aria-labelledby="users-title" className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2
                                id="users-title"
                                className="flex items-center gap-2 text-xl font-bold"
                            >
                                <Users
                                    className="size-5 text-accent-ink"
                                    aria-hidden
                                />
                                Users
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {users.length === data.users.length
                                    ? `${data.users.length} accounts`
                                    : `${users.length} of ${data.users.length} accounts`}
                            </p>
                        </div>
                        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                            <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search name or email"
                                    aria-label="Search users"
                                    className="h-9 pl-9"
                                />
                            </div>
                            <select
                                value={sort}
                                onChange={(e) =>
                                    setSort(e.target.value as SortKey)
                                }
                                aria-label="Sort users"
                                className="h-9 rounded-lg border bg-background px-2.5 text-sm"
                            >
                                <option value="newest">Newest</option>
                                <option value="active">Recently active</option>
                                <option value="words">Most words</option>
                            </select>
                        </div>
                    </div>

                    <Card className="[--card-spacing:0]">
                        <CardContent className="overflow-x-auto p-0">
                            <table className="w-full min-w-180 text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs text-muted-foreground">
                                        <th className="px-4 py-3 font-medium">
                                            User
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Joined
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Last active
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Words
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium">
                                            Mastered
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Status
                                        </th>
                                        <th className="w-12 px-2 py-3">
                                            <span className="sr-only">
                                                Actions
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <UserRow
                                            key={u.id}
                                            row={u}
                                            isSelf={u.id === user.id}
                                            onAction={(kind) =>
                                                setPending({ kind, user: u })
                                            }
                                        />
                                    ))}
                                    {users.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-10 text-center text-muted-foreground"
                                            >
                                                No one matches “{query}”.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </section>
            </div>

            <ConfirmDialog
                open={!!pending}
                onOpenChange={(open) => !open && !busy && setPending(null)}
                destructive={pending?.kind !== "restore"}
                busy={busy}
                title={
                    pending?.kind === "delete"
                        ? "Delete this account?"
                        : pending?.kind === "suspend"
                          ? "Suspend this account?"
                          : "Restore this account?"
                }
                description={
                    pending?.kind === "delete" ? (
                        <>
                            <strong>{pending.user.email}</strong> and all{" "}
                            {pending.user.words} of their saved words will be
                            removed for good. This can&apos;t be undone.
                        </>
                    ) : pending?.kind === "suspend" ? (
                        <>
                            <strong>{pending.user.email}</strong> won&apos;t be
                            able to sign in until you restore them. Their words
                            are kept.
                        </>
                    ) : (
                        <>
                            <strong>{pending?.user.email}</strong> will be able
                            to sign in again.
                        </>
                    )
                }
                confirmLabel={
                    pending?.kind === "delete"
                        ? "Delete account"
                        : pending?.kind === "suspend"
                          ? "Suspend"
                          : "Restore"
                }
                onConfirm={() => void runAction()}
            />
        </main>
    );
}

// --- Pieces ---------------------------------------------------------------

function GateMessage({
    title,
    body,
    action,
}: {
    title: string;
    body: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <div className="flex max-w-sm flex-col items-center gap-4 text-center">
                <Parrot state="rest" size={88} perch />
                <div className="space-y-1.5">
                    <h1 className="text-xl font-bold">{title}</h1>
                    <p className="text-sm text-muted-foreground">{body}</p>
                </div>
                <div className="flex gap-2">
                    {action}
                    <Link
                        href="/"
                        className="inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
                    >
                        <ArrowLeft className="size-4" /> Back to Leword
                    </Link>
                </div>
            </div>
        </div>
    );
}

function StatTile({
    icon,
    value,
    label,
    hint,
}: {
    icon: React.ReactNode;
    value: number | string;
    label: string;
    hint: string;
}) {
    return (
        <Card className="[--card-spacing:--spacing(3.5)]">
            <CardContent className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="tabular text-xl leading-tight font-bold">
                        {typeof value === "number"
                            ? value.toLocaleString()
                            : value}
                    </p>
                    <p className="text-[11px] font-medium text-muted-foreground">
                        {label}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground/70">
                        {hint}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

function ChartHeading({
    title,
    figure,
    caption,
}: {
    title: string;
    figure: string;
    caption: string;
}) {
    return (
        <div>
            <h3 className="text-sm font-semibold text-muted-foreground">
                {title}
            </h3>
            <p className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl leading-none font-bold">
                    {figure}
                </span>
                <span className="text-xs text-muted-foreground">{caption}</span>
            </p>
        </div>
    );
}

function TopList({ title, items }: { title: string; items: AdminCount[] }) {
    const max = items[0]?.count ?? 1;
    return (
        <Card>
            <CardContent className="space-y-3">
                <h3 className="font-bold">{title}</h3>
                {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Nothing yet.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {items.map((item) => (
                            <li key={item.name} className="space-y-1">
                                <div className="flex items-baseline justify-between gap-2 text-sm">
                                    <span className="truncate">
                                        {item.name}
                                    </span>
                                    <span className="tabular shrink-0 text-xs text-muted-foreground">
                                        {item.count}
                                    </span>
                                </div>
                                <div className="h-1 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-primary/70"
                                        style={{
                                            width: `${(item.count / max) * 100}%`,
                                        }}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

function UserRow({
    row,
    isSelf,
    onAction,
}: {
    row: AdminUserRow;
    isSelf: boolean;
    onAction: (kind: "suspend" | "restore" | "delete") => void;
}) {
    const rate = row.words ? Math.round((row.mastered / row.words) * 100) : 0;
    return (
        <tr className="border-b last:border-0 hover:bg-muted/40">
            <td className="max-w-72 px-4 py-3">
                <p className="truncate font-medium">
                    {row.name || row.email || "Unnamed"}
                    {isSelf && (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                            (you)
                        </span>
                    )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                    {row.name ? row.email : null}
                    {row.name && row.email ? " · " : null}
                    <span className="capitalize">{row.provider}</span>
                </p>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                {formatDate(row.createdAt)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                {timeAgo(lastActive(row))}
            </td>
            <td className="tabular px-4 py-3 text-right font-medium">
                {row.words}
            </td>
            <td className="tabular px-4 py-3 text-right text-muted-foreground">
                {row.words ? `${rate}%` : "—"}
            </td>
            <td className="px-4 py-3">
                {row.suspended ? (
                    <Badge variant="destructive">Suspended</Badge>
                ) : !row.confirmed ? (
                    <Badge variant="outline">Unconfirmed</Badge>
                ) : (
                    <Badge variant="secondary">Active</Badge>
                )}
            </td>
            <td className="px-2 py-3 text-right">
                {!isSelf && (
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    aria-label={`Actions for ${row.email ?? "this user"}`}
                                />
                            }
                        >
                            <Ellipsis className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            {row.suspended ? (
                                <DropdownMenuItem
                                    onClick={() => onAction("restore")}
                                >
                                    <UserCheck /> Restore access
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem
                                    onClick={() => onAction("suspend")}
                                >
                                    <UserMinus /> Suspend
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => onAction("delete")}
                            >
                                <Trash2 /> Delete account
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </td>
        </tr>
    );
}
