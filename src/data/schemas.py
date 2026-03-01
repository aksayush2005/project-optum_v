from dataclasses import dataclass
from typing import Any, Dict


@dataclass
class BatchRecord:
    batch_id: str
    timestamp: str
    payload: Dict[str, Any]


TARGET_COLUMNS = [
    "yield",
    "quality_score",
    "energy_kwh",
    "emission_kgco2e",
    "throughput_units_hr",
]
