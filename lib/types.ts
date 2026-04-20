export interface RouteEntry {
  timestamp: string        // ISO 8601 with timezone
  day_of_week: number      // 1=Mon … 5=Fri
  day_name: string         // "Monday" … "Friday"
  hour: number
  minute: number
  duration_seconds: number         // baseline without traffic
  duration_traffic_seconds: number // with live traffic
  delay_seconds: number            // difference = actual delay
  distance_meters: number
  route: "route1" | "route2"
}

export interface RouteConfig {
  id: "route1" | "route2"
  label: string
  originLat: number
  originLng: number
  destLat: number
  destLng: number
  collectFromHour: number  // inclusive
  collectToHour: number    // exclusive
}

export function getRouteConfigs(): RouteConfig[] {
  return [
    {
      id: "route1",
      label: process.env.ROUTE_1_LABEL ?? "Route 1",
      originLat: parseFloat(process.env.ROUTE_1_ORIGIN_LAT ?? "52.2297"),
      originLng: parseFloat(process.env.ROUTE_1_ORIGIN_LNG ?? "21.0122"),
      destLat: parseFloat(process.env.ROUTE_1_DEST_LAT ?? "52.4064"),
      destLng: parseFloat(process.env.ROUTE_1_DEST_LNG ?? "16.9252"),
      collectFromHour: 5,
      collectToHour: 12,
    },
    {
      id: "route2",
      label: process.env.ROUTE_2_LABEL ?? "Route 2",
      originLat: parseFloat(process.env.ROUTE_2_ORIGIN_LAT ?? "52.4064"),
      originLng: parseFloat(process.env.ROUTE_2_ORIGIN_LNG ?? "16.9252"),
      destLat: parseFloat(process.env.ROUTE_2_DEST_LAT ?? "52.2297"),
      destLng: parseFloat(process.env.ROUTE_2_DEST_LNG ?? "21.0122"),
      collectFromHour: 12,
      collectToHour: 20,
    },
  ]
}
