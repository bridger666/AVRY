#!/bin/bash

# VPS Bridge Empty Response Bug Fix Deployment Script
# This script deploys the streaming fix to the VPS

VPS_HOST="ubuntu@43.156.108.96"
VPS_PASS="mT4-wye-9Dn-hYK"
VPS_PATH="/home/ubuntu/AVRY"

echo "🚀 Deploying VPS Bridge Empty Response Bug Fix..."
echo ""

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass is not installed. Please install it first:"
    echo "   brew install sshpass (macOS)"
    echo "   sudo apt-get install sshpass (Ubuntu/Debian)"
    exit 1
fi

# Pull latest changes from git
echo "📥 Pulling latest changes from git..."
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no "$VPS_HOST" "cd $VPS_PATH && git pull origin main"

if [ $? -ne 0 ]; then
    echo "❌ Failed to pull changes from git"
    exit 1
fi

echo "✅ Git pull successful"
echo ""

# Restart vps-bridge service
echo "🔄 Restarting vps-bridge service..."
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no "$VPS_HOST" "sudo systemctl restart vps-bridge"

if [ $? -ne 0 ]; then
    echo "❌ Failed to restart vps-bridge service"
    exit 1
fi

echo "✅ vps-bridge service restarted"
echo ""

# Check service status
echo "📊 Checking vps-bridge service status..."
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no "$VPS_HOST" "sudo systemctl status vps-bridge --no-pager"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Testing the fix with curl commands..."
echo ""
echo "Testing /console/stream:"
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no "$VPS_HOST" "curl -s -X POST http://localhost:3003/console/stream -H 'Content-Type: application/json' -H 'x-api-key: supersecretkey-9f8a7b6c5d4e3f2g1h0i-jklmnopqrstuvwxyz123456' -d '{\"session_id\":\"test\",\"messages\":[{\"role\":\"user\",\"content\":\"halo\"}]}' | head -5"
echo ""
echo "Testing /aria/stream:"
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no "$VPS_HOST" "curl -s -X POST http://localhost:3003/aria/stream -H 'Content-Type: application/json' -H 'x-api-key: supersecretkey-9f8a7b6c5d4e3f2g1h0i-jklmnopqrstuvwxyz123456' -d '{\"session_id\":\"test\",\"messages\":[{\"role\":\"user\",\"content\":\"halo\"}]}' | head -5"
echo ""
echo "✅ All done! The fix should now be working."