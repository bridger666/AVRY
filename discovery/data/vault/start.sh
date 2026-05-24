#!/bin/bash

echo "🚀 Starting Aivory AI Readiness Platform..."
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt

# Check if .env exists, if not copy from .env.example
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Starting backend server on http://localhost:8081..."
echo "📂 Frontend files are in the 'frontend' directory"
echo ""
echo "To view the application:"
echo "  1. Open frontend/index.html in your browser, OR"
echo "  2. Use a simple HTTP server: python3 -m http.server 8080 --directory frontend"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8081 --reload
