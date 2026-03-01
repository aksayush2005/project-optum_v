from __future__ import annotations

from dataclasses import dataclass
from typing import Dict

import numpy as np
import pandas as pd

from src.config.settings import ConstraintConfig, ObjectiveWeights, RuntimeConfig
from src.data.pipeline import FeaturePipeline
from src.models.predictor import MultiTargetPredictor
from src.services.adaptive import AdaptiveOptimizer
from src.services.signature_registry import SignatureRegistry


@dataclass
class KPIReport:
    yield_improvement_pct: float
    energy_savings_kwh_per_batch: float
    emission_reduction_kgco2e_per_batch: float
    cost_optimization_pct: float
    annual_roi_usd: float


def build_synthetic_dataset(n_rows: int = 500, machine_count: int = 3) -> pd.DataFrame:
    rng = np.random.default_rng(42)
    machines = rng.integers(1, machine_count + 1, n_rows)
    material = rng.integers(1, 5, n_rows)
    batch_size = rng.uniform(300, 1500, n_rows)

    temperature = rng.normal(190, 18, n_rows)
    pressure = rng.normal(5.5, 1.1, n_rows)
    mixing_speed = rng.normal(320, 80, n_rows)
    vibration = np.abs(rng.normal(1.5, 0.6, n_rows))
    energy = 0.25 * batch_size + 0.9 * temperature + 8.0 * pressure + rng.normal(0, 20, n_rows)

    good_output = 0.9 * batch_size + rng.normal(0, 40, n_rows)
    total_input = batch_size + rng.normal(20, 10, n_rows)
    throughput = 50 + 0.2 * mixing_speed - 0.4 * pressure + rng.normal(0, 5, n_rows)

    yield_pct = np.clip(65 + 0.02 * temperature + 0.01 * mixing_speed - 0.9 * vibration + rng.normal(0, 3, n_rows), 40, 99)
    quality = np.clip(60 + 0.03 * temperature + 0.015 * mixing_speed - 0.8 * pressure + rng.normal(0, 4, n_rows), 30, 99)
    emission = np.clip(0.35 * energy + 2.0 * pressure + rng.normal(0, 8, n_rows), 20, None)

    ts = pd.date_range("2025-01-01", periods=n_rows, freq="h")

    df = pd.DataFrame(
        {
            "batch_id": [f"B{i:05d}" for i in range(n_rows)],
            "timestamp": ts,
            "machine_id": machines,
            "material_type_id": material,
            "batch_size": batch_size,
            "temperature": temperature,
            "pressure": pressure,
            "mixing_speed": mixing_speed,
            "vibration": vibration,
            "good_output": good_output,
            "total_input": total_input,
            "energy_kwh": energy,
            "yield": yield_pct,
            "quality_score": quality,
            "emission_kgco2e": emission,
            "throughput_units_hr": throughput,
        }
    )
    return df


def run_validation_simulation(
    machine_count: int = 3,
    n_rows: int = 300,
    energy_price_low: float = 0.08,
    energy_price_high: float = 0.22,
    emission_cap: float = 150.0,
) -> Dict[str, float]:
    df = build_synthetic_dataset(n_rows=n_rows, machine_count=machine_count)

    pipeline = FeaturePipeline()
    clean, artifacts = pipeline.fit_transform(df)

    predictor = MultiTargetPredictor()
    predictor.fit(clean, artifacts.feature_columns)

    constraints = ConstraintConfig(emission_cap=emission_cap)
    runtime = RuntimeConfig(signature_store_path="sim_signature_store.json")
    registry = SignatureRegistry(runtime.signature_store_path)

    adaptive = AdaptiveOptimizer(
        predictor=predictor,
        registry=registry,
        feature_cols=artifacts.feature_columns,
        constraints=constraints,
        runtime=runtime,
    )

    live = clean.sample(50, random_state=42)
    baseline_pred = predictor.predict(live[artifacts.feature_columns])

    rec_energy = []
    rec_emission = []
    rec_yield = []
    rec_cost = []

    for _, row in live.iterrows():
        row_df = pd.DataFrame([row])
        price = float(np.random.uniform(energy_price_low, energy_price_high))
        rec = adaptive.recommend(
            live_row=row_df,
            mode="yield_energy",
            weights=ObjectiveWeights(),
            energy_price=price,
            carbon_price=0.04,
        )
        rec_energy.append(-rec.expected_delta.get("energy_kwh", 0.0))
        rec_emission.append(-rec.expected_delta.get("emission_kgco2e", 0.0))
        rec_yield.append(rec.expected_delta.get("yield", 0.0))
        rec_cost.append(((-rec.expected_delta.get("energy_kwh", 0.0)) * price) + ((-rec.expected_delta.get("emission_kgco2e", 0.0)) * 0.04))

    avg_baseline_energy = float(np.mean(baseline_pred[:, 2]))
    avg_baseline_yield = float(np.mean(baseline_pred[:, 0]))

    energy_savings = float(np.mean(rec_energy))
    emission_reduction = float(np.mean(rec_emission))
    yield_gain = float(np.mean(rec_yield))
    cost_gain = float(np.mean(rec_cost))

    annual_roi = (cost_gain * 365 * 8) - 150000.0
    cost_opt_pct = (cost_gain / max(1.0, avg_baseline_energy * ((energy_price_low + energy_price_high) / 2.0))) * 100.0
    yield_improvement_pct = (yield_gain / max(1.0, avg_baseline_yield)) * 100.0

    report = KPIReport(
        yield_improvement_pct=yield_improvement_pct,
        energy_savings_kwh_per_batch=energy_savings,
        emission_reduction_kgco2e_per_batch=emission_reduction,
        cost_optimization_pct=cost_opt_pct,
        annual_roi_usd=annual_roi,
    )
    return report.__dict__
