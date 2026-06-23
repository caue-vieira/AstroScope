"use client";

import type { DateRange } from "./LightCurveStore";

interface DateRangePickerProps {
    bounds: { min: string; max: string };
    value: DateRange | null;
    onChange: (range: DateRange | null) => void;
}

export default function DateRangePicker({
    bounds,
    value,
    onChange,
}: DateRangePickerProps) {
    const from = value?.from ?? bounds.min;
    const to = value?.to ?? bounds.max;

    function handleFrom(e: React.ChangeEvent<HTMLInputElement>) {
        const next = e.target.value;
        if (next > to) return; // impede inversão
        onChange({ from: next, to });
    }

    function handleTo(e: React.ChangeEvent<HTMLInputElement>) {
        const next = e.target.value;
        if (next < from) return;
        onChange({ from, to: next });
    }

    function handleReset() {
        onChange(null);
    }

    const isFiltered = value !== null;

    return (
        <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-muted-foreground font-medium">Filtrar por data:</span>

            <label className="flex items-center gap-1.5">
                <span className="text-muted-foreground">De</span>
                <input
                    type="date"
                    value={from}
                    min={bounds.min}
                    max={bounds.max}
                    onChange={handleFrom}
                    className="
                        bg-card border border-border rounded-md px-2 py-1
                        text-foreground text-sm
                        focus:outline-none focus:ring-2 focus:ring-ring
                        dark:[color-scheme:dark]
                    "
                />
            </label>

            <label className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Até</span>
                <input
                    type="date"
                    value={to}
                    min={bounds.min}
                    max={bounds.max}
                    onChange={handleTo}
                    className="
                        bg-card border border-border rounded-md px-2 py-1
                        text-foreground text-sm
                        focus:outline-none focus:ring-2 focus:ring-ring
                        dark:[color-scheme:dark]
                    "
                />
            </label>

            {isFiltered && (
                <button
                    type="button"
                    onClick={handleReset}
                    className="
                        px-2.5 py-1 rounded-md text-xs border border-border
                        text-muted-foreground hover:text-foreground hover:bg-muted
                        transition-colors
                    "
                >
                    Limpar filtro
                </button>
            )}
        </div>
    );
}
