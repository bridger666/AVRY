#!/bin/bash

# VPS Bridge Diagnostic & Configuration Script
# Run this on your Mac to diagnose and configure the VPS and local environment
# Usage: bash VPS_DIAGNOSTIC_SCRIPT.sh

set -e

VPS_HOST="ubuntu@43.156.108.96"
VPS_PATH="/home/ubuntu/AVRY"
LOCAL_AVRY_PATH="$HOME/AVRY"

echo "=========================================="
echo "VPS BRIDGE DIAGNOSTIC & CONFIGURATION"
echo "=========================================="
echo ""

# ============================================================================
# STEP 1: Confirm environment and files on VPS
# ============================================================================
echo "STEP 1: Confirming VPS environment..."
echo ""

ssh "$VPS_HOST" << 'EOF'
echo "Current user:"
whoami
echo ""
echo "Hostname:"
hostname
echo ""
echo "Current directory:"
pwd
echo ""
echo "Changing to /home/ubuntu/AVRY..."
cd /home/ubuntu/AVRY
echo "Current directory after cd:"
pwd
echo ""
echo "Directory listing (first 2 levels):"
ls -R | head -50
EOF

echo ""
echo "✓ VPS environment confirmed"
echo ""

# ============================================================================
# STEP 2: Verify vps-bridge .env file on VPS
# ============================================================================
echo "STEP 2: Verifying vps-bridge .env on VPS..."
echo ""

ssh "$VPS_HOST" << 'EOF'
cd /home/ubuntu/AVRY/vps-bridge
echo "Contents of .env file:"
echo "======================"
cat .env
echo ""
echo "Verification Checklist:"
echo "======================"
echo -n "✓ PORT=3003: "
grep -q "^PORT=3003" .env && echo "PASS" || echo "FAIL"
echo -n "✓ API_KEY=supersecret-xyz123456789: "
grep -q "^API_KEY=supersecret-xyz123456789" .env && echo "PASS" || echo "FAIL"
echo -n "✓ OPENROUTER_API_KEY set: "
grep -q "^OPENROUTER_API_KEY=" .env && echo "PASS" || echo "FAIL"
echo -n "✓ N8N_BASE_URL=http://43.156.108.96:5678: "
grep -q "^N8N_BASE_URL=http://43.156.108.96:5678" .env && echo "PASS" || echo "FAIL"
echo -n "✓ N8N_API_KEY set: "
grep -q "^N8N_API_KEY=" .env && echo "PASS" || echo "FAIL"
echo -n "✓ ZEROCLAW_BASE_URL=http://127.0.0.1:3010: "
grep -q "^ZEROCLAW_BASE_URL=http://127.0.0.1:3010" .env && echo "PASS" || echo "FAIL"
EOF

echo ""
echo "✓ VPS .env verification complete"
echo ""

# ============================================================================
# STEP 3: Check vps-bridge process status
# ============================================================================
echo "STEP 3: Checking vps-bridge process status..."
echo ""

ssh "$VPS_HOST" << 'EOF'
echo "Checking for running vps-bridge process:"
ps aux | grep "node server.js" | grep -v grep || echo "NOT_RUNNING"
echo ""
echo "If NOT_RUNNING, the script will start it..."
EOF

echo ""

# Start vps-bridge if not running
ssh "$VPS_HOST" << 'EOF'
cd /home/ubuntu/AVRY/vps-bridge
RUNNING=$(ps aux | grep "node server.js" | grep -v grep | wc -l)
if [ "$RUNNING" -eq 0 ]; then
  echo "Starting vps-bridge..."
  mkdir -p /home/ubuntu/AVRY/logs
  nohup node server.js > /home/ubuntu/AVRY/logs/vps-bridge.log 2>&1 &
  sleep 2
  echo "vps-bridge started"
else
  echo "vps-bridge is already running"
fi
EOF

echo ""

# Check health
echo "Checking vps-bridge health endpoint..."
ssh "$VPS_HOST" << 'EOF'
echo "Health check response:"
curl -sS "http://localhost:3003/health" || echo "ERROR: Could not reach health endpoint"
EOF

echo ""
echo "✓ Process status check complete"
echo ""

