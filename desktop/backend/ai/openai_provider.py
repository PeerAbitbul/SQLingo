"""
OpenAI AI provider.
Supports GPT-4, GPT-4o, and other OpenAI models.
"""
from typing import List
import time
import logging
from openai import OpenAI
from openai import OpenAIError

from ai.base import AIProviderBase, ChatRequest, ChatResponse, Message

logger = logging.getLogger(__name__)


class OpenAIProvider(AIProviderBase):
    """
    OpenAI provider for GPT models.
    Handles chat completions with usage tracking and cost calculation.
    """
    
    # Model pricing per 1M tokens (updated 2024)
    PRICING = {
        "gpt-4": {"input": 30.00, "output": 60.00},
        "gpt-4-turbo": {"input": 10.00, "output": 30.00},
        "gpt-4o": {"input": 5.00, "output": 15.00},
        "gpt-4o-mini": {"input": 0.15, "output": 0.60},
        "gpt-3.5-turbo": {"input": 0.50, "output": 1.50},
    }
    
    def __init__(self, api_key: str):
        """
        Initialize OpenAI provider.
        
        Args:
            api_key: OpenAI API key
        """
        super().__init__(api_key, "openai")
        self.client = OpenAI(api_key=api_key)
        self.default_model = "gpt-4o"  # Best model for SQL generation
    
    def chat(self, request: ChatRequest) -> ChatResponse:
        """
        Send chat completion request to OpenAI.
        
        Args:
            request: ChatRequest with messages and parameters
            
        Returns:
            ChatResponse with AI response and usage data
        """
        start_time = time.time()
        
        try:
            # Format messages
            messages = self._format_messages(request.messages)
            
            # Prepare parameters
            params = {
                "model": request.model or self.default_model,
                "messages": messages,
                "temperature": request.temperature,
            }
            
            if request.max_tokens:
                params["max_tokens"] = request.max_tokens
            
            # Make API request
            response = self.client.chat.completions.create(**params)
            
            # Extract data
            message = response.choices[0].message
            usage = response.usage
            
            # Calculate metrics
            tokens_prompt = usage.prompt_tokens
            tokens_completion = usage.completion_tokens
            tokens_total = usage.total_tokens
            latency_ms = self._measure_latency(start_time)
            
            return ChatResponse(
                content=message.content,
                model=response.model,
                provider=self.provider_name,
                tokens_prompt=tokens_prompt,
                tokens_completion=tokens_completion,
                tokens_total=tokens_total,
                latency_ms=latency_ms,
                finish_reason=response.choices[0].finish_reason,
                request_id=response.id,
            )
            
        except OpenAIError as e:
            error_str = str(e)
            logger.error(f"OpenAI API error: {error_str}")
            
            # Provide user-friendly error messages
            if "invalid_api_key" in error_str or "Incorrect API key" in error_str:
                raise RuntimeError(
                    "Invalid OpenAI API key. Please check your API key in Settings > API Keys. "
                    "Get your API key from: https://platform.openai.com/api-keys"
                )
            elif "insufficient_quota" in error_str:
                raise RuntimeError("OpenAI API quota exceeded. Please check your billing at: https://platform.openai.com/account/billing")
            elif "rate_limit" in error_str:
                raise RuntimeError("OpenAI API rate limit exceeded. Please try again later.")
            else:
                raise RuntimeError(f"OpenAI API error: {error_str}")
        except Exception as e:
            logger.error(f"Unexpected error in OpenAI provider: {e}")
            raise RuntimeError(f"OpenAI provider error: {str(e)}")
    
    def get_available_models(self) -> List[str]:
        """
        Get list of available OpenAI models by querying the OpenAI API.

        This fetches the current list of chat models directly from OpenAI,
        ensuring the app always has access to the latest models without updates.

        Returns:
            List of model names suitable for chat completions
        """
        try:
            # Fetch all models from OpenAI API
            models_response = self.client.models.list()

            # Filter to only GPT chat models (exclude embeddings, whisper, dall-e, etc.)
            chat_models = []
            for model in models_response.data:
                model_id = model.id
                # Include GPT models suitable for chat
                if any(prefix in model_id for prefix in ["gpt-4", "gpt-3.5-turbo"]):
                    chat_models.append(model_id)

            # Sort models: put newer/better models first
            priority_order = ["gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"]
            sorted_models = []

            # Add priority models first (in order)
            for priority in priority_order:
                matching = [m for m in chat_models if m.startswith(priority)]
                sorted_models.extend(sorted(matching, reverse=True))  # Newest first

            # Add any remaining models
            remaining = [m for m in chat_models if m not in sorted_models]
            sorted_models.extend(sorted(remaining, reverse=True))

            # Remove duplicates while preserving order
            seen = set()
            unique_models = []
            for m in sorted_models:
                if m not in seen:
                    seen.add(m)
                    unique_models.append(m)

            return unique_models if unique_models else self._fallback_models()

        except Exception as e:
            logger.warning(f"Failed to fetch OpenAI models from API: {e}")
            return self._fallback_models()

    def _fallback_models(self) -> List[str]:
        """Fallback model list if API fetch fails"""
        return [
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4-turbo",
            "gpt-4",
            "gpt-3.5-turbo",
        ]
    
    def calculate_cost(self, input_tokens: int, output_tokens: int, model: str) -> float:
        """
        Calculate cost based on OpenAI pricing.
        
        Args:
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            model: Model name
            
        Returns:
            Cost in USD
        """
        # Get pricing for model (use gpt-4o-mini as default)
        pricing = self.PRICING.get(model, self.PRICING["gpt-4o-mini"])
        
        input_cost = (input_tokens / 1_000_000) * pricing["input"]
        output_cost = (output_tokens / 1_000_000) * pricing["output"]
        
        return round(input_cost + output_cost, 6)

