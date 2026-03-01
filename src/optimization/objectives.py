from __future__ import annotations

from dataclasses import dataclass
from typing import Dict

from src.config.settings import ObjectiveWeights


@dataclass
class ObjectiveVector:
    neg_yield: float
    neg_quality: float
    energy: float
    emissions: float
    neg_throughput: float
    cost: float

    def as_tuple(self):
        return (
            self.neg_yield,
            self.neg_quality,
            self.energy,
            self.emissions,
            self.neg_throughput,
            self.cost,
        )


def compute_cost(energy_kwh: float, throughput: float, emission_kg: float, energy_price: float, carbon_price: float) -> float:
    throughput_penalty = 0.0 if throughput > 0 else 1000.0
    return energy_kwh * energy_price + emission_kg * carbon_price + throughput_penalty


def objective_from_prediction(pred: Dict[str, float], energy_price: float, carbon_price: float) -> ObjectiveVector:
    return ObjectiveVector(
        neg_yield=-pred["yield"],
        neg_quality=-pred["quality_score"],
        energy=pred["energy_kwh"],
        emissions=pred["emission_kgco2e"],
        neg_throughput=-pred["throughput_units_hr"],
        cost=compute_cost(pred["energy_kwh"], pred["throughput_units_hr"], pred["emission_kgco2e"], energy_price, carbon_price),
    )


def weighted_score(obj: ObjectiveVector, w: ObjectiveWeights) -> float:
    return (
        w.yield_weight * obj.neg_yield
        + w.quality_weight * obj.neg_quality
        + w.energy_weight * obj.energy
        + w.emission_weight * obj.emissions
        + w.throughput_weight * obj.neg_throughput
        + w.cost_weight * obj.cost
    )
