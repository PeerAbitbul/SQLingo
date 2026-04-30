"""
Ollama API Routes
Endpoints for managing local Ollama server: status, hardware, catalog, model pull/delete.
"""
import json
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ai.ollama_provider import OllamaProvider
from ai.ollama_catalog import MODEL_CATALOG
from utils.hardware_detector import detect_hardware, recommend_models

logger = logging.getLogger(__name__)

router = APIRouter()


# Request models
class ModelRequest(BaseModel):
    model: str
    base_url: Optional[str] = None


# ── Status ──────────────────────────────────────────────────────────────────

@router.get("/status")
async def ollama_status(base_url: Optional[str] = None):
    """Check if Ollama server is running."""
    url = base_url or OllamaProvider.DEFAULT_BASE_URL
    version = OllamaProvider.is_ollama_running(url)
    return {
        "installed": version is not None,
        "running": version is not None,
        "version": version,
        "base_url": url,
    }


# ── Hardware ────────────────────────────────────────────────────────────────

@router.get("/hardware")
async def get_hardware():
    """Detect hardware specs for model recommendations."""
    return detect_hardware()


# ── Catalog ─────────────────────────────────────────────────────────────────

@router.get("/catalog")
async def get_catalog(base_url: Optional[str] = None):
    """
    Return full model catalog with fit badges + other installed models.
    """
    hardware = detect_hardware()
    catalog = recommend_models(MODEL_CATALOG, hardware)

    # Fetch other installed models not in the catalog
    other_installed = []
    url = base_url or OllamaProvider.DEFAULT_BASE_URL
    version = OllamaProvider.is_ollama_running(url)
    if version:
        try:
            provider = OllamaProvider(base_url=url)
            all_models = provider.get_available_models()
            catalog_ids = {m["id"] for m in MODEL_CATALOG}
            other_installed = [m for m in all_models if m not in catalog_ids]
        except Exception as e:
            logger.warning(f"Failed to list Ollama models: {e}")

    return {
        "catalog": catalog,
        "gemma": [m for m in catalog if m.get("family") == "Gemma 4"],  # backward compat
        "other_installed": other_installed,
        "hardware": hardware,
    }


# ── Installed models ────────────────────────────────────────────────────────

@router.get("/installed")
async def get_installed(base_url: Optional[str] = None):
    """List all models currently installed in Ollama."""
    url = base_url or OllamaProvider.DEFAULT_BASE_URL
    version = OllamaProvider.is_ollama_running(url)
    if not version:
        return {"models": [], "running": False}

    try:
        provider = OllamaProvider(base_url=url)
        models = provider.get_available_models()
        return {"models": models, "running": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Pull (SSE stream) ──────────────────────────────────────────────────────

@router.post("/pull")
async def pull_model(request: ModelRequest):
    """
    Pull a model from Ollama registry.
    Returns Server-Sent Events with download progress.
    """
    import httpx

    base_url = (request.base_url or OllamaProvider.DEFAULT_BASE_URL).rstrip("/")

    # Verify Ollama is running first
    version = OllamaProvider.is_ollama_running(base_url)
    if not version:
        raise HTTPException(
            status_code=503,
            detail="Ollama is not running. Start with `ollama serve`.",
        )

    async def event_stream():
        try:
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream(
                    "POST",
                    f"{base_url}/api/pull",
                    json={"model": request.model, "stream": True},
                ) as response:
                    if response.status_code != 200:
                        body = await response.aread()
                        error_data = {
                            "model": request.model,
                            "status": "error",
                            "error": body.decode("utf-8", errors="replace")[:200],
                            "done": True,
                        }
                        yield f"data: {json.dumps(error_data)}\n\n"
                        return

                    async for line in response.aiter_lines():
                        if not line.strip():
                            continue
                        try:
                            data = json.loads(line)
                        except json.JSONDecodeError:
                            continue

                        completed = data.get("completed", 0)
                        total = data.get("total", 0)
                        percent = round((completed / total) * 100, 1) if total > 0 else 0

                        event = {
                            "model": request.model,
                            "status": data.get("status", ""),
                            "completed": completed,
                            "total": total,
                            "percent": percent,
                            "done": data.get("status") == "success",
                        }
                        yield f"data: {json.dumps(event)}\n\n"

        except httpx.ConnectError:
            error_data = {
                "model": request.model,
                "status": "error",
                "error": "Cannot connect to Ollama server.",
                "done": True,
            }
            yield f"data: {json.dumps(error_data)}\n\n"
        except Exception as e:
            error_data = {
                "model": request.model,
                "status": "error",
                "error": str(e)[:200],
                "done": True,
            }
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ── Delete ──────────────────────────────────────────────────────────────────

@router.post("/delete")
async def delete_model(request: ModelRequest):
    """Delete a model from Ollama."""
    import httpx

    base_url = (request.base_url or OllamaProvider.DEFAULT_BASE_URL).rstrip("/")

    version = OllamaProvider.is_ollama_running(base_url)
    if not version:
        raise HTTPException(
            status_code=503,
            detail="Ollama is not running. Start with `ollama serve`.",
        )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.request(
                "DELETE",
                f"{base_url}/api/delete",
                json={"model": request.model},
            )

            if response.status_code == 200:
                return {"success": True, "model": request.model}
            else:
                body = response.text or ""
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to delete model: {body[:200]}",
                )
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Cannot connect to Ollama server.",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
