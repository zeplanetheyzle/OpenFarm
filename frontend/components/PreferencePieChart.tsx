"use client"

import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts"

interface Props {
  graph: number
  table: number
}

export default function PreferencePieChart({ graph, table }: Props) {
  const total = graph + table
  const COLORS = ["#3b82f6", "#f59e0b"]

  if (total === 0) {
    return (
      <PieChart width={500} height={350}>
        <Pie
          data={[{ name: "없음", value: 1 }]}
          cx="50%"
          cy="50%"
          outerRadius={120}
          dataKey="value"
        >
          <Cell fill="#e5e7eb" />
        </Pie>
        <Legend />
      </PieChart>
    )
  }

  const data = [
    { name: `Graph (${graph}회)`, value: graph },
    { name: `Table (${table}회)`, value: table },
  ]

  return (
    <PieChart width={500} height={350}>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        outerRadius={120}
        dataKey="value"
        label={({ value }: { value?: number }) =>
          value !== undefined ? `${((value / total) * 100).toFixed(1)}%` : ""
        }
      >
        {data.map((entry, index) => (
          <Cell key={index} fill={COLORS[index]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  )
}