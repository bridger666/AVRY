#!/bin/bash

# Start Aivory Console (Backend + Frontend)

echo "🚀 Starting Aivory Console..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js first:"
    echo "  brew install node"
    echo "  or visit https://nodejs.org/"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "nextjs-console/node_modules" ]; then
    echo "📦 Installing Next.js dependencies..."
    cd nextjs-console
    npm install
    cd ..
    echo ""
fi

# Start backend
echo "🔧 Starting Backend (port 8081)..."
python3 -m uvicorn app.main:app --reload --port 8081 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting Frontend (port 3000)..."
cd nextjs-console
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Aivory Console is running!"
echo ""
echo "📍 Backend:  http://localhost:8081"
echo "📍 Frontend: http://localhost:3000/console"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
