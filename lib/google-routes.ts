import { RouteConfig, RouteEntry } from "./types"

interface RoutesApiResponse {
  routes: Array<{
    duration: string          // e.g. "1820s"
    staticDuration: string    // without traffic
    distanceMeters: number
  }>
}

function parseDuration(d: string): number {
  // Google returns durations as "NNNs" (seconds with trailing s)
  return parseInt(d.replace("s", ""), 10)
}

export async function fetchRouteData(
  config: RouteConfig,
  now: Date
): Promise<RouteEntry | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY is not set")

  const body = {
    origin: {
      location: {
        latLng: { latitude: config.originLat, longitude: config.originLng },
      },
    },
    destination: {
      location: {
        latLng: { latitude: config.destLat, longitude: config.destLng },
      },
    },
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE_OPTIMAL",
    departureTime: new Date(now.getTime() + 2 * 60_000).toISOString(),
  }

  const res = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        // Request only the fields we need — reduces billing SKU surface
        "X-Goog-FieldMask": "routes.duration,routes.staticDuration,routes.distanceMeters",
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Routes API error ${res.status}: ${text}`)
  }

  const data: RoutesApiResponse = await res.json()
  const route = data.routes?.[0]
  if (!route) return null

  const durationTraffic = parseDuration(route.duration)
  const durationBase = parseDuration(route.staticDuration)

  const dayOfWeek = now.getDay() // 0=Sun … 6=Sat; Mon=1
  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  return {
    timestamp: now.toISOString(),
    day_of_week: dayOfWeek,
    day_name: DAY_NAMES[dayOfWeek],
    hour: now.getHours(),
    minute: now.getMinutes(),
    duration_seconds: durationBase,
    duration_traffic_seconds: durationTraffic,
    delay_seconds: Math.max(0, durationTraffic - durationBase),
    distance_meters: route.distanceMeters,
    route: config.id,
  }
}
