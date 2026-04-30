"""
Base AI provider class.
All AI providers inherit from this base class.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import time


@dataclass
class Message:
    """Chat message structure."""
    role: str  # "system", "user", or "assistant"
    content: str


@dataclass
class ChatRequest:
    """Request structure for chat completions."""
    messages: List[Message]
    model: Optional[str] = None
    temperature: float = 0.7
    max_tokens: Optional[int] = None


@dataclass
class ChatResponse:
    """Response structure from AI providers."""
    content: str
    model: str
    provider: str
    tokens_prompt: int
    tokens_completion: int
    tokens_total: int
    latency_ms: int
    finish_reason: Optional[str] = None
    request_id: Optional[str] = None


class AIProviderBase(ABC):
    """
    Abstract base class for AI providers.
    Ensures consistent interface across OpenAI, Claude, Gemini.
    """
    
    def __init__(self, api_key: str, provider_name: str):
        """
        Initialize AI provider.
        
        Args:
            api_key: API key for the provider
            provider_name: Name of the provider (openai, claude, gemini)
        """
        self.api_key = api_key
        self.provider_name = provider_name
        self.default_model: Optional[str] = None
    
    @abstractmethod
    def chat(self, request: ChatRequest) -> ChatResponse:
        """
        Send a chat completion request.
        
        Args:
            request: ChatRequest with messages and parameters
            
        Returns:
            ChatResponse with AI response and usage data
        """
        pass
    
    @abstractmethod
    def get_available_models(self) -> List[str]:
        """
        Get list of available models from provider.
        
        Returns:
            List of model names
        """
        pass
    
    def _format_messages(self, messages: List[Message]) -> List[Dict[str, str]]:
        """
        Format messages for API request.
        
        Args:
            messages: List of Message objects
            
        Returns:
            List of message dictionaries
        """
        return [{"role": msg.role, "content": msg.content} for msg in messages]
    
    def _measure_latency(self, start_time: float) -> int:
        """
        Calculate request latency in milliseconds.
        
        Args:
            start_time: Request start time from time.time()
            
        Returns:
            Latency in milliseconds
        """
        return int((time.time() - start_time) * 1000)

