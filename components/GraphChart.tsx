"use client"

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts"

interface Props {
    data: any[]
}

export default function GraphChart({
    data
}: Props) {

    return (

        <div className="w-full h-[400px] bg-white rounded-3xl shadow-xl p-10">

            <h1 className="text-3xl font-bold mb-10">
                Environment Graph
            </h1>

            <ResponsiveContainer width="100%" height={300}>

                <LineChart data={data}>

                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis 
                        dataKey="created_at"
                        tickFormatter={(value) => new Date(value).toLocaleTimeString() }
                    />
                    <YAxis />

                    <Tooltip />

                    <Line
                        type="monotone"
                        dataKey="temperature"
                        stroke="#f97316"
                        strokeWidth={4}
                    />

                    <Line
                        type="monotone"
                        dataKey="temperature2"
                        stroke="#a855f7"
                        strokeWidth={4}    
                    />

                    <Line
                        type="monotone"
                        dataKey="humidity"
                        stroke="#3b82f6"
                        strokeWidth={4}
                    />

                    <Line
                        type="monotone"
                        dataKey="co2_level"
                        stroke="#10b981"
                        strokeWidth={4}
                    />

                </LineChart>

            </ResponsiveContainer>

        </div>
    )
}