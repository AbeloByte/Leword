"use client";

// Charts for the admin dashboard. Plain SVG sized to its container, so labels
// are measured in real pixels rather than stretched by a viewBox.
//
// Both charts are single-series (the card title names what is plotted, so no
// legend box), share one colour -- the app's accent, --primary -- and carry
// the same hover/keyboard readout. Every value they show is also in the table
// view rendered by <ActivityTable>.

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import type { AdminDay } from "@/lib/admin-types";

const HEIGHT = 220;
const M = { top: 20, right: 8, bottom: 26, left: 36 };

const shortDay = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
});
const longDay = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
});
const fmtDay = (d: string, long = false) =>
    (long ? longDay : shortDay).format(new Date(`${d}T00:00:00Z`));

const compact = new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
});
const tick = (n: number, max: number) =>
    max >= 10_000 ? compact.format(n) : n.toLocaleString();

// --- shared helpers --------------------------------------------------------

function useWidth<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) =>
            setWidth(Math.round(entry.contentRect.width)),
        );
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    return [ref, width] as const;
}

/** Running total of sign-ups, starting from `start`. */
function cumulative(days: AdminDay[], start: number): number[] {
    const out: number[] = [];
    for (const d of days) out.push((out[out.length - 1] ?? start) + d.signups);
    return out;
}