# ============================================================================
# STEP 4: Test AIRA endpoint
# ============================================================================
echo "STEP 4: Testing AIRA endpoint via vps-bridge..."
echo ""

ssh "$VPS_HOST" << 'EOF'
echo "Testing /bridge/aira endpoint:"
curl -sS -X POST "http://localhost:3003/bridge/aira" \
  -H "x-api-key: supersecret-xyz123456789" \
  -H "Content-Type: application/json" \
  -d '{"message":"test from Kiro via VPS"}' | head -100
echo ""
echo "✓ AIRA endpoint test complete"
EOF

echo ""

# ============================================================================
# STEP 5: Sync vps-bridge .env to Mac
# ============================================================================
echo "STEP 5: Syncing vps-bridge .env to Mac..."
echo ""

mkdir -p "$LOCAL_AVRY_PATH/vps-bridge"
scp "$VPS_HOST:/home/ubuntu/AVRY/vps-bridge/.env" "$LOCAL_AVRY_PATH/vps-bridge/.env"

echo "✓ .env synced to $LOCAL_AVRY_PATH/vps-bridge/.env"
echo ""
echo "Contents of synced .env:"
echo "========================"
cat "$LOCAL_AVRY_PATH/vps-bridge/.env"
echo ""

# ============================================================================
# STEP 6: Prepare Next.js console .env.local
# ============================================================================
echo "STEP 6: Preparing Next.js console .env.local..."
echo ""

mkdir -p "$LOCAL_AVRY_PATH/nextjs-console"

# Extract N8N_API_KEY from synced .env
N8N_API_KEY=$(grep "^N8N_API_KEY=" "$LOCAL_AVRY_PATH/vps-bridge/.env" | cut -d'=' -f2)

cat > "$LOCAL_AVRY_PATH/nextjs-console/.env.local.template" << EOF
# VPS Bridge Configuration
VPS_BRIDGE_URL=http://localhost:3003
VPS_BRIDGE_API_KEY=supersecret-xyz123456789

# Public VPS Bridge URLs (fallback)
NEXT_PUBLIC_VPS_BRIDGE_URL=http://localhost:3003
NEXT_PUBLIC_VPS_BRIDGE_API_KEY=supersecret-xyz123456789

# n8n Configuration
N8N_BASE_URL=http://43.156.108.96:5678
N8N_API_KEY=$N8N_API_KEY

# Public n8n Editor URL
NEXT_PUBLIC_N8N_EDITOR_BASE_URL=http://43.156.108.96:5678

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CONSOLE_URL=http://localhost:3000
EOF

echo "✓ Template created at: $LOCAL_AVRY_PATH/nextjs-console/.env.local.template"
echo ""
echo "Template contents:"
echo "=================="
cat "$LOCAL_AVRY_PATH/nextjs-console/.env.local.template"
echo ""

# ============================================================================
# FINAL SUMMARY
# ============================================================================
echo ""
echo "=========================================="
echo "DIAGNOSTIC SUMMARY"
echo "=========================================="
echo ""
echo "✓ VPS environment confirmed"
echo "✓ vps-bridge .env verified"
echo "✓ vps-bridge process checked and started if needed"
echo "✓ Health endpoint tested"
echo "✓ AIRA endpoint tested"
echo "✓ .env synced to Mac at: $LOCAL_AVRY_PATH/vps-bridge/.env"
echo "✓ Next.js .env.local template created at: $LOCAL_AVRY_PATH/nextjs-console/.env.local.template"
echo ""
echo "NEXT STEPS:"
echo "==========="
echo "1. Review the synced .env file:"
echo "   cat $LOCAL_AVRY_PATH/vps-bridge/.env"
echo ""
echo "2. Copy the template to actual .env.local:"
echo "   cp $LOCAL_AVRY_PATH/nextjs-console/.env.local.template $LOCAL_AVRY_PATH/nextjs-console/.env.local"
echo ""
echo "3. Verify the .env.local file:"
echo "   cat $LOCAL_AVRY_PATH/nextjs-console/.env.local"
echo ""
echo "4. Start the Next.js dev server:"
echo "   cd $LOCAL_AVRY_PATH/nextjs-console"
echo "   npm run dev"
echo ""
echo "=========================================="
