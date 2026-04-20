import { NextRequest, NextResponse } from "next/server"
import { getRouteConfigs } from "@/lib/types"
import { fetchRouteData } from "@/lib/google-routes"
import { appendEntry } from "@/lib/storage"

// This endpoint is called by the external cron job (crontab / systemd timer)
// every 10 minutes Mon–Fri 04:50–20:00.
// Protect it with a shared secret so it can't be triggered by random requests.

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const dayOfWeek = now.getDay() // 0=Sun, 6=Sat
  const hour = now.getHours()

  // Only collect on weekdays
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return NextResponse.json({ skipped: "weekend" })
  }

  const configs = getRouteConfigs()
  const results: Array<{ route: string; status: string; error?: string }> = []

  for (const config of configs) {
    // Check if current hour is within collection window for this route
    if (hour < config.collectFromHour || hour >= config.collectToHour) {
      results.push({ route: config.id, status: "outside_window" })
      continue
    }

    try {
      const entry = await fetchRouteData(config, now)
      if (entry) {
        appendEntry(entry)
        results.push({ route: config.id, status: "ok" })
      } else {
        results.push({ route: config.id, status: "no_data" })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[collect] ${config.id} error:`, message)
      results.push({ route: config.id, status: "error", error: message })
    }
  }

  return NextResponse.json({ timestamp: now.toISOString(), results })
}

// Allow GET for quick manual test in browser (still requires secret via query param)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get("secret")
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Reuse POST logic
  const mockReq = new NextRequest(req.url, {
    method: "POST",
    headers: { "x-cron-secret": process.env.CRON_SECRET ?? "" },
  })
  return POST(mockReq)
}
