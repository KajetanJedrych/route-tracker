"use client"

interface HeatmapCell {
  day: number
  dayName: string
  hour: number
  avg_delay: number
  count: number
}

const DAYS = [
  { n: 1, short: "Mon" },
  { n: 2, short: "Tue" },
  { n: 3, short: "Wed" },
  { n: 4, short: "Thu" },
  { n: 5, short: "Fri" },
]

function delayColor(sec: number, max: number): string {
  if (max === 0 || sec === 0) return "#111827"
  const ratio = Math.min(sec / max, 1)
  // dark green → yellow → red
  if (ratio < 0.33) {
    const t = ratio / 0.33
    const g = Math.round(120 + t * (180 - 120))
    return `rgb(20, ${g}, 60)`
  } else if (ratio < 0.66) {
    const t = (ratio - 0.33) / 0.33
    const r = Math.round(t * 240)
    return `rgb(${r}, 160, 20)`
  } else {
    const t = (ratio - 0.66) / 0.34
    const g = Math.round(100 - t * 80)
    return `rgb(220, ${g}, 20)`
  }
}

function fmtMin(sec: number) {
  const m = Math.round(sec / 60)
  return `${m}m`
}

export default function HeatmapChart({ data }: { data: HeatmapCell[] }) {
  if (!data.length) {
    return <EmptyState />
  }

  // Determine hour range from data
  const hours = Array.from(new Set(data.map((d) => d.hour))).sort((a, b) => a - b)
  const maxDelay = Math.max(...data.map((d) => d.avg_delay))

  const cellMap = new Map<string, HeatmapCell>()
  data.forEach((d) => cellMap.set(`${d.day}-${d.hour}`, d))

  return (
    <div className="bg-[#0d0d12] border border-[#1e1e2e] p-4 overflow-x-auto">
      <div
        className="grid gap-0.5"
        style={{
          gridTemplateColumns: `48px repeat(${hours.length}, minmax(36px, 1fr))`,
          minWidth: hours.length * 38 + 50,
        }}
      >
        {/* Header row */}
        <div />
        {hours.map((h) => (
          <div key={h} className="text-center text-[10px] text-[#444] pb-1">
            {h}:00
          </div>
        ))}

        {/* Day rows */}
        {DAYS.map(({ n, short }) => (
          <>
            <div
              key={`label-${n}`}
              className="flex items-center text-[11px] text-[#555] pr-2"
            >
              {short}
            </div>
            {hours.map((h) => {
              const cell = cellMap.get(`${n}-${h}`)
              const bg = cell ? delayColor(cell.avg_delay, maxDelay) : "#0d0d12"
              return (
                <div
                  key={`${n}-${h}`}
                  title={
                    cell
                      ? `${cell.dayName} ${h}:00 — avg delay: ${fmtMin(cell.avg_delay)} (${cell.count} samples)`
                      : "no data"
                  }
                  className="h-8 rounded-sm relative group cursor-default"
                  style={{ backgroundColor: bg }}
                >
                  {cell && cell.avg_delay > 0 && (
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/70">
                      {fmtMin(cell.avg_delay)}
                    </span>
                  )}
                  {/* tooltip */}
                  {cell && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10 bg-[#1a1a2e] border border-[#333] px-2 py-1 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {cell.dayName} {h}:00<br />
                      delay: <span className="text-[#6ee7b7]">{fmtMin(cell.avg_delay)}</span>
                      <br />
                      samples: {cell.count}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-[10px] text-[#333]">delay:</span>
        <div
          className="h-2 w-32 rounded-sm"
          style={{
            background:
              "linear-gradient(to right, rgb(20,150,60), rgb(200,160,20), rgb(220,30,20))",
          }}
        />
        <span className="text-[10px] text-[#333]">low → high</span>
        <span className="text-[10px] text-[#222] ml-4">max: {fmtMin(maxDelay)}</span>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-[#0d0d12] border border-[#1e1e2e] p-8 text-center">
      <p className="text-[#333] text-sm">no data collected yet</p>
      <p className="text-[#222] text-xs mt-1">
        data will appear once the cron job starts collecting
      </p>
    </div>
  )
}
