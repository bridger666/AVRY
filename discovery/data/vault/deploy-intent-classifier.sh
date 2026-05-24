#!/bin/bash

# Intent Classifier Deployment Script
# This script helps deploy the intent classifier implementation to VPS

set -e

VPS_HOST="ubuntu@43.156.108.96"
VPS_PATH="/path/to/Aivory"  # Update this to your actual VPS path

echo "=========================================="
echo "Intent Classifier Deployment"
echo "=========================================="

echo ""
echo "Step 1: Checking local git status..."
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    echo "✅ No uncommitted changes detected"
else
    echo "⚠️  Uncommitted changes detected"
    echo "Files changed:"
    git status --short
    echo ""
    read -p "Commit changes before deploying? (y/n) " -n 1 -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        read -p "Enter commit message: " commit_msg
        git add app/services/intent_classifier.py app/api/routes/console.py
        git commit -m "$commit_msg"
        echo "✅ Changes committed"
    fi
fi

echo ""
echo "Step 2: Pushing to remote..."
git push origin main
echo "✅ Pushed to remote"

echo "Step 3: Deploying to VPS..."
echo "Connecting to $VPS_HOST..."

# Execute deployment commands on VPS
ssh $VPS_HOST << 'ENDSSH'
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
    curl -X POST http://localhost:3003/api/console/classify-intent \
      -H "Content-Type: application/json" \
      -d '{"message":"Test intent classification","context":{"tier":"builder"}}'
ENDSSH

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "The intent classifier is now live at:"
echo "http://43.156.108.96:3003/api/console/classify-intent"
echo ""
echo "Test it with:"
echo 'curl -X POST http://43.156.108.96:3003/api/console/classify-intent -H "Content-Type: application/json" -d "{\"message\":\"Create a workflow\",\"context\":{\"tier\":\"builder\"}}"'