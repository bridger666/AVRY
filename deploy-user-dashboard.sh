#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy-user-dashboard.sh
# Deploys the AIVORY User Dashboard (nextjs-console) to the VPS.
# Creates the https://app.aivory.id and https://dashboard.aivory.id endpoints.
#
# Run on the VPS:  bash deploy-user-dashboard.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

REPO_DIR="/home/ubuntu/AVRY"
COMPOSE_FILE="$REPO_DIR/docker-compose.dashboard.yml"
CONSOLE_DIR="$REPO_DIR/nextjs-console"

echo "============================================================"
echo "  AIVORY User Dashboard Deployment"
echo "  URLs: https://app.aivory.id, https://dashboard.aivory.id"
echo "============================================================"

# ── 1. Update pnpm lockfile ───────────────────────────────────────────────────
echo ""
echo "▶ [1/5] Updating pnpm lockfile..."
cd "$CONSOLE_DIR"
pnpm install --no-frozen-lockfile
echo "✓ Lockfile updated"

# ── 2. Build the application ──────────────────────────────────────────────────
echo ""
echo "▶ [2/5] Building user dashboard..."
pnpm build
echo "✓ Build complete"

# ── 3. Ensure Docker networks exist ───────────────────────────────────────────
echo ""
echo "▶ [3/5] Ensuring Docker networks exist..."
docker network inspect aivory-net >/dev/null 2>&1 || \
    docker network create aivory-net
docker network inspect traefik-public >/dev/null 2>&1 || \
    docker network create traefik-public
echo "✓ Networks ready"

# ── 4. Build Docker image ─────────────────────────────────────────────────────
echo ""
echo "▶ [4/5] Building Docker image..."
docker compose -f "$COMPOSE_FILE" build --no-cache aivory-dashboard
echo "✓ Docker image built"

# ── 5. Start the container ────────────────────────────────────────────────────
echo ""
echo "▶ [5/5] Starting user dashboard container..."
docker compose -f "$COMPOSE_FILE" up -d --force-recreate aivory-dashboard
echo "✓ Container started"

# ── 6. Health check ───────────────────────────────────────────────────────────
echo ""
echo "▶ Waiting for dashboard to be ready..."
sleep 8
if curl -sf http://localhost:3000/ > /dev/null; then
    echo "✓ User dashboard responding on port 3000"
else
    echo "⚠ Dashboard not yet responding locally — checking logs:"
    docker logs aivory-dashboard --tail 30
fi

echo ""
echo "============================================================"
echo "  ✅  Deployment complete!"
echo "  🌐  URLs: https://app.aivory.id, https://dashboard.aivory.id"
echo "============================================================"
echo ""
echo "Useful commands:"
echo "  View logs:    docker logs -f aivory-dashboard"
echo "  Restart:      docker compose -f $COMPOSE_FILE restart"
echo "  Stop:         docker compose -f $COMPOSE_FILE down"
