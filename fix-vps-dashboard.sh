#!/bin/bash
# Fix VPS Dashboard Navigation Issue
# This script fixes the 504 Gateway Timeout and localhost redirect issues
# Run on VPS directly: bash fix-vps-dashboard.sh

set -e

echo "============================================================"
echo "  AIVORY Dashboard Fix Script"
echo "============================================================"

# ── 1. Fix frontend files to use correct dashboard URL ────────────────────────
echo ""
echo "▶ [1/5] Fixing frontend files to use dashboard.aivory.id..."
cd /home/ubuntu/AVRY

# Backup the original files
cp frontend/index.html frontend/index.html.backup
cp frontend/index_embedded.html frontend/index_embedded.html.backup
cp frontend/workflows.html frontend/workflows.html.backup
cp frontend/settings.html frontend/settings.html.backup
cp frontend/logs.html frontend/logs.html.backup

# Replace app.aivory.id with dashboard.aivory.id in the DASHBOARD_URL configuration
sed -i 's|window.location.protocol}//app.aivory.id|window.location.protocol}//dashboard.aivory.id|g' frontend/index.html
sed -i 's|window.location.protocol}//app.aivory.id|window.location.protocol}//dashboard.aivory.id|g' frontend/index_embedded.html

echo "✓ Fixed frontend/index.html and frontend/index_embedded.html"

# Also fix the stag-frontend directory
echo ""
echo "▶ [1b/5] Fixing stag-frontend files..."
cd /home/ubuntu/stag-frontend/frontend

# Backup the original files
cp index.html index.html.backup
cp index_embedded.html index_embedded.html.backup
cp workflows.html workflows.html.backup
cp settings.html settings.html.backup
cp logs.html logs.html.backup

# Replace app.aivory.id with dashboard.aivory.id in the DASHBOARD_URL configuration
sed -i 's|window.location.protocol}//app.aivory.id|window.location.protocol}//dashboard.aivory.id|g' index.html
sed -i 's|window.location.protocol}//app.aivory.id|window.location.protocol}//dashboard.aivory.id|g' index_embedded.html

echo "✓ Fixed stag-frontend/index.html and index_embedded.html"

# ── 2. Recreate dashboard container with correct labels ───────────────────────
echo ""
echo "▶ [2/5] Recreating dashboard container with correct labels..."
docker compose -f docker-compose.dashboard.yml down
docker compose -f docker-compose.dashboard.yml up -d --force-recreate
echo "✓ Dashboard container recreated"

# ── 3. Wait for container to be ready ─────────────────────────────────────────
echo ""
echo "▶ [3/5] Waiting for dashboard container to be ready..."
sleep 10
echo "✓ Container ready"

# ── 4. Verify Traefik discovers the dashboard ─────────────────────────────────
echo ""
echo "▶ [4/5] Verifying Traefik discovers the dashboard..."
sleep 5
docker exec traefik cat /etc/traefik/dynamic.yml | grep -A 5 "aivory-dashboard" || echo "⚠ Dashboard service not yet in Traefik config (may take a moment)"

# ── 5. Test the dashboard ─────────────────────────────────────────────────────
echo ""
echo "▶ [5/5] Testing dashboard access..."
echo ""
echo "Testing locally on VPS:"
curl -sf http://localhost:3000/ && echo "✓ Dashboard responding locally" || echo "⚠ Dashboard not responding locally"

echo ""
echo "Testing via Traefik:"
curl -sk https://dashboard.aivory.id/ && echo "✓ Dashboard responding via Traefik" || echo "⚠ Dashboard not responding via Traefik"

echo ""
echo "============================================================"
echo "  ✅  Fix complete!"
echo "============================================================"
echo ""
echo "If the dashboard is still not accessible, check:"
echo "  - Docker logs: docker logs aivory-dashboard"
echo "  - Traefik logs: docker logs traefik"
echo "  - Network connectivity: docker exec aivory-dashboard ping -c 3 172.20.0.1"
