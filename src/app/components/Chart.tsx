"use client"

import type { Session } from "../utils/parser"
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    Tooltip,
    ErrorBar,
    CartesianGrid,
} from "recharts";

type ChartPoint = {
    x: number;
    y: number;
    error: number;
}

interface ChartProps {
    sessions: Session[] | null
}

function Chart({ sessions }: ChartProps) {
    const chartData = sessions?.flatMap(session => {
        session.data.map(p => ({
            x: p.jd,
            y: p.magnitude,
            error: p.error
        }));
    });

     return (
        <ScatterChart width={700} height={400}>
            <CartesianGrid />
        
            <XAxis
                type="number"
                dataKey="x"
                name="Julian Date"
            />
        
            <YAxis
                type="number"
                dataKey="y"
                name="Magnitude"
                reversed
            />
        
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
        
            <Scatter data={chartData} fill="#8884d8">
                <ErrorBar
                dataKey="error"
                width={4}
                strokeWidth={1}
                />
            </Scatter>
        </ScatterChart>
      );
}

export default Chart;