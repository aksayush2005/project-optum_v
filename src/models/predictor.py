from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.multioutput import MultiOutputRegressor
from sklearn.neural_network import MLPRegressor

from src.data.schemas import TARGET_COLUMNS


@dataclass
class ModelMetrics:
    mae: float
    rmse: float
    mape: float


class MultiTargetPredictor:
    """Ensemble surrogate model for multi-objective optimization."""

    def __init__(self) -> None:
        self._gb = MultiOutputRegressor(GradientBoostingRegressor(random_state=42))
        self._nn = MLPRegressor(hidden_layer_sizes=(128, 64), max_iter=500, random_state=42)
        self._feature_cols: List[str] = []
        self._is_fitted = False

    def fit(self, df: pd.DataFrame, feature_cols: List[str]) -> Dict[str, ModelMetrics]:
        self._feature_cols = feature_cols
        x = df[feature_cols].fillna(0.0)
        y = df[TARGET_COLUMNS].fillna(0.0)

        self._gb.fit(x, y)
        self._nn.fit(x, y)
        self._is_fitted = True

        pred = self.predict(df)
        return self.evaluate(y.to_numpy(), pred)

    def predict(self, df: pd.DataFrame) -> np.ndarray:
        if not self._is_fitted:
            raise RuntimeError("Model is not fitted")
        x = df[self._feature_cols].fillna(0.0)
        gb_pred = self._gb.predict(x)
        nn_pred = self._nn.predict(x)
        if nn_pred.ndim == 1:
            nn_pred = nn_pred.reshape(-1, len(TARGET_COLUMNS))
        return 0.6 * gb_pred + 0.4 * nn_pred

    def predict_dict(self, row: pd.DataFrame) -> Dict[str, float]:
        pred = self.predict(row)[0]
        return {k: float(v) for k, v in zip(TARGET_COLUMNS, pred)}

    @staticmethod
    def evaluate(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, ModelMetrics]:
        out: Dict[str, ModelMetrics] = {}
        for i, t in enumerate(TARGET_COLUMNS):
            yt = y_true[:, i]
            yp = y_pred[:, i]
            mae = mean_absolute_error(yt, yp)
            rmse = np.sqrt(mean_squared_error(yt, yp))
            mape = float(np.mean(np.abs((yt - yp) / np.clip(np.abs(yt), 1e-5, None))) * 100.0)
            out[t] = ModelMetrics(mae=mae, rmse=rmse, mape=mape)
        return out

    def feature_importance_proxy(self) -> Dict[str, float]:
        if not self._is_fitted:
            return {}
        importances = np.zeros(len(self._feature_cols), dtype=float)
        for est in self._gb.estimators_:
            if hasattr(est, "feature_importances_"):
                importances += est.feature_importances_
        if importances.sum() == 0:
            return {c: 0.0 for c in self._feature_cols}
        importances = importances / importances.sum()
        return {c: float(v) for c, v in zip(self._feature_cols, importances)}
