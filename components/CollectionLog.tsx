"use client"

import { useEffect, useState } from "react"
import { RouteId } from "@/app/page"

interface Entry {
  timestamp: string
  day_name: string
  hour: number
  minute: number
  duration_seconds: number
  duration_traffic_seconds: number
  delay_seconds: number
  distance_meters: number
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

function delayClass(sec: number) {
  if (sec < 120) return "text-[#6ee7b7]"
  if (sec < 360) return "text-[#fbbf24]"
  return "text-[#f87171]"
}

export default function CollectionLog({ routeId }: { routeId: RouteId }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/data?view=raw&route=${routeId}&limit=50`)
      .then((r) => r.json())
      .then((data) => setEntries([...data].reverse()))
      .finally(() => setLoading(false))
  }, [routeId])

  if (loading)
    return (
      <div className="bg-[#0d0d12] border border-[#1e1e2e] p-4 text-[#333] text-xs">
        loading…
      </div>
    )

  if (!entries.length)
    return (
      <div className="bg-[#0d0d12] border border-[#1e1e2e] p-4 text-[#333] text-xs">
        no entries yet
      </div>
    )

  return (
    <div className="bg-[#0d0d12] border border-[#1e1e2e] overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-[#1a1a2a] text-[#444] uppercase tracking-widest">
            <th className="text-left px-4 py-2">timestamp</th>
            <th className="text-left px-4 py-2">day</th>
            <th className="text-right px-4 py-2">base</th>
            <th className="text-right px-4 py-2">w/traffic</th>
            <th className="text-right px-4 py-2">delay</th>
            <th className="text-right px-4 py-2">km</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr
              key={i}
              className="border-b border-[#111] hover:bg-[#111] transition-colors"
            >
              <td className="px-4 py-1.5 text-[#555]">
                {new Date(e.timestamp).toLocaleString()}
              </td>
              <td className="px-4 py-1.5 text-[#666]">{e.day_name}</td>
              <td className="px-4 py-1.5 text-right text-[#666]">
                {fmt(e.duration_seconds)}
              </td>
              <td className="px-4 py-1.5 text-right text-[#aaa]">
                {fmt(e.duration_traffic_seconds)}
              </td>
              <td className={`px-4 py-1.5 text-right font-bold ${delayClass(e.delay_seconds)}`}>
                +{fmt(e.delay_seconds)}
              </td>
              <td className="px-4 py-1.5 text-right text-[#444]">
                {(e.distance_meters / 1000).toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
