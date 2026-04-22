"use client"

import { useState } from "react"
import { groupByMonth, readALCDEFFile } from "../utils/parser";
import Chart from "./Chart";

function FileInput() {
    const [data, setData] = useState<any>(null);

    const handleFile = async(e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;

        const text = await file.text();

        const sessions = readALCDEFFile(text);
        const grouped = groupByMonth(sessions);

        console.log("Sessões:", sessions);
        console.log("Agrupados por mês:", grouped);

        setData(grouped);
    };

    return (
        <div>
            <input type="file" accept=".txt" onChange={handleFile} />
            <Chart sessions={data} />
        </div>
    )
}

export default FileInput;