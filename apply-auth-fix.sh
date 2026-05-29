#!/bin/bash
# Apply unified authentication fix
# Run on VPS: bash apply-auth-fix.sh

set -e

echo "============================================================"
echo "  Applying Unified Authentication Fix"
echo "============================================================"

# ── 1. Copy auth-manager.js to stag-frontend ──────────────────────────────────
echo ""
echo "▶ [1/3] Copying auth-manager.js to stag-frontend..."
cp /home/ubuntu/AVRY/frontend/auth-manager.js /home/ubuntu/stag-frontend/frontend/auth-manager.js
echo "✓ Copied auth-manager.js"

# ── 2. Restart stag-frontend container ────────────────────────────────────────
echo ""
echo "▶ [2/3] Restarting stag-frontend container..."
cd /home/ubuntu/stag-frontend
docker compose down
docker compose up -d
echo "✓ Restarted stag-frontend container"

# ── 3. Verify the fix ─────────────────────────────────────────────────────────
echo ""
echo "▶ [3/3] Verifying the fix..."
echo ""
echo "Testing auth-manager.js on stag.aivory.id:"
curl -sf https://stag.aivory.id/auth-manager.js | grep -q "aivoryCookie" && echo "✓ auth-manager.js uses cookies" || echo "⚠ auth-manager.js may not use cookies"

echo ""
echo "============================================================"
echo "  ✅  Fix applied!"
echo "============================================================"
echo ""
echo "To verify the fix is working:"
echo "  1. Open https://stag.aivory.id in a new incognito window"
echo "  2. Click 'Dashboard' button"
echo "  3. You should be redirected to https://dashboard.aivory.id/dashboard"
echo "  4. The URL should contain ?auth_token= parameter"
echo "  5. After login, you should be redirected to the correct dashboard"
