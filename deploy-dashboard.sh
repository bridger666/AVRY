#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy-dashboard.sh
# Deploys the AIVORY User Dashboard (nextjs-console) to the VPS.
# Creates the https://dashboard.aivory.id endpoint via Traefik.
#
# Run on the VPS:  bash deploy-dashboard.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

REPO_DIR="/home/ubuntu/AVRY"
CONSOLE_DIR="$REPO_DIR/nextjs-console"
COMPOSE_FILE="$REPO_DIR/docker-compose.dashboard.yml"
ENV_FILE="$CONSOLE_DIR/.env.production"

echo "============================================================"
echo "  AIVORY Dashboard Deployment — dashboard.aivory.id"
echo "============================================================"

# ── 1. Pull latest code ───────────────────────────────────────────────────────
echo ""
echo "▶ [1/6] Pulling latest code from GitHub..."
cd "$REPO_DIR"
git fetch origin main
git reset --hard origin/main
echo "✓ Code updated"

# ── 2. Write production environment file ─────────────────────────────────────
echo ""
echo "▶ [2/6] Writing production .env..."
cat > "$ENV_FILE" <<'EOF'
NODE_ENV=production
PORT=3000

# Public API base URL (served via Traefik)
NEXT_PUBLIC_API_URL=https://backend.aivory.id

# n8n editor (internal)
NEXT_PUBLIC_N8N_EDITOR_BASE_URL=http://n8n:5678

# VPS Bridge (internal only)
VPS_BRIDGE_URL=http://localhost:3003
EOF
echo "✓ .env.production written"

# ── 3. Ensure traefik-public network exists ───────────────────────────────────
echo ""
echo "▶ [3/6] Ensuring Docker networks exist..."
docker network inspect traefik-public >/dev/null 2>&1 || \
    docker network create traefik-public
docker network inspect aivory-net >/dev/null 2>&1 || \
    docker network create aivory-net
echo "✓ Networks ready"

# ── 4. Build the image ────────────────────────────────────────────────────────
echo ""
echo "▶ [4/6] Building Docker image (this may take a few minutes)..."
docker compose -f "$COMPOSE_FILE" build --no-cache
echo "✓ Image built"

# ── 5. Start / restart the container ─────────────────────────────────────────
echo ""
echo "▶ [5/6] Starting aivory-dashboard container..."
docker compose -f "$COMPOSE_FILE" up -d --force-recreate
echo "✓ Container started"

# ── 6. Health check ───────────────────────────────────────────────────────────
echo ""
echo "▶ [6/6] Waiting for dashboard to be ready..."
sleep 8
if curl -sf http://localhost:3000/ > /dev/null; then
    echo "✓ Dashboard responding on port 3000"
else
    echo "⚠ Dashboard not yet responding locally — checking logs:"
    docker logs aivory-dashboard --tail 30
fi

echo ""
echo "============================================================"
echo "  ✅  Deployment complete!"
echo "  🌐  URL: https://dashboard.aivory.id"
echo "============================================================"
echo ""
echo "Useful commands:"
echo "  View logs:    docker logs -f aivory-dashboard"
echo "  Restart:      docker compose -f $COMPOSE_FILE restart"
echo "  Stop:         docker compose -f $COMPOSE_FILE down"
