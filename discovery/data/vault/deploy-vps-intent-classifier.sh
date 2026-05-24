#!/bin/bash

# Secure Deployment Script for Intent Classifier to VPS
# This script handles deployment without exposing credentials

set -e

echo "=========================================="
echo "Intent Classifier VPS Deployment"
echo "=========================================="

# Configuration
VPS_HOST="43.156.108.96"
VPS_USER="ubuntu"
VPS_PATH="/home/ubuntu/Aivory"  # Adjust this path as needed

echo ""
echo "Step 1: Checking local git status..."
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    echo "✅ No uncommitted changes"
else
    echo "⚠️  Uncommitted changes detected"
    read -p "Commit changes now? (y/n) " -n 1 -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        read -p "Enter commit message: " commit_msg
        git add app/services/intent_classifier.py app/api/routes/console.py
        git commit -m "$commit_msg"
        echo "✅ Changes committed"
    else
        echo "❌ Cannot proceed with uncommitted changes"
        exit 1
    fi
fi

echo ""
echo "Step 2: Pushing to remote..."
git push origin main
echo "✅ Pushed to remote"

echo ""
echo "Step 3: Connecting to VPS..."
echo "VPS: $VPS_HOST"
echo "You'll be prompted for SSH password"
echo ""

# Create remote deployment script
cat > /tmp/deploy_remote.sh << 'EOFSCRIPT'
#!/bin/bash
set -e
echo "===== Remote Deployment Started ====="
cd $VPS_PATH

echo "Pulling latest changes..."
git pull origin main

echo "Restarting backend service..."
pm2 restart aivory-backend

echo "Waiting for service to restart..."
sleep 5

echo "Checking service status..."
pm2 status

echo ""
echo "Testing intent classifier endpoint..."
echo "Sending test request..."

curl -X POST http://localhost:3003/api/console/classify-intent \
  -H "Content-Type: application/json" \
  -d '{"message":"Create a workflow to process invoices","context":{"tier":"builder","user_id":"test"}}'

echo ""
echo "===== Remote Deployment Complete ====="
EOFSCRIPT

chmod +x /tmp/deploy_remote.sh

# Transfer and execute on VPS
scp /tmp/deploy_remote.sh ${VPS_USER}@${VPS_HOST}:/tmp/deploy_remote.sh
ssh ${VPS_USER}@${VPS_HOST} 'bash /tmp/deploy_remote.sh'

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "The intent classifier is now live at:"
echo "http://43.156.108.96:3003/api/console/classify-intent"
echo ""
echo "Test from local machine:"
echo 'curl -X POST http://43.156.108.96:3003/api/console/classify-intent -H "Content-Type: application/json" -d '"'"'{"message":"Create a workflow","context":{"tier":"builder"}}'"'"''