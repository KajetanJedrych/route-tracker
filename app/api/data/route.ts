import { NextRequest, NextResponse } from "next/server"
import { readEntries, buildHeatmap, buildHourlyAvg, buildDailyAvg } from "@/lib/storage"
import { getRouteConfigs } from "@/lib/types"

type RouteId = "route1" | "route2"

function isRouteId(val: string | null): val is RouteId {
  return val === "route1" || val === "route2"
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const view = searchParams.get("view")
  const routeParam = searchParams.get("route")
  const limit = parseInt(searchParams.get("limit") ?? "50", 10)

  if (view === "summary") {
    const configs = getRouteConfigs()
    const summary = configs.map((config) => {
      const entries = readEntries(config.id)
      const latest = entries.at(-1) ?? null
      const totalDelay = entries.reduce((sum, e) => sum + e.delay_seconds, 0)
      const maxDelay = entries.reduce((max, e) => Math.max(max, e.delay_seconds), 0)
      return {
        id: config.id,
        label: config.label,
        collectWindow: `${config.collectFromHour}:00–${config.collectToHour}:00`,
        totalEntries: entries.length,
        latestTimestamp: latest?.timestamp ?? null,
        latestDelaySeconds: latest?.delay_seconds ?? null,
        avgDelaySeconds: entries.length ? Math.round(totalDelay / entries.length) : 0,
        maxDelaySeconds: maxDelay,
      }
    })
    return NextResponse.json(summary)
  }

  if (!isRouteId(routeParam)) {
    return NextResponse.json({ error: "Missing or invalid route parameter" }, { status: 400 })
  }

  const entries = readEntries(routeParam)

  if (view === "heatmap") return NextResponse.json(buildHeatmap(entries))
  if (view === "hourly") return NextResponse.json(buildHourlyAvg(entries))
  if (view === "daily") return NextResponse.json(buildDailyAvg(entries))
  if (view === "raw") return NextResponse.json(entries.slice(-limit))

  return NextResponse.json({ error: "Invalid view parameter" }, { status: 400 })
}
