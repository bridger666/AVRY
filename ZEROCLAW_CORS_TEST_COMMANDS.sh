#!/bin/bash
#
# Zeroclaw CORS + Logging Test Commands
# Quick reference for testing after implementation
#

ZEROCLAW_URL="http://43.156.108.96:3100"

echo "========================================="
echo "Zeroclaw CORS + Logging Tests"
echo "========================================="
echo ""

# Test 1: OPTIONS Preflight
echo "[1/5] Testing OPTIONS preflight (CORS)..."
echo "Command:"
echo "  curl -X OPTIONS ${ZEROCLAW_URL}/webhook \\"
echo "    -H 'Origin: http://localhost:3000' \\"
echo "    -H 'Access-Control-Request-Method: POST' \\"
echo "    -v"
echo ""
echo "Expected headers:"
echo "  Access-Control-Allow-Origin: http://localhost:3000"
echo "  Access-Control-Allow-Methods: GET, POST, OPTIONS"
echo "  Access-Control-Allow-Headers: Content-Type, Authorization"
echo ""
read -p "Press Enter to run test..."
curl -X OPTIONS "${ZEROCLAW_URL}/webhook" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
echo ""
echo ""

# Test 2: POST with CORS headers
echo "[2/5] Testing POST with CORS headers..."
echo "Command:"
echo "  curl -X POST ${ZEROCLAW_URL}/webhook \\"
echo "    -H 'Origin: http://localhost:3000' \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"message\":\"test\",\"history\":[],\"mode\":\"console\"}' \\"
echo "    -v"
echo ""
echo "Expected headers:"
echo "  Access-Control-Allow-Origin: http://localhost:3000"
echo "  Vary: Origin"
echo ""
read -p "Press Enter to run test..."
curl -X POST "${ZEROCLAW_URL}/webhook" \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{"message":"test","history":[],"mode":"console"}' \
  -v
echo ""
echo ""

# Test 3: Check logs for request
echo "[3/5] Checking logs for ARIA calls..."
echo "Command:"
echo "  ssh user@43.156.108.96 'journalctl -u zeroclaw -n 20 | grep aria_call'"
echo ""
echo "Expected log entries:"
echo "  - aria_call_started"
echo "  - aria_call_completed"
echo "  - Both with same request_id"
echo "  - Includes mode, status_code, duration_ms"
echo ""
read -p "Press Enter to check logs (requires SSH access)..."
echo "Note: Run this command on VPS:"
echo "  journalctl -u zeroclaw -f | grep aria_call"
echo ""
echo ""

# Test 4: Browser test
echo "[4/5] Browser test instructions..."
echo ""
echo "1. Open: http://localhost:3000/console"
echo "2. Open DevTools (F12) → Console tab"
echo "3. Look for: ✅ Zeroclaw connection successful"
echo "4. Check Network tab:"
echo "   - No CORS errors"
echo "   - Request to 43.156.108.96:3100/webhook"
echo "   - Status 200"
echo "5. Send test message: 'Hello'"
echo "6. Verify response appears"
echo ""
read -p "Press Enter to continue..."
echo ""

# Test 5: Log filtering
echo "[5/5] Log filtering examples..."
echo ""
echo "Filter for successful calls:"
echo "  journalctl -u zeroclaw -f | grep 'aria_call_completed'"
echo ""
echo "Filter for errors:"
echo "  journalctl -u zeroclaw -f | grep 'aria_call.*error'"
echo ""
echo "Show last 50 ARIA calls:"
echo "  journalctl -u zeroclaw -n 1000 | grep 'aria_call' | tail -50"
echo ""
echo "Calculate average latency:"
echo "  journalctl -u zeroclaw --since '1 hour ago' | grep 'duration_ms' | \\"
echo "    awk -F'duration_ms=' '{print \$2}' | awk '{print \$1}' | \\"
echo "    awk '{sum+=\$1; count++} END {print sum/count}'"
echo ""
echo "Count requests by mode:"
echo "  journalctl -u zeroclaw --since '1 hour ago' | grep 'aria_call_started' | \\"
echo "    awk -F'mode=' '{print \$2}' | awk '{print \$1}' | sort | uniq -c"
echo ""

echo "========================================="
echo "Test Summary"
echo "========================================="
echo ""
echo "✅ CORS working if:"
echo "   - OPTIONS returns 200 with CORS headers"
echo "   - POST returns CORS headers"
echo "   - Browser shows no CORS errors"
echo ""
echo "✅ Logging working if:"
echo "   - Logs show aria_call_started"
echo "   - Logs show aria_call_completed"
echo "   - Logs include request_id, mode, duration_ms"
echo ""
echo "========================================="
