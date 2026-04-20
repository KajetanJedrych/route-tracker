# RouteTracker

Commute intelligence dashboard. Collects Google Maps travel time data every 10 minutes
(Mon–Fri) and visualises delays, heatmaps, and trends in a Next.js dashboard.

---

## How it works

```
crontab (every 10 min, Mon–Fri 04:50–20:00)
  └─→ POST /api/collect  (protected by CRON_SECRET header)
        └─→ Google Routes API  (TRAFFIC_AWARE_OPTIMAL)
              └─→ appends to data/route1.json or data/route2.json

Browser  →  GET /  →  Next.js dashboard
              └─→ /api/data?view=summary|heatmap|hourly|daily|raw
```

---

## Collection windows

| Route   | Hours               |
|---------|---------------------|
| Route 1 | Mon–Fri 05:00–12:00 |
| Route 2 | Mon–Fri 12:00–20:00 |

---

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your API key and coordinates
npm run dev

# Trigger a manual collection:
curl -X POST http://localhost:3000/api/collect \
  -H "x-cron-secret: changeme_random_secret"
```


## Environment variables

| Variable                  | Description                              |
|---------------------------|------------------------------------------|
| `GOOGLE_MAPS_API_KEY`     | Google Cloud Routes API key              |
| `ROUTE_1_ORIGIN_LAT/LNG` | Route 1 start coordinates                |
| `ROUTE_1_DEST_LAT/LNG`   | Route 1 end coordinates                  |
| `ROUTE_1_LABEL`           | Display name e.g. "Home → Work"          |
| `ROUTE_2_ORIGIN_LAT/LNG` | Route 2 start coordinates                |
| `ROUTE_2_DEST_LAT/LNG`   | Route 2 end coordinates                  |
| `ROUTE_2_LABEL`           | Display name e.g. "Work → Home"          |
| `CRON_SECRET`             | Shared secret protecting /api/collect    |

---

## Data format

Each entry in `data/route1.json` / `data/route2.json`:

```json
{
  "timestamp": "2026-04-14T07:30:00.000Z",
  "day_of_week": 1,
  "day_name": "Monday",
  "hour": 7,
  "minute": 30,
  "duration_seconds": 1820,
  "duration_traffic_seconds": 2950,
  "delay_seconds": 1130,
  "distance_meters": 18500,
  "route": "route1"
}
```

---

## Google Cloud setup

1. [console.cloud.google.com](https://console.cloud.google.com) → new project
2. Enable **Routes API**
3. Create API key → restrict to your server IP
4. Set budget alert at $1
