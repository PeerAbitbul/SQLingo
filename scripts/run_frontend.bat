@echo off
REM DB Chat - Frontend Runner Script (Windows)

echo Starting DB Chat Frontend...
echo.

cd /d "%~dp0desktop\frontend"

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Node modules not found!
    echo Installing dependencies...
    call npm install
)

REM Run Tauri dev
echo Starting Tauri app...
echo.
call npm run tauri:dev

