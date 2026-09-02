# DELHIVERY LOGISTICS DATASET VERIFICATION & ML PRE-FEASIBILITY REPORT
**Project:** Smart Freight — AI-Based Multimodal Freight Consolidation Intelligence Layer  
**Component:** Model 1 (Indian Logistics Travel-Time Prediction Engine)  
**Audit Phase:** Step 1 — Real Indian Operational Dataset Verification  
**Date of Audit:** September 1, 2026  
**Status:** AUDIT & VERIFICATION ONLY (Read-Only Codebase Assessment)

---

## 1. DATASET PROVENANCE & ACQUISITION

* **Dataset Name:** Delhivery Logistics Dataset (Public Operational Transit Data)
* **Target Storage Location:** `ml/data/delhivery_data.csv`
* **File Size:** 55,465,113 bytes (~55.4 MB)
* **Acquisition Source:** Publicly hosted benchmark repository (CloudFront / Kaggle standard delivery dataset)
* **Dataset Context:** Real-world logistics and freight movement logs collected across India by Delhivery (one of India's largest logistics and supply chain networks), containing detailed shipment tracking scans, Open Source Routing Machine (OSRM) baselines, and actual transit timestamps.

---

## 2. DATASET STRUCTURE

* **Exact Filename:** `delhivery_data.csv`
* **File Format:** CSV (Comma-Separated Values, UTF-8)
* **Total Rows:** `144,867` records
* **Total Columns:** `24` columns

### Complete Schema & Data Types:

| # | Column Name | Raw Data Type | Inferred Semantic Type | Sample Value |
| :- | :--- | :--- | :--- | :--- |
| 1 | `data` | `str` (object) | Split Category | `"training"`, `"test"` |
| 2 | `trip_creation_time` | `str` (object) | ISO Datetime | `"2018-09-12 00:00:16.535741"` |
| 3 | `route_schedule_uuid` | `str` (object) | Identifier (UUID) | `"thanos::schedules:route_... "` |
| 4 | `route_type` | `str` (object) | Categorical | `"FTL"` (Full Truck Load) / `"Carting"` |
| 5 | `trip_uuid` | `str` (object) | Identifier (UUID) | `"trip-153768492602129387"` |
| 6 | `source_center` | `str` (object) | Hub Code | `"IND854326AAB"` |
| 7 | `source_name` | `str` (object) | Text (Hub + State) | `"Purnia_Central_H_2 (Bihar)"` |
| 8 | `destination_center` | `str` (object) | Hub Code | `"IND000000ACB"` |
| 9 | `destination_name` | `str` (object) | Text (Hub + State) | `"Gurgaon_Bilaspur_HB (Haryana)"` |
| 10 | `od_start_time` | `str` (object) | ISO Datetime | `"2018-09-12 00:00:16.535741"` |
| 11 | `od_end_time` | `str` (object) | ISO Datetime | `"2018-09-12 09:01:23.000000"` |
| 12 | `start_scan_to_end_scan` | `float64` | Numerical (Minutes) | `541.0` |
| 13 | `is_cutoff` | `bool` | Boolean Flag | `True` / `False` |
| 14 | `cutoff_factor` | `int64` | Numerical (Factor) | `66` |
| 15 | `cutoff_timestamp` | `str` (object) | ISO Datetime | `"2018-09-23 11:05:19"` |
| 16 | `actual_distance_to_destination` | `float64` | Numerical (Kilometers) | `100.7084` |
| 17 | `actual_time` | `float64` | Numerical (Minutes) | `183.0` |
| 18 | `osrm_time` | `float64` | Numerical (Minutes) | `95.0` |
| 19 | `osrm_distance` | `float64` | Numerical (Kilometers) | `129.3519` |
| 20 | `factor` | `float64` | Ratio (`actual/osrm`) | `1.9263` |
| 21 | `segment_actual_time` | `float64` | Numerical (Minutes) | `41.0` |
| 22 | `segment_osrm_time` | `float64` | Numerical (Minutes) | `15.0` |
| 23 | `segment_osrm_distance` | `float64` | Numerical (Kilometers) | `20.9580` |
| 24 | `segment_factor` | `float64` | Ratio (`seg_act/seg_osrm`) | `2.7333` |

---

## 3. DATA QUALITY & INTEGRITY AUDIT

### 3.1 Missing Value Analysis

| Column Name | Missing Count | Missing Percentage (%) | Impact Assessment |
| :--- | :--- | :--- | :--- |
| `source_name` | 293 | 0.2023% | Low; `source_center` ID is 100% complete. |
| `destination_name` | 261 | 0.1802% | Low; `destination_center` ID is 100% complete. |
| *All other 22 columns* | **0** | **0.0000%** | **100% complete (No missing values).** |

### 3.2 Duplicate Record Analysis
* **Exact Duplicate Rows across all 24 columns:** `0` (0.00%)
* The raw dataset contains no fully identical rows.

### 3.3 Anomalies, Negative Values & Outliers

| Quality Metric | Count | Observations & Root Cause |
| :--- | :--- | :--- |
| **Negative Distance Values** | `0` | Clean; all distances $\ge 0.0\text{ km}$. |
| **Negative Time Values (`actual_time`, `osrm_time`)** | `0` | Clean; all cumulative times $\ge 6.0\text{ mins}$. |
| **Negative Values in `segment_actual_time`** | `21` | Telemetry glitch where package scan sequence was updated retroactively. |
| **Negative Values in `segment_factor`** | `2,365` | Caused by the 21 negative times and zero `segment_osrm_time` artifacts. |
| **Invalid/Corrupted Datetime Strings** | `0` | All 144,867 timestamps in `trip_creation_time`, `od_start_time`, `od_end_time` parse validly. |
| **Extreme Outliers** | `132` trips | Maximum `actual_time` reaches $4,532\text{ minutes}$ (~75.5 hours) for long-haul national transits ($>1,900\text{ km}$). |

---

## 4. CARDINALITY & OPERATIONAL COVERAGE

* **Unique Trips (`trip_uuid`):** `14,817`
* **Unique Route Schedules (`route_schedule_uuid`):** `1,504`
* **Unique Source Centers:** `1,508`
* **Unique Destination Centers:** `1,481`
* **Unique Source $\rightarrow$ Destination Pairs (Hub-to-Hub):** `2,783`
* **Route Types:**
  - `FTL` (Full Truck Load): `99,660` records ($68.8\%$)
  - `Carting` (Short-haul / Regional Shuttle): `45,207` records ($31.2\%$)

### Time Coverage:
* **Earliest Trip Creation Timestamp:** `2018-09-12 00:00:16.535741`
* **Latest Trip Creation Timestamp:** `2018-10-03 23:59:42.701692`
* **Latest Trip Completion (`od_end_time`):** `2018-10-08 03:00:24.353479`
* **Total Time Span Covered:** **26.1 Days** of peak pre-Diwali/festive high-volume freight operations across India.

---

## 5. NUMERICAL DISTRIBUTIONS & DESCRIPTIVE STATISTICS

| Metric Column | Min | 25th %ile | Median (50%) | Mean | 75th %ile | 99th %ile | Max | Std Dev |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`actual_time` (min)** | 9.0 | 51.0 | 132.0 | 416.9 | 513.0 | 2,599.0 | 4,532.0 | 598.1 |
| **`osrm_time` (min)** | 6.0 | 27.0 | 64.0 | 213.9 | 257.0 | 1,355.0 | 1,686.0 | 308.0 |
| **`actual_distance` (km)**| 9.0 | 23.4 | 66.1 | 234.1 | 286.7 | 1,482.0 | 1,927.4 | 345.0 |
| **`osrm_distance` (km)**| 9.0 | 29.9 | 78.5 | 284.8 | 343.2 | 1,849.9 | 2,326.2 | 421.1 |
| **`factor` ($T_{act}/T_{osrm}$)**| 0.14 | 1.60 | **1.86** | 2.12 | 2.21 | 6.96 | 77.39 | 1.72 |
| **`start_scan_to_end_scan` (min)**| 20.0 | 161.0 | 449.0 | 961.3 | 1,634.0 | 3,554.0 | 7,898.0 | 1,037.0 |
| **`segment_actual_time` (min)**| -244.0 | 20.0 | 29.0 | 36.2 | 40.0 | 169.0 | 3,051.0 | 53.6 |
| **`segment_osrm_time` (min)**| 0.0 | 11.0 | 17.0 | 18.5 | 22.0 | 72.0 | 1,611.0 | 14.8 |
| **`segment_osrm_distance` (km)**| 0.0 | 12.1 | 23.5 | 22.8 | 27.8 | 77.4 | 2,191.4 | 17.9 |

> **Crucial Finding on Indian Ground Logistics:**
> The median `factor` is **1.86**, meaning actual observed transit times across Indian highways are on average **$86\%$ longer** than OSRM free-flow routing engine estimates. This empirically proves the necessity of an ML correction layer for Smart Freight.

---

## 6. INVESTIGATION OF COLUMN MEANINGS & HIERARCHY

The dataset contains a 3-level operational hierarchy:
```
1. TRIP LEVEL (trip_uuid: 14,817 full journeys)
   └── 2. OD LEG LEVEL (source_center -> destination_center: 26,368 hub-to-hub corridors)
       └── 3. CHECKPOINT CUTOFF LEVEL (is_cutoff = True/False: 144,867 row scans)
```

1. **`actual_time` (Cumulative Transit Duration)**:
   - Measures actual cumulative in-motion road transit time from segment origin up to the recorded scan point.
   - At the final segment cutoff (`is_cutoff = False`), it represents the total actual driving duration for that hub-to-hub corridor.
2. **`actual_distance_to_destination` (Cumulative Distance Traveled)**:
   - Despite its name ("to_destination"), mathematical verification proves this is **cumulative distance covered from source**, growing monotonically as the truck approaches its destination.
3. **`osrm_distance` & `osrm_time` (Routing Engine Free-Flow Baselines)**:
   - Theoretical road distance and driving duration computed by Open Source Routing Machine under unconstrained conditions.
4. **`segment_actual_time`, `segment_osrm_time`, `segment_osrm_distance`**:
   - Incremental, non-cumulative measurements for individual sub-legs between intermediate checkpoint scans.
5. **`start_scan_to_end_scan` (Total Turnaround / Lead Time)**:
   - Wall-clock elapsed time between origin dispatch scan (`od_start_time`) and final destination delivery scan (`od_end_time`), including intermediate toll queues, driver rest, and hub loading/unloading dwell time.

---

## 7. TARGET VARIABLE SELECTION

### Recommended Primary Target:
* **Target Variable:** `actual_time` (Aggregated to OD Leg / Trip level)
* **Target Unit:** Minutes (or converted to Hours for display: $\text{hours} = \text{actual\_time} / 60$)
* **Alternative Secondary Target:** `start_scan_to_end_scan` (Total Lead Time including hub handling)

### Why `actual_time` is the Optimal Target:
1. It isolates **true road transit dynamics** (congestion, road quality, terrain, highway bottlenecks) from warehouse-specific loading dock delays.
2. It directly aligns with Smart Freight's OSRM routing layer (`routing_service.py`), allowing the model to learn the real-world non-linear multiplier over theoretical driving time.
3. It directly feeds the cold-chain shelf-life feasibility check ($\text{predicted\_hours} \le \text{refrigerated\_limit}$) and SLA delivery-window compliance checks.

---

## 8. DATA LEAKAGE AUDIT & FEATURE CLASSIFICATION

Strict classification of every column in `delhivery_data.csv` to prevent data leakage during offline training:

* **Category A:** Available **before** consolidation decision (Safe for training & prediction)
* **Category B:** Available **during** the trip (Unsafe for pre-trip dispatch planning)
* **Category C:** Available **after** the trip completes (Definite Data Leakage — NEVER use as input)
* **Category D:** Administrative / Identifier field (Not suitable as generalizable predictive feature)

| Column Name | Category | Safe for Input? | Reason / Classification Justification |
| :--- | :---: | :---: | :--- |
| `trip_creation_time` | **A** | **YES** | Pre-trip timestamp; yields `hour_of_day`, `day_of_week`, `is_weekend`. |
| `route_type` | **A** | **YES** | Pre-assigned dispatch type (`FTL` vs. `Carting`). |
| `source_center` / `source_name` | **A** | **YES** | Origin location; allows extraction of origin state and hub frequency. |
| `destination_center` / `dest_name`| **A** | **YES** | Destination location; allows extraction of destination state. |
| `osrm_distance` | **A** | **YES** | Pre-trip route distance computed by OSRM API. |
| `osrm_time` | **A** | **YES** | Pre-trip baseline free-flow driving duration computed by OSRM API. |
| `segment_osrm_distance` (sum) | **A** | **YES** | Sum of planned route segment distances. |
| `segment_osrm_time` (sum) | **A** | **YES** | Sum of planned route segment OSRM durations. |
| `od_start_time` | **B** | **NO** | Departure scan timestamp; during dispatch execution only. |
| `is_cutoff` | **B** | **NO** | Checkpoint logging state during active journey. |
| `cutoff_factor` | **B** | **NO** | In-transit progress indicator. |
| `cutoff_timestamp` | **B** | **NO** | In-transit GPS/scan event timestamp. |
| `actual_distance_to_destination`| **C** | **NO (LEAKAGE)** | Actual odometer GPS distance recorded during/after driving. |
| `actual_time` | **C** | **NO (TARGET)** | True travel duration; this is the prediction target. |
| `segment_actual_time` | **C** | **NO (LEAKAGE)** | Ground-truth segment time measured after traversal. |
| `factor` | **C** | **NO (LEAKAGE)** | Direct mathematical quotient of `actual_time / osrm_time`. |
| `segment_factor` | **C** | **NO (LEAKAGE)** | Direct mathematical quotient of `segment_actual / segment_osrm`. |
| `od_end_time` | **C** | **NO (LEAKAGE)** | Arrival timestamp recorded after journey completion. |
| `start_scan_to_end_scan` | **C** | **NO (LEAKAGE)** | Complete wall-clock turnaround recorded post-delivery. |
| `trip_uuid` | **D** | **NO** | High-cardinality unique identifier (used only for Group K-Fold splitting). |
| `route_schedule_uuid` | **D** | **NO** | Operational schedule ID (overfits to specific internal routes). |
| `data` | **D** | **NO** | Kaggle split tag; internal administrative marker. |

---

## 9. SMART FREIGHT FEATURE MAPPING

Comparison between features available in the Delhivery dataset and features currently generated by the Smart Freight application runtime:

| ML Feature Candidate | In Delhivery Dataset? | In Smart Freight Project? | Source in Smart Freight | External Live API Needed? |
| :--- | :---: | :---: | :--- | :---: |
| **Origin Location** | `source_name` | `pickup_location` | `database.py` (Shipment input) | No (Internal) |
| **Destination Location** | `destination_name` | `destination` | `database.py` (Shipment input) | No (Internal) |
| **OSRM Route Distance** | `osrm_distance` | `distance_km` | `routing_service.py` $\rightarrow$ `get_road_route()` | No (OSRM active) |
| **OSRM Free-Flow Time** | `osrm_time` | `duration_minutes` | `routing_service.py` $\rightarrow$ `get_road_route()` | No (OSRM active) |
| **Route Road Class / Summary**| Extracted from Name | `route_summary` | `routing_service.py` (`"NH16"`) | No (OSRM active) |
| **Scheduled Start Hour** | From `trip_creation_time` | `pickup_time` | `database.py` (`"08:00"`) | No (Internal) |
| **Day of Week / Weekend** | From `trip_creation_time` | `pickup_date` | `database.py` (`"2026-08-16"`) | No (Internal) |
| **Total Payload Weight** | Not recorded | `weight_kg` / `total_load_kg`| `main.py` (`_build_trips`) | No (Internal) |
| **Vehicle Type & Cooling** | `route_type` (Proxy) | `selected_vehicle`, `is_refrigerated` | `database.py` (Fleet registry) | No (Internal) |
| **Number of Route Stops** | Derived (`num_legs`) | `len(route)` | `main.py` (`_build_route`) | No (Internal) |
| **State / Interstate Crossing**| Regex from hub name | Geocoded state | Derived via Nominatim | No (Internal) |

---

## 10. CURRENT DETERMINISTIC BASELINE IN CODEBASE

Inspection of `main.py`, `backend/optimizer.py`, and `routing_service.py` reveals the current deterministic travel-time logic:

1. **Primary Consolidation Engine (`main.py` $\rightarrow$ `_build_route()`)**:
   $$\text{Duration (hours)} = \text{round}\left(\frac{\text{Distance (km)}}{\text{AVG\_SPEED\_KMH}}, 1\right) \quad \text{where } \text{AVG\_SPEED\_KMH} = 50.0\text{ km/h}$$
2. **Prototype Optimizer (`backend/optimizer.py` $\rightarrow$ `consolidate_shipments()`)**:
   $$\text{Journey Hours} = \frac{\text{Distance (km)}}{40.0\text{ km/h}}$$
3. **Street Routing Layer (`routing_service.py` $\rightarrow$ `get_road_route()`)**:
   $$\text{Duration (minutes)} = \frac{\text{OSRM duration\_seconds}}{60.0}$$

### Current Baseline Inaccuracy:
* For a $440\text{ km}$ trip from Bhubaneswar to Kolkata:
  - `main.py` assumes: $440 / 50 = \mathbf{8.8\text{ hours}}$ (flat constant speed).
  - `routing_service.py` OSRM assumes: $\mathbf{5.6\text{ hours}}$ ($336\text{ minutes}$, implying $78.5\text{ km/h}$ uninterrupted driving).
  - **Empirical Reality (Delhivery Data)**: With median delay multiplier $1.86\times$, actual truck transit is $\approx \mathbf{10.4\text{ hours}}$, leading to false-positive delivery feasibility and premature cold-chain spoilage under existing heuristics.

---

## 11. RECOMMENDED TRAINING FEATURE SET FOR MODEL 1

Aggregation of training records must occur at the **OD Leg / Trip Level** (combining sub-segment rows per trip) using only leak-free features:

```python
MODEL_1_FEATURES = [
    # Core Geometric & Routing Features (Available via routing_service.py)
    "osrm_distance",             # Total driving road distance in km
    "osrm_time",                 # OSRM theoretical driving duration in minutes
    "osrm_speed_kmh",            # osrm_distance / (osrm_time / 60.0)
    
    # Corridor & Network Topology
    "num_intermediate_stops",    # Number of pickup/dropoff checkpoints
    "is_interstate",             # 1 if source_state != dest_state else 0
    "route_type_encoded",        # FTL (1) vs Carting (0)
    
    # Temporal & Congestion Drivers
    "departure_hour",            # 0 to 23 (captures night vs rush-hour traffic)
    "departure_dayofweek",       # 0 (Monday) to 6 (Sunday)
    "is_weekend",                # 1 if Saturday/Sunday else 0
    "is_night_dispatch",         # 1 if departure between 21:00 and 05:00
    
    # Geographic Categoricals (Target / Frequency Encoded)
    "source_state",              # Origin Indian State
    "dest_state",                # Destination Indian State
]
```

---

## 12. RISKS, LIMITATIONS & MITIGATION

1. **Temporal Horizon of Dataset**:
   - The Delhivery dataset spans September–October 2018 (pre-monsoon/festive).
   - *Mitigation:* The model will primarily learn structural route difficulty and OSRM correction factors rather than live weather patterns.
2. **Missing Exact Freight Cargo Weights in Delhivery**:
   - Delhivery packet logs omit exact gross tonnage of heavy trucks.
   - *Mitigation:* `route_type` (FTL vs. Carting) acts as an effective proxy for long-haul heavy carrier versus regional light vehicle.
3. **Data Logging Outliers in Raw Segments**:
   - 21 negative segment times and multi-day terminal dwell outliers.
   - *Mitigation:* Cleanse cutoff anomalies by aggregating to OD leg level (`is_cutoff = False` or `groupby(['trip_uuid', 'source_center', 'destination_center'])`) and filtering values outside $1\text{st}\text{--}99\text{th}$ percentiles.

---

## 13. FINAL GO / NO-GO ASSESSMENT

| Evaluation Dimension | Assessment | Status |
| :--- | :--- | :---: |
| **Dataset Authenticity** | Real, empirical Indian logistics operational logs from 1,500+ Indian transport hubs. | **PASSED** |
| **Feature Overlap** | High compatibility with Smart Freight’s live OSRM and geocoding inputs. | **PASSED** |
| **Leakage Controllability** | Clean separation between pre-trip OSRM inputs and post-trip actual times. | **PASSED** |
| **Value Addition over Heuristics**| Solves the severe $1.86\times$ discrepancy between OSRM baselines and actual Indian road transit. | **PASSED** |

### Decision: **GO** (Approved for Step 2 Dataset Auditing & Feature Engineering)

---
*Report generated strictly under Read-Only verification rules. No production codebase files or database schemas were altered.*
