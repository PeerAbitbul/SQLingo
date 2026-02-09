#!/bin/bash

# DB Chat - Backend Runner Script

echo "🚀 Starting DB Chat Backend..."
echo ""

cd "$(dirname "$0")/desktop/backend"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run: python3 -m venv venv"
    echo "Then: source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Activate virtual environment
echo "✅ Activating virtual environment..."
source venv/bin/activate

# Check if dependencies are installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo "❌ Dependencies not installed!"
    echo "Installing dependencies..."
    pip install -r requirements.txt
fi

# Run the server
echo "✅ Starting FastAPI server..."
echo ""
python main.py

