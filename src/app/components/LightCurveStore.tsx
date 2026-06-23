"use client";

import {
    createContext,
    useContext,
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

export function LightCurveProvider({ children }: { children: ReactNode }) {
    const [sessions, setSessions] = useState<Session[] | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | null>(null);

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
