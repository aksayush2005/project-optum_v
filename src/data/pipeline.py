from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.impute import KNNImputer, SimpleImputer
from sklearn.preprocessing import RobustScaler

from src.data.schemas import TARGET_COLUMNS


@dataclass
class PipelineArtifacts:
    feature_columns: List[str]
    scaler: RobustScaler


class FeaturePipeline:
    """Preprocesses batch/process/energy/environment data into model-ready features."""

    def __init__(self) -> None:
        self._simple_imputer = SimpleImputer(strategy="median")
        self._knn_imputer = KNNImputer(n_neighbors=3)
        self._scaler = RobustScaler()
        self._fitted = False
        self._feature_columns: List[str] = []

    @staticmethod
    def add_derived_metrics(df: pd.DataFrame) -> pd.DataFrame:
        out = df.copy()
        good_output = out.get("good_output", pd.Series(np.nan, index=out.index))
        total_input = out.get("total_input", pd.Series(np.nan, index=out.index))
        energy = out.get("energy_kwh", pd.Series(np.nan, index=out.index))
        emissions = out.get("emission_kgco2e", pd.Series(np.nan, index=out.index))

        out["energy_per_unit"] = energy / good_output.replace(0, np.nan)
        out["yield_efficiency_ratio"] = good_output / total_input.replace(0, np.nan)
        out["emissions_intensity_batch"] = emissions / out.get("batch_size", 1.0)
        out["equipment_stress_index"] = (
            0.4 * out.get("vibration", 0.0)
            + 0.3 * out.get("temperature", 0.0)
            + 0.3 * out.get("pressure", 0.0)
        )
        return out

    @staticmethod
    def add_time_series_features(df: pd.DataFrame, group_col: str = "machine_id") -> pd.DataFrame:
        out = df.copy()
        if "timestamp" in out.columns:
            out = out.sort_values("timestamp")

        for col in ["temperature", "pressure", "energy_kwh", "throughput_units_hr"]:
            if col in out.columns:
                out[f"{col}_lag1"] = out[col].shift(1)
                out[f"{col}_roll_mean_3"] = out[col].rolling(3, min_periods=1).mean()
                out[f"{col}_roll_std_3"] = out[col].rolling(3, min_periods=1).std().fillna(0.0)
                out[f"{col}_slope"] = out[col].diff().fillna(0.0)

        if group_col in out.columns:
            out["batch_index_machine"] = out.groupby(group_col).cumcount()

        return out

    def _numeric_matrix(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
        numeric = df.select_dtypes(include=[np.number]).copy()
        feature_cols = [c for c in numeric.columns if c not in TARGET_COLUMNS]
        return numeric, feature_cols

    def fit_transform(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, PipelineArtifacts]:
        engineered = self.add_derived_metrics(df)
        engineered = self.add_time_series_features(engineered)

        numeric, feature_cols = self._numeric_matrix(engineered)
        x = numeric[feature_cols]

        x_med = pd.DataFrame(self._simple_imputer.fit_transform(x), columns=feature_cols, index=x.index)
        x_imp = pd.DataFrame(self._knn_imputer.fit_transform(x_med), columns=feature_cols, index=x.index)

        detector = IsolationForest(contamination=0.03, random_state=42)
        mask = detector.fit_predict(x_imp) == 1
        filtered = x_imp[mask]

        scaled = pd.DataFrame(self._scaler.fit_transform(filtered), columns=feature_cols, index=filtered.index)

        self._feature_columns = feature_cols
        self._fitted = True

        result = engineered.loc[scaled.index].copy()
        for c in feature_cols:
            result[c] = scaled[c]

        return result, PipelineArtifacts(feature_columns=feature_cols, scaler=self._scaler)

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        if not self._fitted:
            raise RuntimeError("Pipeline must be fitted before transform.")

        engineered = self.add_derived_metrics(df)
        engineered = self.add_time_series_features(engineered)
        numeric, _ = self._numeric_matrix(engineered)
        x = numeric.reindex(columns=self._feature_columns)

        x_med = pd.DataFrame(self._simple_imputer.transform(x), columns=self._feature_columns, index=x.index)
        x_imp = pd.DataFrame(self._knn_imputer.transform(x_med), columns=self._feature_columns, index=x.index)
        scaled = pd.DataFrame(self._scaler.transform(x_imp), columns=self._feature_columns, index=x.index)

        out = engineered.copy()
        for c in self._feature_columns:
            out[c] = scaled[c]
        return out
