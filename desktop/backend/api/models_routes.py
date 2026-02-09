"""
API Routes for fetching available AI models
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import httpx
import os

router = APIRouter()

class ModelInfo(BaseModel):
    id: str
    name: str
    description: str
    provider: str
    pricing: Optional[Dict[str, float]] = None

class ModelsResponse(BaseModel):
    models: List[ModelInfo]
    success: bool
    error: Optional[str] = None

@router.get("/models/claude", response_model=ModelsResponse)
async def get_claude_models():
    """Fetch available Claude models from Anthropic API"""
    try:
        # For now, return known working models
        # In future, this could fetch from Anthropic's API
        models = [
            ModelInfo(
                id="claude-3-opus-20240229",
                name="Claude 3 Opus",
                description="Most powerful model",
                provider="claude",
                pricing={"input": 15.0, "output": 75.0}
            ),
            ModelInfo(
                id="claude-3-sonnet-20240229",
                name="Claude 3 Sonnet",
                description="Balanced performance (Recommended)",
                provider="claude",
                pricing={"input": 3.0, "output": 15.0}
            ),
            ModelInfo(
                id="claude-3-haiku-20240307",
                name="Claude 3 Haiku",
                description="Fastest and cheapest",
                provider="claude",
                pricing={"input": 0.25, "output": 1.25}
            ),
        ]
        
        return ModelsResponse(models=models, success=True)
    except Exception as e:
        return ModelsResponse(models=[], success=False, error=str(e))

@router.get("/models/openai", response_model=ModelsResponse)
async def get_openai_models():
    """Fetch available OpenAI models"""
    try:
        models = [
            ModelInfo(
                id="gpt-4o",
                name="GPT-4o",
                description="Latest GPT-4 (Recommended)",
                provider="openai",
                pricing={"input": 2.5, "output": 10.0}
            ),
            ModelInfo(
                id="gpt-4o-mini",
                name="GPT-4o Mini",
                description="Faster and cheaper",
                provider="openai",
                pricing={"input": 0.15, "output": 0.6}
            ),
            ModelInfo(
                id="gpt-4-turbo",
                name="GPT-4 Turbo",
                description="Previous generation",
                provider="openai",
                pricing={"input": 10.0, "output": 30.0}
            ),
            ModelInfo(
                id="gpt-4",
                name="GPT-4",
                description="Original GPT-4",
                provider="openai",
                pricing={"input": 30.0, "output": 60.0}
            ),
            ModelInfo(
                id="gpt-3.5-turbo",
                name="GPT-3.5 Turbo",
                description="Cheapest option",
                provider="openai",
                pricing={"input": 0.5, "output": 1.5}
            ),
        ]
        
        return ModelsResponse(models=models, success=True)
    except Exception as e:
        return ModelsResponse(models=[], success=False, error=str(e))

@router.get("/models/gemini", response_model=ModelsResponse)
async def get_gemini_models():
    """Fetch available Gemini models"""
    try:
        models = [
            ModelInfo(
                id="gemini-2.5-flash",
                name="Gemini 2.5 Flash",
                description="Latest and fastest (Recommended)",
                provider="gemini",
                pricing={"input": 0.0, "output": 0.0}  # Free tier
            ),
            ModelInfo(
                id="gemini-1.5-pro",
                name="Gemini 1.5 Pro",
                description="More powerful",
                provider="gemini",
                pricing={"input": 1.25, "output": 5.0}
            ),
            ModelInfo(
                id="gemini-1.5-flash",
                name="Gemini 1.5 Flash",
                description="Previous version",
                provider="gemini",
                pricing={"input": 0.0, "output": 0.0}
            ),
            ModelInfo(
                id="gemini-pro",
                name="Gemini Pro",
                description="Older version",
                provider="gemini",
                pricing={"input": 0.5, "output": 1.5}
            ),
        ]
        
        return ModelsResponse(models=models, success=True)
    except Exception as e:
        return ModelsResponse(models=[], success=False, error=str(e))

@router.get("/models/all", response_model=Dict)
async def get_all_models():
    """Fetch all available models from all providers"""
    try:
        claude_response = await get_claude_models()
        openai_response = await get_openai_models()
        gemini_response = await get_gemini_models()
        
        return {
            "claude": claude_response.models if claude_response.success else [],
            "openai": openai_response.models if openai_response.success else [],
            "gemini": gemini_response.models if gemini_response.success else [],
            "success": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

