@echo off
REM DB Chat - Backend Runner Script (Windows)

echo Starting DB Chat Backend...
echo.

cd /d "%~dp0desktop\backend"

REM Check if virtual environment exists
if not exist "venv\" (
    echo Virtual environment not found!
    echo Please run: python -m venv venv
    echo Then: venv\Scripts\activate ^&^& pip install -r requirements.txt
    exit /b 1
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Run the server
echo Starting FastAPI server...
echo.
python main.py

