#!/bin/bash
# Deploy VPS Bridge docker-compose.yml with port 3003 fix
# Run with: bash deploy-vps-bridge-port-fix.sh

echo "=== VPS Bridge Port 3003 Fix Deployment ==="
echo ""

# Navigate to correct directory
cd /home/ubuntu/AVRY/vps-bridge

# Recreate_the container with new configuration
echo "Recreating container with port 3003..."
docker compose down
docker compose up -d

echo ""
echo "=== Deployment Complete ==="
echo "Verifying container status..."
docker ps --filter "name=aivory-bridge"

echo ""
echo "Waiting 5 seconds for Traefik to detect changes..."
sleep 5

echo ""
echo "Testing Traefik configuration..."
docker logs traefik 2>&1 | tail -20