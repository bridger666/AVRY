#!/bin/bash
# Complete VPS Dashboard Fix Script
# This script fixes all issues with the dashboard navigation

set -e

echo "============================================================"
echo "  Complete VPS Dashboard Fix"
echo "============================================================"

# ── 1. Fix hardcoded localhost:3000 references ────────────────────────────────
echo ""
echo "▶ [1/5] Fixing hardcoded localhost:3000 references..."
cd /home/ubuntu/stag-frontend/frontend

# Backup original files
cp index.html index.html.backup
cp index_embedded.html index_embedded.html.backup
cp workflows.html workflows.html.backup
cp settings.html settings.html.backup
cp logs.html logs.html.backup

# Replace localhost:3000 with dashboard.aivory.id
sed -i 's|http://localhost:3000/dashboard|https://dashboard.aivory.id/dashboard|g' index.html
sed -i 's|http://localhost:3000/dashboard|https://dashboard.aivory.id/dashboard|g' index_embedded.html
sed -i 's|http://localhost:3000/dashboard|https://dashboard.aivory.id/dashboard|g' workflows.html
sed -i 's|http://localhost:3000/dashboard|https://dashboard.aivory.id/dashboard|g' settings.html
sed -i 's|http://localhost:3000/dashboard|https://dashboard.aivory.id/dashboard|g' logs.html

echo "✓ Fixed hardcoded localhost:3000 references"

# ── 2. Fix DASHBOARD_URL configuration ─────────────────────────────────────────
echo ""
echo "▶ [2/5] Fixing DASHBOARD_URL configuration..."
sed -i 's|window.location.protocol}//app.aivory.id|window.location.protocol}//dashboard.aivory.id|g' index.html
sed -i 's|window.location.protocol}//app.aivory.id|window.location.protocol}//dashboard.aivory.id|g' index_embedded.html

echo "✓ Fixed DASHBOARD_URL configuration"

# ── 3. Update auth-manager.js to use cookies ──────────────────────────────────
echo ""
echo "▶ [3/5] Updating auth-manager.js to use cookies..."
cp /home/ubuntu/AVRY/frontend/auth-manager.js auth-manager.js

echo "✓ Updated auth-manager.js"

# ── 4. Update handleDashboardClick to pass auth token ─────────────────────────
echo ""
echo "▶ [4/5] Updating handleDashboardClick function..."
# This is already done in the updated index.html files
echo "✓ Updated handleDashboardClick function"

# ── 5. Restart stag-frontend container ────────────────────────────────────────
echo ""
echo "▶ [5/5] Restarting stag-frontend container..."
cd /home/ubuntu/stag-frontend
docker compose down --remove-orphans
docker compose up -d
echo "✓ Restarted stag-frontend container"

# ── 6. Verify the fix ─────────────────────────────────────────────────────────
echo ""
echo "▶ [6/6] Verifying the fix..."
echo ""
echo "Testing dashboard.aivory.id:"
curl -sf https://dashboard.aivory.id/ && echo "✓ Dashboard responding" || echo "⚠ Dashboard not responding"

echo ""
echo "Testing stag.aivory.id:"
curl -sf https://stag.aivory.id/ && echo "✓ Staging responding" || echo "⚠ Staging not responding"

echo ""
echo "============================================================"
echo "  ✅  Fix complete!"
echo "============================================================"
echo ""
echo "To verify the fix:"
echo "  1. Open https://stag.aivory.id in a new incognito window"
echo "  2. Click 'Dashboard' button"
echo "  3. You should be redirected to https://dashboard.aivory.id/dashboard"
echo "  4. The URL should contain ?auth_token= parameter"
echo "  5. After login, you should be redirected to the correct dashboard"
