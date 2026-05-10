"""
Claude CLI provider — uses the local Claude Code CLI (claude -p).
No API key needed; charges against the user's Claude Max subscription.
"""
import os
import shutil
import subprocess
import time
import logging
from pathlib import Path
from typing import List, Generator, Optional

from ai.base import AIProviderBase, ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

CLAUDE_BINARY = "claude"

# Common npm global bin paths that packaged Electron apps don't inherit
_EXTRA_PATHS = [
    "/usr/local/bin",
    "/opt/homebrew/bin",          # Apple Silicon Homebrew
    "/opt/homebrew/sbin",
    "/usr/bin",
    "/opt/local/bin",             # MacPorts
    str(Path.home() / ".npm-global" / "bin"),
    str(Path.home() / ".npm" / "bin"),
    str(Path.home() / ".local" / "bin"),
    str(Path.home() / "Library" / "pnpm"),
    "/usr/local/share/npm/bin",
]


def _find_claude_binary() -> Optional[str]:
    """Find the claude binary, checking PATH and common install locations."""
    # Enrich PATH so shutil.which can find it in packaged apps
    current_path = os.environ.get("PATH", "")
    extra = ":".join(p for p in _EXTRA_PATHS if p not in current_path)
    if extra:
        os.environ["PATH"] = extra + ":" + current_path

    found = shutil.which(CLAUDE_BINARY)
    if found:
        return found

    # Direct filesystem check as fallback
    for directory in _EXTRA_PATHS:
        candidate = os.path.join(directory, CLAUDE_BINARY)
        if os.path.isfile(candidate) and os.access(candidate, os.X_OK):
            return candidate

    return None


class ClaudeCLIProvider(AIProviderBase):
    """
    Runs `claude -p <prompt>` as a subprocess.
    The user must be logged in to the Claude Code CLI.
    """

    def __init__(self):
        super().__init__(api_key="cli", provider_name="claude")
        self.default_model = "claude-cli"
        binary = _find_claude_binary()
        if not binary:
            raise RuntimeError(
                "Claude CLI not found. Install it with: npm install -g @anthropic-ai/claude-code"
            )
        self._binary: str = binary

    @staticmethod
    def is_available() -> bool:
        return _find_claude_binary() is not None

    def _build_prompt(self, request: ChatRequest) -> str:
        """Combine system prompt + conversation history into a single string."""
        parts = []
        if request.system:
            parts.append(request.system)
            parts.append("")

        for msg in request.messages:
            if msg.role == "user":
                parts.append(f"Human: {msg.content}")
            elif msg.role == "assistant":
                parts.append(f"Assistant: {msg.content}")

        return "\n".join(parts)

    def _run(self, prompt: str) -> str:
        """Invoke the Claude CLI and return stdout."""
        try:
            result = subprocess.run(
                [self._binary, "-p", prompt],
                capture_output=True,
                text=True,
                timeout=180,
            )
            if result.returncode != 0:
                err = (result.stderr or "").strip()
                # Auth error
                if "not logged in" in err.lower() or "login" in err.lower():
                    raise RuntimeError(
                        "Claude CLI is not logged in. Run `claude` in a terminal to authenticate."
                    )
                raise RuntimeError(f"Claude CLI error: {err or 'unknown error'}")
            return result.stdout.strip()
        except subprocess.TimeoutExpired:
            raise RuntimeError("Claude CLI timed out (>180s)")

    def chat(self, request: ChatRequest) -> ChatResponse:
        start_time = time.time()
        prompt = self._build_prompt(request)
        content = self._run(prompt)
        return ChatResponse(
            content=content,
            model="claude-cli",
            provider="claude",
            tokens_prompt=0,
            tokens_completion=0,
            tokens_total=0,
            latency_ms=int((time.time() - start_time) * 1000),
            finish_reason="stop",
        )

    def stream_chat(self, request: ChatRequest) -> Generator[str, None, None]:
        """CLI doesn't stream — yield the full response as one chunk."""
        response = self.chat(request)
        yield response.content

    def get_available_models(self) -> List[str]:
        return ["claude-cli"]

    def calculate_cost(self, input_tokens: int, output_tokens: int, model: str) -> float:
        return 0.0
