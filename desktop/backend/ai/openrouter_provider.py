"""
OpenRouter AI provider.
OpenRouter is OpenAI-compatible and gives access to 100+ models
(Claude, GPT-4o, Llama, Mistral, DeepSeek, Gemini, etc.)
"""
import time
import logging
from typing import Generator
from openai import OpenAI, OpenAIError

from ai.base import AIProviderBase, ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


class OpenRouterProvider(AIProviderBase):
    """OpenRouter provider — OpenAI-compatible, proxies 100+ models."""

    def __init__(self, api_key: str):
        super().__init__(api_key, "openrouter")
        self.client = OpenAI(
            api_key=api_key,
            base_url=OPENROUTER_BASE_URL,
            default_headers={
                "HTTP-Referer": "https://sqlingo.app",
                "X-Title": "SQLingo",
            },
        )
        self.default_model = "google/gemma-4-31b-it:free"

    def chat(self, request: ChatRequest) -> ChatResponse:
        start_time = time.time()
        try:
            messages = self._format_messages(request.messages)
            if request.system:
                messages = [{"role": "system", "content": request.system}] + messages
            params = {
                "model": request.model or self.default_model,
                "messages": messages,
                "max_tokens": request.max_tokens or 2048,
                "temperature": request.temperature or 0.7,
            }

            response = self.client.chat.completions.create(**params)
            latency_ms = int((time.time() - start_time) * 1000)

            content = response.choices[0].message.content or ""
            usage = response.usage

            tokens_prompt = usage.prompt_tokens if usage else 0
            tokens_completion = usage.completion_tokens if usage else 0
            tokens_total = usage.total_tokens if usage else 0

            return ChatResponse(
                content=content,
                model=response.model,
                provider="openrouter",
                tokens_prompt=tokens_prompt,
                tokens_completion=tokens_completion,
                tokens_total=tokens_total,
                latency_ms=latency_ms,
            )
        except OpenAIError as e:
            err_str = str(e)
            if "402" in err_str and "spend limit" in err_str.lower():
                raise Exception("OpenRouter API key has reached its spending limit. Please update the limit in your OpenRouter dashboard.")
            if "401" in err_str:
                raise Exception("Invalid OpenRouter API key. Please check your key in settings.")
            raise Exception(f"OpenRouter API error: {err_str}")
        except Exception as e:
            raise Exception(f"OpenRouter error: {str(e)}")

    def stream_chat(self, request: ChatRequest) -> Generator[str, None, None]:
        """Stream OpenRouter response tokens."""
        messages = self._format_messages(request.messages)
        if request.system:
            messages = [{"role": "system", "content": request.system}] + messages
        params = {
            "model": request.model or self.default_model,
            "messages": messages,
            "max_tokens": request.max_tokens or 2048,
            "temperature": request.temperature or 0.7,
            "stream": True,
        }
        try:
            stream = self.client.chat.completions.create(**params)
            for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
        except OpenAIError as e:
            raise RuntimeError(f"OpenRouter stream error: {str(e)}")

    def get_available_models(self):
        return [self.default_model]
