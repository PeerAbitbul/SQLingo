#!/bin/bash

# DB Chat - Development Startup Script
# This script starts both backend and frontend in development mode

echo "=================================="
echo "DB Chat - Starting Development"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "desktop" ]; then
    echo -e "${RED}Error: Must run from project root directory${NC}"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Check if backend venv exists
if [ ! -d "desktop/backend/venv" ]; then
    echo -e "${YELLOW}Backend virtual environment not found!${NC}"
    echo "Creating virtual environment..."
    cd desktop/backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    pip install mssql-python
    cd ../..
    echo -e "${GREEN}Virtual environment created!${NC}"
    echo ""
fi

# Check if .env exists
if [ ! -f "desktop/backend/.env" ]; then
    echo -e "${YELLOW}Backend .env file not found!${NC}"
    echo "Copying from env.example..."
    cp desktop/backend/env.example desktop/backend/.env
    echo -e "${GREEN}.env file created!${NC}"
    echo -e "${YELLOW}Please edit desktop/backend/.env and add your API keys${NC}"
    echo ""
fi

# Check if frontend node_modules exists
if [ ! -d "desktop/frontend/node_modules" ]; then
    echo -e "${YELLOW}Frontend dependencies not found!${NC}"
    echo "Installing dependencies..."
    cd desktop/frontend
    npm install
    cd ../..
    echo -e "${GREEN}Dependencies installed!${NC}"
    echo ""
fi

echo "=================================="
echo "Starting Backend..."
echo "=================================="
echo ""

# Start backend in background
cd desktop/backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ../..

echo -e "${GREEN}Backend started (PID: $BACKEND_PID)${NC}"
echo "Backend URL: http://localhost:8000"
echo ""

# Wait for backend to start
echo "Waiting for backend to be ready..."
sleep 3

# Check if backend is running
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}Backend is ready!${NC}"
else
    echo -e "${YELLOW}Backend might still be starting...${NC}"
fi

echo ""
echo "=================================="
echo "Starting Frontend (Electron)..."
echo "=================================="
echo ""

# Start frontend
cd desktop/frontend
npm run electron:dev &
FRONTEND_PID=$!
cd ../..

echo -e "${GREEN}Frontend started (PID: $FRONTEND_PID)${NC}"
echo ""

echo "=================================="
echo "Application Started!"
echo "=================================="
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "To stop:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo "  or press Ctrl+C"
echo ""
echo "Logs:"
echo "  Backend: Check terminal output"
echo "  Frontend: Open DevTools in app"
echo ""

# Wait for user to stop
trap "echo ''; echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Keep script running
wait

