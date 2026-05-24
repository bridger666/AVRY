#!/bin/bash

echo "=== VPS Intent Classifier & Streaming Diagnostic ==="
echo ""

# Step 1: Check VPS Bridge processes
echo "Step 1: Checking VPS Bridge processes..."
pm2 list | grep -i "bridge\|zeroclaw\|n8n"
echo ""

# Step 2: Check VPS Bridge logs for intent classifier
echo "Step 2: Checking VPS Bridge logs for intent classifier..."
pm2 logs vps-bridge --lines 50 --nostream | grep -i "intent" || echo "No intent-related logs found"
echo ""

# Step 3: Check Aria Stream for JSON vs SSE
echo "Step 3: Checking Aria Stream streaming protocol..."
echo "Looking for 'text/event-stream' or 'application/json' in logs..."
pm2 logs vps-bridge --lines 100 --nostream | grep -E "(text/event-stream|application/json|SSE|EventSource)" || echo "No streaming protocol logs found"
echo ""

# Step 4: Check frontend intent banner configuration
echo "Step 4: Checking frontend configuration..."
if [ -f "/home/ubuntu/aivory/nextjs-console/.env.local" ]; then
    echo "Reading frontend .env.local..."
    grep -i "intent" /home/ubuntu/aivory/nextjs-console/.env.local || echo "No INTENT_ config found"
else
    echo "Frontend .env.local not found"
fi
echo ""

# Step 5: Check backend intent classifier service
echo "Step 5: Checking backend intent classifier..."
if [ -f "/home/ubuntu/aivory/app/api/routes/console.py" ]; then
    echo "Found console.py, checking for intent classifier integration..."
    grep -n "intent" /home/ubuntu/aivory/app/api/routes/console.py | head -20 || echo "No intent references found"
else
    echo "Backend console.py not found"
fi
echo ""

# Step 6: Test Aria Stream endpoint
echo "Step 6: Testing Aria Stream endpoint..."
curl -s -I http://127.0.0.1:4000/api/aira/stream 2>&1 | grep -E "(Content-Type|200|404|500)" || echo "Could not reach Aria Stream endpoint"
echo ""

# Step 7: Check VPS Bridge Aria endpoint
echo "Step 7: Checking VPS Bridge Aria endpoint..."
curl -s -I http://127.0.0.1:4000/api/vps/aira/ask 2>&1 | grep -E "(Content-Type|200|404|500)" || echo "Could not reach VPS Bridge Aria endpoint"
echo ""

# Step 8: Check for SSE in streaming implementations
echo "Step 8: Checking for SSE implementation in streaming files..."
find /home/ubuntu/aivory -name "*stream*.js" -o -name "*stream*.ts" 2>/dev/null | head -5
echo ""

# Step 9: Check recent errors
echo "Step 9: Checking recent errors in VPS Bridge..."
pm2 logs vps-bridge --lines 30 --nostream --err || echo "No error logs"
echo ""

echo "=== Diagnostic Complete ==="
echo ""
echo "Next steps based on findings:"
echo "1. If intent classifier missing: Check app/api/routes/console.py for integration"
echo "2. If using JSON instead of SSE: Check streaming response headers and implementation"
echo "3. If frontend banner missing: Check nextjs-console components for intent display"