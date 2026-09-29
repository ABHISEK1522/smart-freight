# 🚛 Smart Freight — AI-Powered Logistics & Cold-Chain Dispatch Platform

> **SOA Ideathon 2026** · Full-stack freight consolidation, ML transit intelligence, real-time street routing, cargo damage detection, and multi-role operations platform.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [ML Pipeline](#ml-pipeline)
- [Frontend Pages](#frontend-pages)
- [Testing](#testing)
- [License](#license)

---

## Overview

Smart Freight is an end-to-end logistics intelligence platform that optimizes cold-chain freight corridors across Indian highways. It combines **machine learning transit-time prediction**, **greedy shipment consolidation**, **real-time OpenStreetMap routing**, **cargo damage incident management**, and **role-based multi-user authentication** into a unified dispatch control tower.

The platform serves two primary personas:
- **Consumers / Dispatchers** — Create shipments, optimize loads, track deliveries, analyze costs and risks.
- **Drivers** — Accept assigned shipments, advance delivery lifecycle stages, report cargo damage incidents with photo evidence, and interact with telemetry anomaly alerts.

---

## Key Features

### 🤖 Dual-Model ML Architecture
- **Model 1 — Transit-Time Prediction**: Pre-trained Random Forest Regressor on **25,660 real Delhivery logistics records** across 17 Indian states. Achieves **R² = 0.9774**, MAE of **26.11 minutes**, outperforming OSRM free-flow, heuristic, and median baselines.
- **Model 2 — Cargo Damage-Risk Pipeline**: Closed-loop operational learning architecture. Collects verified driver incident reports, extracts features (product fragility, route distance, transit duration, vehicle type), and produces explainable damage-risk scores. Automated retraining triggers after 50 verified samples.

### 📦 Shipment Consolidation Engine
- Greedy multi-stop corridor optimization across the **Puri → Bhubaneswar → Cuttack → Jamshedpur → Kolkata → Howrah** corridor.
- Destination cluster compatibility, temperature tolerance matching, deadline-feasibility validation, and capacity-aware vehicle assignment.
- AI-powered SLA analysis: per-stop ETA prediction, buffer calculation, and FEASIBLE / NOT FEASIBLE decision with natural language reasoning.
- Full cost breakdown: separate vs. consolidated costs, savings percentage, and capacity utilization metrics.

### 🗺️ Real Street Routing (OpenStreetMap + OSRM)
- **Nominatim** geocoding for location text → coordinates resolution.
- **OSRM** (Open Source Routing Machine) for actual road-network driving routes with real geometry, distance, and duration.
- Multi-waypoint routing with intermediate stops.
- GeoJSON polyline route geometry rendered on interactive Leaflet maps.
- Configurable fallback endpoints and timeout settings via environment variables.

### 🔐 Multi-User Authentication & Role-Based Access
- **PBKDF2-HMAC-SHA256** password hashing with cryptographic salt (100,000 iterations).
- **HS256 JWT** signed access tokens with 7-day expiration.
- Role-based access control: `consumer` and `driver` roles.
- User-isolated data: each user sees only their own shipments, vehicles, and incidents.
- Demo user fallback for seamless development mode.

### 🚨 Cargo Incident & Damage Reporting System
- Drivers report cargo damage, temperature excursions, spillage, seal breakage, and impact events.
- **Photo evidence upload** with server-side storage (JPG, PNG, WEBP support).
- Full incident lifecycle management: `REPORTED → UNDER INSPECTION → RESOLVED / DISMISSED / DAMAGE VERIFIED`.
- Verified incidents feed the Model 2 damage-risk training pipeline.
- Customer-facing incident visibility for shipment owners.

### 🌡️ Human-in-the-Loop Telemetry Anomaly Detection
- Evaluates simulated sensor telemetry (temperature, G-force, speed).
- Anomaly detection triggers driver alerts for physical cargo inspection.
- Telemetry alerts do **not** auto-declare cargo damaged — driver verification is always required.
- Dismissed false alerts are excluded from ML training data to prevent label noise.

### 📊 Risk Assessment Engine
- **Delay risk**: Distance, journey duration, deadline proximity, and route reliability scoring.
- **Spoilage risk**: Product perishability sensitivity index, temperature requirements, refrigeration status, and transit duration.
- Weighted composite risk with **LOW / MEDIUM / HIGH** tier classification.
- Natural language risk explanations for each contributing factor.
- Per-route reliability scoring for known Indian highway corridors.

### 🚗 Fleet Management
- Full CRUD for fleet vehicles with capacity, cost, type, and refrigeration capability.
- Vehicle availability status management (Available / In Use / Maintenance).
- Cold-chain capability tracking for perishable freight matching.
- User-isolated fleet registry in SQLite.

### 📋 Shipment Tracking
- 4-stage consumer tracking lifecycle: `Planned → Dispatched → In Transit → Delivered`.
- 6-stage driver delivery lifecycle: `Assigned → Accepted → Picked Up → In Transit → Arrived → Delivered`.
- Stage advancement with timestamps.
- Cross-role tracking synchronization.

### 📄 PDF Report Generation
- Automated professional PDF briefs via ReportLab.
- Numbered pages with headers and footers.
- Comprehensive project documentation export.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                           │
│   React 19 · Tailwind CSS 4 · Leaflet Maps · Recharts · Three.js      │
│   GSAP Animations · Lucide Icons · Role-Based Routing                  │
├─────────────────────────────────────────────────────────────────────────┤
│                              REST API                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                        BACKEND (FastAPI 0.115)                          │
│   Pydantic v2 Models · JWT Auth · CORS Middleware · Static Uploads      │
├──────────────┬──────────────┬──────────────┬────────────────────────────┤
│  Auth Layer  │  Routing     │  ML Service  │  Damage ML Service         │
│  PBKDF2 +    │  Nominatim + │  Random      │  Operational Learning      │
│  HS256 JWT   │  OSRM        │  Forest      │  Pipeline + Explainable    │
│              │              │  Regressor   │  Risk Scoring              │
├──────────────┴──────────────┴──────────────┴────────────────────────────┤
│                        DATABASE (SQLite)                                 │
│   Users · Shipments · Vehicles · Cargo Incidents · Verified ML Data     │
├─────────────────────────────────────────────────────────────────────────┤
│                        ML PIPELINE                                       │
│   Training Data: Delhivery Dataset (55 MB, 25,660 records)              │
│   Preprocessing: ColumnTransformer (Numeric Scaling + OHE)              │
│   Models: Random Forest · XGBoost · HistGBT · Ridge Regression          │
│   Artifacts: travel_time_model.joblib (27 MB) + preprocessor.joblib     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Python 3.10+** | Runtime |
| **FastAPI 0.115** | REST API framework |
| **Pydantic v2** | Request/response validation |
| **SQLite** | Persistent storage |
| **Uvicorn** | ASGI server |
| **scikit-learn / joblib** | ML model inference |
| **pandas / numpy** | Feature engineering |
| **ReportLab** | PDF generation |

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** | React framework with App Router |
| **React 19** | UI library |
| **Tailwind CSS 4** | Styling |
| **Leaflet** | Interactive map rendering |
| **Recharts** | Data visualization charts |
| **Three.js** | 3D scene rendering |
| **GSAP** | Scroll and micro-animations |
| **Lucide React** | Icon system |

### External Services
| Service | Purpose |
|---|---|
| **Nominatim (OSM)** | Geocoding (city → lat/lon) |
| **OSRM** | Road-network routing & geometry |

---

## Project Structure

```
Smart Freight Prototype/
├── main.py                      # FastAPI application (73 KB, 1901 lines)
│                                  Auth, Shipments, Fleet, Optimize,
│                                  Tracking, Incidents, Telemetry, Routes
├── database.py                  # SQLite ORM layer (42 KB)
│                                  Users, Shipments, Vehicles, Incidents
├── auth.py                      # PBKDF2 hashing + HS256 JWT tokens
├── routing_service.py           # Nominatim geocoding + OSRM routing
├── generate_pdf.py              # ReportLab PDF brief generator
├── requirements.txt             # Python dependencies
├── smart_freight.db             # SQLite database file
│
├── backend/
│   ├── ml_service.py            # Model 1: Transit-time inference wrapper
│   ├── damage_ml_service.py     # Model 2: Damage-risk scoring & pipeline
│   ├── mock_data.py             # Demo/seed data
│   ├── models.py                # Shared Pydantic models
│   ├── optimizer.py             # Consolidation optimizer
│   └── risk_engine.py           # Risk calculation engine
│
├── ml/
│   ├── data/
│   │   └── delhivery_data.csv   # Training dataset (55 MB, 25,660 records)
│   ├── models/
│   │   ├── travel_time_model.joblib   # Trained RF model (27 MB)
│   │   ├── preprocessor.joblib        # ColumnTransformer pipeline
│   │   └── model_metadata.json        # Metrics, features, benchmarks
│   ├── reports/
│   │   ├── MODEL_1_EVALUATION.md      # Model performance evaluation
│   │   ├── ML_CONSOLIDATION_INTEGRATION.md
│   │   ├── INTEGRATION_READINESS.md
│   │   └── DELHIVERY_DATASET_VERIFICATION.md
│   └── src/
│       ├── train.py             # Model training script
│       └── features.py          # Feature engineering pipeline
│
├── frontend/
│   ├── package.json             # Node.js dependencies
│   └── src/
│       ├── app/
│       │   ├── layout.js        # Root layout with AuthProvider
│       │   ├── globals.css      # Global styles
│       │   ├── page.js          # Main dispatch dashboard (78 KB)
│       │   ├── login/           # Authentication page
│       │   ├── driver/          # Driver workspace dashboard
│       │   ├── shipments/       # Shipment management
│       │   ├── fleet/           # Fleet management
│       │   ├── vehicles/        # Vehicle registry
│       │   ├── routes/          # Route planning & maps
│       │   ├── costs/           # Cost analysis & optimization
│       │   ├── risks/           # Risk assessment dashboard
│       │   ├── analytics/       # Analytics & reporting
│       │   └── design-lab/      # Design system showcase
│       ├── components/
│       │   ├── Sidebar.js                       # Navigation sidebar
│       │   ├── StreetRouteMap.js                 # Leaflet route map (34 KB)
│       │   ├── DamageRiskSection.js              # Damage risk panel (27 KB)
│       │   ├── IsometricLogisticsScene.js        # Isometric 3D illustration
│       │   ├── ConsumerVectorStory.js            # Consumer onboarding story
│       │   ├── DriverVectorStory.js              # Driver onboarding story
│       │   ├── VehicleIllustration.js            # SVG vehicle visuals
│       │   ├── Interactive3DWorldHomepage.js     # Three.js hero scene
│       │   ├── CentralDamageIntelligencePanel.js # Damage intelligence center
│       │   ├── ConsolidationInteractiveVisualizer.js
│       │   ├── DriverInteractiveScrubber.js      # Driver delivery scrubber
│       │   └── OrganicFluidAtmosphere.js         # Ambient visual effects
│       └── context/
│           └── AuthContext.js    # JWT auth state management
│
├── uploads/incidents/           # Uploaded evidence photos
├── test_*.py                    # Test suites (12 files)
└── LICENSE                      # MIT License
```

---

## Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** & npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/ABHISEK1522/smart-freight.git
cd smart-freight
```

### 2. Backend Setup

```bash
# Create and activate virtual environment
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# macOS / Linux
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# For ML inference (optional but recommended)
pip install scikit-learn joblib pandas numpy

# For PDF generation (optional)
pip install reportlab

# Start the API server
uvicorn main:app --reload
```

The backend starts at **http://127.0.0.1:8000**.

### 3. Frontend Setup

```bash
cd frontend

# Install Node.js dependencies
npm install

# Start the development server
npm run dev
```

The frontend starts at **http://localhost:3000**.

### 4. Verify Installation

```bash
curl http://127.0.0.1:8000/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "Smart Freight Multi-User API",
  "database": "SQLite (smart_freight.db)"
}
```

### Environment Variables (Optional)

| Variable | Default | Description |
|---|---|---|
| `NOMINATIM_BASE_URL` | `https://nominatim.openstreetmap.org` | Nominatim geocoding endpoint |
| `OSRM_BASE_URL` | `http://router.project-osrm.org/route/v1/driving` | OSRM routing endpoint |
| `OSRM_FALLBACK_URL` | `https://routing.openstreetmap.de/routed-car/route/v1/driving` | Fallback OSRM endpoint |
| `NOMINATIM_USER_AGENT` | `SmartFreight-Logistics/1.0` | Nominatim request user agent |
| `ROUTING_TIMEOUT_SECONDS` | `10` | HTTP request timeout |
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000` | Backend API URL for frontend |

---

## API Reference

### Authentication & Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register new user (Consumer or Driver) |
| `POST` | `/auth/login` | Authenticate and receive JWT token |
| `GET` | `/auth/me` | Get current user profile |

### Driver Workspace

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/driver/me` | Get driver profile & metadata |
| `PATCH` | `/driver/me` | Update driver status / vehicle assignment |
| `GET` | `/driver/shipments` | List assigned shipments |
| `PATCH` | `/driver/shipments/{id}/status` | Advance shipment delivery stage |

### Shipments (User-Isolated CRUD)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/shipments` | Create new shipment |
| `GET` | `/shipments` | List all user shipments |
| `GET` | `/shipments/{id}` | Get shipment by ID |
| `PUT/PATCH` | `/shipments/{id}` | Update shipment |
| `DELETE` | `/shipments/{id}` | Delete shipment |

### Fleet Vehicles (User-Isolated CRUD)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/vehicles` | Add fleet vehicle |
| `GET` | `/vehicles` | List all user vehicles |
| `GET` | `/vehicles/{id}` | Get vehicle by ID |
| `PUT/PATCH` | `/vehicles/{id}` | Update vehicle |
| `DELETE` | `/vehicles/{id}` | Delete vehicle |

### Optimization & Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/optimize` | Run greedy consolidation + ML transit prediction |
| `GET` | `/shipments/{id}/tracking` | Get tracking stages |
| `POST` | `/shipments/{id}/tracking/status` | Advance tracking stage |

### Cargo Incidents & Damage Reporting

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/incidents/upload-photo` | Upload evidence photo (Driver only) |
| `POST` | `/incidents` | Report cargo incident (Driver only) |
| `GET` | `/incidents/{shipment_id}` | List shipment incidents |
| `GET` | `/incidents/{shipment_id}/latest` | Get latest incident |
| `GET` | `/customer/incidents` | List customer's incidents |
| `PATCH` | `/incidents/{id}/status` | Update incident lifecycle status |

### Damage Risk & Telemetry

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/shipments/{id}/damage-risk` | Full damage-risk profile & Model 2 status |
| `GET` | `/damage-risk/stats` | Historical damage statistics |
| `GET` | `/damage-risk/pipeline-status` | Model 2 data collection progress |
| `POST` | `/telemetry/evaluate` | Evaluate telemetry anomalies |
| `POST` | `/telemetry/dismiss` | Dismiss false telemetry alert |

### Street Routing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/route` | Calculate road route (query params) |
| `POST` | `/route` | Calculate road route (JSON body) |
| `GET` | `/routes/calculate` | Alias for `/route` |
| `POST` | `/routes/calculate` | Alias for `/route` |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check with DB status |
| `GET` | `/api/health` | Alias for `/health` |
| `GET` | `/docs` | Swagger UI (auto-generated) |
| `GET` | `/redoc` | ReDoc documentation (auto-generated) |

---

## ML Pipeline

### Model 1 — Transit-Time Prediction

| Attribute | Value |
|---|---|
| **Algorithm** | Random Forest Regressor |
| **Training Data** | Delhivery logistics dataset (25,660 records, 55 MB) |
| **Data Split** | 17,926 train / 3,928 val / 3,806 test |
| **Target** | `actual_time` (minutes) |
| **R² Score** | 0.9774 |
| **MAE** | 26.11 minutes (0.44 hours) |
| **RMSE** | 49.17 minutes |
| **MAPE** | 22.39% |
| **Median AE** | 14.68 minutes |

#### Input Features (12 total)

| Feature | Type | Description |
|---|---|---|
| `osrm_distance` | Numeric | Route distance in km |
| `osrm_time` | Numeric | OSRM free-flow time in minutes |
| `osrm_speed_kmh` | Numeric | Average OSRM speed |
| `num_intermediate_stops` | Numeric | Count of stops along route |
| `is_ftl` | Binary | Full truckload flag |
| `departure_hour` | Numeric | Hour of departure (0-23) |
| `departure_dayofweek` | Numeric | Day of week (0=Mon, 6=Sun) |
| `is_weekend` | Binary | Weekend dispatch flag |
| `is_night_dispatch` | Binary | Night dispatch flag (21:00-05:00) |
| `is_interstate` | Binary | Cross-state route flag |
| `source_state` | Categorical | Origin state (17 Indian states) |
| `destination_state` | Categorical | Destination state |

#### Benchmark Comparison

| Model | MAE (min) | R² | MAPE |
|---|---|---|---|
| Baseline (50 km/h Heuristic) | 51.64 | 0.9004 | 31.6% |
| Baseline (OSRM Free-Flow) | 94.16 | 0.6280 | 49.2% |
| Baseline (Train Median) | 128.95 | -0.0908 | 67.1% |
| Ridge Linear Regression | 36.04 | 0.9605 | 33.8% |
| HistGradientBoosting | 30.73 | 0.9727 | 28.3% |
| XGBoost Regressor | 28.06 | 0.9768 | 25.1% |
| **Random Forest (Selected)** | **26.11** | **0.9774** | **22.4%** |

### Model 2 — Cargo Damage-Risk Pipeline

A closed-loop operational learning system:

1. **Driver reports incident** → stored in SQLite with metadata
2. **Driver verifies / resolves** → incident gets `is_verified_damage` flag
3. **Verified incidents** become labeled training examples
4. **Feature extraction**: product fragility, cargo weight, route distance, ML-predicted transit hours, stop count, vehicle type
5. **Automated retraining** triggers after 50+ verified samples
6. Until threshold: explainable rule-based scoring with **LOW / MEDIUM / HIGH / CRITICAL** tier classification

---

## Frontend Pages

| Route | Page | Description |
|---|---|---|
| `/` | **Dispatch Dashboard** | Main control tower — create shipments, run optimization, view AI results, interactive route maps, cost/risk analysis |
| `/login` | **Authentication** | Login & registration with role selection (Consumer / Driver) |
| `/driver` | **Driver Workspace** | Assigned shipments, delivery lifecycle advancement, cargo incident reporting with photo upload, route navigation |
| `/shipments` | **Shipment Management** | Full CRUD shipment management with filtering |
| `/fleet` | **Fleet Management** | Vehicle fleet overview and management |
| `/vehicles` | **Vehicle Registry** | Detailed vehicle specifications and CRUD |
| `/routes` | **Route Planning** | Interactive Leaflet maps with OSRM road routing |
| `/costs` | **Cost Analysis** | Consolidation savings, per-trip breakdown, optimization metrics |
| `/risks` | **Risk Dashboard** | Delay risk, spoilage risk, damage risk visualization |
| `/analytics` | **Analytics** | Data charts and operational insights (Recharts) |
| `/design-lab` | **Design Lab** | Component showcase and design system reference |

### Notable Frontend Components

- **StreetRouteMap** — Full Leaflet.js integration rendering real OSRM road geometries with waypoint markers
- **DamageRiskSection** — Comprehensive damage intelligence panel with incident lifecycle and Model 2 pipeline status
- **Interactive3DWorldHomepage** — Three.js powered 3D globe/scene for the landing hero
- **IsometricLogisticsScene** — SVG isometric warehouse and truck illustration
- **ConsumerVectorStory / DriverVectorStory** — Animated onboarding vector story experiences
- **ConsolidationInteractiveVisualizer** — Visual consolidation result explorer
- **CentralDamageIntelligencePanel** — Fleet-wide damage intelligence command center

---

## Testing

The project includes **12 test files** covering different subsystems:

```bash
# Run all tests
python -m pytest

# Individual test suites
python test_full_system.py          # Full system integration test
python test_driver_auth.py          # Driver authentication & RBAC
python test_multiuser_auth.py       # Multi-user isolation tests
python test_incident_system.py      # Incident lifecycle & damage reporting
python test_fleet_api.py            # Fleet vehicle CRUD
python test_ml_service.py           # ML inference service
python test_street_routing.py       # Nominatim + OSRM routing
python test_sqlite_backend.py       # Database layer tests
python test_live_http.py            # Live HTTP endpoint tests
python test_step5_phase1.py         # Phase 1 integration
python test_step5_phase2.py         # Phase 2 integration
python test_rec_engine.py           # Recommendation engine
```

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 ABHISEK1522
