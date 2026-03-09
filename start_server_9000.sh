#!/bin/bash

echo "=================================================="
echo "🚀 Starting Aivory on Port 9000"
echo "=================================================="
echo ""

# Check if port 9000 is already in use
if lsof -Pi :9000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 9000 is already in use"
    echo ""
    echo "Current process:"
    lsof -i :9000
    echo ""
    read -p "Kill existing process and restart? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Killing process on port 9000..."
        kill $(lsof -t -i:9000)
        sleep 1
    else
        echo "Exiting..."
        exit 1
    fi
fi

echo "✓ Port 9000 is available"
echo ""
echo "Starting simple_server.py on port 9000..."
echo "This serves both frontend files AND API endpoints"
echo ""
echo "Access the app at:"
echo "  • Main app:  http://localhost:9000/index.html"
echo "  • Dashboard: http://localhost:9000/dashboard.html"
echo "  • API test:  http://localhost:9000/test-api-connection.html"
echo ""
echo "Press Ctrl+C to stop"
echo ""
echo "=================================================="
echo ""

python3 simple_server.py
