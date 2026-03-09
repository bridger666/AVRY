#!/bin/bash

# Aivory Development Startup Script
# This script starts both backend and frontend servers

echo "🚀 Starting Aivory Development Environment..."
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if uvicorn is installed
if ! python3 -c "import uvicorn" &> /dev/null; then
    echo "❌ Uvicorn is not installed. Installing dependencies..."
    pip3 install -r requirements.txt
fi

echo "✅ Dependencies OK"
echo ""

# Start backend in background
echo "🔧 Starting Backend API on port 8081..."
python3 -m uvicorn app.main:app --reload --port 8081 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:8081/health > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""

# Start frontend in background
echo "🌐 Starting Frontend on port 9000..."
cd frontend && python3 -m http.server 9000 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

# Wait for frontend to start
sleep 2

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "📍 URLs:"
echo "   Frontend:  http://localhost:9000"
echo "   Backend:   http://localhost:8081"
echo "   API Docs:  http://localhost:8081/docs"
echo "   Quick Login: http://localhost:9000/superadmin-login.html"
echo ""
echo "🔐 Superadmin Credentials:"
echo "   Email:    grandmaster@aivory.ai"
echo "   Password: GrandMaster2026!"
echo ""
echo "📝 To stop servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "💡 Opening quick login page in 3 seconds..."
sleep 3

# Try to open browser (works on macOS and Linux)
if command -v open &> /dev/null; then
    open http://localhost:9000/superadmin-login.html
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:9000/superadmin-login.html
else
    echo "   Please open: http://localhost:9000/superadmin-login.html"
fi

echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for user to stop
wait
