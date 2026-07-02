"use client";

import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ErrorBar,
    ResponsiveContainer,
    type TooltipProps,
} from "recharts";
import type { ChartPoint } from "../utils/parser";

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface CustomTooltipProps extends Omit<TooltipProps<number, string>, 'payload'> {
    payload?: Array<{ payload: ChartPoint }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload as ChartPoint;
    return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
            <p className="font-semibold text-foreground mb-1">{d.sessionDate}</p>
            <p className="text-muted-foreground">
                Magnitude:{" "}
                <span className="text-foreground font-mono">
                    {d.magnitude.toFixed(3)}
                </span>
            </p>
            <p className="text-muted-foreground">
                ± erro:{" "}
                <span className="text-foreground font-mono">
                    {d.errorUp.toFixed(3)}
                </span>
            </p>
            <p className="text-muted-foreground">
                N pontos:{" "}
                <span className="text-foreground font-mono">{d.n}</span>
            </p>
        </div>
    );
}

// ─── Chart ────────────────────────────────────────────────────────────────────

interface ChartProps {
    data: ChartPoint[];
}

export default function Chart({ data }: ChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                Nenhum dado para exibir no intervalo selecionado.
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={450}>
            <ScatterChart margin={{ top: 16, right: 32, bottom: 48, left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />

                <XAxis
                    dataKey="sessionDate"
                    type="category"
                    name="Data"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    angle={-40}
                    textAnchor="end"
                    interval={0}
                    height={60}
                    label={{
                        value: "Data da sessão",
                        position: "insideBottom",
                        offset: -12,
                        fontSize: 12,
                        fill: "var(--muted-foreground)",
                    }}
                />

                <YAxis
                    dataKey="magnitude"
                    type="number"
                    name="Magnitude"
                    reversed
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickFormatter={(v: number) => v.toFixed(2)}
                    label={{
                        value: "Magnitude",
                        angle: -90,
                        position: "insideLeft",
                        offset: 8,
                        fontSize: 12,
                        fill: "var(--muted-foreground)",
                    }}
                    domain={["auto", "auto"]}
                />

                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />

                <Scatter
                    data={data}
                    fill="var(--chart-1)"
                    opacity={0.85}
                    shape="circle"
                >
                    <ErrorBar
                        dataKey="errorUp"
                        width={4}
                        strokeWidth={1.5}
                        stroke="var(--chart-2)"
                        direction="y"
                    />
                </Scatter>
            </ScatterChart>
        </ResponsiveContainer>
    );
}