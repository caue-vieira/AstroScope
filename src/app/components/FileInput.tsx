"use client"

import { useState } from "react"
import { groupByFilter, readALCDEFFile } from "../utils/parser";
import Chart from "./Chart";

type FileInputProps = {
    onDataLoaded: (data: any) => void;
}

function FileInput({ onDataLoaded }: FileInputProps) {
    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;

        const text = await file.text();

        const sessions = readALCDEFFile(text);
        const grouped = groupByFilter("month", sessions);

        console.log("Sessões:", sessions);
        console.log("Agrupados:", grouped);

        onDataLoaded(sessions);
    }

    return (
        <div>
            <input type="file" accept=".txt" onChange={handleFile} />
        </div>
    )
}

export default FileInput;