"use client"

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend
} from "recharts"

interface Props {

    graph: number

    table: number

    report: number
}

export default function PreferencePieChart({

    graph,

    table,

    report

}: Props) {

    const data = [

        {
            name: "Graph",
            value: graph
        },

        {
            name: "Table",
            value: table
        },

        {
            name: "Report",
            value: report
        }
    ]

    const COLORS = [

        "#3b82f6",

        "#f59e0b",

        "#10b981"
    ]

    return (

        <PieChart
            width={500}
            height={350}
        >

            <Pie

                data={data}

                cx="50%"

                cy="50%"

                outerRadius={120}

                dataKey="value"

                label
            >

                {

                    data.map(

                        (

                            entry,

                            index

                        ) => (

                            <Cell

                                key={index}

                                fill={
                                    COLORS[index]
                                }
                            />
                        )
                    )
                }

            </Pie>

            <Tooltip />

            <Legend />

        </PieChart>
    )
}