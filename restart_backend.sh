#!/bin/bash

# ARIA Protocol Deployment - Backend Restart Script
# This script restarts the Aivory backend to load the new ARIA protocol

echo "=========================================="
echo "ARIA Protocol Deployment"
echo "Restarting Aivory Backend Server"
echo "=========================================="
echo ""

# Check if running as systemd service
if systemctl is-active --quiet aivory-backend; then
    echo "✓ Detected systemd service"
    echo "Restarting aivory-backend service..."
    sudo systemctl restart aivory-backend
    sleep 2
    if systemctl is-active --quiet aivory-backend; then
        echo "✅ Backend restarted successfully!"
        echo ""
        echo "Checking logs..."
        sudo journalctl -u aivory-backend -n 20 --no-pager
    else
        echo "❌ Failed to restart backend"
        echo "Check logs with: sudo journalctl -u aivory-backend -f"
        exit 1
    fi

# Check if running with PM2
elif pm2 list | grep -q "aivory-backend"; then
    echo "✓ Detected PM2 process"
    echo "Restarting aivory-backend with PM2..."
    pm2 restart aivory-backend
    sleep 2
    echo "✅ Backend restarted successfully!"
    echo ""
    echo "Checking logs..."
    pm2 logs aivory-backend --lines 20 --nostream

# Manual restart instructions
else
    echo "⚠️  Could not detect systemd or PM2"
    echo ""
    echo "Please restart the backend manually:"
    echo ""
    echo "1. Stop the current backend process (Ctrl+C if running in terminal)"
    echo ""
    echo "2. Start the backend again:"
    echo "   cd $(pwd)"
    echo "   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
    echo ""
    echo "Or if using a virtual environment:"
    echo "   source venv/bin/activate"
    echo "   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ ARIA Protocol Deployment Complete!"
echo "=========================================="
echo ""
echo "Test the new behavior:"
echo "1. Open AI Console: http://localhost:3000/console.html"
echo "2. Send message: 'siapa kamu?'"
echo "3. Expected: Response in Indonesian introducing ARIA"
echo ""
echo "For more details, see: ARIA_PROTOCOL_DEPLOYMENT_GUIDE.md"
