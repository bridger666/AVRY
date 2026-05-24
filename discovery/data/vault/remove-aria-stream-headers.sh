#!/bin/bash

# Script to remove header authentication from Aria Stream
# SSH to VPS: ubuntu@43.156.108.96
# Password: mT4-wye-9Dn-hYK

echo "=== Removing Header Authentication from Aria Stream ==="
echo ""

# Command to run on VPS
ssh ubuntu@43.156.108.96 << 'SSH_EOF'
echo "Step 1: Check current Aria Stream implementation"
if [ -f "/home/ubuntu/aivory/nextjs-console/app/api/aira/stream/route.ts" ]; then
    echo "Found: nextjs-console/app/api/aira/stream/route.ts"
    echo ""
    echo "Step 2: Check for header authentication in Aria Stream"
    grep -n "Content-Type\|headers\|Authorization" /home/ubuntu/aivory/nextjs-console/app/api/aira/stream/route.ts | head -20
    echo ""
else
    echo "Aria Stream route not found"
    exit 1
fi

echo "Step 3: Check VPS Bridge streaming client"
if [ -f "/home/ubuntu/aivory/vps-bridge/zereroclawStreamingClient.js" ]; then
    echo "Found: vps-bridge/zereroclawStreamingClient.js"
    echo ""
    echo "Step 4: Check for header authentication in VPS Bridge"
    grep -n "Content-Type\|headers\|Authorization" /home/ubuntu/aivory/vps-bridge/zereroclawStreamingClient.js | head -20
    echo ""
else
    echo "VPS Bridge streaming client not found"
fi

echo "Step 5: Check Aria Stream response headers"
if [ -f "/home/ubuntu/aivory/nextjs-console/app/api/aira/stream/route.ts" ]; then
    echo ""
    echo "=== Current Aria Stream Headers ==="
    grep -A3 "headers\|Content-Type" /home/ubuntu/aivory/nextjs-console/app/api/aira/stream/route.ts | head -15
fi

echo ""
echo "=== Analysis Complete ==="
echo ""
echo "Next steps:"
echo "1. If header authentication found, remove it from route.ts and zeroclawStreamingClient.js"
echo "2. Ensure Content-Type is 'text/event-stream' for SSE"
echo "3. Restart services to apply changes"
SSH_EOF

echo ""
echo "=== Script Complete ==="