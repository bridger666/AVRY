#!/bin/bash

# Aivory Backend Startup Script

echo "🚀 Starting Aivory Backend Server..."
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please create .env.local with your Sumopod API credentials"
    exit 1
fi

# Check if Sumopod API key is set
if ! grep -q "SUMOPOD_API_KEY" .env.local; then
    echo "⚠️  Warning: SUMOPOD_API_KEY not found in .env.local"
fi

# Display configuration
echo "📋 Configuration:"
echo "   - Port: 8081"
echo "   - Reload: Enabled"
echo "   - Log Level: Info"
echo ""

# Start server
echo "✅ Starting server..."
echo ""
uvicorn app.main:app --reload --port 8081 --log-level info

