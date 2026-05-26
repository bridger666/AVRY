#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy-admin-dashboard.sh
# Deploys the AIVORY Admin Dashboard to the VPS.
# Creates the https://admin.aivory.id endpoint via Traefik.
#
# Run on the VPS:  bash deploy-admin-dashboard.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

REPO_DIR="/home/ubuntu/AVRY-admin-dashboard"
COMPOSE_FILE="$REPO_DIR/docker-compose.yml"
ENV_FILE="$REPO_DIR/.env.local"

echo "============================================================"
echo "  AIVORY Admin Dashboard Deployment — admin.aivory.id"
echo "============================================================"

# ── 1. Pull latest code ───────────────────────────────────────────────────────
echo ""
echo "▶ [1/6] Pulling latest code from GitHub..."
cd "$REPO_DIR"
git fetch origin main
git reset --hard origin/main
echo "✓ Code updated"

# ── 2. Ensure environment file exists ─────────────────────────────────────────
echo ""
echo "▶ [2/6] Checking environment file..."
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env.local not found. Please create it first."
    exit 1
fi
echo "✓ .env.local exists"

# ── 3. Ensure app-network exists ──────────────────────────────────────────────
echo ""
echo "▶ [3/6] Ensuring Docker network exists..."
docker network inspect app-network >/dev/null 2>&1 || \
    docker network create app-network
echo "✓ Network ready"

# ── 4. Build the image ────────────────────────────────────────────────────────
echo ""
echo "▶ [4/6] Building Docker image (this may take a few minutes)..."
docker compose -f "$COMPOSE_FILE" build --no-cache
echo "✓ Image built"

# ── 5. Start / restart the container ─────────────────────────────────────────
echo ""
echo "▶ [5/6] Starting avry-admin-dashboard container..."
docker compose -f "$COMPOSE_FILE" up -d --force-recreate
echo "✓ Container started"

# ── 6. Health check ───────────────────────────────────────────────────────────
echo ""
echo "▶ [6/6] Waiting for admin dashboard to be ready..."
sleep 8
if curl -sf http://localhost:3300/ > /dev/null; then
    echo "✓ Admin dashboard responding on port 3300"
else
    echo "⚠ Admin dashboard not yet responding locally — checking logs:"
    docker logs avry-admin-dashboard --tail 30
fi

echo ""
echo "============================================================"
echo "  ✅  Deployment complete!"
echo "  🌐  URL: https://admin.aivory.id"
echo "============================================================"
echo ""
echo "Useful commands:"
echo "  View logs:    docker logs -f avry-admin-dashboard"
echo "  Restart:      docker compose -f $COMPOSE_FILE restart"
echo "  Stop:         docker compose -f $COMPOSE_FILE down"
