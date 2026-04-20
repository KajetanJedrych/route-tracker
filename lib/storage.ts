import fs from "fs"
import path from "path"
import { RouteEntry } from "./types"

const DATA_DIR = path.join(process.cwd(), "data")
const BUDGET_FILE = path.join(DATA_DIR, "budget.json")
export const MONTHLY_BUDGET = 1000

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function filePath(routeId: "route1" | "route2"): string {
  return path.join(DATA_DIR, `${routeId}.json`)
}

function budgetKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function readBudget(): Record<string, number> {
  ensureDataDir()
  if (!fs.existsSync(BUDGET_FILE)) return {}
  try {
    return JSON.parse(fs.readFileSync(BUDGET_FILE, "utf-8"))
  } catch {
    return {}
  }
}

export function getMonthlyCallCount(date: Date): number {
  return readBudget()[budgetKey(date)] ?? 0
}

export function incrementMonthlyCallCount(date: Date): void {
  const budget = readBudget()
  const key = budgetKey(date)
  budget[key] = (budget[key] ?? 0) + 1
  fs.writeFileSync(BUDGET_FILE, JSON.stringify(budget, null, 2), "utf-8")
}

export function readEntries(routeId: "route1" | "route2"): RouteEntry[] {
  ensureDataDir()
  const fp = filePath(routeId)
  if (!fs.existsSync(fp)) return []
  try {
    const raw = fs.readFileSync(fp, "utf-8")
    return JSON.parse(raw) as RouteEntry[]
  } catch {
    return []
  }
}

export function appendEntry(entry: RouteEntry): void {
  ensureDataDir()
  const entries = readEntries(entry.route)
  entries.push(entry)
  fs.writeFileSync(filePath(entry.route), JSON.stringify(entries, null, 2), "utf-8")
}

export function readAllEntries(): RouteEntry[] {
  return [...readEntries("route1"), ...readEntries("route2")]
}

// ── aggregation helpers ────────────────────────────────────────────────────

export interface HeatmapCell {
  day: number      // 1–5
  dayName: string
  hour: number
  avg_delay: number
  count: number
}

export interface HourlyAvg {
  hour: number
  avg_delay: number
  avg_duration_traffic: number
  count: number
}

export interface DailyAvg {
  day: number
  dayName: string
  avg_delay: number
  avg_duration_traffic: number
  count: number
}

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

export function buildHeatmap(entries: RouteEntry[]): HeatmapCell[] {
  const map = new Map<string, { total: number; count: number; dayName: string }>()

  for (const e of entries) {
    const key = `${e.day_of_week}-${e.hour}`
    const existing = map.get(key) ?? { total: 0, count: 0, dayName: DAY_NAMES[e.day_of_week] }
    existing.total += e.delay_seconds
    existing.count += 1
    map.set(key, existing)
  }

  const cells: HeatmapCell[] = []
  map.forEach((val, key) => {
    const [day, hour] = key.split("-").map(Number)
    cells.push({
      day,
      dayName: val.dayName,
      hour,
      avg_delay: Math.round(val.total / val.count),
      count: val.count,
    })
  })

  return cells.sort((a, b) => a.day - b.day || a.hour - b.hour)
}

export function buildHourlyAvg(entries: RouteEntry[]): HourlyAvg[] {
  const map = new Map<number, { totalDelay: number; totalTraffic: number; count: number }>()

  for (const e of entries) {
    const existing = map.get(e.hour) ?? { totalDelay: 0, totalTraffic: 0, count: 0 }
    existing.totalDelay += e.delay_seconds
    existing.totalTraffic += e.duration_traffic_seconds
    existing.count += 1
    map.set(e.hour, existing)
  }

  return Array.from(map.entries())
    .map(([hour, val]) => ({
      hour,
      avg_delay: Math.round(val.totalDelay / val.count),
      avg_duration_traffic: Math.round(val.totalTraffic / val.count),
      count: val.count,
    }))
    .sort((a, b) => a.hour - b.hour)
}

export function buildDailyAvg(entries: RouteEntry[]): DailyAvg[] {
  const map = new Map<number, { totalDelay: number; totalTraffic: number; count: number }>()

  for (const e of entries) {
    const existing = map.get(e.day_of_week) ?? { totalDelay: 0, totalTraffic: 0, count: 0 }
    existing.totalDelay += e.delay_seconds
    existing.totalTraffic += e.duration_traffic_seconds
    existing.count += 1
    map.set(e.day_of_week, existing)
  }

  return Array.from(map.entries())
    .map(([day, val]) => ({
      day,
      dayName: DAY_NAMES[day],
      avg_delay: Math.round(val.totalDelay / val.count),
      avg_duration_traffic: Math.round(val.totalTraffic / val.count),
      count: val.count,
    }))
    .sort((a, b) => a.day - b.day)
}
