export type DataPoint = {
    jd: number;
    magnitude: number;
    error: number;
    date: Date;
}

export type Session = {
    sessionDate: string;
    data: DataPoint[];
}

export function readALCDEFFile(text: string) {
    const lines = text.split("\n");

    const sessions: Session[] = [];

    let currentSession: Session | null = null;
    let inDataBlock = false;

    for (let rawLine of lines) {
        const line = rawLine.trim();

        // Nova sessão
        if (line === "STARTMETADATA") {
            currentSession = {
                sessionDate: "",
                data: [],
            };
            continue;
        }

        if (!currentSession) continue;

        // Captura data da sessão
        if (line.startsWith("SESSIONDATE=")) {
            currentSession.sessionDate = line.split("=")[1];
        }

        // Controle de bloco DATA
        if (line === "ENDMETADATA") {
            continue;
        }

        if (line.startsWith("DATA=")) {
            inDataBlock = true;
        }

        if (line === "ENDDATA") {
            inDataBlock = false;
            sessions.push(currentSession);
            currentSession = null;
            continue;
        }

        // Parse dos dados
        if (inDataBlock && line.startsWith("DATA=")) {
            const content = line.replace("DATA=", "");
            const [jdStr, magStr, errStr] = content.split("|");

            const jd = parseFloat(jdStr);
            const magnitude = parseFloat(magStr);
            const error = parseFloat(errStr);

            const date = jdToDate(jd);

            currentSession.data.push({
                    jd,
                    magnitude,
                    error,
                    date,
                });
        }
    }

    return sessions;
}

function jdToDate(jd: number) {
    const unixTime = (jd - 2440587.5) * 86400000;
    return new Date(unixTime);
}

export function groupByFilter(groupBy: string, sessions: Session[]) {
    const groups: Record<string, DataPoint[]> = {};

    sessions.forEach(session => {
        session.data.forEach(point => {
            const year = point.date.getFullYear();
            const month = point.date.getMonth() + 1;

            const key = `${year}-${String(month).padStart(2, "0")}`;

            if (!groups[key]) {
                groups[key] = [];
            }

            groups[key].push(point);
        });
    });

    return groups;
}