/** Clean axis ticks: 0 and ~4 steps of 1, 2 or 5 × 10^k. */
function niceTicks(max: number): number[] {
    if (max <= 0) return [0, 1];
    const rough = max / 4;
    const pow = 10 ** Math.floor(Math.log10(rough));
    const step =
        [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? pow * 10;
    const s = Math.max(1, step); // counts are whole numbers
    const ticks: number[] = [];
    for (let v = 0; v < max + s; v += s) ticks.push(v);
    return ticks;
}

/** Indices for ~5 evenly spaced x labels, always including both ends. */
function xLabelIndices(n: number, width: number): number[] {
    const count = Math.max(2, Math.min(6, Math.floor(width / 90)));
    if (n <= count) return Array.from({ length: n }, (_, i) => i);
    const out = new Set<number>();
    for (let i = 0; i < count; i++)
        out.add(Math.round((i * (n - 1)) / (count - 1)));
    return [...out];
}

/** Arrow-key / hover cursor over n data positions. */
function useCursor(n: number) {
    const [active, setActive] = useState<number | null>(null);
    const onKeyDown = (e: React.KeyboardEvent) => {
        const cur = active ?? n - 1;
        let next = cur;
        if (e.key === "ArrowLeft") next = Math.max(0, cur - 1);
        else if (e.key === "ArrowRight") next = Math.min(n - 1, cur + 1);
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = n - 1;
        else if (e.key === "Escape") return setActive(null);
        else return;
        e.preventDefault();
        setActive(next);
    };
    return {
        active,
        setActive,
        focusProps: {
            tabIndex: 0,
            onKeyDown,
            onFocus: () => setActive((a) => a ?? n - 1),
            onBlur: () => setActive(null),
        },
    };
}

function Axis({
    ticks,
    y,
    width,
    max,
}: {
    ticks: number[];
    y: (v: number) => number;
    width: number;
    max: number;
}) {
    return (
        <g aria-hidden>
            {ticks.map((t) => (
                <g key={t}>
                    <line
                        x1={M.left}
                        x2={width - M.right}
                        y1={Math.round(y(t)) + 0.5}
                        y2={Math.round(y(t)) + 0.5}
                        stroke="var(--border)"
                        strokeWidth={1}
                    />
                    <text
                        x={M.left - 8}
                        y={y(t)}
                        dy="0.32em"
                        textAnchor="end"
                        className="tabular fill-muted-foreground text-[10px]"
                    >
                        {tick(t, max)}
                    </text>
                </g>
            ))}
        </g>
    );
}

function XLabels({
    days,
    x,
    width,
}: {
    days: AdminDay[];
    x: (i: number) => number;
    width: number;
}) {
    const idx = xLabelIndices(days.length, width);
    return (
        <g aria-hidden>
            {idx.map((i) => (
                <text
                    key={i}
                    x={x(i)}
                    y={HEIGHT - 6}
                    textAnchor={
                        i === 0 ? "start" : i === days.length - 1 ? "end" : "middle"
                    }
                    className="fill-muted-foreground text-[10px]"
                >
                    {fmtDay(days[i].date)}
                </text>
            ))}
        </g>
    );
}

function Tooltip({
    x,
    width,
    value,
    label,
    detail,
}: {
    x: number;
    width: number;
    value: string;
    label: string;
    detail?: string;
}) {
    // Keep the box inside the card: anchor by its centre, clamped at the edges.
    const half = 72;
    const left = Math.min(Math.max(x, half), Math.max(half, width - half));
    return (
        <div
            className="pointer-events-none absolute top-0 z-10 w-36 -translate-x-1/2 rounded-md border bg-popover px-2.5 py-1.5 text-popover-foreground shadow-sm"
            style={{ left }}
            aria-hidden
        >
            <p className="text-sm leading-tight font-semibold">{value}</p>
            {detail && (
                <p className="text-[11px] text-muted-foreground">{detail}</p>
            )}
            <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
    );
}

// --- Words saved per day (columns) ----------------------------------------

export function WordsChart({ days }: { days: AdminDay[] }) {
    const [ref, width] = useWidth<HTMLDivElement>();
    const { active, setActive, focusProps } = useCursor(days.length);
    const liveId = useId();

    const max = Math.max(0, ...days.map((d) => d.words));
    const ticks = niceTicks(max);
    const top = ticks[ticks.length - 1];
    const plotW = Math.max(0, width - M.left - M.right);
    const plotH = HEIGHT - M.top - M.bottom;
    const base = M.top + plotH;
    const band = days.length ? plotW / days.length : 0;
    // Columns cap at 24px; the rest of the band is air, and adjacent bars
    // always keep at least a 2px gap.
    const barW = Math.max(1, Math.min(24, band - 2));
    const y = (v: number) => M.top + plotH - (v / top) * plotH;
    const cx = (i: number) => M.left + band * i + band / 2;
    const peak = days.reduce(
        (best, d, i) => (d.words > (days[best]?.words ?? -1) ? i : best),
        0,
    );

    const column = (i: number, v: number) => {
        const h = base - y(v);
        if (h <= 0) return "";
        const x0 = cx(i) - barW / 2;
        const r = Math.min(4, barW / 2, h);
        const yt = base - h;
        return `M${x0},${base}V${yt + r}Q${x0},${yt} ${x0 + r},${yt}H${x0 + barW - r}Q${x0 + barW},${yt} ${x0 + barW},${yt + r}V${base}Z`;
    };

    const total = days.reduce((n, d) => n + d.words, 0);
    const a = active != null ? days[active] : null;

    return (
        <div ref={ref} className="relative w-full min-w-0">
            {width > 0 && (
                <svg
                    width={width}
                    height={HEIGHT}
                    role="group"
                    aria-label={`Words saved per day, ${total} in total. Use the arrow keys to read each day.`}
                    aria-describedby={liveId}
                    className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onPointerLeave={() => setActive(null)}
                    {...focusProps}
                >
                    <Axis ticks={ticks} y={y} width={width} max={top} />

                    {days.map((d, i) => (
                        <path
                            key={d.date}
                            d={column(i, d.words)}
                            fill="var(--primary)"
                            opacity={active == null || active === i ? 1 : 0.45}
                            className="transition-opacity duration-150"
                        />
                    ))}

                    {/* The one direct label: the busiest day. */}
                    {max > 0 && active == null && (
                        <text
                            x={cx(peak)}
                            y={y(days[peak].words) - 6}
                            textAnchor={
                                peak < 2
                                    ? "start"
                                    : peak > days.length - 3
                                      ? "end"
                                      : "middle"
                            }
                            className="tabular fill-foreground text-[11px] font-semibold"
                            aria-hidden
                        >
                            {days[peak].words}
                        </text>
                    )}

                    {/* Hit targets: the whole band, taller than any bar. */}
                    {days.map((d, i) => (
                        <rect
                            key={d.date}
                            x={M.left + band * i}
                            y={M.top}
                            width={band}
                            height={plotH}
                            fill="transparent"
                            onPointerEnter={() => setActive(i)}
                        />
                    ))}

                    <XLabels days={days} x={cx} width={width} />
                </svg>
            )}
            {a && active != null && (
                <Tooltip
                    x={cx(active)}
                    width={width}
                    value={`${a.words} word${a.words === 1 ? "" : "s"}`}
                    label={fmtDay(a.date, true)}
                />
            )}
            <p id={liveId} className="sr-only" aria-live="polite">
                {a
                    ? `${fmtDay(a.date, true)}: ${a.words} words saved`
                    : ""}
            </p>
        </div>
    );
}

// --- Total users over time (line + area) -----------------------------------

export function GrowthChart({
    days,
    startCount,
}: {
    days: AdminDay[];
    /** Accounts that existed before the first day shown. */
    startCount: number;
}) {
    const [ref, width] = useWidth<HTMLDivElement>();
    const { active, setActive, focusProps } = useCursor(days.length);
    const liveId = useId();
    const gradId = useId();

    const totals = useMemo(
        () => cumulative(days, startCount),
        [days, startCount],
    );

    const last = totals[totals.length - 1] ?? 0;
    const ticks = niceTicks(Math.max(...totals, 1));
    const top = ticks[ticks.length - 1];
    const plotW = Math.max(0, width - M.left - M.right);
    const plotH = HEIGHT - M.top - M.bottom;
    const base = M.top + plotH;
    const step = days.length > 1 ? plotW / (days.length - 1) : 0;
    const x = (i: number) => M.left + step * i;
    const y = (v: number) => M.top + plotH - (v / top) * plotH;

    const line = totals
        .map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`)
        .join("");
    const area = `${line}L${x(totals.length - 1)},${base}L${x(0)},${base}Z`;

    const pick = (e: React.PointerEvent<SVGRectElement>) => {
        const box = e.currentTarget.getBoundingClientRect();
        const i = Math.round((e.clientX - box.left) / (step || 1));
        setActive(Math.max(0, Math.min(days.length - 1, i)));
    };

    const a = active != null ? days[active] : null;
    const endX = x(totals.length - 1);
    const endY = y(last);

    return (
        <div ref={ref} className="relative w-full min-w-0">
            {width > 0 && days.length > 0 && (
                <svg
                    width={width}
                    height={HEIGHT}
                    role="group"
                    aria-label={`Total users over time, ${last} now. Use the arrow keys to read each day.`}
                    aria-describedby={liveId}
                    className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onPointerLeave={() => setActive(null)}
                    {...focusProps}
                >
                    <defs>
                        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
                            <stop
                                offset="0%"
                                stopColor="var(--primary)"
                                stopOpacity={0.16}
                            />
                            <stop
                                offset="100%"
                                stopColor="var(--primary)"
                                stopOpacity={0.02}
                            />
                        </linearGradient>
                    </defs>

                    <Axis ticks={ticks} y={y} width={width} max={top} />

                    <path d={area} fill={`url(#${gradId})`} />
                    <path
                        d={line}
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth={2}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                    />

                    {active != null && (
                        <line
                            x1={x(active)}
                            x2={x(active)}
                            y1={M.top}
                            y2={base}
                            stroke="var(--muted-foreground)"
                            strokeOpacity={0.5}
                            strokeWidth={1}
                            aria-hidden
                        />
                    )}

                    {/* End marker + label: where things stand today. */}
                    <circle
                        cx={active != null ? x(active) : endX}
                        cy={active != null ? y(totals[active]) : endY}
                        r={4}
                        fill="var(--primary)"
                        stroke="var(--card)"
                        strokeWidth={2}
                    />
                    {active == null && (
                        <text
                            x={endX - 8}
                            y={endY - 10}
                            textAnchor="end"
                            className="tabular fill-foreground text-[11px] font-semibold"
                            aria-hidden
                        >
                            {last.toLocaleString()}
                        </text>
                    )}

                    {/* Crosshair layer: snaps to the nearest day. */}
                    <rect
                        x={M.left}
                        y={M.top}
                        width={plotW}
                        height={plotH}
                        fill="transparent"
                        onPointerMove={pick}
                        onPointerDown={pick}
                    />

                    <XLabels days={days} x={x} width={width} />
                </svg>
            )}
            {a && active != null && (
                <Tooltip
                    x={x(active)}
                    width={width}
                    value={`${totals[active].toLocaleString()} users`}
                    detail={
                        a.signups
                            ? `+${a.signups} joined that day`
                            : "No new sign-ups"
                    }
                    label={fmtDay(a.date, true)}
                />
            )}
            <p id={liveId} className="sr-only" aria-live="polite">
                {a && active != null
                    ? `${fmtDay(a.date, true)}: ${totals[active]} users, ${a.signups} joined`
                    : ""}
            </p>
        </div>
    );
}

