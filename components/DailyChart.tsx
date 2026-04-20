"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface DailyAvg {
  day: number
  dayName: string
  avg_delay: number
  avg_duration_traffic: number
  count: number
}

const SHORT_DAY: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
}

export default function DailyChart({ data }: { data: DailyAvg[] }) {
  if (!data.length) return <EmptyState />

  const maxDelay = Math.max(...data.map((d) => d.avg_delay))

  const chartData = data.map((d) => ({
    day: SHORT_DAY[d.dayName] ?? d.dayName,
    "Travel time (min)": Math.round(d.avg_duration_traffic / 60),
    "Avg delay (min)": Math.round(d.avg_delay / 60),
    rawDelay: d.avg_delay,
    count: d.count,
  }))

  return (
    <div className="bg-[#0d0d12] border border-[#1e1e2e] p-4 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2a" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: "#444", fontSize: 11 }}
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
          <Bar dataKey="Travel time (min)" radius={[2, 2, 0, 0]}>
            {chartData.map((entry, idx) => (
              <Cell
                key={idx}
                fill={entry.rawDelay === maxDelay ? "#f87171" : "#6ee7b7"}
                fillOpacity={0.7}
              />
            ))}
          </Bar>
        </BarChart>
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
