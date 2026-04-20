import { NextResponse } from "next/server"
import { readEntries } from "@/lib/storage"
import { getRouteConfigs } from "@/lib/types"

export async function GET() {
  const configs = getRouteConfigs()

  const status = configs.map((c) => {
    const entries = readEntries(c.id)
    const latest = entries[entries.length - 1] ?? null
    return {
      route: c.id,
      label: c.label,
      totalEntries: entries.length,
      latestTimestamp: latest?.timestamp ?? null,
      latestDelaySec: latest?.delay_seconds ?? null,
      latestDurationMin: latest
        ? Math.round(latest.duration_traffic_seconds / 60)
        : null,
    }
  })

  return NextResponse.json({
    serverTime: new Date().toISOString(),
    routes: status,
  })
}
