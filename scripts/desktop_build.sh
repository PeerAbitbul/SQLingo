#!/bin/bash

# DB Chat Backend Build Script
# Builds standalone executable using PyInstaller

echo "🚀 DB Chat Backend Build Script"
echo "================================"
echo ""

# Check if virtual environment is activated
if [ -z "$VIRTUAL_ENV" ]; then
    echo "⚠️  Virtual environment not activated!"
    echo "Activating venv..."
    source venv/bin/activate
fi

# Check if PyInstaller is installed
if ! python -c "import PyInstaller" 2>/dev/null; then
    echo "📦 Installing PyInstaller..."
    pip install pyinstaller
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf build dist *.spec

# Build using Python script
echo "🔨 Building executable..."
python build.py

# Check if build was successful
if [ -f "dist/db-chat-backend" ]; then
    echo ""
    echo "✅ Build successful!"
    echo "📦 Executable: dist/db-chat-backend"
    echo ""
    echo "To test:"
    echo "  cd dist"
    echo "  ./db-chat-backend"
else
    echo ""
    echo "❌ Build failed!"
    exit 1
fi

