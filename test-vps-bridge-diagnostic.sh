#!/bin/bash

# Test script for VPS Bridge Free Diagnostic endpoint
# This script tests the /diagnostics/free/run endpoint

echo "Testing VPS Bridge Free Diagnostic Endpoint"
echo "============================================"
echo ""

# VPS Bridge URL
VPS_URL="http://43.156.108.96:3001"
API_KEY="supersecret-xyz123456789"

# Test payload with sample answers
PAYLOAD='{
  "organization_id": "demo_org",
  "answers": {
    "q1": 0,
    "q2": 1,
    "q3": 2,
    "q4": 3,
    "q5": 0,
    "q6": 1,
    "q7": 2,
    "q8": 3,
    "q9": 0,
    "q10": 1,
    "q11": 2,
    "q12": 3
  }
}'

echo "Sending request to: ${VPS_URL}/diagnostics/free/run"
echo ""

# Make the request
curl -X POST "${VPS_URL}/diagnostics/free/run" \
  -H "X-Api-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "${PAYLOAD}" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "============================================"
echo "Test complete!"
echo ""
echo "Expected response format:"
echo "{"
echo '  "diagnostic_id": "diag-demo_org-1234567890",'
echo '  "organization_id": "demo_org",'
echo '  "score": 50,'
echo '  "maturity_level": "Developing",'
echo '  "strengths": "...",'
echo '  "blocker": "...",'
echo '  "opportunity": "...",'
echo '  "narrative": "...",'
echo '  "timestamp": "2024-01-01T00:00:00.000Z"'
echo "}"
