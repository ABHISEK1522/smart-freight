# SMART FREIGHT — ML MODEL 1 EVALUATION REPORT
**Model:** Indian Freight Transit-Time Prediction Engine  
**Objective:** Predict empirical real-world Indian road freight travel time to replace deterministic flat-speed heuristics in the Smart Freight Consolidation & Cold-Chain Risk Engine.  
**Evaluation Date:** September 1, 2026  
**Status:** MODEL TRAINED & VERIFIED (Isolated in `ml/`)

---

## 1. DATASET PROVENANCE & TRAINING DATA

* **Dataset:** Delhivery Logistics Real Operational Dataset (`ml/data/delhivery_data.csv`).
* **Raw Records:** `144,867` raw checkpoint scan events across `14,817` unique journeys nationwide.
* **Aggregated OD Corridor Legs:** `26,368` hub-to-hub movements.
* **Cleaned Usable Records:** `25,660` records ($97.31\%$ data retention after removing invalid zero/negative durations and extreme telemetry artifacts).
* **Coverage:** Nationwide Indian national/state highways spanning 1,500+ logistics centers across 20+ states and union territories.

---

## 2. TARGET VARIABLE DEFINITION

* **Target Variable:** `actual_time`
* **Unit:** Minutes (also evaluated in Hours: $\text{Hours} = \text{Minutes} / 60$)
* **Definition:** The actual cumulative in-motion road transit duration from the origin dispatch hub to the destination receiving hub.
* **Why Selected:** Isolates pure on-road transit resistance (congestion, road geometry, terrain, highway bottlenecks) from variable warehouse dock dwell times.

---

## 3. FEATURE ENGINEERING & LEAKAGE AUDIT

### 3.1 Features Selected for Training (100% Pre-Trip Available)

| Feature Name | Feature Type | Origin in Smart Freight | Semantic Rationale |
| :--- | :---: | :--- | :--- |
| `osrm_distance` | Numerical (km) | `routing_service.py` (`distance_km`) | Total theoretical driving road distance. |
| `osrm_time` | Numerical (min)| `routing_service.py` (`duration_minutes`) | Base free-flow routing engine duration. |
| `osrm_speed_kmh` | Numerical (km/h)| Derived ($\text{dist} / \text{time}$) | Route curvature/road classification proxy. |
| `num_intermediate_stops`| Numerical (int) | `main.py` (`len(route)`) | Number of intermediate pickup/dropoff hubs. |
| `is_ftl` | Binary (0/1) | `database.py` (`selected_vehicle`) | Full Truck Load vs. light shuttle transport. |
| `departure_hour` | Numerical (0–23)| `database.py` (`pickup_time`) | Captures diurnal traffic peaks and urban truck entry bans. |
| `departure_dayofweek` | Categorical (0–6)| `database.py` (`pickup_date`) | Captures weekend vs weekday congestion patterns. |
| `is_weekend` | Binary (0/1) | `database.py` (`pickup_date`) | Weekend freight velocity indicator. |
| `is_night_dispatch` | Binary (0/1) | `database.py` (`pickup_time`) | 1 if dispatch between 21:00 and 05:00. |
| `is_interstate` | Binary (0/1) | Derived (Origin/Dest State) | Captures state border toll/tax checkpost delays. |
| `source_state` | Categorical | `database.py` (`pickup_location`) | Origin State (One-Hot Encoded). |
| `destination_state`| Categorical | `database.py` (`destination`) | Destination State (One-Hot Encoded). |

### 3.2 Features Excluded Due to Data Leakage

| Excluded Field | Leakage Type | Exclusion Justification |
| :--- | :---: | :--- |
| `actual_distance_to_destination` | Post-Trip Ground Truth | Odometer reading measured during/after driving. |
| `segment_actual_time` | Ground Truth Sub-Segment | Measured after checkpoint arrival. |
| `factor` / `segment_factor` | Direct Target Derived | Mathematical ratios containing `actual_time`. |
| `od_end_time` | Post-Trip Timestamp | Arrival timestamp recorded at journey conclusion. |
| `start_scan_to_end_scan` | Post-Delivery Metric | Includes terminal dwell time recorded post-unloading. |
| `is_cutoff`, `cutoff_factor` | Mid-Trip Telemetry | Intermediate checkpoint tracking states. |

