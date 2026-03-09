#!/bin/bash
#
# Zeroclaw Connection Test Script
# Tests the Zeroclaw backend on VPS
#

echo "========================================="
echo "Zeroclaw Connection Test"
echo "========================================="
echo ""

ZEROCLAW_URL="http://43.156.108.96:3100"

# Test 1: Health Check
echo "[1/3] Testing health endpoint..."
echo "URL: ${ZEROCLAW_URL}/health"
echo ""

HEALTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "${ZEROCLAW_URL}/health" 2>&1)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health check passed (HTTP 200)"
else
    echo "❌ Health check failed (HTTP ${HTTP_CODE:-connection error})"
    echo "Response: $HEALTH_RESPONSE"
fi
echo ""

# Test 2: Webhook Endpoint
echo "[2/3] Testing webhook endpoint..."
echo "URL: ${ZEROCLAW_URL}/webhook"
echo ""

WEBHOOK_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X POST "${ZEROCLAW_URL}/webhook" \
    -H "Content-Type: application/json" \
    -d '{"message":"ping","history":[],"system_prompt":"Reply with pong"}' 2>&1)

HTTP_CODE=$(echo "$WEBHOOK_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$WEBHOOK_RESPONSE" | grep -v "HTTP_CODE:")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Webhook endpoint passed (HTTP 200)"
    echo "Response: $RESPONSE_BODY"
else
    echo "❌ Webhook endpoint failed (HTTP ${HTTP_CODE:-connection error})"
    echo "Response: $WEBHOOK_RESPONSE"
fi
echo ""

# Test 3: Check for CORS headers
echo "[3/3] Testing CORS headers..."
CORS_RESPONSE=$(curl -s -I -X OPTIONS "${ZEROCLAW_URL}/webhook" \
    -H "Origin: http://localhost:3000" \
    -H "Access-Control-Request-Method: POST" 2>&1)

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS headers present"
    echo "$CORS_RESPONSE" | grep "Access-Control"
else
    echo "⚠️  CORS headers not found (may cause browser issues)"
    echo "Response headers:"
    echo "$CORS_RESPONSE"
fi
echo ""

echo "========================================="
echo "Test Summary"
echo "========================================="
echo ""
echo "If all tests passed:"
echo "  • Open http://localhost:3000/console"
echo "  • Check browser console for connection test"
echo "  • Send a test message"
echo ""
echo "If tests failed:"
echo "  • Check Zeroclaw is running on VPS"
echo "  • Check Zeroclaw configuration"
echo "  • Check firewall allows port 3100"
echo "  • See ZEROCLAW_BACKEND_CONFIG.md for setup"
echo ""
echo "========================================="
