#!/bin/bash
set -e

# UPDATE THIS TO YOUR VPS HOSTNAME OR IP
VPS_USER="ubuntu"
VPS_HOST="${1:-YOUR_VPS_IP_OR_HOSTNAME}"
VPS_PATH="/home/ubuntu/AVRY/vps-bridge"

echo "🚀 Deploying VPS Bridge network fix (bind 0.0.0.0)..."
echo ""

# Copy updated server.js to VPS
echo "📦 Copying updated server.js to VPS..."
scp vps-bridge/server.js ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/server.js

# Rebuild and restart
echo "🔨 Rebuilding Docker image and restarting container..."
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
cd /home/ubuntu/AVRY/vps-bridge

# Build image without cache
docker compose build --no-cache aivory-bridge

# Restart container
docker compose up -d aivory-bridge

# Wait for health check
echo "⏳ Waiting for container to be healthy..."
for i in {1..30}; do
  if docker compose ps aivory-bridge | grep -q "healthy"; then
    echo "✅ Container is healthy!"
    break
  fi
  echo "   Waiting... ($i/30)"
  sleep 2
done

# Show logs
echo ""
echo "📋 Container logs:"
docker compose logs --tail 20 aivory-bridge

echo ""
echo "🌐 Testing /health endpoint..."
curl -s http://localhost:3001/health | jq . || echo "❌ Health check failed"
ENDSSH

echo ""
echo "✅ Deployment complete!"