---

## 4. TRAIN / VALIDATION / TEST SPLIT METHODOLOGY

To prevent subtle data leakage from multi-leg trips appearing across splits, a strict **Grouped Split by `trip_uuid`** was applied:

* **Train Set ($70\%$):** `17,926` records (`10,144` unique trips)
* **Validation Set ($15\%$):** `3,928` records (`2,174` unique trips)
* **Test Set ($15\%$ Held-Out):** `3,806` records (`2,174` unique trips)

*Note: Zero trip overlap exists between Train, Validation, and Test sets.*

---

## 5. EXPERIMENTAL RESULTS ON HELD-OUT TEST SET

All models and baselines were evaluated on the identical $3,806$ unseen test records:

| Model / Baseline | MAE (min) | MAE (hrs) | RMSE (min) | $R^2$ Score | MedAE (min) | MAPE (%) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Baseline C: Simple Train Median** | 128.95 | 2.15 | 341.31 | -0.0908 | 40.00 | 67.14% |
| **Baseline B: OSRM Free-Flow Time** | 94.16 | 1.57 | 199.31 | 0.6280 | 41.00 | 49.18% |
| **Baseline A: Existing Smart Freight (50 km/h Heuristic)** | 51.64 | 0.86 | 103.13 | 0.9004 | 24.95 | 31.60% |
| **Model 1: Ridge Linear Regression** | 36.04 | 0.60 | 64.94 | 0.9605 | 20.92 | 33.77% |
| **Model 4: HistGradientBoosting** | 30.73 | 0.51 | 54.02 | 0.9727 | 18.31 | 28.32% |
| **Model 3: XGBoost Regressor** | 28.06 | 0.47 | 49.80 | 0.9768 | 16.58 | 25.10% |
| **Model 2: Random Forest Regressor (BEST)** | **26.11** | **0.44** | **49.17** | **0.9774** | **14.68** | **22.39%** |

---

## 6. IMPROVEMENT OVER EXISTING BASELINES

Comparing the selected **Random Forest Regressor** against Smart Freight's current heuristics:

1. **Improvement vs. Current Smart Freight 50 km/h Heuristic (`main.py`)**:
   - **MAE reduced by $49.4\%$** ($51.64\text{ mins} \rightarrow \mathbf{26.11\text{ mins}}$).
   - **RMSE reduced by $52.3\%$** ($103.13\text{ mins} \rightarrow \mathbf{49.17\text{ mins}}$).
   - **Median Error reduced by $41.2\%$** ($24.95\text{ mins} \rightarrow \mathbf{14.68\text{ mins}}$).
   - **$R^2$ improved from $0.9004$ to $\mathbf{0.9774}$**.

2. **Improvement vs. OSRM Free-Flow Routing (`routing_service.py`)**:
   - **MAE reduced by $72.3\%$** ($94.16\text{ mins} \rightarrow \mathbf{26.11\text{ mins}}$).
   - **RMSE reduced by $75.3\%$** ($199.31\text{ mins} \rightarrow \mathbf{49.17\text{ mins}}$).

---

## 7. FEATURE IMPORTANCE & INTERPRETABILITY

Top features driving the Random Forest model predictions:

