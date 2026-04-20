"use client"

import { SummaryData, RouteId } from "@/app/page"

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export default function SummaryCards({
  summary,
  activeRoute,
}: {
  summary: SummaryData[]
  activeRoute: RouteId
}) {
  if (!summary.length) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {summary.map((s) => {
        const isActive = s.id === activeRoute
        return (
          <div
            key={s.id}
            className={`border p-5 transition-colors ${
              isActive
                ? "border-[#6ee7b7]/40 bg-[#0d1a14]"
                : "border-[#1e1e2e] bg-[#0d0d12]"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-widest text-[#6ee7b7]">
                {s.label}
              </span>
              <span className="text-xs text-[#333] border border-[#1e1e2e] px-2 py-0.5">
                {s.collectWindow}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Metric label="entries" value={s.totalEntries.toString()} />
              <Metric
                label="avg delay"
                value={s.avgDelaySeconds ? fmt(s.avgDelaySeconds) : "—"}
                accent={s.avgDelaySeconds > 300}
              />
              <Metric
                label="max delay"
                value={s.maxDelaySeconds ? fmt(s.maxDelaySeconds) : "—"}
                accent={s.maxDelaySeconds > 600}
              />
            </div>

            {s.latestTimestamp && (
              <div className="mt-3 pt-3 border-t border-[#1a1a2a] flex items-center justify-between">
                <span className="text-[#333] text-xs">last collection</span>
                <span className="text-[#666] text-xs">
                  {new Date(s.latestTimestamp).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div>
      <div className="text-[#333] text-xs mb-1">{label}</div>
      <div className={`text-lg font-bold ${accent ? "text-[#f87171]" : "text-[#e8e6e1]"}`}>
        {value}
      </div>
    </div>
  )
}
