"""
AI Provider Enum
"""
from enum import Enum

class AIProvider(str, Enum):
    """Supported AI providers"""
    CLAUDE = "claude"
    OPENAI = "openai"
    GEMINI = "gemini"
    BEDROCK = "bedrock"
    OLLAMA = "ollama"


