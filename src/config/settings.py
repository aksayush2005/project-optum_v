from dataclasses import dataclass, field
from typing import Dict


@dataclass
class ObjectiveWeights:
    yield_weight: float = 1.0
    quality_weight: float = 1.0
    energy_weight: float = 1.0
    emission_weight: float = 1.0
    throughput_weight: float = 1.0
    cost_weight: float = 1.0


@dataclass
class ConstraintConfig:
    emission_cap: float = 150.0
    max_param_step: float = 0.08
    min_quality: float = 70.0
    min_yield: float = 75.0
    safety_bounds: Dict[str, tuple] = field(
        default_factory=lambda: {
            "temperature": (140.0, 240.0),
            "pressure": (2.0, 9.0),
            "mixing_speed": (100.0, 600.0),
            "batch_size": (200.0, 2000.0),
        }
    )


@dataclass
class RuntimeConfig:
    drift_threshold: float = 1.8
    gap_threshold: float = 0.12
    signature_store_path: str = "signature_store.json"
