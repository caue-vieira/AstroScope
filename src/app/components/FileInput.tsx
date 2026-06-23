"use client";

import { useRef } from "react";
import { readALCDEFFile } from "../utils/parser";
import type { Session } from "../utils/parser";

type FileInputProps = {
    onDataLoaded: (sessions: Session[]) => void;
    hasData: boolean;
};

export default function FileInput({ onDataLoaded, hasData }: FileInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        const sessions = readALCDEFFile(text);
        onDataLoaded(sessions);

        // reset so the same file can be re-imported
        if (inputRef.current) inputRef.current.value = "";
    }

    return (
        <div className="flex items-center gap-3">
            <label
                className="
                    cursor-pointer inline-flex items-center gap-2
                    px-4 py-2 rounded-lg border border-border
                    bg-card hover:bg-muted text-sm text-foreground
                    transition-colors select-none
                "
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {hasData ? "Carregar outro arquivo" : "Carregar arquivo ALCDEF (.txt)"}
                <input
                    ref={inputRef}
                    type="file"
                    accept=".txt"
                    onChange={handleFile}
                    className="sr-only"
                />
            </label>
        </div>
    );
}
