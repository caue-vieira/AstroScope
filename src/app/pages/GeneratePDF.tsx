"use client";

import { useMemo, useState } from "react";
import { useLightCurve } from "../components/LightCurveStore";
import { useOrbit } from "../components/OrbitStore";
import {
    filterSessionsByDateRange,
    getDateBounds,
    sessionsToChartPoints,
} from "../utils/parser";
import type { ChartPoint } from "../utils/parser";
import type { DateRange } from "../components/LightCurveStore";
import type { AsteroidInfo } from "../utils/SbdbService";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stats = {
    sessions: number;
    total: number;
    min: string;
    max: string;
    mean: string;
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GeneratePDF() {
    const { sessions, dateRange } = useLightCurve();
    const { asteroidInfo } = useOrbit();
    const [generating, setGenerating] = useState(false);

    const hasLightCurve = sessions !== null && sessions.length > 0;
    const hasOrbit = asteroidInfo !== null;
    const hasAnyData = hasLightCurve || hasOrbit;

    // ── Derived data ───────────────────────────────────────────────────────
    const bounds = useMemo(
        () => (sessions ? getDateBounds(sessions) : null),
        [sessions]
    );
    const filteredSessions = useMemo(() => {
        if (!sessions) return [];
        if (!dateRange || !bounds) return sessions;
        return filterSessionsByDateRange(sessions, dateRange.from, dateRange.to);
    }, [sessions, dateRange, bounds]);
    const chartData = useMemo(
        () => sessionsToChartPoints(filteredSessions),
        [filteredSessions]
    );
    const stats = useMemo((): Stats | null => {
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

    // ── PDF generation ─────────────────────────────────────────────────────
    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const { default: jsPDF } = await import("jspdf");
            const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            buildPDF(doc, { hasLightCurve, hasOrbit, stats, chartData, asteroidInfo, dateRange });
            doc.save(`AstroScope_${new Date().toISOString().slice(0, 10)}.pdf`);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 min-h-0">

            {/* ── Page header ─────────────────────────────────────────────── */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Gerar PDF</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Relatório com os dados carregados nas demais seções
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={!hasAnyData || generating}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                    {generating ? (
                        <>
                            <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                            Gerando…
                        </>
                    ) : (
                        <>
                            <DownloadIcon />
                            Gerar PDF
                        </>
                    )}
                </button>
            </div>

            {/* ── No data warning ─────────────────────────────────────────── */}
            {!hasAnyData && (
                <div className="flex flex-col items-center justify-center gap-4 py-20 text-center text-muted-foreground">
                    <svg
                        xmlns="http://www.w3.org/2000/svg" width="48" height="48"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
                        className="opacity-25" aria-hidden="true"
                    >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                    <div>
                        <p className="text-sm font-medium text-foreground mb-1">Nenhum dado disponível</p>
                        <p className="text-xs text-muted-foreground max-w-sm">
                            Carregue um arquivo ALCDEF na aba{" "}
                            <span className="font-medium text-foreground">Curva de Luz</span>{" "}
                            ou busque um asteroide na aba{" "}
                            <span className="font-medium text-foreground">Órbita 3D</span>{" "}
                            para gerar o relatório.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Preview sections ─────────────────────────────────────────── */}
            {hasAnyData && (
                <div className="flex flex-col gap-4 max-w-3xl">

                    {/* Light Curve preview */}
                    {hasLightCurve && stats && (
                        <PreviewCard
                            title="Curva de Luz"
                            badge={`${stats.sessions} sessões · ${stats.total} medições`}
                            color="blue"
                        >
                            <div className="flex flex-wrap gap-2">
                                <MiniStat label="Mag. mínima" value={stats.min} />
                                <MiniStat label="Mag. máxima" value={stats.max} />
                                <MiniStat label="Mag. média" value={stats.mean} />
                                {dateRange && (
                                    <MiniStat
                                        label="Período filtrado"
                                        value={`${dateRange.from} → ${dateRange.to}`}
                                    />
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                O PDF incluirá o gráfico de magnitude × data e as estatísticas acima.
                            </p>
                        </PreviewCard>
                    )}

                    {/* No light curve notice */}
                    {!hasLightCurve && (
                        <NoDataCard section="Curva de Luz" instruction="Carregue um arquivo ALCDEF" />
                    )}

                    {/* Orbit preview */}
                    {hasOrbit && asteroidInfo && (
                        <PreviewCard
                            title={`Órbita 3D — ${asteroidInfo.fullname}`}
                            badge={[asteroidInfo.orbitClass, asteroidInfo.isNeo && "NEO", asteroidInfo.isPha && "PHA"].filter(Boolean).join(" · ")}
                            color="amber"
                        >
                            <div className="flex flex-wrap gap-2">
                                <MiniStat label="Semieixo maior" value={`${asteroidInfo.semiMajorAxis} AU`} />
                                <MiniStat label="Excentricidade" value={asteroidInfo.eccentricity} />
                                <MiniStat label="Inclinação" value={`${asteroidInfo.inclination}°`} />
                                <MiniStat label="Período" value={`${asteroidInfo.period} d`} />
                                <MiniStat label="MOID" value={`${asteroidInfo.moid} AU`} />
                                <MiniStat label="Observações" value={String(asteroidInfo.nObsUsed)} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                O PDF incluirá os elementos orbitais, dados de aproximação e qualidade do ajuste.
                            </p>
                        </PreviewCard>
                    )}

                    {/* No orbit notice */}
                    {!hasOrbit && (
                        <NoDataCard section="Órbita 3D" instruction="Busque um asteroide pela designação" />
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Preview UI sub-components ────────────────────────────────────────────────

function PreviewCard({
    title, badge, color, children,
}: {
    title: string;
    badge: string;
    color: "blue" | "amber";
    children: React.ReactNode;
}) {
    const accent = color === "blue"
        ? "border-blue-500/30 bg-blue-500/5"
        : "border-amber-500/30 bg-amber-500/5";
    return (
        <div className={`rounded-xl border p-4 ${accent}`}>
            <div className="flex items-center gap-2 mb-3">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <span className="text-xs text-muted-foreground bg-card border border-border rounded-full px-2 py-0.5">{badge}</span>
            </div>
            {children}
        </div>
    );
}

function NoDataCard({ section, instruction }: { section: string; instruction: string }) {
    return (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-4 flex items-center gap-3 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round" className="shrink-0 opacity-50" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-xs">
                <span className="font-medium">{section}</span> não incluída no relatório. {instruction} para adicioná-la.
            </p>
        </div>
    );
}

function MiniStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-card border border-border rounded-lg px-3 py-1.5 min-w-[90px]">
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p className="text-xs font-semibold text-foreground font-mono">{value}</p>
        </div>
    );
}

function DownloadIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
}

// ─── PDF builder ──────────────────────────────────────────────────────────────

type BuildParams = {
    hasLightCurve: boolean;
    hasOrbit: boolean;
    stats: Stats | null;
    chartData: ChartPoint[];
    asteroidInfo: AsteroidInfo | null;
    dateRange: DateRange | null;
};

function buildPDF(doc: InstanceType<typeof import("jspdf").default>, p: BuildParams) {
    const PW = 210;
    const PH = 297;
    const M = 15;
    const CW = PW - 2 * M;

    let y = M;

    const newPageIfNeeded = (needed: number) => {
        if (y + needed > PH - M - 12) {
            doc.addPage();
            y = M;
        }
    };

    const hLine = (yy: number, r = 200, g = 200, b = 200) => {
        doc.setDrawColor(r, g, b);
        doc.setLineWidth(0.3);
        doc.line(M, yy, PW - M, yy);
    };

    // ── Header bar ──────────────────────────────────────────────────────────
    doc.setFillColor(15, 15, 20);
    doc.rect(0, 0, PW, 18, "F");

    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("ASTROSCOPE", M, 12);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    const dateStr = new Date().toLocaleDateString("pt-BR", {
        day: "2-digit", month: "long", year: "numeric",
    });
    doc.text(`Relatório gerado em ${dateStr}`, PW - M, 12, { align: "right" });

    doc.setTextColor(0, 0, 0);
    y = 26;

    // ── Light Curve section ──────────────────────────────────────────────────
    if (p.hasLightCurve && p.stats) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 60, 180);
        doc.text("CURVA DE LUZ", M, y);
        y += 3;
        hLine(y, 60, 100, 220);
        y += 7;
        doc.setTextColor(0, 0, 0);

        // Stats grid (3 per row)
        const cells: [string, string][] = [
            ["Sessões", String(p.stats.sessions)],
            ["Medições totais", String(p.stats.total)],
            ["Mag. mínima", p.stats.min],
            ["Mag. máxima", p.stats.max],
            ["Mag. média", p.stats.mean],
        ];
        if (p.dateRange) {
            cells.push(["Período filtrado", `${p.dateRange.from} → ${p.dateRange.to}`]);
        }

        const cellW = CW / 3;
        const cellH = 11;
        cells.forEach(([label, value], i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const cx = M + col * cellW;
            const cy = y + row * cellH;
            doc.setFillColor(244, 245, 250);
            doc.roundedRect(cx, cy, cellW - 2, cellH - 1, 1.5, 1.5, "F");
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(120, 120, 130);
            doc.text(label, cx + 3, cy + 4);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(20, 20, 30);
            doc.text(value, cx + 3, cy + 8.5);
        });
        y += Math.ceil(cells.length / 3) * cellH + 5;

        // Chart
        newPageIfNeeded(82);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 110);
        doc.text("Gráfico: Magnitude média por sessão (eixo Y invertido — menor = mais brilhante)", M, y);
        y += 4;
        drawChart(doc, p.chartData, M, y, CW, 75);
        y += 82;
    }

    // ── Orbit section ────────────────────────────────────────────────────────
    if (p.hasOrbit && p.asteroidInfo) {
        newPageIfNeeded(20);

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(180, 80, 20);
        doc.text("ÓRBITA 3D", M, y);
        y += 3;
        hLine(y, 220, 100, 40);
        y += 7;
        doc.setTextColor(0, 0, 0);

        // Asteroid full name
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(20, 20, 30);
        doc.text(p.asteroidInfo.fullname, M, y);
        y += 5;

        // Badges
        const badges: { label: string; r: number; g: number; b: number }[] = [
            { label: p.asteroidInfo.orbitClass, r: 59, g: 130, b: 246 },
        ];
        if (p.asteroidInfo.isNeo) badges.push({ label: "NEO", r: 200, g: 120, b: 10 });
        if (p.asteroidInfo.isPha) badges.push({ label: "PHA", r: 210, g: 50, b: 50 });

        let bx = M;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        for (const badge of badges) {
            doc.setFillColor(badge.r, badge.g, badge.b);
            doc.setTextColor(255, 255, 255);
            const bw = doc.getTextWidth(badge.label) + 6;
            doc.roundedRect(bx, y - 3.5, bw, 5, 1, 1, "F");
            doc.text(badge.label, bx + 3, y);
            bx += bw + 3;
        }
        y += 8;

        // Two-column info tables
        const col1: [string, string][] = [
            ["Semieixo maior", `${p.asteroidInfo.semiMajorAxis} AU`],
            ["Excentricidade", p.asteroidInfo.eccentricity],
            ["Inclinação", `${p.asteroidInfo.inclination}°`],
            ["Dist. periélio", `${p.asteroidInfo.perihelionDist} AU`],
            ["Dist. afélio", `${p.asteroidInfo.aphelionDist} AU`],
            ["Período orbital", `${p.asteroidInfo.period} dias`],
        ];
        const col2: [string, string][] = [
            ["MOID (Terra)", `${p.asteroidInfo.moid} AU`],
            ["MOID Júpiter", `${p.asteroidInfo.moidJup} AU`],
            ["T. Tisserand", p.asteroidInfo.tJup],
            ["Cód. condição", `${p.asteroidInfo.conditionCode} / 9`],
            ["RMS residual", `${p.asteroidInfo.rms}″`],
            ["Nº observações", String(p.asteroidInfo.nObsUsed)],
        ];

        const colW = CW / 2;
        const rowH = 11;

        const drawCol = (entries: [string, string][], startX: number) => {
            entries.forEach(([label, value], i) => {
                const cy = y + i * rowH;
                doc.setFillColor(244, 245, 250);
                doc.roundedRect(startX, cy, colW - 3, rowH - 1, 1.5, 1.5, "F");
                doc.setFont("helvetica", "normal");
                doc.setFontSize(7);
                doc.setTextColor(120, 120, 130);
                doc.text(label, startX + 3, cy + 4);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                doc.setTextColor(20, 20, 30);
                doc.text(value, startX + 3, cy + 8.5);
            });
        };

        newPageIfNeeded(Math.max(col1.length, col2.length) * rowH + 10);
        drawCol(col1, M);
        drawCol(col2, M + colW);
        y += Math.max(col1.length, col2.length) * rowH + 4;

        // Observation arc
        newPageIfNeeded(10);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 110);
        doc.text(
            `Primeira obs.: ${p.asteroidInfo.firstObs}   ·   Última obs.: ${p.asteroidInfo.lastObs}   ·   Arco de dados: ${p.asteroidInfo.dataArc} dias`,
            M, y
        );
        y += 8;
    }

    // ── Footer on every page ─────────────────────────────────────────────────
    const totalPages = doc.getNumberOfPages();
    for (let pg = 1; pg <= totalPages; pg++) {
        doc.setPage(pg);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(160, 160, 170);
        hLine(PH - 10, 220, 220, 225);
        doc.text("AstroScope — Análise de Asteroides e Curvas de Luz", M, PH - 5);
        doc.text(`${pg} / ${totalPages}`, PW - M, PH - 5, { align: "right" });
    }
}

// ─── Chart drawing ────────────────────────────────────────────────────────────

function drawChart(
    doc: InstanceType<typeof import("jspdf").default>,
    data: ChartPoint[],
    x: number,
    y: number,
    w: number,
    h: number
) {
    if (data.length === 0) return;

    const pad = { top: 4, right: 6, bottom: 24, left: 30 };
    const px = x + pad.left;
    const py = y + pad.top;
    const pw = w - pad.left - pad.right;
    const ph = h - pad.top - pad.bottom;

    // Background
    doc.setFillColor(248, 249, 252);
    doc.rect(x, y, w, h, "F");

    // Plot area border
    doc.setDrawColor(200, 205, 215);
    doc.setLineWidth(0.25);
    doc.rect(px, py, pw, ph);

    // Value ranges — magnitude axis is reversed (lower = brighter)
    const mags = data.map((d) => d.magnitude);
    const errs = data.map((d) => d.errorUp);
    const rawMin = Math.min(...mags.map((m, i) => m - errs[i]));
    const rawMax = Math.max(...mags.map((m, i) => m + errs[i]));
    const vRange = rawMax - rawMin || 0.5;
    const magMin = rawMin - vRange * 0.1;
    const magMax = rawMax + vRange * 0.1;

    // Coordinate helpers (Y is reversed: high mag → bottom of plot)
    const toX = (i: number) => px + (i / Math.max(data.length - 1, 1)) * pw;
    const toY = (mag: number) => py + ((mag - magMin) / (magMax - magMin)) * ph;

    // Horizontal grid + Y axis labels
    const nGridY = 4;
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(140, 140, 150);
    for (let i = 0; i <= nGridY; i++) {
        const mag = magMin + (magMax - magMin) * (i / nGridY);
        const gy = toY(mag);
        if (i > 0 && i < nGridY) {
            doc.setDrawColor(225, 228, 235);
            doc.setLineWidth(0.15);
            doc.line(px, gy, px + pw, gy);
        }
        doc.text(mag.toFixed(2), px - 1.5, gy + 0.8, { align: "right" });
    }

    // X axis date labels
    const maxLabels = Math.min(data.length, 8);
    const step = Math.max(1, Math.ceil(data.length / maxLabels));
    doc.setFontSize(5.5);
    for (let i = 0; i < data.length; i += step) {
        const lx = toX(i);
        doc.text(data[i].sessionDate, lx, py + ph + 4, { angle: 35, align: "left" });
    }

    // Error bars + data points
    for (let i = 0; i < data.length; i++) {
        const dpx = toX(i);
        const dpy = toY(data[i].magnitude);
        const errTop = toY(data[i].magnitude - data[i].errorUp);
        const errBot = toY(data[i].magnitude + data[i].errorUp);

        doc.setDrawColor(130, 155, 215);
        doc.setLineWidth(0.35);
        doc.line(dpx, errTop, dpx, errBot);
        doc.line(dpx - 0.6, errTop, dpx + 0.6, errTop);
        doc.line(dpx - 0.6, errBot, dpx + 0.6, errBot);

        doc.setFillColor(55, 95, 205);
        doc.circle(dpx, dpy, 0.85, "F");
    }

    // Axis titles
    doc.setFontSize(6.5);
    doc.setTextColor(100, 100, 115);
    doc.text("Magnitude", x + pad.left / 2 - 1, py + ph / 2, { angle: 90, align: "center" });
    doc.text("Data da sessão", px + pw / 2, y + h - 1, { align: "center" });
}
