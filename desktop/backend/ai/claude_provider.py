"""
Anthropic Claude AI provider.
Supports Claude 3 and 3.5 models.
"""
from typing import List, Generator
import time
import logging
from anthropic import Anthropic, AnthropicError

from ai.base import AIProviderBase, ChatRequest, ChatResponse

logger = logging.getLogger(__name__)


class ClaudeProvider(AIProviderBase):
    """
    Anthropic Claude provider.
    Handles chat completions with usage tracking and cost calculation.
    """
    
    # Model pricing per 1M tokens (updated December 2024)
    PRICING = {
        # Claude 3 models
        "claude-3-opus-20240229": {"input": 15.00, "output": 75.00},
        "claude-3-sonnet-20240229": {"input": 3.00, "output": 15.00},
        "claude-3-haiku-20240307": {"input": 0.25, "output": 1.25},
        # Claude 3.5 models
        "claude-3-5-sonnet-20241022": {"input": 3.00, "output": 15.00},
        "claude-3-5-sonnet-latest": {"input": 3.00, "output": 15.00},
        # Claude Sonnet 4 (when available, use same pricing as 3.5)
        "claude-sonnet-4-latest": {"input": 3.00, "output": 15.00},
    }

    def __init__(self, api_key: str = None, auth_token: str = None):
        """
        Initialize Claude provider.

        Args:
            api_key: Anthropic API key (x-api-key header)
            auth_token: Access token from Claude Code CLI (Authorization: Bearer header)
        """
        super().__init__(api_key or auth_token or '', "claude")
        if auth_token:
            self.client = Anthropic(auth_token=auth_token)
        else:
            self.client = Anthropic(api_key=api_key)
        # Use latest stable version
        self.default_model = "claude-3-5-sonnet-latest"
    
    def chat(self, request: ChatRequest) -> ChatResponse:
        """
        Send chat completion request to Claude.
        
        Args:
            request: ChatRequest with messages and parameters
            
        Returns:
            ChatResponse with AI response and usage data
        """
        start_time = time.time()
        
        try:
            messages = [{"role": m.role, "content": m.content} for m in request.messages if m.role != "system"]

            params = {
                "model": request.model or self.default_model,
                "messages": messages,
                "temperature": request.temperature,
                "max_tokens": request.max_tokens or 4096,
                "system": self._build_system_param(request),
            }

            # Make API request
            response = self.client.messages.create(**params)
            
            # Extract data
            content = response.content[0].text if response.content else ""
            
            # Calculate metrics
            tokens_prompt = response.usage.input_tokens
            tokens_completion = response.usage.output_tokens
            tokens_total = tokens_prompt + tokens_completion
            latency_ms = self._measure_latency(start_time)
            
            return ChatResponse(
                content=content,
                model=response.model,
                provider=self.provider_name,
                tokens_prompt=tokens_prompt,
                tokens_completion=tokens_completion,
                tokens_total=tokens_total,
                latency_ms=latency_ms,
                finish_reason=response.stop_reason,
                request_id=response.id,
            )
            
        except AnthropicError as e:
            error_str = str(e)
            logger.error(f"Claude API error: {error_str}")

            # Provide user-friendly error messages
            if "authentication_error" in error_str or "invalid x-api-key" in error_str or "invalid_token" in error_str:
                raise RuntimeError(
                    "Invalid Claude credentials. Please check your API key or access token in Settings > API Keys. "
                    "Get your API key from: https://console.anthropic.com/settings/keys "
                    "or generate an access token using: claude setup-token"
                )
            elif "not_found_error" in error_str:
                raise RuntimeError(
                    f"Claude model not found. The model may be deprecated or unavailable. "
                    f"Try using 'claude-3-5-sonnet-latest' or 'claude-3-haiku-20240307' instead."
                )
            elif "rate_limit" in error_str:
                raise RuntimeError("Claude API rate limit exceeded. Please try again later.")
            elif "overloaded" in error_str:
                raise RuntimeError("Claude API is currently overloaded. Please try again in a moment.")
            else:
                raise RuntimeError(f"Claude API error: {error_str}")
        except Exception as e:
            logger.error(f"Unexpected error in Claude provider: {e}")
            raise RuntimeError(f"Claude provider error: {str(e)}")
    
    def _build_system_param(self, request: ChatRequest):
        """Build Claude system parameter with prompt caching."""
        # Prefer request.system (new architecture), fall back to system role in messages
        system_text = request.system
        if not system_text:
            for m in request.messages:
                if m.role == "system":
                    system_text = m.content
                    break
        if not system_text:
            return None
        return [{"type": "text", "text": system_text, "cache_control": {"type": "ephemeral"}}]

    def stream_chat(self, request: ChatRequest) -> Generator[str, None, None]:
        """Stream Claude response tokens using prompt caching."""
        messages = [{"role": m.role, "content": m.content} for m in request.messages if m.role != "system"]
        params = {
            "model": request.model or self.default_model,
            "messages": messages,
            "max_tokens": request.max_tokens or 4096,
            "temperature": request.temperature,
        }
        system_param = self._build_system_param(request)
        if system_param:
            params["system"] = system_param
        try:
            with self.client.messages.stream(**params) as stream:
                for text in stream.text_stream:
                    yield text
        except AnthropicError as e:
            raise RuntimeError(f"Claude stream error: {str(e)}")

    def get_available_models(self) -> List[str]:
        """
        Get list of available Claude models.

        Note: Anthropic doesn't provide a public models API endpoint.
        We return a curated list based on official documentation and verify
        the default model works with the provided API key.

        The "latest" aliases always point to the newest stable versions.

        Returns:
            List of model names
        """
        try:
            # Verify API key works by testing default model with minimal request
            # This ensures the returned list is valid for this API key
            try:
                self.client.messages.create(
                    model=self.default_model,
                    max_tokens=1,
                    messages=[{"role": "user", "content": "hi"}]
                )
                # API key works and default model is valid
                logger.info(f"Verified Claude API access with model: {self.default_model}")

            except AnthropicError as e:
                error_str = str(e)
                if "not_found_error" in error_str:
                    # Default model not available, try fallback
                    logger.warning(f"Default model {self.default_model} not available")
                    self.default_model = "claude-3-haiku-20240307"
                    # Test fallback
                    self.client.messages.create(
                        model=self.default_model,
                        max_tokens=1,
                        messages=[{"role": "user", "content": "hi"}]
                    )
                else:
                    raise

            # Return curated list of Claude models based on official documentation
            # https://docs.anthropic.com/en/docs/about-claude/models
            return [
                # Latest aliases (recommended - auto-update to newest versions)
                "claude-3-5-sonnet-latest",
                "claude-3-opus-latest",
                "claude-3-haiku-latest",
                # Claude 3.5 family (specific versions)
                "claude-3-5-sonnet-20241022",
                "claude-3-5-sonnet-20240620",
                # Claude 3 family
                "claude-3-opus-20240229",
                "claude-3-sonnet-20240229",
                "claude-3-haiku-20240307",
            ]

        except Exception as e:
            logger.warning(f"Failed to verify Claude API access: {e}")
            return self._fallback_models()

    def _fallback_models(self) -> List[str]:
        """Fallback model list if API verification fails"""
        return [
            "claude-3-5-sonnet-latest",
            "claude-3-haiku-20240307",
        ]
    
    def calculate_cost(self, input_tokens: int, output_tokens: int, model: str) -> float:
        """
        Calculate cost based on Claude pricing.

        Args:
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            model: Model name

        Returns:
            Cost in USD
        """
        # Get pricing for model
        # For "latest" models, use the corresponding pricing
        if model == "claude-3-5-sonnet-latest":
            pricing = self.PRICING["claude-3-5-sonnet-latest"]
        elif model == "claude-sonnet-4-latest":
            pricing = self.PRICING["claude-sonnet-4-latest"]
        else:
            # Use Haiku as default (cheapest) for unknown models
            pricing = self.PRICING.get(model, self.PRICING["claude-3-haiku-20240307"])

        input_cost = (input_tokens / 1_000_000) * pricing["input"]
        output_cost = (output_tokens / 1_000_000) * pricing["output"]

        return round(input_cost + output_cost, 6)