// --- Table view -------------------------------------------------------------

export function ActivityTable({
    days,
    startCount,
}: {
    days: AdminDay[];
    startCount: number;
}) {
    const totals = cumulative(days, startCount);
    const rows = days.map((d, i) => ({ ...d, total: totals[i] })).reverse();
    return (
        <details className="group rounded-lg border bg-card text-sm">
            <summary className="cursor-pointer list-none px-4 py-2.5 text-xs font-medium text-muted-foreground select-none hover:text-foreground">
                <span className="group-open:hidden">Show the numbers as a table</span>
                <span className="hidden group-open:inline">Hide table</span>
            </summary>
            <div className="max-h-72 overflow-auto border-t">
                <table className="w-full">
                    <thead className="sticky top-0 bg-card">
                        <tr className="border-b text-left text-xs text-muted-foreground">
                            <th className="px-4 py-2 font-medium">Day</th>
                            <th className="px-4 py-2 text-right font-medium">
                                Words saved
                            </th>
                            <th className="px-4 py-2 text-right font-medium">
                                Sign-ups
                            </th>
                            <th className="px-4 py-2 text-right font-medium">
                                Total users
                            </th>
                        </tr>
                    </thead>
                    <tbody className="tabular">
                        {rows.map((r) => (
                            <tr key={r.date} className="border-b last:border-0">
                                <td className="px-4 py-1.5">
                                    {fmtDay(r.date, true)}
                                </td>
                                <td className="px-4 py-1.5 text-right">
                                    {r.words}
                                </td>
                                <td className="px-4 py-1.5 text-right">
                                    {r.signups}
                                </td>
                                <td className="px-4 py-1.5 text-right">
                                    {r.total}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </details>
    );
}
