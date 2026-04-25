import { useEffect, useState } from "react";
import FileInput from "../components/FileInput";
import Chart from "../components/Chart";
import { groupByFilter, Session } from "../utils/parser";

function LightCurve() {
    const [data, setData] = useState<any>(null);
    const [groupedData, setGroupedData] = useState<any>(null);

    useEffect(() => {
        if(data !== null) {
            const filtered = getFirstSessionPerMonth(data);
            setGroupedData(filtered);
        }
    }, [data]);

    function formatDate(date: Date) {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
      
        return `${day}/${month}/${year}`;
    }

    function getFirstSessionPerMonth(sessions: Session[]) {
        const grouped = groupByFilter("month", sessions);

        const result: Session[] = [];

        Object.entries(grouped).forEach(([month, points]) => {
            if(points.length === 0) return;

            const first = points[0];

            result.push({
                sessionDate: formatDate(first.date),
                data: [points[0]]
            });
        });

        return result;
    }

    return (
        <>
            <FileInput onDataLoaded={setData} />
            {groupedData && (
                <Chart sessions={groupedData} />
            )}
        </>
    )
}

export default LightCurve;