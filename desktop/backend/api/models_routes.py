"""
API Routes for fetching available AI models
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional

router = APIRouter()

class ModelInfo(BaseModel):
    id: str
    name: str
    description: str
    provider: str

class ModelsResponse(BaseModel):
    models: List[ModelInfo]
    success: bool
    error: Optional[str] = None

@router.get("/models/claude", response_model=ModelsResponse)
async def get_claude_models():
    models = [
        ModelInfo(id="claude-opus-4-5",         name="Claude Opus 4",    description="Most powerful",              provider="claude"),
        ModelInfo(id="claude-sonnet-4-5",        name="Claude Sonnet 4",  description="Balanced (Recommended)",     provider="claude"),
        ModelInfo(id="claude-haiku-4-5",         name="Claude Haiku 4",   description="Fastest and cheapest",       provider="claude"),
        ModelInfo(id="claude-3-5-sonnet-20241022", name="Claude 3.5 Sonnet", description="Previous generation",    provider="claude"),
        ModelInfo(id="claude-3-5-haiku-20241022",  name="Claude 3.5 Haiku",  description="Previous generation",    provider="claude"),
    ]
    return ModelsResponse(models=models, success=True)

@router.get("/models/openai", response_model=ModelsResponse)
async def get_openai_models():
    models = [
        ModelInfo(id="gpt-4o",       name="GPT-4o",       description="Best for most tasks (Recommended)", provider="openai"),
        ModelInfo(id="gpt-4o-mini",  name="GPT-4o Mini",  description="Faster and cheaper",               provider="openai"),
        ModelInfo(id="o3",           name="o3",           description="Advanced reasoning",               provider="openai"),
        ModelInfo(id="o3-mini",      name="o3 Mini",      description="Fast reasoning model",             provider="openai"),
        ModelInfo(id="o1",           name="o1",           description="Previous reasoning model",         provider="openai"),
    ]
    return ModelsResponse(models=models, success=True)

@router.get("/models/gemini", response_model=ModelsResponse)
async def get_gemini_models():
    models = [
        ModelInfo(id="gemini-2.5-flash", name="Gemini 2.5 Flash", description="Latest, fast and free tier (Recommended)", provider="gemini"),
        ModelInfo(id="gemini-2.5-pro",   name="Gemini 2.5 Pro",   description="Most capable Gemini",                      provider="gemini"),
        ModelInfo(id="gemini-2.0-flash", name="Gemini 2.0 Flash", description="Previous generation",                      provider="gemini"),
    ]
    return ModelsResponse(models=models, success=True)

@router.get("/models/all", response_model=Dict)
async def get_all_models():
    try:
        claude_response  = await get_claude_models()
        openai_response  = await get_openai_models()
        gemini_response  = await get_gemini_models()
        return {
            "claude": claude_response.models  if claude_response.success  else [],
            "openai": openai_response.models  if openai_response.success  else [],
            "gemini": gemini_response.models  if gemini_response.success  else [],
            "success": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
