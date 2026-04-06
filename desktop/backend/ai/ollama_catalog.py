"""
Catalog of Gemma 4 model variants available via Ollama.
Includes metadata required to show fit recommendations in the UI.
"""
from typing import List, Dict, Any


# Gemma 4 variants published on Ollama (ollama.com/library/gemma4).
# ram_required_gb is the minimum RAM needed to run the 4-bit quantized variant
# comfortably. size_gb is the approximate download size.
GEMMA4_CATALOG: List[Dict[str, Any]] = [
    {
        "id": "gemma4:e2b",
        "name": "Gemma 4 E2B",
        "params": "2B",
        "active_params": "2B",
        "ram_required_gb": 4,
        "size_gb": 2.1,
        "context": 256_000,
        "tier": "minimal",
        "description": "Edge model. Fast on older laptops and low-RAM devices. Lower quality, good for simple questions.",
    },
    {
        "id": "gemma4:e4b",
        "name": "Gemma 4 E4B",
        "params": "4B",
        "active_params": "4B",
        "ram_required_gb": 6,
        "size_gb": 3.6,
        "context": 256_000,
        "tier": "standard",
        "description": "Sweet spot for most users. Fast on modern laptops with solid quality for SQL generation.",
    },
    {
        "id": "gemma4:26b-a4b",
        "name": "Gemma 4 26B (MoE)",
        "params": "26B",
        "active_params": "3.8B",
        "ram_required_gb": 18,
        "size_gb": 14.0,
        "context": 256_000,
        "tier": "power",
        "description": "Mixture-of-Experts. Delivers ~30B quality while activating only 3.8B params per inference.",
    },
    {
        "id": "gemma4:31b",
        "name": "Gemma 4 31B Dense",
        "params": "31B",
        "active_params": "31B",
        "ram_required_gb": 20,
        "size_gb": 18.0,
        "context": 256_000,
        "tier": "workstation",
        "description": "Workstation-class. Needs 24GB+ VRAM or unified memory. Highest quality.",
    },
]


def get_catalog() -> List[Dict[str, Any]]:
    """Return a copy of the Gemma 4 catalog."""
    return [dict(item) for item in GEMMA4_CATALOG]
