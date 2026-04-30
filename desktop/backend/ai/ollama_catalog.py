"""
Catalog of Ollama models suitable for SQL generation.
Includes multiple model families with fit metadata.
"""
from typing import List, Dict, Any


MODEL_CATALOG: List[Dict[str, Any]] = [

    # ── Gemma 4 (Google) ─────────────────────────────────────────────────────
    {
        "id": "gemma4:e2b",
        "name": "Gemma 4 E2B",
        "family": "Gemma 4",
        "params": "2B",
        "active_params": "2B",
        "ram_required_gb": 4,
        "size_gb": 2.1,
        "context": 256_000,
        "tier": "minimal",
        "description": "Edge model. Fast on older laptops and low-RAM devices. Lower quality.",
    },
    {
        "id": "gemma4:e4b",
        "name": "Gemma 4 E4B",
        "family": "Gemma 4",
        "params": "4B",
        "active_params": "4B",
        "ram_required_gb": 6,
        "size_gb": 3.6,
        "context": 256_000,
        "tier": "standard",
        "description": "Sweet spot for most users. Fast on modern laptops with solid quality.",
    },
    {
        "id": "gemma4:26b-a4b",
        "name": "Gemma 4 26B (MoE)",
        "family": "Gemma 4",
        "params": "26B",
        "active_params": "3.8B",
        "ram_required_gb": 18,
        "size_gb": 14.0,
        "context": 256_000,
        "tier": "power",
        "description": "Mixture-of-Experts. ~30B quality, only 3.8B active params per inference.",
    },
    {
        "id": "gemma4:31b",
        "name": "Gemma 4 31B Dense",
        "family": "Gemma 4",
        "params": "31B",
        "active_params": "31B",
        "ram_required_gb": 20,
        "size_gb": 18.0,
        "context": 256_000,
        "tier": "workstation",
        "description": "Workstation-class. Needs 24GB+ unified memory. Highest Gemma quality.",
    },

    # ── Llama 3.x (Meta) ─────────────────────────────────────────────────────
    {
        "id": "llama3.2:1b",
        "name": "Llama 3.2 1B",
        "family": "Llama 3",
        "params": "1B",
        "active_params": "1B",
        "ram_required_gb": 2,
        "size_gb": 1.3,
        "context": 128_000,
        "tier": "minimal",
        "description": "Ultra-light. Runs on any device. Good for simple queries on low-RAM machines.",
    },
    {
        "id": "llama3.2:3b",
        "name": "Llama 3.2 3B",
        "family": "Llama 3",
        "params": "3B",
        "active_params": "3B",
        "ram_required_gb": 4,
        "size_gb": 2.0,
        "context": 128_000,
        "tier": "standard",
        "description": "Lightweight and fast. Reliable SQL generation for common queries.",
    },
    {
        "id": "llama3.1:8b",
        "name": "Llama 3.1 8B",
        "family": "Llama 3",
        "params": "8B",
        "active_params": "8B",
        "ram_required_gb": 8,
        "size_gb": 4.7,
        "context": 128_000,
        "tier": "power",
        "description": "Great balance of speed and quality. Strong SQL reasoning and context understanding.",
    },

    # ── Qwen 2.5 (Alibaba) ───────────────────────────────────────────────────
    {
        "id": "qwen2.5:3b",
        "name": "Qwen 2.5 3B",
        "family": "Qwen 2.5",
        "params": "3B",
        "active_params": "3B",
        "ram_required_gb": 4,
        "size_gb": 1.9,
        "context": 32_000,
        "tier": "standard",
        "description": "Fast and efficient. Solid SQL quality for its size, good multilingual support.",
    },
    {
        "id": "qwen2.5:7b",
        "name": "Qwen 2.5 7B",
        "family": "Qwen 2.5",
        "params": "7B",
        "active_params": "7B",
        "ram_required_gb": 8,
        "size_gb": 4.4,
        "context": 128_000,
        "tier": "power",
        "description": "Strong general model with excellent SQL and multilingual capabilities.",
    },
    {
        "id": "qwen2.5-coder:7b",
        "name": "Qwen 2.5 Coder 7B",
        "family": "Qwen 2.5",
        "params": "7B",
        "active_params": "7B",
        "ram_required_gb": 8,
        "size_gb": 4.4,
        "context": 128_000,
        "tier": "power",
        "description": "Code & SQL specialist. Fine-tuned specifically for code generation — highly recommended for SQL.",
    },
    {
        "id": "qwen2.5-coder:14b",
        "name": "Qwen 2.5 Coder 14B",
        "family": "Qwen 2.5",
        "params": "14B",
        "active_params": "14B",
        "ram_required_gb": 12,
        "size_gb": 9.0,
        "context": 128_000,
        "tier": "workstation",
        "description": "Top-tier SQL specialist. Best local model for complex queries and stored procedures.",
    },

    # ── Mistral ──────────────────────────────────────────────────────────────
    {
        "id": "mistral:7b",
        "name": "Mistral 7B",
        "family": "Mistral",
        "params": "7B",
        "active_params": "7B",
        "ram_required_gb": 8,
        "size_gb": 4.1,
        "context": 32_000,
        "tier": "power",
        "description": "Reliable and fast. Good SQL generation, popular for production local deployments.",
    },
    {
        "id": "mistral-nemo:12b",
        "name": "Mistral Nemo 12B",
        "family": "Mistral",
        "params": "12B",
        "active_params": "12B",
        "ram_required_gb": 12,
        "size_gb": 7.1,
        "context": 128_000,
        "tier": "power",
        "description": "Upgraded Mistral with larger context. Better reasoning and complex query support.",
    },

    # ── Phi-4 (Microsoft) ─────────────────────────────────────────────────────
    {
        "id": "phi4-mini:3.8b",
        "name": "Phi-4 Mini 3.8B",
        "family": "Phi-4",
        "params": "3.8B",
        "active_params": "3.8B",
        "ram_required_gb": 4,
        "size_gb": 2.5,
        "context": 16_000,
        "tier": "standard",
        "description": "Microsoft's compact model. Punches above its weight for reasoning and SQL.",
    },
    {
        "id": "phi4:14b",
        "name": "Phi-4 14B",
        "family": "Phi-4",
        "params": "14B",
        "active_params": "14B",
        "ram_required_gb": 12,
        "size_gb": 9.1,
        "context": 16_000,
        "tier": "workstation",
        "description": "Microsoft flagship small model. Excellent reasoning, matches GPT-3.5 quality locally.",
    },
]

# Keep backward-compat alias
GEMMA4_CATALOG = [m for m in MODEL_CATALOG if m["family"] == "Gemma 4"]


def get_catalog() -> List[Dict[str, Any]]:
    """Return a copy of the full model catalog."""
    return [dict(item) for item in MODEL_CATALOG]


def get_families() -> List[str]:
    """Return unique family names in display order."""
    seen = []
    for m in MODEL_CATALOG:
        if m["family"] not in seen:
            seen.append(m["family"])
    return seen
