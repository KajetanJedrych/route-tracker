#!/bin/bash
# ============================================================
# collect.sh — called by crontab every 15 minutes
# Place this file at /opt/route-tracker/collect.sh
# Make it executable: chmod +x /opt/route-tracker/collect.sh
#
# Crontab entry (crontab -e):
#   */15 * * * 1-5 /opt/route-tracker/collect.sh >> /var/log/route-tracker.log 2>&1
# ============================================================

APP_URL="http://localhost:3000"
CRON_SECRET="changeme_random_secret"   # must match .env.local CRON_SECRET

response=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "x-cron-secret: ${CRON_SECRET}" \
  "${APP_URL}/api/collect")

echo "$(date '+%Y-%m-%d %H:%M:%S') collect → HTTP ${response}"
