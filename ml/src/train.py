"""
Smart Freight - ML Model 1 Training & Evaluation Orchestrator
============================================================
Reproducible script to train, evaluate, and serialize Indian freight transit-time models.
"""

import json
import os
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    median_absolute_error,
    r2_score,
)
from sklearn.model_selection import GroupShuffleSplit
import xgboost as xgb

# Add local path for features module
CURRENT_DIR = Path(__file__).resolve().parent
sys.path.append(str(CURRENT_DIR))

from features import (
    ALL_INPUT_FEATURES,
    CATEGORICAL_FEATURES,
    NUMERIC_FEATURES,
    aggregate_raw_delhivery_data,
    build_preprocessor,
    clean_od_dataset,
)


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray, name: str = "Model") -> dict:
    """Calculate comprehensive regression error metrics."""
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2 = float(r2_score(y_true, y_pred))
    medae = float(median_absolute_error(y_true, y_pred))
    # Filter zeros for safe MAPE computation
    mask = y_true > 0
    mape = float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)
    return {
        "model_name": name,
        "mae_minutes": round(mae, 2),
        "rmse_minutes": round(rmse, 2),
        "r2_score": round(r2, 4),
        "medae_minutes": round(medae, 2),
        "mape_percent": round(mape, 2),
        "mae_hours": round(mae / 60.0, 2),
    }


