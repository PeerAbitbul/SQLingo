#!/bin/bash

# DB Chat - Frontend Runner Script

echo "🚀 Starting DB Chat Frontend..."
echo ""

cd "$(dirname "$0")/desktop/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ Node modules not found!"
    echo "Installing dependencies..."
    npm install
fi

# Run Tauri dev
echo "✅ Starting Tauri app..."
echo ""
npm run tauri:dev

