#!/bin/bash
# Builds the Python backend with PyInstaller and copies it to frontend/resources

set -e

BACKEND_DIR="$(cd "$(dirname "$0")/../desktop/backend" && pwd)"
RESOURCES_DIR="$(cd "$(dirname "$0")/../desktop/frontend" && pwd)/resources"

echo "Building Python backend..."

cd "$BACKEND_DIR"

# Activate venv
if [ -f "venv/bin/activate" ]; then
  source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
  source venv/Scripts/activate
else
  echo "ERROR: venv not found. Run: python -m venv venv && pip install -r requirements.txt"
  exit 1
fi

pip install pyinstaller -q
pyinstaller db-chat-backend.spec --noconfirm

mkdir -p "$RESOURCES_DIR"

if [ -f "dist/db-chat-backend" ]; then
  cp dist/db-chat-backend "$RESOURCES_DIR/db-chat-backend"
  echo "Backend ready at resources/db-chat-backend"
elif [ -f "dist/db-chat-backend.exe" ]; then
  cp dist/db-chat-backend.exe "$RESOURCES_DIR/db-chat-backend.exe"
  echo "Backend ready at resources/db-chat-backend.exe"
else
  echo "ERROR: PyInstaller output not found"
  exit 1
fi
