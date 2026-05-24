#!/bin/bash

# Aivory Layered Diagnostic System - Deployment Script
# This script deploys the complete 3-tier diagnostic system to XAMPP

echo "========================================="
echo "Aivory Layered Diagnostic System"
echo "Deployment Script"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running from correct directory
if [ ! -f "run_server.py" ]; then
    echo -e "${RED}Error: Must run from Aivory project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Copying frontend files to XAMPP...${NC}"
cp -v frontend/* /Applications/XAMPP/xamppfiles/htdocs/aivory/frontend/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend files copied successfully${NC}"
else
    echo -e "${RED}✗ Failed to copy frontend files${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 2: Restarting XAMPP...${NC}"
sudo /Applications/XAMPP/xamppfiles/xampp restart

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ XAMPP restarted successfully${NC}"
else
    echo -e "${RED}✗ Failed to restart XAMPP${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 3: Checking backend status...${NC}"

# Check if backend is running
if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✓ Backend is running on port 8081${NC}"
else
    echo -e "${YELLOW}⚠ Backend is not running${NC}"
    echo -e "${YELLOW}Starting backend...${NC}"
    python run_server.py &
    sleep 3
    if lsof -Pi :8081 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${GREEN}✓ Backend started successfully${NC}"
    else
        echo -e "${RED}✗ Failed to start backend${NC}"
        exit 1
    fi
fi

echo ""
echo "========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "========================================="
echo ""
echo "Access points:"
echo "  Frontend: http://localhost/aivory/frontend/index.html"
echo "  Backend:  http://localhost:8081"
echo ""
echo "Test the system:"
echo "  1. Free Diagnostic (12 questions)"
echo "  2. AI Snapshot (30 questions) - \$15"
echo "  3. Deep Diagnostic (Blueprint) - \$99"
echo ""
echo "Documentation:"
echo "  - LAYERED_DIAGNOSTIC_ARCHITECTURE.md"
echo "  - TESTING_LAYERED_SYSTEM.md"
echo ""
echo "Hard refresh browser: Cmd + Shift + R"
echo ""
