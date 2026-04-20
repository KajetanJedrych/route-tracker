"use client"

import { useState, useEffect, useCallback } from "react"
import SummaryCards from "@/components/SummaryCards"
import HeatmapChart from "@/components/HeatmapChart"
import HourlyChart from "@/components/HourlyChart"
import DailyChart from "@/components/DailyChart"
import CollectionLog from "@/components/CollectionLog"

export type RouteId = "route1" | "route2"

export interface SummaryData {
  id: RouteId
  label: string
  collectWindow: string
  totalEntries: number
  latestTimestamp: string | null
  latestDelaySeconds: number | null
  avgDelaySeconds: number
  maxDelaySeconds: number
}

export default function HomePage() {
  const [activeRoute, setActiveRoute] = useState<RouteId>("route1")
  const [summary, setSummary] = useState<SummaryData[]>([])
  const [heatmap, setHeatmap] = useState([])
  const [hourly, setHourly] = useState([])
  const [daily, setDaily] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      const [sumRes, hmRes, hrRes, dayRes] = await Promise.all([
        fetch("/api/data?view=summary"),
        fetch(`/api/data?view=heatmap&route=${activeRoute}`),
        fetch(`/api/data?view=hourly&route=${activeRoute}`),
        fetch(`/api/data?view=daily&route=${activeRoute}`),
      ])
      const [sumData, hmData, hrData, dayData] = await Promise.all([
        sumRes.json(),
        hmRes.json(),
        hrRes.json(),
        dayRes.json(),
      ])
      setSummary(sumData)
      setHeatmap(hmData)
      setHourly(hrData)
      setDaily(dayData)
      setLastRefresh(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [activeRoute])

  useEffect(() => {
    setLoading(true)
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    const id = setInterval(fetchAll, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [fetchAll])

  const activeLabel = summary.find((s) => s.id === activeRoute)?.label ?? activeRoute

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-[#e8e6e1] font-mono">
      <header className="border-b border-[#1e1e2e] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[#6ee7b7] text-lg font-bold tracking-widest uppercase">
            ◈ RouteTracker
          </span>
          <span className="text-[#444] text-xs">/ commute intelligence</span>
        </div>
        <div className="flex items-center gap-4">
          {lastRefresh && (
            <span className="text-[#444] text-xs">
              refreshed {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchAll}
            className="text-xs border border-[#2a2a3e] px-3 py-1 text-[#6ee7b7] hover:bg-[#1a1a2e] transition-colors"
          >
            ↻ refresh
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <SummaryCards summary={summary} activeRoute={activeRoute} />

        <div className="flex gap-0 border border-[#1e1e2e] w-fit">
          {(["route1", "route2"] as RouteId[]).map((r) => {
            const label = summary.find((s) => s.id === r)?.label ?? r
            return (
              <button
                key={r}
                onClick={() => setActiveRoute(r)}
                className={`px-6 py-2 text-xs uppercase tracking-widest transition-colors ${
                  activeRoute === r
                    ? "bg-[#6ee7b7] text-[#0a0a0f] font-bold"
                    : "text-[#666] hover:text-[#aaa] hover:bg-[#111]"
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-[#444] text-sm tracking-widest">
            loading data…
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <div className="mb-4 flex items-baseline gap-3">
                <h2 className="text-sm uppercase tracking-[0.2em] text-[#6ee7b7]">Delay heatmap</h2>
                <span className="text-xs text-[#444]">avg extra minutes per slot · {activeLabel}</span>
              </div>
              <HeatmapChart data={heatmap} />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section>
                <div className="mb-4 flex items-baseline gap-3">
                  <h2 className="text-sm uppercase tracking-[0.2em] text-[#6ee7b7]">By hour</h2>
                  <span className="text-xs text-[#444]">avg delay in minutes</span>
                </div>
                <HourlyChart data={hourly} />
              </section>
              <section>
                <div className="mb-4 flex items-baseline gap-3">
                  <h2 className="text-sm uppercase tracking-[0.2em] text-[#6ee7b7]">By day</h2>
                  <span className="text-xs text-[#444]">avg travel time in minutes</span>
                </div>
                <DailyChart data={daily} />
              </section>
            </div>

            <section>
              <div className="mb-4 flex items-baseline gap-3">
                <h2 className="text-sm uppercase tracking-[0.2em] text-[#6ee7b7]">Collection log</h2>
                <span className="text-xs text-[#444]">last 50 raw entries</span>
              </div>
              <CollectionLog routeId={activeRoute} />
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
