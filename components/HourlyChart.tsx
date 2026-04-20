"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface HourlyAvg {
  hour: number
  avg_delay: number
  avg_duration_traffic: number
  count: number
}

export default function HourlyChart({ data }: { data: HourlyAvg[] }) {
  if (!data.length) return <EmptyState />

  const chartData = data.map((d) => ({
    hour: `${d.hour}:00`,
    "Avg delay (min)": Math.round(d.avg_delay / 60),
    "Travel time (min)": Math.round(d.avg_duration_traffic / 60),
    count: d.count,
  }))

  return (
    <div className="bg-[#0d0d12] border border-[#1e1e2e] p-4 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2a" />
          <XAxis
            dataKey="hour"
            tick={{ fill: "#444", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#444", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#0d0d1a",
              border: "1px solid #2a2a3e",
              borderRadius: 0,
              fontSize: 11,
              fontFamily: "monospace",
            }}
            labelStyle={{ color: "#6ee7b7" }}
            itemStyle={{ color: "#e8e6e1" }}
          />
          <Line
            type="monotone"
            dataKey="Avg delay (min)"
            stroke="#f87171"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: "#f87171" }}
          />
          <Line
            type="monotone"
            dataKey="Travel time (min)"
            stroke="#6ee7b7"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: "#6ee7b7" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-[#0d0d12] border border-[#1e1e2e] h-64 flex items-center justify-center">
      <p className="text-[#333] text-sm">no data yet</p>
    </div>
  )
}
