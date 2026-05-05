import { NextRequest, NextResponse } from "next/server"
import { readEntries, buildHeatmap, buildHourlyAvg, buildDailyAvg, BASE_DURATION_SECONDS } from "@/lib/storage"
import { getRouteConfigs } from "@/lib/types"

type RouteId = "route1" | "route2"

function isRouteId(val: string | null): val is RouteId {
  return val === "route1" || val === "route2"
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const view = searchParams.get("view")
  const routeParam = searchParams.get("route")
  const limit = parseInt(searchParams.get("limit") ?? "9999", 10)

  if (view === "summary") {
    const configs = getRouteConfigs()
    const summary = configs.map((config) => {
      const entries = readEntries(config.id)
      const latest = entries.at(-1) ?? null
      const totalDelay = entries.reduce((sum, e) => sum + Math.max(0, e.duration_traffic_seconds - BASE_DURATION_SECONDS), 0)
      const maxDelay = entries.reduce((max, e) => Math.max(max, Math.max(0, e.duration_traffic_seconds - BASE_DURATION_SECONDS)), 0)
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
  if (view === "raw") {
    const raw = entries.slice(-limit).map((e) => ({
      ...e,
      delay_seconds: Math.max(0, e.duration_traffic_seconds - BASE_DURATION_SECONDS),
    }))
    return NextResponse.json(raw)
  }

  return NextResponse.json({ error: "Invalid view parameter" }, { status: 400 })
}
