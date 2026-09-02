"""
Smart Freight - ML Model 1 (Travel-Time Prediction) Feature Engineering Pipeline
================================================================================
Reproducible preprocessing and feature extraction module for real Indian logistics transit data.
"""

import re
from typing import List, Tuple
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler

TOP_INDIAN_STATES = [
    "Maharashtra",
    "Karnataka",
    "Tamil Nadu",
    "Haryana",
    "Uttar Pradesh",
    "Telangana",
    "Gujarat",
    "West Bengal",
    "Andhra Pradesh",
    "Rajasthan",
    "Delhi",
    "Punjab",
    "Madhya Pradesh",
    "Kerala",
    "Bihar",
    "Odisha",
    "Assam",
]

NUMERIC_FEATURES = [
    "osrm_distance",
    "osrm_time",
    "osrm_speed_kmh",
    "num_intermediate_stops",
    "is_ftl",
    "departure_hour",
    "departure_dayofweek",
    "is_weekend",
    "is_night_dispatch",
    "is_interstate",
]

CATEGORICAL_FEATURES = ["source_state", "destination_state"]

ALL_INPUT_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def extract_state_name(name_str: str) -> str:
    """Extract standard Indian state name from text strings (e.g. 'Purnia_Central_H_2 (Bihar)' -> 'Bihar')."""
    if not isinstance(name_str, str):
        return "Other"
    match = re.search(r"\(([^)]+)\)", name_str)
    if match:
        st = match.group(1).strip()
    else:
        tokens = name_str.split("_")
        st = tokens[-1].strip() if tokens else "Other"
    return st if st in TOP_INDIAN_STATES else "Other"


def aggregate_raw_delhivery_data(df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate raw segment-level cutoff records to the Hub-to-Hub (OD Leg) level.
    
    Extracts strictly pre-trip features and ground truth actual transit duration.
    """
    od_df = (
        df.groupby(["trip_uuid", "source_center", "destination_center"])
        .agg(
            {
                "actual_time": "max",
                "osrm_distance": "max",
                "osrm_time": "max",
                "segment_osrm_distance": "sum",
                "segment_osrm_time": "sum",
                "is_cutoff": "count",
                "route_type": "first",
                "source_name": "first",
                "destination_name": "first",
                "trip_creation_time": "first",
            }
        )
        .rename(columns={"is_cutoff": "num_intermediate_stops"})
        .reset_index()
    )

    # 1. Spatial & Network Features
    od_df["source_state"] = od_df["source_name"].apply(extract_state_name)
    od_df["destination_state"] = od_df["destination_name"].apply(extract_state_name)
    od_df["is_interstate"] = (od_df["source_state"] != od_df["destination_state"]).astype(int)

    # 2. Temporal & Schedule Features (derived from pre-trip creation/scheduled timestamp)
    tct = pd.to_datetime(od_df["trip_creation_time"], errors="coerce")
    od_df["departure_hour"] = tct.dt.hour.fillna(12).astype(int)
    od_df["departure_dayofweek"] = tct.dt.dayofweek.fillna(0).astype(int)
    od_df["is_weekend"] = (od_df["departure_dayofweek"] >= 5).astype(int)
    od_df["is_night_dispatch"] = (
        (od_df["departure_hour"] >= 21) | (od_df["departure_hour"] <= 5)
    ).astype(int)

    # 3. Routing Derived Features
    od_df["osrm_speed_kmh"] = od_df["osrm_distance"] / (
        od_df["osrm_time"] / 60.0 + 1e-5
    )
    od_df["is_ftl"] = (od_df["route_type"] == "FTL").astype(int)

    return od_df


def clean_od_dataset(df: pd.DataFrame) -> pd.DataFrame:
    """Filter impossible values and extreme non-physical telemetry artifacts."""
    clean_mask = (df["osrm_time"] > 0) & (df["actual_time"] > 0) & (df["osrm_distance"] > 0)
    factor = df["actual_time"] / df["osrm_time"]
    clean_mask &= (factor >= 0.2) & (factor <= 8.0)
    clean_mask &= (df["actual_time"] <= 3500) & (df["osrm_distance"] <= 2000)
    return df[clean_mask].copy().reset_index(drop=True)


def build_preprocessor() -> ColumnTransformer:
    """Construct standard scikit-learn preprocessing ColumnTransformer."""
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_FEATURES,
            ),
        ]
    )
