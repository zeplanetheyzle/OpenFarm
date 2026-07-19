"use client"

import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts"

interface Props {
  graph: number
  table: number}

export default function PreferencePieChart({ graph, table }: Props) {
  const total = graph + table

  const COLORS = ["#3b82f6", "#f59e0b", "#10b981"]

  // 전체 0이면 회색 빈 원
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
        <Legend
          payload={[
            { value: "Graph", color: COLORS[0], type: "circle" as const },
            { value: "Table", color: COLORS[1], type: "circle" as const },
          ]}
        />
      </PieChart>
    )
  }

  const data = [
    { name: "Graph", value: graph },
    { name: "Table", value: table },
  ]

  return (
    <PieChart width={500} height={350}>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        outerRadius={120}
        dataKey="value"
        label
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