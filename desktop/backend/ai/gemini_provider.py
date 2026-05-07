"""
Google Gemini AI provider.
Supports Gemini 2.5 and other Google AI models.
"""
from typing import List, Generator
import time
import logging
import json
import httpx

from ai.base import AIProviderBase, ChatRequest, ChatResponse

_RETRY_STATUS_CODES = {429, 503, 504}

logger = logging.getLogger(__name__)


class GeminiProvider(AIProviderBase):
    """
    Google Gemini provider.
    Uses Google AI API (not Vertex AI).
    """
    
    # Model pricing per 1M tokens (updated for Gemini 2.5)
    PRICING = {
        # Legacy models (deprecated)
        "gemini-pro": {"input": 0.50, "output": 1.50},
        "gemini-1.5-pro": {"input": 1.25, "output": 5.00},
        "gemini-1.5-flash": {"input": 0.075, "output": 0.30},
        # Gemini 2.0 models
        "gemini-2.0-flash": {"input": 0.075, "output": 0.30},
        # Gemini 2.5 models (latest)
        "gemini-2.5-flash": {"input": 0.075, "output": 0.30},
        "gemini-2.5-pro": {"input": 1.25, "output": 5.00},
    }
    
    def __init__(self, api_key: str):
        """
        Initialize Gemini provider.
        
        Args:
            api_key: Google AI API key
        """
        super().__init__(api_key, "gemini")
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        self.default_model = "gemini-2.5-flash"  # Latest and fastest
    
    def chat(self, request: ChatRequest) -> ChatResponse:
        """
        Send chat completion request to Gemini.
        
        Args:
            request: ChatRequest with messages and parameters
            
        Returns:
            ChatResponse with AI response and usage data
        """
        start_time = time.time()
        
        try:
            model = request.model or self.default_model
            
            # Convert messages to Gemini format
            contents = []
            for msg in request.messages:
                if msg.role == "system":
                    # System messages become part of first user message
                    contents.append({
                        "role": "user",
                        "parts": [{"text": f"System: {msg.content}"}]
                    })
                elif msg.role == "user":
                    contents.append({
                        "role": "user",
                        "parts": [{"text": msg.content}]
                    })
                elif msg.role == "assistant":
                    contents.append({
                        "role": "model",
                        "parts": [{"text": msg.content}]
                    })
            
            # Prepare payload
            payload = {
                "contents": contents,
                "generationConfig": {"temperature": request.temperature},
            }
            if request.system:
                payload["systemInstruction"] = {"parts": [{"text": request.system}]}
            if request.max_tokens:
                payload["generationConfig"]["maxOutputTokens"] = request.max_tokens
            
            # Make API request with retry for transient errors
            url = f"{self.base_url}/models/{model}:generateContent?key={self.api_key}"
            max_attempts = 3
            data = None
            for attempt in range(1, max_attempts + 1):
                with httpx.Client(timeout=60.0) as client:
                    response = client.post(url, json=payload)
                if response.status_code not in _RETRY_STATUS_CODES:
                    response.raise_for_status()
                    data = response.json()
                    break
                if attempt == max_attempts:
                    response.raise_for_status()
                wait = 2 ** (attempt - 1)
                logger.warning(f"Gemini API returned {response.status_code}, retrying in {wait}s (attempt {attempt}/{max_attempts})")
                time.sleep(wait)
            
            # Extract data
            candidate = data["candidates"][0]
            finish_reason = candidate.get("finishReason", "STOP")

            # Handle different response formats
            if "content" in candidate and "parts" in candidate["content"]:
                content = candidate["content"]["parts"][0]["text"]
            elif "text" in candidate:
                content = candidate["text"]
            elif finish_reason == "MAX_TOKENS":
                # Model hit token limit - return partial response
                logger.warning(f"Gemini hit MAX_TOKENS. Response may be incomplete.")
                content = "(Response truncated due to token limit. Please try with a shorter prompt or increase max_tokens.)"
            else:
                logger.error(f"Unexpected Gemini response format: {data}")
                raise RuntimeError(f"Unexpected Gemini response format. Missing 'parts' in response.")
            
            # Extract token usage (if available)
            usage_metadata = data.get("usageMetadata", {})
            tokens_prompt = usage_metadata.get("promptTokenCount", 0)
            tokens_completion = usage_metadata.get("candidatesTokenCount", 0)
            tokens_total = usage_metadata.get("totalTokenCount", tokens_prompt + tokens_completion)
            
            # Calculate metrics
            latency_ms = self._measure_latency(start_time)
            
            return ChatResponse(
                content=content,
                model=model,
                provider=self.provider_name,
                tokens_prompt=tokens_prompt,
                tokens_completion=tokens_completion,
                tokens_total=tokens_total,
                latency_ms=latency_ms,
                finish_reason=finish_reason,
                request_id=None,
            )
            
        except httpx.HTTPError as e:
            error_str = str(e)
            logger.error(f"Gemini API error: {error_str}")
            
            # Provide user-friendly error messages
            if "400" in error_str or "API_KEY_INVALID" in error_str:
                raise RuntimeError(
                    "Invalid Gemini API key. Please check your API key in Settings > API Keys. "
                    "Get your API key from: https://aistudio.google.com/app/apikey"
                )
            elif "403" in error_str:
                raise RuntimeError(
                    "Gemini API access forbidden. Please ensure your API key has the correct permissions. "
                    "Check your API key at: https://aistudio.google.com/app/apikey"
                )
            elif "429" in error_str:
                raise RuntimeError("Gemini API rate limit exceeded. Please try again later.")
            elif "404" in error_str and "not found" in error_str:
                raise RuntimeError(
                    "Gemini model not found. The model may not be available in your region or with your API key. "
                    "Try using 'gemini-1.5-flash' or 'gemini-1.5-pro' instead."
                )
            elif "503" in error_str:
                raise RuntimeError(
                    "Gemini service is temporarily unavailable. Please try again in a moment."
                )
            elif "504" in error_str:
                raise RuntimeError(
                    "Gemini request timed out (gateway timeout). Please try again."
                )
            else:
                raise RuntimeError(f"Gemini API error: {error_str}")
        except Exception as e:
            logger.error(f"Unexpected error in Gemini provider: {e}")
            raise RuntimeError(f"Gemini provider error: {str(e)}")
    
    def stream_chat(self, request: ChatRequest) -> Generator[str, None, None]:
        """Stream Gemini response tokens via SSE endpoint."""
        model = request.model or self.default_model
        contents = []
        for msg in request.messages:
            role = "model" if msg.role == "assistant" else "user"
            contents.append({"role": role, "parts": [{"text": msg.content}]})

        payload = {
            "contents": contents,
            "generationConfig": {"temperature": request.temperature},
        }
        if request.system:
            payload["systemInstruction"] = {"parts": [{"text": request.system}]}
        if request.max_tokens:
            payload["generationConfig"]["maxOutputTokens"] = request.max_tokens

        url = f"{self.base_url}/models/{model}:streamGenerateContent?key={self.api_key}&alt=sse"
        try:
            with httpx.Client(timeout=120.0) as client:
                with client.stream("POST", url, json=payload) as response:
                    response.raise_for_status()
                    for line in response.iter_lines():
                        if not line.startswith("data: ") or line == "data: [DONE]":
                            continue
                        try:
                            data = json.loads(line[6:])
                            parts = (data.get("candidates") or [{}])[0].get("content", {}).get("parts", [])
                            for part in parts:
                                if "text" in part:
                                    yield part["text"]
                        except (json.JSONDecodeError, IndexError):
                            pass
        except httpx.HTTPError as e:
            raise RuntimeError(f"Gemini stream error: {str(e)}")

    def get_available_models(self) -> List[str]:
        """
        Get list of available Gemini models by querying the Google AI API.

        This fetches the current list of models directly from Google,
        ensuring the app always has access to the latest models without updates.

        Returns:
            List of model names suitable for text generation
        """
        try:
            # Fetch available models from Gemini API
            url = f"https://generativelanguage.googleapis.com/v1beta/models?key={self.api_key}"

            with httpx.Client(timeout=10.0) as client:
                response = client.get(url)
                response.raise_for_status()
                data = response.json()

            # Extract model names that support generateContent
            available_models = []
            for model in data.get("models", []):
                model_name = model.get("name", "")
                supported_methods = model.get("supportedGenerationMethods", [])

                # Only include models that support generateContent
                if "generateContent" in supported_methods:
                    # Extract short name (e.g., "models/gemini-2.5-flash" -> "gemini-2.5-flash")
                    if "/" in model_name:
                        model_name = model_name.split("/")[-1]
                    available_models.append(model_name)

            # Sort by priority (newer versions first)
            priority_order = ["gemini-2.5", "gemini-2.0", "gemini-1.5", "gemini-1.0"]
            sorted_models = []

            for priority in priority_order:
                matching = [m for m in available_models if m.startswith(priority)]
                # Sort by "pro" before "flash" for same version
                matching.sort(key=lambda x: (0 if "pro" in x else 1, x))
                sorted_models.extend(matching)

            # Add any remaining models
            remaining = [m for m in available_models if m not in sorted_models]
            sorted_models.extend(sorted(remaining))

            return sorted_models if sorted_models else self._fallback_models()

        except Exception as e:
            logger.warning(f"Failed to fetch Gemini models from API: {e}")
            return self._fallback_models()

    def _fallback_models(self) -> List[str]:
        """Fallback model list if API fetch fails"""
        return [
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-2.0-flash",
            "gemini-1.5-pro",
            "gemini-1.5-flash",
        ]
    
    def calculate_cost(self, input_tokens: int, output_tokens: int, model: str) -> float:
        """
        Calculate cost based on Gemini pricing.
        
        Args:
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            model: Model name
            
        Returns:
            Cost in USD
        """
        # Get pricing for model (use 2.5-flash as default - cheapest current model)
        pricing = self.PRICING.get(model, self.PRICING["gemini-2.5-flash"])
        
        input_cost = (input_tokens / 1_000_000) * pricing["input"]
        output_cost = (output_tokens / 1_000_000) * pricing["output"]
        
        return round(input_cost + output_cost, 6)

