import json
import numpy as np
import pandas as pd
import joblib

# Load dataset and model
data_path = r"c:\Users\baish\OneDrive\Desktop\smart freight bubu\ml\data\delhivery_data.csv"
model_path = r"c:\Users\baish\OneDrive\Desktop\smart freight bubu\ml\models\travel_time_model.joblib"
preproc_path = r"c:\Users\baish\OneDrive\Desktop\smart freight bubu\ml\models\preprocessor.joblib"

df = pd.read_csv(data_path)

import sys
from pathlib import Path
sys.path.append(r"c:\Users\baish\OneDrive\Desktop\smart freight bubu\ml\src")
from features import aggregate_raw_delhivery_data, clean_od_dataset, ALL_INPUT_FEATURES

od_df = aggregate_raw_delhivery_data(df)
clean_df = clean_od_dataset(od_df)

model = joblib.load(model_path)
preprocessor = joblib.load(preproc_path)

# Task 1 & 2: Overall Actual and Predicted Distributions
X_all = preprocessor.transform(clean_df[ALL_INPUT_FEATURES])
clean_df["predicted_time"] = model.predict(X_all)

print("="*80)
print("TASK 1 & 2: FULL CLEANED DATASET (25,660 records) - ACTUAL vs PREDICTED")
print("="*80)

def get_dist_stats(series, name=""):
    return {
        "Metric": name,
        "Mean": round(series.mean(), 1),
        "Median (P50)": round(series.median(), 1),
        "P25": round(series.quantile(0.25), 1),
        "P75": round(series.quantile(0.75), 1),
        "P90": round(series.quantile(0.90), 1),
        "P95": round(series.quantile(0.95), 1),
        "Max": round(series.max(), 1)
    }

dist_table = [
    get_dist_stats(clean_df["actual_time"], "Actual Transit Time (min)"),
    get_dist_stats(clean_df["predicted_time"], "ML Predicted Transit Time (min)"),
    get_dist_stats(clean_df["osrm_time"], "OSRM Free-flow Time (min)"),
    get_dist_stats((clean_df["osrm_distance"]/50.0)*60.0, "50 km/h Heuristic Time (min)")
]
print(pd.DataFrame(dist_table).to_string(index=False))

# Task 3: 380 km Corridors (~350-420 km, OSRM ~250-330 min)
print("\n" + "="*80)
print("TASK 3: COMPARABLE REAL DATA RECORDS FOR ~380 KM (Distance: 350-420 km)")
print("="*80)

sample_380 = clean_df[
    (clean_df["osrm_distance"] >= 350) & 
    (clean_df["osrm_distance"] <= 420) &
    (clean_df["osrm_time"] >= 250) &
    (clean_df["osrm_time"] <= 330)
].copy()

print(f"Total matching real-world records in Delhivery data: {len(sample_380)}")
print(f"Actual Time Distribution for ~380km:")
print(f" - Mean: {sample_380['actual_time'].mean():.1f} min ({sample_380['actual_time'].mean()/60:.2f} hrs)")
print(f" - Median: {sample_380['actual_time'].median():.1f} min ({sample_380['actual_time'].median()/60:.2f} hrs)")
print(f" - P25: {sample_380['actual_time'].quantile(0.25):.1f} min ({sample_380['actual_time'].quantile(0.25)/60:.2f} hrs)")
print(f" - P75: {sample_380['actual_time'].quantile(0.75):.1f} min ({sample_380['actual_time'].quantile(0.75)/60:.2f} hrs)")
print(f" - P90: {sample_380['actual_time'].quantile(0.90):.1f} min ({sample_380['actual_time'].quantile(0.90)/60:.2f} hrs)")
print(f" - Min: {sample_380['actual_time'].min():.1f} min | Max: {sample_380['actual_time'].max():.1f} min")

print(f"\nDelay Factor (Actual / OSRM):")
factor_380 = sample_380["actual_time"] / sample_380["osrm_time"]
print(f" - Mean Factor: {factor_380.mean():.2f}x")
print(f" - Median Factor: {factor_380.median():.2f}x")
print(f" - Interquartile Range: {factor_380.quantile(0.25):.2f}x to {factor_380.quantile(0.75):.2f}x")

print("\nSample real trips in this range:")
cols_show = ["trip_uuid", "source_name", "destination_name", "osrm_distance", "osrm_time", "actual_time", "num_intermediate_stops", "is_ftl"]
print(sample_380[cols_show].head(10).to_string(index=False))

# Task 4: Short-Haul 30 km Corridors (~25-35 km, OSRM ~20-30 min)
print("\n" + "="*80)
print("TASK 4: COMPARABLE REAL DATA RECORDS FOR ~30 KM (Distance: 25-35 km)")
print("="*80)

sample_30 = clean_df[
    (clean_df["osrm_distance"] >= 25) & 
    (clean_df["osrm_distance"] <= 35) &
    (clean_df["osrm_time"] >= 20) &
    (clean_df["osrm_time"] <= 30)
].copy()

print(f"Total matching real-world records in Delhivery data: {len(sample_30)}")
print(f"Actual Time Distribution for ~30km:")
print(f" - Mean: {sample_30['actual_time'].mean():.1f} min ({sample_30['actual_time'].mean()/60:.2f} hrs)")
print(f" - Median: {sample_30['actual_time'].median():.1f} min ({sample_30['actual_time'].median()/60:.2f} hrs)")
print(f" - P25: {sample_30['actual_time'].quantile(0.25):.1f} min")
print(f" - P75: {sample_30['actual_time'].quantile(0.75):.1f} min")
print(f" - P90: {sample_30['actual_time'].quantile(0.90):.1f} min")
print(f" - Min: {sample_30['actual_time'].min():.1f} min | Max: {sample_30['actual_time'].max():.1f} min")

# Task 5 & 6: Semantic Analysis of Features
print("\n" + "="*80)
print("TASK 5 & 6: FEATURE DISTRIBUTIONS & SEMANTIC MEANING")
print("="*80)

print("\nDistribution of num_intermediate_stops in Delhivery training data:")
print(clean_df["num_intermediate_stops"].describe())
print(clean_df["num_intermediate_stops"].value_counts().head(10))

print("\nDistribution of is_ftl in Delhivery training data:")
print(clean_df["is_ftl"].value_counts(normalize=True))

# Check correlation of num_intermediate_stops with actual_time
corr = clean_df[["actual_time", "osrm_distance", "osrm_time", "num_intermediate_stops", "is_ftl", "is_interstate"]].corr()
print("\nCorrelations with actual_time:")
print(corr["actual_time"])
