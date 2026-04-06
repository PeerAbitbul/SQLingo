"""
Hardware detection for local AI model recommendations.
Detects RAM, CPU architecture, and OS to recommend suitable Ollama models.
"""
import platform
import logging
from typing import Dict, List, Any

import psutil

logger = logging.getLogger(__name__)


def detect_hardware() -> Dict[str, Any]:
    """
    Detect the current machine's hardware capabilities.

    Returns:
        Dict with os, arch, is_apple_silicon, total_ram_gb, available_ram_gb,
        cpu_count, effective_vram_gb
    """
    system = platform.system().lower()  # 'darwin' | 'windows' | 'linux'
    arch = platform.machine()  # 'arm64' | 'x86_64' | 'AMD64'

    is_apple_silicon = system == "darwin" and arch == "arm64"

    vm = psutil.virtual_memory()
    total_ram_gb = round(vm.total / (1024 ** 3), 2)
    available_ram_gb = round(vm.available / (1024 ** 3), 2)

    # Apple Silicon uses unified memory - GPU can use full system RAM.
    # For discrete GPUs we can't reliably detect VRAM without extra deps,
    # so we leave it null and fall back to RAM-based logic.
    effective_vram_gb = total_ram_gb if is_apple_silicon else None

    return {
        "os": system,
        "arch": arch,
        "is_apple_silicon": is_apple_silicon,
        "total_ram_gb": total_ram_gb,
        "available_ram_gb": available_ram_gb,
        "cpu_count": psutil.cpu_count(logical=False) or psutil.cpu_count() or 1,
        "effective_vram_gb": effective_vram_gb,
    }


def fit_for_model(required_ram_gb: float, total_ram_gb: float) -> str:
    """
    Determine how well a model fits the current machine.

    Fit levels:
        - incompatible: model too big (won't run or will thrash)
        - risky: runs but may swap / degrade performance
        - compatible: runs comfortably
    """
    headroom_gb = 4.0  # Reserve for OS + other apps

    if required_ram_gb > total_ram_gb - 1:
        return "incompatible"
    if required_ram_gb > total_ram_gb - headroom_gb:
        return "risky"
    return "compatible"


def recommend_models(catalog: List[Dict[str, Any]], hardware: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Annotate a catalog of models with fit information for the given hardware.
    Marks the largest compatible model as "recommended".

    Args:
        catalog: List of model dicts with at least 'id' and 'ram_required_gb'
        hardware: Result of detect_hardware()

    Returns:
        New list of model dicts with added keys: 'fit' and 'recommended'
    """
    total_ram = hardware.get("total_ram_gb", 0)

    annotated = []
    for model in catalog:
        required = model.get("ram_required_gb", 0)
        fit = fit_for_model(required, total_ram)
        annotated.append({**model, "fit": fit, "recommended": False})

    # Find the largest compatible model and mark it recommended.
    # Order catalog by ram_required_gb ascending; pick last compatible.
    compatible = [m for m in annotated if m["fit"] == "compatible"]
    if compatible:
        best = max(compatible, key=lambda m: m.get("ram_required_gb", 0))
        best["recommended"] = True

    return annotated
