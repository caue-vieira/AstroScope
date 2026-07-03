"use client";

import { useMemo } from "react";
import { useLightCurve } from "../components/LightCurveStore";
import {
    filterSessionsByDateRange,
    sessionsToChartPoints,
    getDateBounds,
} from "../utils/parser";
import FileInput from "../components/FileInput";
import Chart from "../components/Chart";
import DateRangePicker from "../components/DateRangePicker";
import type { Session } from "../utils/parser";

export default function LightCurve() {
    const { sessions, setSessions, dateRange, setDateRange } = useLightCurve();

    // ── date bounds from full dataset ──────────────────────────────────────
    const bounds = useMemo(
        () => (sessions ? getDateBounds(sessions) : null),
        [sessions]
    );

    // ── filtered sessions ──────────────────────────────────────────────────
    const filteredSessions = useMemo(() => {
        if (!sessions) return [];
        if (!dateRange || !bounds) return sessions;
        return filterSessionsByDateRange(sessions, dateRange.from, dateRange.to);
    }, [sessions, dateRange, bounds]);

    // ── chart data (one point per session) ────────────────────────────────
    const chartData = useMemo(
        () => sessionsToChartPoints(filteredSessions),
        [filteredSessions]
    );

    // ── stats ──────────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        if (chartData.length === 0) return null;
        const mags = chartData.map((p) => p.magnitude);
        return {
            sessions: filteredSessions.length,
            total: filteredSessions.reduce((a, s) => a + s.data.length, 0),
            min: Math.min(...mags).toFixed(3),
            max: Math.max(...mags).toFixed(3),
            mean: (mags.reduce((a, b) => a + b, 0) / mags.length).toFixed(3),
        };
    }, [chartData, filteredSessions]);

    function handleDataLoaded(loaded: Session[]) {
        setSessions(loaded);
        setDateRange(null); // reset filter when new file is loaded
    }

    return (
        <div className="flex flex-col gap-6 p-6 flex-1 min-h-0">
            {/* ── Header row ─────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    {sessions && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {sessions.length} sessões carregadas
                        </p>
                    )}
                </div>
                <FileInput
                    onDataLoaded={handleDataLoaded}
                    hasData={sessions !== null}
                />
            </div>

            {/* ── Empty state ────────────────────────────────────────────── */}
            {!sessions && (
                <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center text-muted-foreground">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-30"
                        aria-hidden="true"
                    >
                        <path d="M3 3v18h18" />
                        <path d="m19 9-5 5-4-4-3 3" />
                    </svg>
                    <p className="text-sm">
                        Carregue um arquivo ALCDEF (.txt) para visualizar a curva de luz.
                    </p>
                </div>
            )}

            {/* ── Data loaded ────────────────────────────────────────────── */}
            {sessions && bounds && (
                <>
                    {/* Date filter */}
                    <DateRangePicker
                        bounds={bounds}
                        value={dateRange}
                        onChange={setDateRange}
                    />

                    {/* Stats bar */}
                    {stats && (
                        <div className="flex flex-wrap gap-4">
                            <StatCard label="Sessões" value={String(stats.sessions)} />
                            <StatCard label="Medições" value={String(stats.total)} />
                            <StatCard label="Mag. mín." value={stats.min} />
                            <StatCard label="Mag. máx." value={stats.max} />
                            <StatCard label="Mag. média" value={stats.mean} />
                        </div>
                    )}

                    {/* Chart */}
                    <div className="bg-card border border-border rounded-xl p-4 flex justify-center w-[60%] mx-auto h-[500px] items-center">
                        <Chart data={chartData} />
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Small stat card ──────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-card border border-border rounded-lg px-4 py-2 min-w-[90px]">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold text-foreground font-mono">{value}</p>
        </div>
    );
}