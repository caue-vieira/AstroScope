// ─── Types ────────────────────────────────────────────────────────────────────

export type DataPoint = {
    jd: number;
    magnitude: number;
    error: number;
    date: Date;
};

export type Session = {
    /** ISO date string from SESSIONDATE field, e.g. "2009-10-29" */
    sessionDate: string;
    /** Parsed Date object for sorting / filtering */
    sessionDateObj: Date;
    data: DataPoint[];
    /** Value of the OBJECTNAME metadata field, e.g. "Vesta" */
    objectName: string | null;
};

// ─── Parser ───────────────────────────────────────────────────────────────────

export function readALCDEFFile(text: string): Session[] {
    const lines = text.split("\n");
    const sessions: Session[] = [];

    let currentSession: Partial<Session> | null = null;
    let inDataBlock = false;

    for (const rawLine of lines) {
        const line = rawLine.trim();

        if (line === "STARTMETADATA") {
            currentSession = { data: [], objectName: null };
            inDataBlock = false;
            continue;
        }

        if (!currentSession) continue;

        if (line.startsWith("OBJECTNAME=")) {
            const val = line.split("=")[1].trim();
            if (val) currentSession.objectName = val;
            continue;
        }

        if (line.startsWith("SESSIONDATE=")) {
            const raw = line.split("=")[1].trim();
            currentSession.sessionDate = raw;
            currentSession.sessionDateObj = new Date(`${raw}T00:00:00Z`);
            continue;
        }

        if (line === "ENDDATA") {
            if (
                currentSession.sessionDate &&
                currentSession.sessionDateObj &&
                currentSession.data
            ) {
                sessions.push({
                    sessionDate: currentSession.sessionDate,
                    sessionDateObj: currentSession.sessionDateObj,
                    data: currentSession.data,
                    objectName: currentSession.objectName ?? null,
                });
            }
            currentSession = null;
            inDataBlock = false;
            continue;
        }

        if (line.startsWith("DATA=")) {
            inDataBlock = true;
            const content = line.slice(5); // remove "DATA="
            const parts = content.split("|");
            if (parts.length < 3) continue;

            const jd = parseFloat(parts[0]);
            const magnitude = parseFloat(parts[1]);
            const error = parseFloat(parts[2]);

            if (Number.isNaN(jd) || Number.isNaN(magnitude) || Number.isNaN(error)) continue;

            currentSession.data!.push({ jd, magnitude, error, date: jdToDate(jd) });
            continue;
        }

        // reset data block flag when leaving DATA section
        if (inDataBlock && !line.startsWith("DATA=")) {
            inDataBlock = false;
        }
    }

    // Sort by session date ascending
    sessions.sort((a, b) => a.sessionDateObj.getTime() - b.sessionDateObj.getTime());

    return sessions;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert Julian Date to JS Date */
function jdToDate(jd: number): Date {
    const unixMs = (jd - 2440587.5) * 86_400_000;
    return new Date(unixMs);
}

/**
 * Filter sessions to those whose sessionDateObj falls within [from, to] inclusive.
 * from / to are "YYYY-MM-DD" strings (UTC).
 */
export function filterSessionsByDateRange(
    sessions: Session[],
    from: string,
    to: string
): Session[] {
    const fromMs = new Date(`${from}T00:00:00Z`).getTime();
    const toMs = new Date(`${to}T23:59:59Z`).getTime();

    return sessions.filter((s) => {
        const t = s.sessionDateObj.getTime();
        return t >= fromMs && t <= toMs;
    });
}

/**
 * Compute representative statistics per session for the scatter chart.
 * Returns one point per session with mean magnitude and pooled error.
 */
export type ChartPoint = {
    sessionDate: string; // display label
    magnitude: number;   // mean magnitude
    errorUp: number;     // +error bar (positive)
    errorDown: number;   // -error bar (positive)
    n: number;           // number of data points
};

export function sessionsToChartPoints(sessions: Session[]): ChartPoint[] {
    return sessions
        .filter((s) => s.data.length > 0)
        .map((s) => {
            const mags = s.data.map((d) => d.magnitude);
            const mean = mags.reduce((a, b) => a + b, 0) / mags.length;

            // mean photometric error
            const meanErr =
                s.data.reduce((a, d) => a + d.error, 0) / s.data.length;

            return {
                sessionDate: s.sessionDate,
                magnitude: Number(mean.toFixed(4)),
                errorUp: Number(meanErr.toFixed(4)),
                errorDown: Number(meanErr.toFixed(4)),
                n: s.data.length,
            };
        });
}

/** Returns the min / max sessionDate strings across all sessions */
export function getDateBounds(sessions: Session[]): { min: string; max: string } | null {
    if (sessions.length === 0) return null;
    const sorted = [...sessions].sort(
        (a, b) => a.sessionDateObj.getTime() - b.sessionDateObj.getTime()
    );
    return { min: sorted[0].sessionDate, max: sorted[sorted.length - 1].sessionDate };
}
