#!/bin/bash

echo "🧹 Clearing Vite cache..."
rm -rf node_modules/.vite
rm -rf dist

echo "✅ Cache cleared!"
echo ""
echo "Now run: npm run dev"

