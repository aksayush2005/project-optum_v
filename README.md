# Golden Signature Optimization Engine

Production-style Python project for multi-objective optimization in industrial batch manufacturing.

## Features
- Feature pipeline: imputation, outlier filtering, normalization, time-series features, derived KPIs
- Multi-target predictor: yield, quality, energy, emissions, throughput
- Pareto optimization with NSGA-II style evolutionary search
- Golden Signature registry with versioning and approval workflow
- Adaptive correction recommendations with drift detection
- FastAPI endpoints for integration with MES/ERP layers
- Scenario simulator for ROI, energy, emissions, and yield validation

## Project Structure
- `src/config`: configuration models
- `src/data`: preprocessing and feature engineering
- `src/models`: predictive model layer
- `src/optimization`: Pareto and NSGA-II components
- `src/services`: registry, adaptation, continuous learning
- `src/api`: REST API
- `src/simulation`: industrial validation simulation
- `tests`: smoke and unit tests

## Quickstart
```bash
python -m venv .venv
. .venv/Scripts/activate  # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -e .
python -m src.main
uvicorn src.api.main:app --reload
```

## API Endpoints
- `GET /health`
- `GET /signatures/active`
- `POST /batches/compare`
- `POST /optimize/recommend`
- `POST /signatures/promote`
- `POST /constraints/update`
- `POST /simulate/what-if`

## Notes
- `SignatureRegistry` defaults to JSON file persistence (`signature_store.json`).
- Recommendation flow includes human-in-the-loop approval flags.
- Start with synthetic simulation, then connect plant data streams.