| Rank | Feature | Importance Weight | Empirical Interpretation |
| :---: | :--- | :---: | :--- |
| **1** | `osrm_time` | **57.35%** | Acts as the primary anchor for route topography and distance scaling. |
| **2** | `osrm_distance` | **38.95%** | Provides scale for physical road length. |
| **3** | `num_intermediate_stops` | **1.53%** | Captures dwell and acceleration penalties at corridor checkpoints. |
| **4** | `osrm_speed_kmh` | **0.70%** | Discriminates between express national corridors and congested arterials. |
| **5** | `departure_hour` | **0.34%** | Adjusts for diurnal traffic rhythms and urban daytime truck entry restrictions. |
| **6** | `departure_dayofweek` | **0.11%** | Accounts for weekend vs. weekday traffic densities. |
| **7** | `destination_state_Assam` | **0.10%** | Regional adjustment for Northeast corridor terrain and border bottlenecks. |
| **8** | `is_interstate` | **0.06%** | Accounts for state-line toll and commercial tax queues. |

---

## 8. GENERALIZATION & OUT-OF-DISTRIBUTION ANALYSIS

### 8.1 Performance on Unseen OD Route Pairs
To test whether the model merely memorized known city pairs:
* **Seen OD Routes in Test Set ($3,696$ records):** $\text{MAE} = \mathbf{26.10\text{ min}}$, $R^2 = \mathbf{0.9773}$
* **Completely Unseen OD Routes in Test Set ($110$ records):** $\text{MAE} = \mathbf{28.37\text{ min}}$, $R^2 = \mathbf{0.9427}$
  - *(Compare with 50 km/h Heuristic on Unseen Routes: $\text{MAE} = 46.99\text{ min}$)*
  - *(Compare with OSRM Baseline on Unseen Routes: $\text{MAE} = 69.91\text{ min}$)*

### 8.2 Breakdown Across Journey Distance Tiers

| Distance Tier | Sample Size | Mean Actual Transit | ML Model MAE | 50 km/h Heuristic MAE | OSRM Baseline MAE | ML $R^2$ |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Short-Haul ($<50\text{ km}$)** | 2,117 | $60.7\text{ min}$ | **15.27 min** | 25.80 min | 33.66 min | 0.5131 |
| **Medium-Haul ($50\text{--}200\text{ km}$)** | 1,315 | $163.5\text{ min}$ | **31.15 min** | 55.64 min | 87.72 min | 0.6888 |
| **Long-Haul ($200\text{--}600\text{ km}$)** | 246 | $514.9\text{ min}$ | **54.33 min** | 121.14 min | 263.26 min | 0.8053 |
| **National Corridor ($>600\text{ km}$)** | 128 | $1,664.0\text{ min}$ (~27.7 hrs) | **101.04 min** (~1.6 hrs) | 304.40 min (~5.1 hrs) | 836.07 min (~13.9 hrs) | **0.9422** |

> **Key Observation:** On long national freight corridors ($>600\text{ km}$), theoretical OSRM underestimates transit by nearly $14\text{ hours}$ and the 50 km/h heuristic is off by over $5\text{ hours}$. The ML model predicts total transit duration with only $1.6\text{ hours}$ average error ($\approx 6\%$ error margin).

---

## 9. SAVED ARTIFACTS IN `ml/models/`

* `ml/models/travel_time_model.joblib` (27.3 MB — Trained Random Forest Regressor)
* `ml/models/preprocessor.joblib` (3.7 KB — Standard scaler + One-hot encoder pipeline)
* `ml/models/model_metadata.json` (3.5 KB — Reproducibility schema and feature registry)

---

## 10. FINAL CRITICAL DECISION

### Classification: **GO — STRONG**

### Rationale:
1. **Unambiguous Performance Superiority:** The ML model cuts prediction error by **$49.4\%$** compared to Smart Freight’s existing $50\text{ km/h}$ heuristic and by **$72.3\%$** compared to free-flow OSRM.
2. **True Generalization:** Generalizes strongly to brand new, unseen source-destination pairs ($\text{MAE} = 28.37\text{ mins}$, $R^2 = 0.9427$) without route memorization.
3. **Zero Data Leakage:** Built strictly using pre-trip OSRM metrics, route classification, and departure scheduling features.
4. **Immediate Feasibility for Consolidation Engine:** Directly equips the Smart Freight optimizer to prevent cold-chain spoilage and SLA delivery failures caused by over-optimistic travel times.
