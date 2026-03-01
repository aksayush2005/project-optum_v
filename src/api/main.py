from __future__ import annotations

import os
from typing import Dict, Optional

import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel

from src.config.settings import ConstraintConfig, ObjectiveWeights, RuntimeConfig
from src.data.pipeline import FeaturePipeline
from src.models.predictor import MultiTargetPredictor
from src.services.adaptive import AdaptiveOptimizer
from src.services.continuous_learning import ContinuousLearner
from src.services.signature_registry import SignatureRegistry
from src.simulation.scenario import build_synthetic_dataset, run_validation_simulation


class BatchCompareRequest(BaseModel):
    row: Dict[str, float]
    mode: str = "yield_energy"


class RecommendRequest(BaseModel):
    row: Dict[str, float]
    mode: str = "yield_energy"
    energy_price: float = 0.12
    carbon_price: float = 0.04
    weights: Optional[Dict[str, float]] = None


class PromoteRequest(BaseModel):
    mode: str
    params: Dict[str, float]
    outcomes: Dict[str, float]
    constraints_snapshot: Dict[str, float]
    confidence: float = 0.9
    approved: bool = False


class ConstraintUpdateRequest(BaseModel):
    emission_cap: float
    min_quality: Optional[float] = None
    min_yield: Optional[float] = None


class WhatIfRequest(BaseModel):
    machine_count: int = 3
    batches: int = 300
    energy_price_low: float = 0.08
    energy_price_high: float = 0.22
    emission_cap: float = 150.0


app = FastAPI(title="Golden Signature Optimization API", version="0.1.0")

pipeline = None
predictor = None
runtime = None
constraints = None
registry = None
learner = None
adaptive = None
feature_columns = None


def _ensure_initialized() -> None:
    global pipeline, predictor, runtime, constraints, registry, learner, adaptive, feature_columns
    if adaptive is not None:
        return

    pipeline = FeaturePipeline()
    predictor = MultiTargetPredictor()
    runtime = RuntimeConfig(
        signature_store_path=os.getenv("SIGNATURE_STORE_PATH", "/tmp/signature_store.json")
    )
    constraints = ConstraintConfig()
    registry = SignatureRegistry(runtime.signature_store_path)
    learner = ContinuousLearner(registry)

    seed_df = build_synthetic_dataset(n_rows=600, machine_count=3)
    processed, artifacts = pipeline.fit_transform(seed_df)
    feature_columns = artifacts.feature_columns
    predictor.fit(processed, artifacts.feature_columns)
    adaptive = AdaptiveOptimizer(
        predictor=predictor,
        registry=registry,
        feature_cols=artifacts.feature_columns,
        constraints=constraints,
        runtime=runtime,
    )


@app.middleware("http")
async def strip_api_prefix(request, call_next):
    path = request.scope.get("path", "")
    if path == "/api":
        request.scope["path"] = "/"
    elif path.startswith("/api/"):
        request.scope["path"] = path[4:] or "/"
    return await call_next(request)


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/signatures/active")
def active_signatures(mode: Optional[str] = None):
    _ensure_initialized()
    return [s.__dict__ for s in registry.list_active(mode=mode)]


@app.post("/batches/compare")
def batch_compare(req: BatchCompareRequest):
    _ensure_initialized()
    frame = pd.DataFrame([req.row])
    frame = pipeline.transform(frame)
    pred = predictor.predict_dict(frame[feature_columns])
    sigs = registry.list_active(mode=req.mode)
    if not sigs:
        return {"prediction": pred, "active_signature": None, "message": "No active signature"}

    sig = sigs[0]
    gaps = {k: pred.get(k, 0.0) - sig.objectives.get(k, 0.0) for k in pred.keys()}
    return {"prediction": pred, "active_signature": sig.__dict__, "gaps": gaps}


@app.post("/optimize/recommend")
def recommend(req: RecommendRequest):
    _ensure_initialized()
    frame = pd.DataFrame([req.row])
    frame = pipeline.transform(frame)

    w = ObjectiveWeights()
    if req.weights:
        for key, value in req.weights.items():
            if hasattr(w, key):
                setattr(w, key, float(value))

    rec = adaptive.recommend(
        live_row=frame,
        mode=req.mode,
        weights=w,
        energy_price=req.energy_price,
        carbon_price=req.carbon_price,
    )
    return rec.__dict__


@app.post("/signatures/promote")
def promote(req: PromoteRequest):
    _ensure_initialized()
    candidate = learner.propose_signature(
        mode=req.mode,
        params=req.params,
        outcomes=req.outcomes,
        constraints_snapshot=req.constraints_snapshot,
        confidence=req.confidence,
        approved=req.approved,
    )
    status = learner.challenge_and_promote(candidate, approved_by_human=req.approved)
    return {"candidate": candidate.__dict__, "status": status}


@app.post("/constraints/update")
def update_constraints(req: ConstraintUpdateRequest):
    _ensure_initialized()
    constraints.emission_cap = req.emission_cap
    if req.min_quality is not None:
        constraints.min_quality = req.min_quality
    if req.min_yield is not None:
        constraints.min_yield = req.min_yield
    return constraints.__dict__


@app.post("/simulate/what-if")
def what_if(req: WhatIfRequest):
    _ensure_initialized()
    report = run_validation_simulation(
        machine_count=req.machine_count,
        n_rows=req.batches,
        energy_price_low=req.energy_price_low,
        energy_price_high=req.energy_price_high,
        emission_cap=req.emission_cap,
    )
    return report


@app.get("/explain/feature-importance")
def feature_importance():
    _ensure_initialized()
    return predictor.feature_importance_proxy()
