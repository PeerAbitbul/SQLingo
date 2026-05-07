"""
Ollama local AI provider.
Talks to a local Ollama server (default http://localhost:11434).
Used to run Gemma 4 (and other local models) entirely on the user's machine.
No API key required. No inference cost.
"""
from typing import List, Optional, Generator
import json
import time
import logging
import httpx

from ai.base import AIProviderBase, ChatRequest, ChatResponse

logger = logging.getLogger(__name__)


class OllamaProvider(AIProviderBase):
    """
    Local Ollama provider.
    Uses Ollama's REST API to run models locally.
    """

    DEFAULT_BASE_URL = "http://localhost:11434"
    DEFAULT_MODEL = "gemma4:e4b"
    # Local inference can be slow on cold load (weights loading into memory)
    CHAT_TIMEOUT_SECONDS = 180.0

    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        """
        Initialize Ollama provider.

        Args:
            base_url: Ollama API base URL (default: http://localhost:11434)
            model: Default model to use (default: gemma4:e4b)
        """
        # Base class requires api_key; Ollama doesn't use one, pass empty string.
        super().__init__(api_key="", provider_name="ollama")
        self.base_url = (base_url or self.DEFAULT_BASE_URL).rstrip("/")
        self.default_model = model or self.DEFAULT_MODEL

    def chat(self, request: ChatRequest) -> ChatResponse:
        """
        Send a chat completion request to Ollama.

        Args:
            request: ChatRequest with messages and parameters

        Returns:
            ChatResponse with AI response and usage data
        """
        start_time = time.time()

        try:
            model = request.model or self.default_model
            messages = self._format_messages(request.messages)
            if request.system:
                messages = [{"role": "system", "content": request.system}] + messages

            options = {"temperature": request.temperature}
            if request.max_tokens:
                options["num_predict"] = request.max_tokens

            payload = {
                "model": model,
                "messages": messages,
                "stream": False,
                "options": options,
            }

            url = f"{self.base_url}/api/chat"

            with httpx.Client(timeout=self.CHAT_TIMEOUT_SECONDS) as client:
                response = client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()

            content = data.get("message", {}).get("content", "")
            if not content:
                logger.warning(f"Ollama returned empty content: {data}")
                content = "(Empty response from Ollama)"

            tokens_prompt = data.get("prompt_eval_count", 0)
            tokens_completion = data.get("eval_count", 0)
            tokens_total = tokens_prompt + tokens_completion

            latency_ms = self._measure_latency(start_time)

            return ChatResponse(
                content=content,
                model=model,
                provider=self.provider_name,
                tokens_prompt=tokens_prompt,
                tokens_completion=tokens_completion,
                tokens_total=tokens_total,
                latency_ms=latency_ms,
                finish_reason=data.get("done_reason", "stop"),
                request_id=None,
            )

        except httpx.ConnectError:
            raise RuntimeError(
                "Cannot connect to Ollama. Make sure Ollama is running "
                "(start with `ollama serve`) or install it from ollama.com."
            )
        except httpx.TimeoutException:
            raise RuntimeError(
                "Ollama request timed out. The model may still be loading into "
                "memory on first run, or the machine is under heavy load."
            )
        except httpx.HTTPStatusError as e:
            status = e.response.status_code
            body = e.response.text or ""
            if status == 404 or "not found" in body.lower():
                raise RuntimeError(
                    f"Model '{request.model or self.default_model}' is not installed in Ollama. "
                    "Pull it from Settings > Local AI (Ollama)."
                )
            logger.error(f"Ollama HTTP {status}: {body}")
            raise RuntimeError(f"Ollama error ({status}): {body[:200]}")
        except Exception as e:
            logger.error(f"Unexpected error in Ollama provider: {e}")
            raise RuntimeError(f"Ollama provider error: {str(e)}")

    def stream_chat(self, request: ChatRequest) -> Generator[str, None, None]:
        """Stream Ollama response tokens."""
        model = request.model or self.default_model
        messages = self._format_messages(request.messages)
        if request.system:
            messages = [{"role": "system", "content": request.system}] + messages
        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "options": {"temperature": request.temperature},
        }
        if request.max_tokens:
            payload["options"]["num_predict"] = request.max_tokens
        try:
            with httpx.Client(timeout=self.CHAT_TIMEOUT_SECONDS) as client:
                with client.stream("POST", f"{self.base_url}/api/chat", json=payload) as response:
                    response.raise_for_status()
                    for line in response.iter_lines():
                        if not line:
                            continue
                        try:
                            data = json.loads(line)
                            content = data.get("message", {}).get("content", "")
                            if content:
                                yield content
                        except json.JSONDecodeError:
                            pass
        except httpx.ConnectError:
            raise RuntimeError("Cannot connect to Ollama. Make sure Ollama is running.")
        except httpx.HTTPStatusError as e:
            raise RuntimeError(f"Ollama stream error ({e.response.status_code}): {e.response.text[:200]}")

    def get_available_models(self) -> List[str]:
        """
        Get list of currently installed models from the local Ollama server.
        """
        try:
            with httpx.Client(timeout=5.0) as client:
                response = client.get(f"{self.base_url}/api/tags")
                response.raise_for_status()
                data = response.json()

            return [m["name"] for m in data.get("models", []) if m.get("name")]
        except Exception as e:
            logger.warning(f"Failed to fetch Ollama models: {e}")
            return []

    def calculate_cost(self, input_tokens: int, output_tokens: int, model: str) -> float:
        """Local inference has no cost."""
        return 0.0

    @classmethod
    def is_ollama_running(cls, base_url: Optional[str] = None) -> Optional[str]:
        """
        Check if an Ollama server is reachable at base_url.

        Returns:
            Version string if running, None otherwise.
        """
        url = (base_url or cls.DEFAULT_BASE_URL).rstrip("/")
        try:
            with httpx.Client(timeout=2.0) as client:
                response = client.get(f"{url}/api/version")
                if response.status_code == 200:
                    return response.json().get("version", "unknown")
        except Exception:
            pass
        return None
