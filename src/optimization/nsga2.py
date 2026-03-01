from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd

from src.config.settings import ConstraintConfig, ObjectiveWeights
from src.models.predictor import MultiTargetPredictor
from src.optimization.objectives import objective_from_prediction, weighted_score
from src.optimization.pareto import non_dominated_indices


@dataclass
class Candidate:
    params: Dict[str, float]
    objectives: Tuple[float, ...]
    score: float


class NSGA2Optimizer:
    def __init__(self, feature_cols: List[str], constraint_config: ConstraintConfig) -> None:
        self.feature_cols = feature_cols
        self.constraints = constraint_config

    def _sample_population(self, base_row: pd.Series, n: int) -> pd.DataFrame:
        rows = []
        for _ in range(n):
            row = base_row.copy()
            for param, bounds in self.constraints.safety_bounds.items():
                if param in row.index:
                    row[param] = np.random.uniform(bounds[0], bounds[1])
            rows.append(row)
        return pd.DataFrame(rows)

    def _mutate(self, pop: pd.DataFrame, rate: float = 0.2) -> pd.DataFrame:
        out = pop.copy()
        for col, bounds in self.constraints.safety_bounds.items():
            if col not in out.columns:
                continue
            mask = np.random.rand(len(out)) < rate
            delta = np.random.normal(0.0, 0.05 * (bounds[1] - bounds[0]), size=mask.sum())
            out.loc[mask, col] = np.clip(out.loc[mask, col] + delta, bounds[0], bounds[1])
        return out

    def _crossover(self, a: pd.DataFrame, b: pd.DataFrame) -> pd.DataFrame:
        mask = np.random.rand(*a.shape) < 0.5
        c = a.copy()
        c[mask] = b[mask]
        return c

    def optimize(
        self,
        predictor: MultiTargetPredictor,
        context_row: pd.Series,
        weights: ObjectiveWeights,
        energy_price: float,
        carbon_price: float,
        population_size: int = 80,
        generations: int = 25,
    ) -> List[Candidate]:
        pop = self._sample_population(context_row, population_size)

        for _ in range(generations):
            mutated = self._mutate(pop)
            shuffled = pop.sample(frac=1.0, replace=False).reset_index(drop=True)
            crossed = self._crossover(mutated.reset_index(drop=True), shuffled)
            pop = pd.concat([pop, mutated, crossed], ignore_index=True).sample(n=population_size, replace=False)

        preds = predictor.predict(pop[self.feature_cols])
        vectors: List[Tuple[float, ...]] = []
        candidates: List[Candidate] = []

        for i in range(len(pop)):
            pred = {
                "yield": float(preds[i, 0]),
                "quality_score": float(preds[i, 1]),
                "energy_kwh": float(preds[i, 2]),
                "emission_kgco2e": float(preds[i, 3]),
                "throughput_units_hr": float(preds[i, 4]),
            }
            obj = objective_from_prediction(pred, energy_price, carbon_price)
            tup = obj.as_tuple()
            score = weighted_score(obj, weights)
            vectors.append(tup)
            candidates.append(Candidate(params=pop.iloc[i].to_dict(), objectives=tup, score=score))

        pareto_idx = non_dominated_indices(vectors)
        pareto_candidates = [candidates[i] for i in pareto_idx]
        pareto_candidates.sort(key=lambda c: c.score)
        return pareto_candidates