def main():
    base_dir = CURRENT_DIR.parent
    data_path = base_dir / "data" / "delhivery_data.csv"
    models_dir = base_dir / "models"
    models_dir.mkdir(parents=True, exist_ok=True)

    print(f"Loading raw Delhivery operational dataset from: {data_path}")
    raw_df = pd.read_csv(data_path)
    print(f"Raw shape: {raw_df.shape[0]} rows, {raw_df.shape[1]} columns")

    print("\n--- 1. Preprocessing & Feature Extraction ---")
    od_df = aggregate_raw_delhivery_data(raw_df)
    clean_df = clean_od_dataset(od_df)
    print(f"Aggregated OD legs: {len(od_df)} | Cleaned valid records: {len(clean_df)} (Retained {len(clean_df)/len(od_df)*100:.2f}%)")

    print("\n--- 2. Grouped Train / Validation / Test Split ---")
    groups = clean_df["trip_uuid"]
    gss_outer = GroupShuffleSplit(n_splits=1, test_size=0.30, random_state=42)
    train_idx, temp_idx = next(gss_outer.split(clean_df, groups=groups))

    train_data = clean_df.iloc[train_idx].copy().reset_index(drop=True)
    temp_data = clean_df.iloc[temp_idx].copy().reset_index(drop=True)

    gss_inner = GroupShuffleSplit(n_splits=1, test_size=0.50, random_state=42)
    val_idx, test_idx = next(gss_inner.split(temp_data, groups=temp_data["trip_uuid"]))

    val_data = temp_data.iloc[val_idx].copy().reset_index(drop=True)
    test_data = temp_data.iloc[test_idx].copy().reset_index(drop=True)

    print(f"Train Set: {len(train_data)} records ({train_data['trip_uuid'].nunique()} unique trips)")
    print(f"Val Set:   {len(val_data)} records ({val_data['trip_uuid'].nunique()} unique trips)")
    print(f"Test Set:  {len(test_data)} records ({test_data['trip_uuid'].nunique()} unique trips)")

    # Fit ColumnTransformer Preprocessor strictly on Train Set
    preprocessor = build_preprocessor()
    X_train = preprocessor.fit_transform(train_data[ALL_INPUT_FEATURES])
    y_train = train_data["actual_time"].values

    X_val = preprocessor.transform(val_data[ALL_INPUT_FEATURES])
    y_val = val_data["actual_time"].values

    X_test = preprocessor.transform(test_data[ALL_INPUT_FEATURES])
    y_test = test_data["actual_time"].values

    print("\n--- 3. Evaluating Baselines ---")
    val_metrics = []
    test_metrics = []

    # Baseline A: Existing 50 km/h Heuristic (main.py)
    val_pred_50 = (val_data["osrm_distance"].values / 50.0) * 60.0
    test_pred_50 = (test_data["osrm_distance"].values / 50.0) * 60.0
    val_metrics.append(compute_metrics(y_val, val_pred_50, "Baseline A (50 km/h Heuristic)"))
    test_metrics.append(compute_metrics(y_test, test_pred_50, "Baseline A (50 km/h Heuristic)"))

    # Baseline B: OSRM Free-flow Time
    val_pred_osrm = val_data["osrm_time"].values
    test_pred_osrm = test_data["osrm_time"].values
    val_metrics.append(compute_metrics(y_val, val_pred_osrm, "Baseline B (OSRM Free-Flow)"))
    test_metrics.append(compute_metrics(y_test, test_pred_osrm, "Baseline B (OSRM Free-Flow)"))

    # Baseline C: Train Median
    val_pred_med = np.full_like(y_val, np.median(y_train))
    test_pred_med = np.full_like(y_test, np.median(y_train))
    val_metrics.append(compute_metrics(y_val, val_pred_med, "Baseline C (Train Median)"))
    test_metrics.append(compute_metrics(y_test, test_pred_med, "Baseline C (Train Median)"))

    print("\n--- 4. Training ML Candidate Models ---")
    candidate_models = {
        "Ridge Linear Regression": Ridge(alpha=10.0),
        "Random Forest Regressor": RandomForestRegressor(
            n_estimators=120,
            max_depth=16,
            min_samples_split=6,
            random_state=42,
            n_jobs=-1,
        ),
        "HistGradientBoosting": HistGradientBoostingRegressor(
            max_iter=250, max_depth=8, learning_rate=0.05, random_state=42
        ),
        "XGBoost Regressor": xgb.XGBRegressor(
            n_estimators=250,
            learning_rate=0.05,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=-1,
        ),
    }

    trained_models = {}
    for name, model in candidate_models.items():
        print(f"Training {name}...")
        model.fit(X_train, y_train)
        trained_models[name] = model

        val_pred = model.predict(X_val)
        test_pred = model.predict(X_test)

        val_metrics.append(compute_metrics(y_val, val_pred, name))
        test_metrics.append(compute_metrics(y_test, test_pred, name))

    val_results_df = pd.DataFrame(val_metrics)
    test_results_df = pd.DataFrame(test_metrics)

    print("\n" + "=" * 90)
    print("VALIDATION SET RESULTS")
    print("=" * 90)
    print(val_results_df.to_string(index=False))

    print("\n" + "=" * 90)
    print("TEST SET RESULTS (HELD-OUT UNSEEN DATA)")
    print("=" * 90)
    print(test_results_df.to_string(index=False))

    # Select Best Model based on Validation MAE
    ml_val_df = val_results_df[~val_results_df["model_name"].str.startswith("Baseline")].copy()
    best_model_name = ml_val_df.sort_values(by="mae_minutes").iloc[0]["model_name"]
    best_model = trained_models[best_model_name]
    print(f"\n>>> Selected Best Model: {best_model_name}")

    # Feature Importance
    cat_names = preprocessor.named_transformers_["cat"].get_feature_names_out(CATEGORICAL_FEATURES)
    feature_names = list(NUMERIC_FEATURES) + list(cat_names)
    
    if hasattr(best_model, "feature_importances_"):
        importances = best_model.feature_importances_
    elif hasattr(best_model, "coef_"):
        importances = np.abs(best_model.coef_)
    else:
        importances = np.ones(len(feature_names))

    feat_imp_df = (
        pd.DataFrame({"feature": feature_names, "importance": importances})
        .sort_values(by="importance", ascending=False)
        .reset_index(drop=True)
    )

    print("\n" + "=" * 90)
    print(f"TOP 15 FEATURE IMPORTANCES ({best_model_name})")
    print("=" * 90)
    print(feat_imp_df.head(15).to_string())

    # Serialization
    model_path = models_dir / "travel_time_model.joblib"
    preprocessor_path = models_dir / "preprocessor.joblib"
    metadata_path = models_dir / "model_metadata.json"

    print(f"\nSerializing best model artifact to: {model_path}")
    joblib.dump(best_model, model_path)
    joblib.dump(preprocessor, preprocessor_path)

    metadata = {
        "model_name": best_model_name,
        "input_features": ALL_INPUT_FEATURES,
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "target_variable": "actual_time",
        "target_unit": "minutes",
        "train_samples": len(train_data),
        "val_samples": len(val_data),
        "test_samples": len(test_data),
        "test_metrics": test_results_df.to_dict(orient="records"),
        "top_features": feat_imp_df.head(10).to_dict(orient="records"),
    }
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Saved metadata to: {metadata_path}")
    print("\nTraining and evaluation pipeline completed successfully!")


if __name__ == "__main__":
    main()
