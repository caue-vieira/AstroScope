"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from "react";
import type { AsteroidInfo, OrbitalElements } from "../utils/SbdbService";

type OrbitState = {
    query: string;
    asteroidInfo: AsteroidInfo | null;
    orbitalElements: OrbitalElements | null;
    /** Base64 JPEG snapshot of the Three.js canvas — not persisted to localStorage */
    orbitSnapshot: string | null;
    setQuery: (q: string) => void;
    setAsteroidInfo: (info: AsteroidInfo | null) => void;
    setOrbitalElements: (e: OrbitalElements | null) => void;
    setOrbitSnapshot: (s: string | null) => void;
};

const OrbitContext = createContext<OrbitState | null>(null);

function save(key: string, value: unknown): void {
    try {
        if (value === null || value === undefined || value === "") {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, JSON.stringify(value));
        }
    } catch { /* quota exceeded or SSR */ }
}

function load<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}

export function OrbitProvider({ children }: { children: ReactNode }) {
    const [query, setQuery] = useState("");
    const [asteroidInfo, setAsteroidInfo] = useState<AsteroidInfo | null>(null);
    const [orbitalElements, setOrbitalElements] = useState<OrbitalElements | null>(null);
    const [orbitSnapshot, setOrbitSnapshot] = useState<string | null>(null);

    // Restore from localStorage on mount (client-only)
    useEffect(() => {
        const savedQuery = load<string>("astroscope.orbit.query");
        const savedInfo = load<AsteroidInfo>("astroscope.orbit.asteroidInfo");
        const savedElements = load<OrbitalElements>("astroscope.orbit.orbitalElements");
        if (savedQuery) setQuery(savedQuery);
        if (savedInfo) setAsteroidInfo(savedInfo);
        if (savedElements) setOrbitalElements(savedElements);
    }, []);

    useEffect(() => { save("astroscope.orbit.query", query); }, [query]);
    useEffect(() => { save("astroscope.orbit.asteroidInfo", asteroidInfo); }, [asteroidInfo]);
    useEffect(() => { save("astroscope.orbit.orbitalElements", orbitalElements); }, [orbitalElements]);

    return (
        <OrbitContext.Provider value={{ query, asteroidInfo, orbitalElements, orbitSnapshot, setQuery, setAsteroidInfo, setOrbitalElements, setOrbitSnapshot }}>
            {children}
        </OrbitContext.Provider>
    );
}

export function useOrbit() {
    const ctx = useContext(OrbitContext);
    if (!ctx) throw new Error("useOrbit must be used inside OrbitProvider");
    return ctx;
}
