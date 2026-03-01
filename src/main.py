from __future__ import annotations

import json

from src.simulation.scenario import run_validation_simulation


if __name__ == "__main__":
    report = run_validation_simulation()
    print(json.dumps(report, indent=2))
