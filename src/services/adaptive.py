from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional

import numpy as np
import pandas as pd

from src.config.settings import ConstraintConfig, ObjectiveWeights, RuntimeConfig
from src.models.predictor import MultiTargetPredictor
from src.optimization.nsga2 import NSGA2Optimizer
from src.services.signature_registry import GoldenSignature, SignatureRegistry


@dataclass
class Recommendation:
    action: str
    expected_delta: Dict[str, float]
    parameters: Dict[str, float]
    drift_score: float
    explanation: Dict[str, float]


class AdaptiveOptimizer:
    def __init__(
        self,
        predictor: MultiTargetPredictor,
        registry: SignatureRegistry,
        feature_cols: List[str],
        constraints: ConstraintConfig,
        runtime: RuntimeConfig,
    ) -> None:
        self.predictor = predictor
        self.registry = registry
        self.feature_cols = feature_cols
        self.constraints = constraints
        self.runtime = runtime
        self.nsga2 = NSGA2Optimizer(feature_cols=feature_cols, constraint_config=constraints)

    @staticmethod
    def _distance(a: Dict[str, float], b: Dict[str, float]) -> float:
        keys = sorted(set(a.keys()) & set(b.keys()))
        if not keys:
            return 0.0
        return float(np.sqrt(np.mean([(a[k] - b[k]) ** 2 for k in keys])))

    def _nearest_signature(self, current_mode: str) -> Optional[GoldenSignature]:
        active = self.registry.list_active(mode=current_mode)
        return active[0] if active else None

    def recommend(
        self,
        live_row: pd.DataFrame,
        mode: str,
        weights: ObjectiveWeights,
        energy_price: float,
        carbon_price: float,
    ) -> Recommendation:
        signature = self._nearest_signature(mode)

        pred_now = self.predictor.predict_dict(live_row[self.feature_cols])
        current_params = live_row.iloc[0].to_dict()

        drift_score = 0.0
        gap = 1.0
        if signature is not None:
            drift_score = self._distance(current_params, signature.params)
            target_yield = max(signature.objectives.get("yield", 1.0), 1e-6)
            gap = abs(pred_now["yield"] - target_yield) / target_yield

        if signature is not None and drift_score < self.runtime.drift_threshold and gap < self.runtime.gap_threshold:
            return Recommendation(
                action="hold",
                expected_delta={k: 0.0 for k in pred_now.keys()},
                parameters=current_params,
                drift_score=drift_score,
                explanation={"reason": 1.0},
            )

        pareto = self.nsga2.optimize(
            predictor=self.predictor,
            context_row=live_row.iloc[0],
            weights=weights,
            energy_price=energy_price,
            carbon_price=carbon_price,
            population_size=48,
            generations=12,
        )

        best = pareto[0]
        proposal_df = pd.DataFrame([best.params])
        pred_new = self.predictor.predict_dict(proposal_df[self.feature_cols])

        expected_delta = {k: pred_new[k] - pred_now[k] for k in pred_now.keys()}
        explanation = self.predictor.feature_importance_proxy()

        return Recommendation(
            action="adjust",
            expected_delta=expected_delta,
            parameters=best.params,
            drift_score=drift_score,
            explanation=explanation,
        )
