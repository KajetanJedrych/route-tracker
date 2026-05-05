"use client"

import { useEffect, useState, useMemo } from "react"
import { RouteId } from "@/app/page"

interface Entry {
  timestamp: string
  day_name: string
  day_of_week: number
  hour: number
  minute: number
  duration_seconds: number
  duration_traffic_seconds: number
  delay_seconds: number
  distance_meters: number
}

type SortKey = "timestamp" | "duration_traffic_seconds" | "delay_seconds"
type SortDir = "asc" | "desc"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const DAY_NUMS: Record<string, number> = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5 }

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

  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set())
  const [hourFrom, setHourFrom] = useState("")
  const [hourTo, setHourTo] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("timestamp")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  useEffect(() => {
    setLoading(true)
    fetch(`/api/data?view=raw&route=${routeId}`)
      .then((r) => r.json())
      .then((data) => setEntries(data))
      .finally(() => setLoading(false))
  }, [routeId])

  function toggleDay(day: string) {
    setSelectedDays((prev) => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("desc") }
  }

  const filtered = useMemo(() => {
    let rows = entries
    if (selectedDays.size > 0) {
      rows = rows.filter((e) => selectedDays.has(e.day_name))
    }
    if (hourFrom !== "") {
      const from = parseInt(hourFrom, 10)
      rows = rows.filter((e) => e.hour >= from)
    }
    if (hourTo !== "") {
      const to = parseInt(hourTo, 10)
      rows = rows.filter((e) => e.hour < to)
    }
    return [...rows].sort((a, b) => {
      let va: number, vb: number
      if (sortKey === "timestamp") {
        va = new Date(a.timestamp).getTime()
        vb = new Date(b.timestamp).getTime()
      } else {
        va = a[sortKey]
        vb = b[sortKey]
      }
      return sortDir === "asc" ? va - vb : vb - va
    })
  }, [entries, selectedDays, hourFrom, hourTo, sortKey, sortDir])

  function SortIndicator({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="text-[#333] ml-1">⇅</span>
    return <span className="text-[#6ee7b7] ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
  }

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

  const hours = Array.from({ length: 19 }, (_, i) => i + 5)

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="bg-[#0d0d12] border border-[#1e1e2e] px-4 py-3 flex flex-wrap gap-4 items-center">
        <div className="flex gap-1 flex-wrap">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              className={`text-xs px-2 py-1 border transition-colors ${
                selectedDays.has(day)
                  ? "border-[#6ee7b7] text-[#6ee7b7] bg-[#0d2218]"
                  : "border-[#2a2a3e] text-[#555] hover:text-[#aaa]"
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
          {selectedDays.size > 0 && (
            <button
              onClick={() => setSelectedDays(new Set())}
              className="text-xs px-2 py-1 border border-[#3a1a1a] text-[#f87171] hover:bg-[#1a0d0d] transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-[#555]">
          <span>hour</span>
          <select
            value={hourFrom}
            onChange={(e) => setHourFrom(e.target.value)}
            className="bg-[#111] border border-[#2a2a3e] text-[#aaa] px-2 py-1 text-xs"
          >
            <option value="">from</option>
            {hours.map((h) => (
              <option key={h} value={h}>{h}:00</option>
            ))}
          </select>
          <select
            value={hourTo}
            onChange={(e) => setHourTo(e.target.value)}
            className="bg-[#111] border border-[#2a2a3e] text-[#aaa] px-2 py-1 text-xs"
          >
            <option value="">to</option>
            {hours.map((h) => (
              <option key={h} value={h}>{h}:00</option>
            ))}
          </select>
          {(hourFrom !== "" || hourTo !== "") && (
            <button
              onClick={() => { setHourFrom(""); setHourTo("") }}
              className="text-[#f87171] hover:text-[#fca5a5]"
            >
              ✕
            </button>
          )}
        </div>

        <span className="text-[#444] text-xs ml-auto">{filtered.length} / {entries.length} entries</span>
      </div>

      {/* Table */}
      <div className="bg-[#0d0d12] border border-[#1e1e2e] overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-[#1a1a2a] text-[#444] uppercase tracking-widest">
              <th
                className="text-left px-4 py-2 cursor-pointer hover:text-[#888] select-none"
                onClick={() => handleSort("timestamp")}
              >
                date <SortIndicator col="timestamp" />
              </th>
              <th className="text-left px-4 py-2">time</th>
              <th className="text-left px-4 py-2">day</th>
              <th
                className="text-right px-4 py-2 cursor-pointer hover:text-[#888] select-none"
                onClick={() => handleSort("duration_traffic_seconds")}
              >
                w/traffic <SortIndicator col="duration_traffic_seconds" />
              </th>
              <th
                className="text-right px-4 py-2 cursor-pointer hover:text-[#888] select-none"
                onClick={() => handleSort("delay_seconds")}
              >
                delay vs 60m <SortIndicator col="delay_seconds" />
              </th>
              <th className="text-right px-4 py-2">km</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => {
              const d = new Date(e.timestamp)
              const dateStr = d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "2-digit" })
              const timeStr = `${String(e.hour).padStart(2, "0")}:${String(e.minute).padStart(2, "0")}`
              return (
                <tr
                  key={i}
                  className="border-b border-[#111] hover:bg-[#111] transition-colors"
                >
                  <td className="px-4 py-1.5 text-[#555]">{dateStr}</td>
                  <td className="px-4 py-1.5 text-[#555]">{timeStr}</td>
                  <td className="px-4 py-1.5 text-[#666]">{e.day_name}</td>
                  <td className="px-4 py-1.5 text-right text-[#aaa]">
                    {fmt(e.duration_traffic_seconds)}
                  </td>
                  <td className={`px-4 py-1.5 text-right font-bold ${delayClass(e.delay_seconds)}`}>
                    {e.delay_seconds > 0 ? `+${fmt(e.delay_seconds)}` : fmt(0)}
                  </td>
                  <td className="px-4 py-1.5 text-right text-[#444]">
                    {(e.distance_meters / 1000).toFixed(1)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="px-4 py-6 text-center text-[#333] text-xs">no entries match the current filters</div>
        )}
      </div>
    </div>
  )
}
