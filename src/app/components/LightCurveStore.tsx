"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import type { Session } from "../utils/parser";

export type DateRange = {
    from: string; // "YYYY-MM-DD"
    to: string;   // "YYYY-MM-DD"
};

type LightCurveState = {
    sessions: Session[] | null;
    dateRange: DateRange | null;
    setSessions: (s: Session[] | null) => void;
    setDateRange: (r: DateRange | null) => void;
};

const LightCurveContext = createContext<LightCurveState | null>(null);

function save(key: string, value: unknown): void {
    try {
        if (value === null) { localStorage.removeItem(key); return; }
        localStorage.setItem(key, JSON.stringify(value));
    } catch { /* quota exceeded or SSR */ }
}

function loadSessions(): Session[] | null {
    try {
        const raw = localStorage.getItem("astroscope.lc.sessions");
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Session[];
        // Revive Date objects lost during JSON serialization
        return parsed.map(s => ({
            ...s,
            sessionDateObj: new Date(s.sessionDateObj),
            data: s.data.map(d => ({ ...d, date: new Date(d.date) })),
        }));
    } catch {
        return null;
    }
}

function loadDateRange(): DateRange | null {
    try {
        const raw = localStorage.getItem("astroscope.lc.dateRange");
        return raw ? (JSON.parse(raw) as DateRange) : null;
    } catch {
        return null;
    }
}

export function LightCurveProvider({ children }: { children: ReactNode }) {
    const [sessions, setSessions] = useState<Session[] | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | null>(null);

    // Restore from localStorage on mount (client-only)
    useEffect(() => {
        const savedSessions = loadSessions();
        const savedRange = loadDateRange();
        if (savedSessions) setSessions(savedSessions);
        if (savedRange) setDateRange(savedRange);
    }, []);

    useEffect(() => { save("astroscope.lc.sessions", sessions); }, [sessions]);
    useEffect(() => { save("astroscope.lc.dateRange", dateRange); }, [dateRange]);

    return (
        <LightCurveContext.Provider
            value={{ sessions, setSessions, dateRange, setDateRange }}
        >
            {children}
        </LightCurveContext.Provider>
    );
}

export function useLightCurve() {
    const ctx = useContext(LightCurveContext);
    if (!ctx) throw new Error("useLightCurve must be used inside LightCurveProvider");
    return ctx;
}
