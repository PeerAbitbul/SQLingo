"""
SQLingo - Local Backend
FastAPI server that runs locally on user's machine
"""
import sys
import asyncio

# Windows fix: ProactorEventLoop (default on Windows) causes "Invalid argument"
# errors with httpx/SSL. SelectorEventLoop is required for compatibility.
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import uvicorn
import socket
import json
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from api.ollama_routes import router as ollama_router
from api.agent_routes import router as agent_router
from startup import init_on_startup
from agent.scheduler import agent_scheduler  # Import our new Agent Scheduler

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

def find_free_port(start_port: int = 8000, max_attempts: int = 100) -> int:
    """
    Find a free port starting from start_port.
    Tries ports sequentially: 8000, 8001, 8002, etc.

    Args:
        start_port: The port to start searching from (default: 8000)
        max_attempts: Maximum number of ports to try (default: 100)

    Returns:
        int: A free port number

    Raises:
        RuntimeError: If no free port is found after max_attempts
    """
    for port_offset in range(max_attempts):
        port = start_port + port_offset
        try:
            # Try to bind to the port
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('127.0.0.1', port))
                s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                return port
        except OSError:
            # Port is already in use, try next one
            continue

    raise RuntimeError(f"Could not find a free port after trying {max_attempts} ports starting from {start_port}")

def save_port_config(port: int) -> None:
    """
    Save the backend port to a configuration file that the frontend can read.
    The file is saved in the user's home directory.

    Args:
        port: The port number to save
    """
    # Create config directory in user's home
    config_dir = Path.home() / '.sqlingo'
    config_dir.mkdir(exist_ok=True)

    config_file = config_dir / 'backend_port.json'

    config_data = {
        'port': port,
        'host': '127.0.0.1',
        'base_url': f'http://127.0.0.1:{port}/api'
    }

    with open(config_file, 'w') as f:
        json.dump(config_data, f, indent=2)

    print(f"[OK] Backend port configuration saved to: {config_file}")

app = FastAPI(
    title="SQLingo Local Backend",
    description="AI-Powered Database Assistant - Local Backend",
    version="0.1.0"
)

# CORS middleware for Electron app
# Allow all origins for Electron (since it runs locally)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (Electron uses file:// protocol)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api")
app.include_router(ollama_router, prefix="/api/ollama")
app.include_router(agent_router, prefix="/api/agents")

@app.on_event("startup")
async def startup_event():
    # Start the background job scheduler
    agent_scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    if agent_scheduler.scheduler:
        agent_scheduler.scheduler.shutdown()

@app.get("/")
async def root():
    return {
        "message": "SQLingo Local Backend",
        "version": "0.1.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    # Detect if running as PyInstaller bundle
    import sys
    is_frozen = getattr(sys, 'frozen', False)

    print("[INFO] Initializing local database...")
    init_on_startup()

    # Port from environment or default (high port unlikely to conflict)
    port = int(os.getenv('DESKTOP_BACKEND_PORT', '39847'))

    # Save port configuration for frontend (still useful for consistency)
    save_port_config(port)

    print(f"[OK] Using fixed port: {port}")
    print(f"[START] Starting backend server on http://127.0.0.1:{port}")
    print(f"[INFO] API available at: http://127.0.0.1:{port}/api")

    # When frozen (PyInstaller), pass the app object directly
    # When not frozen (development), use the string reference to enable reload
    if is_frozen:
        print("[OK] Running in production mode (no auto-reload)")
        uvicorn.run(
            app,  # Pass app object directly in production
            host="127.0.0.1",
            port=port,
            log_level="info"
        )
    else:
        print("[OK] Running in development mode (auto-reload enabled)")
        uvicorn.run(
            "main:app",  # Use string reference in development for reload
            host="127.0.0.1",
            port=port,
            reload=True,
            log_level="info"
        )

