import json
import os
import re
import uuid
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

import auth
import database
import routing_service
from routing_service import (
    LocationNotFoundError,
    NoRouteFoundError,
    RateLimitError,
    RoutingError,
    RoutingServiceError,
)

try:
    from backend.ml_service import predict_travel_time
except ImportError:
    try:
        from ml_service import predict_travel_time
    except ImportError:
        predict_travel_time = None

try:
    from backend.damage_ml_service import damage_ml_service
except ImportError:
    try:
        from damage_ml_service import damage_ml_service
    except ImportError:
        damage_ml_service = None


# ---------------------------------------------------------------------------
# App & Database Initialization
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Smart Freight API",
    description="Multi-user dispatch, fleet management, and corridor optimization platform",
    version="0.4.0",
)

# Static Uploads Setup for Evidence Photos
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "incidents")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")), name="uploads")

# Initialize SQLite database and tables on startup
database.init_db()

# Allow requests from Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Pydantic models - Auth & Users
# ---------------------------------------------------------------------------


class UserRegisterRequest(BaseModel):
    """Payload for user sign up."""

    name: str = Field(..., min_length=2, example="Alex Morgan")
    email: str = Field(..., min_length=3, example="alex@freightlink.com")
    password: str = Field(..., min_length=6, example="secret123")
    role: Optional[str] = Field(default="consumer", example="consumer")
    driver_status: Optional[str] = Field(default="Available", example="Available")
    assigned_vehicle: Optional[str] = Field(default="Refrigerated Van (Medium)", example="Refrigerated Van (Medium)")
    license_number: Optional[str] = Field(default="OD-02-2024-DRV-8821", example="OD-02-2024-DRV-8821")
    phone: Optional[str] = Field(default="+91 98765 43210", example="+91 98765 43210")


class UserLoginRequest(BaseModel):
    """Payload for user login."""

    email: str = Field(..., min_length=3, example="demo@smartfreight.io")
    password: str = Field(..., example="password123")


class UserResponse(BaseModel):
    """Safe user profile response."""

    id: str = Field(..., example="USR-101")
    name: str = Field(..., example="Alex Morgan")
    email: str = Field(..., example="alex@freightlink.com")
    role: str = Field(default="consumer", example="consumer")
    driver_status: Optional[str] = Field(default=None, example="Available")
    assigned_vehicle: Optional[str] = Field(default=None, example="Refrigerated Van (Medium)")
    license_number: Optional[str] = Field(default=None, example="OD-02-2024-DRV-8821")
    phone: Optional[str] = Field(default=None, example="+91 98765 43210")
    created_at: Optional[str] = None


class DriverProfileUpdate(BaseModel):
    """Payload for updating driver profile / availability status."""

    driver_status: Optional[str] = Field(default=None, example="On Duty")
    assigned_vehicle: Optional[str] = Field(default=None, example="Refrigerated Truck (Heavy)")
    phone: Optional[str] = Field(default=None, example="+91 98765 43210")


class DriverShipmentStatusUpdate(BaseModel):
    """Payload for driver updating assigned shipment status."""

    status: str = Field(..., example="In Transit")


class AuthResponse(BaseModel):
    """Token and user info returned upon successful login / registration."""

    token: str = Field(..., example="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    user: UserResponse


# ---------------------------------------------------------------------------
# Pydantic models - Shipments
# ---------------------------------------------------------------------------


class ShipmentCreate(BaseModel):
    """Fields sent when creating/saving a new shipment."""

    product_type: str = Field(..., example="Fresh Tomatoes")
    weight_kg: float = Field(..., gt=0, example=500.0)
    pickup_location: str = Field(..., example="Bhubaneswar")
    destination: str = Field(..., example="Kolkata")

    # Scheduling fields
    pickup_date: Optional[str] = Field(default=None, example="2026-08-16")
    pickup_time: Optional[str] = Field(default="08:00", example="08:00")
    delivery_date: Optional[str] = Field(default=None, example="2026-08-18")
    delivery_time: Optional[str] = Field(default="18:00", example="18:00")

    # Requirement & Plan fields
    delivery_priority: Optional[str] = Field(default="Standard", example="Standard")
    special_requirement: Optional[str] = Field(default="Refrigerated", example="Refrigerated")
    selected_vehicle: Optional[str] = Field(default="Refrigerated Van (Medium)", example="Refrigerated Van (Medium)")
    route: Optional[Any] = Field(default=None, example=["Bhubaneswar", "Cuttack", "Kolkata"])
    cost: Optional[float] = Field(default=0.0, example=14500.0)
    savings: Optional[float] = Field(default=0.0, example=14500.0)
    risk_percentage: Optional[float] = Field(default=0.0, example=48.2)
    eta: Optional[str] = Field(default="7.2 hrs", example="7.2 hrs")
    status: Optional[str] = Field(default="Planned", example="Planned")

    # Backward compatibility aliases
    delivery_deadline: Optional[date] = Field(default=None, example="2026-08-20")
    temperature_requirement: Optional[str] = Field(default=None, example="2-8°C")
    priority: Optional[str] = Field(default=None, example="High")


class ShipmentUpdate(BaseModel):
    """Fields allowed for partial/full update of an existing shipment."""

    product_type: Optional[str] = None
    weight_kg: Optional[float] = Field(default=None, gt=0)
    pickup_location: Optional[str] = None
    destination: Optional[str] = None
    pickup_date: Optional[str] = None
    pickup_time: Optional[str] = None
    delivery_date: Optional[str] = None
    delivery_time: Optional[str] = None
    delivery_priority: Optional[str] = None
    special_requirement: Optional[str] = None
    selected_vehicle: Optional[str] = None
    route: Optional[Any] = None
    cost: Optional[float] = None
    savings: Optional[float] = None
    risk_percentage: Optional[float] = None
    eta: Optional[str] = None
    status: Optional[str] = None


class Shipment(BaseModel):
    """A full persistent shipment record retrieved from SQLite."""

    id: str = Field(..., example="SF-1001")
    user_id: Optional[str] = Field(default=None, example="USR-101")
    driver_id: Optional[str] = Field(default=None, example="USR-DRIVER-001")
    product_type: str = Field(..., example="Fresh Tomatoes")
    weight_kg: float = Field(..., gt=0, example=500.0)
    pickup_location: str = Field(..., example="Bhubaneswar")
    destination: str = Field(..., example="Kolkata")
    pickup_date: Optional[str] = Field(default=None, example="2026-08-16")
    pickup_time: Optional[str] = Field(default="08:00", example="08:00")
    delivery_date: Optional[str] = Field(default=None, example="2026-08-18")
    delivery_time: Optional[str] = Field(default="18:00", example="18:00")
    delivery_priority: Optional[str] = Field(default="Standard", example="Standard")
    special_requirement: Optional[str] = Field(default="Normal", example="Refrigerated")
    selected_vehicle: Optional[str] = Field(default=None, example="Refrigerated Van (Medium)")
    route: Optional[Any] = Field(default=None, example=["Bhubaneswar", "Cuttack", "Kolkata"])
    cost: Optional[float] = Field(default=0.0, example=14500.0)
    savings: Optional[float] = Field(default=0.0, example=14500.0)
    risk_percentage: Optional[float] = Field(default=0.0, example=48.2)
    eta: Optional[str] = Field(default=None, example="7.2 hrs")
    status: str = Field(default="Planned", example="Planned")
    created_at: Optional[str] = Field(default=None, example="2026-08-16T10:00:00")

    # Backward compatibility alias fields
    delivery_deadline: Optional[Any] = None
    temperature_requirement: Optional[str] = None
    priority: Optional[str] = None


# ---------------------------------------------------------------------------
# Pydantic models - Fleet Vehicles
# ---------------------------------------------------------------------------


class VehicleCreate(BaseModel):
    """Payload for registering a new fleet vehicle."""

    id: Optional[str] = Field(default=None, example="VH-106")
    type: str = Field(..., example="Refrigerated Truck (Heavy)")
    capacity_kg: float = Field(..., gt=0, example=5000.0)
    base_cost: float = Field(..., gt=0, example=18000.0)
    status: str = Field(default="Available", example="Available")
    special_capability: Optional[str] = Field(default="Refrigerated / Cold-Chain", example="Refrigerated / Cold-Chain")
    is_refrigerated: Optional[bool] = Field(default=False, example=True)


class VehicleUpdate(BaseModel):
    """Payload for editing an existing fleet vehicle."""

    type: Optional[str] = None
    capacity_kg: Optional[float] = Field(default=None, gt=0)
    base_cost: Optional[float] = Field(default=None, gt=0)
    status: Optional[str] = None
    special_capability: Optional[str] = None
    is_refrigerated: Optional[bool] = None


class Vehicle(BaseModel):
    """Persistent vehicle record from SQLite."""

    id: str = Field(..., example="VH-101")
    user_id: Optional[str] = Field(default=None, example="USR-101")
    type: str = Field(..., example="Refrigerated Truck (Heavy)")
    capacity_kg: float = Field(..., gt=0, example=5000.0)
    base_cost: float = Field(..., gt=0, example=18000.0)
    status: str = Field(default="Available", example="Available")
    special_capability: Optional[str] = Field(default="Normal / Ambient", example="Refrigerated / Cold-Chain")
    is_refrigerated: bool = Field(default=False, example=True)
    created_at: Optional[str] = None


# ---------------------------------------------------------------------------
# Pydantic models - Trips & Optimization
# ---------------------------------------------------------------------------


class Trip(BaseModel):
    """A consolidated trip grouping one or more compatible shipments."""

    model_config = {"protected_namespaces": ()}

    trip_id: str = Field(..., example="trip-a1b2c3d4")
    vehicle_type: str = Field(..., example="Refrigerated Truck")
    vehicle_capacity_kg: float = Field(..., example=5000)
    shipment_ids: list[str] = Field(..., example=["SF-1001", "SF-1002"])
    total_load_kg: float = Field(..., example=800.0)
    capacity_utilization_percent: float = Field(..., example=16.0)
    destinations: list[str] = Field(..., example=["Kolkata"])
    status: str = Field(default="Planned", example="Planned")

    # --- Cost & savings for this trip ---
    separate_cost: float = Field(..., example=36000)
    consolidated_cost: float = Field(..., example=18000)
    savings: float = Field(..., example=18000)
    savings_percent: float = Field(..., example=50.0)

    # --- Route information ---
    route: list[str] = Field(..., example=["Bhubaneswar", "Cuttack", "Kolkata"])
    route_distance_km: float = Field(..., example=440)
    estimated_duration_hours: float = Field(..., example=9.0)

    # --- AI / ML Transit Intelligence ---
    ml_used: bool = Field(default=True, example=True)
    model_name: str = Field(default="Random Forest Regressor", example="Random Forest Regressor")
    baseline_duration_hours: float = Field(default=7.6, example=7.6)
    ai_predicted_transit_hours: float = Field(default=12.7, example=12.7)
    ai_predicted_transit_formatted: str = Field(default="12h 41m", example="12h 41m")
    baseline_transit_formatted: str = Field(default="7h 36m", example="7h 36m")
    predicted_eta_formatted: str = Field(default="Aug 16, 22:11", example="Aug 16, 22:11")
    sla_deadline_formatted: str = Field(default="Aug 17, 18:00", example="Aug 17, 18:00")
    sla_buffer_formatted: str = Field(default="19h 49m", example="19h 49m")
    ai_decision: str = Field(default="FEASIBLE", example="FEASIBLE")
    ai_reasoning: str = Field(
        default="AI predicts the consolidated route will reach all shipment deadlines with sufficient SLA buffer.",
        example="AI predicts the consolidated route will reach all shipment deadlines with sufficient SLA buffer.",
    )

    # --- Risk assessment ---
    delay_risk_percent: float = Field(..., example=42.0)
    spoilage_risk_percent: float = Field(..., example=35.0)
    overall_risk_percent: float = Field(..., example=38.5)
    risk_level: str = Field(..., example="MEDIUM")
    explanations: list[str] = Field(
        ..., example=["Long route distance increases delay risk."]
    )

    # --- Future Damage-Risk ML Telemetry ---
    damage_risk_score: float = Field(default=28.0, example=28.0)
    damage_risk_tier: str = Field(default="LOW", example="LOW")
    damage_model_status: str = Field(default="COLLECTING DATA", example="COLLECTING DATA")


class OptimizeResponse(BaseModel):
    """Top-level response from POST /optimize with trips and overall totals."""

    trips: list[Trip]
    total_separate_cost: float = Field(..., example=54000)
    total_consolidated_cost: float = Field(..., example=36000)
    total_savings: float = Field(..., example=18000)
    total_savings_percent: float = Field(..., example=33.33)


class TrackingStage(BaseModel):
    """One stage in the shipment tracking lifecycle."""

    name: str = Field(..., example="Picked Up")
    completed: bool = Field(..., example=True)
    timestamp: datetime | None = Field(None, example="2026-08-16T10:30:00")


class TrackingResponse(BaseModel):
    """Full tracking information for a shipment."""

    shipment_id: str = Field(..., example="SF-1001")
    current_status: str = Field(..., example="In Transit")
    stages: list[TrackingStage]


# ---------------------------------------------------------------------------
# Pydantic models - Cargo Incidents & Driver Damage Reporting
# ---------------------------------------------------------------------------


class IncidentCreate(BaseModel):
    """Payload submitted by driver to report cargo damage or an operational incident."""

    shipment_id: str = Field(..., example="SF-1001")
    vehicle_id: Optional[str] = Field(None, example="VH-101")
    incident_type: str = Field(..., example="Package Damage")
    severity: str = Field(..., example="High")
    description: str = Field(..., example="Crate crushed during highway transit.")
    photo_name: Optional[str] = Field(None, example="damage_pkg_01.jpg")
    timestamp: Optional[str] = Field(None, example="2026-08-16T14:30:00")
    source: str = Field(default="DRIVER_REPORT", example="DRIVER_REPORT")


class IncidentStatusUpdate(BaseModel):
    """Lifecycle status update for an incident."""

    status: str = Field(..., example="UNDER INSPECTION")
    resolution_note: Optional[str] = Field(None, example="Driver inspected package seals. Re-secured in bay 2.")
    is_verified_damage: Optional[int] = Field(None, example=1)


class IncidentResponse(BaseModel):
    """Standardized incident response record."""

    id: str
    shipment_id: str
    driver_id: str
    vehicle_id: Optional[str] = None
    incident_type: str
    severity: str
    description: str
    photo_name: Optional[str] = None
    timestamp: str
    status: str
    resolution_note: Optional[str] = None
    inspected_at: Optional[str] = None
    resolved_at: Optional[str] = None
    source: str = "DRIVER_REPORT"
    is_verified_damage: int = 0
    created_at: str


class TelemetryEvaluateRequest(BaseModel):
    """Simulated telemetry data point to evaluate for potential incident alerts."""

    shipment_id: str
    temperature: Optional[float] = None
    g_force: Optional[float] = None
    speed_kmh: Optional[float] = None


class TelemetryDismissRequest(BaseModel):
    """Driver dismissal of a false telemetry alert."""

    shipment_id: str
    reason: Optional[str] = "Normal road bump / sensor spike"


# ---------------------------------------------------------------------------
# Pydantic models - Street Routing & Map Geometry
# ---------------------------------------------------------------------------


class LocationPoint(BaseModel):
    """Geocoded location coordinates."""

    name: str = Field(..., example="Bhubaneswar")
    latitude: float = Field(..., example=20.2961)
    longitude: float = Field(..., example=85.8245)


class RouteRequest(BaseModel):
    """Payload for requesting a real road route."""

    origin: Optional[str] = Field(default=None, example="Bhubaneswar")
    pickup_location: Optional[str] = Field(default=None, example="Bhubaneswar")
    destination: str = Field(..., example="Kolkata")
    stops: Optional[List[str]] = Field(default=None, example=["Cuttack", "Jamshedpur"])
    waypoints: Optional[List[str]] = Field(default=None, example=["Bhubaneswar", "Cuttack", "Kolkata"])


class RouteResponse(BaseModel):
    """Real road route geometry and journey telemetry."""

    origin: LocationPoint
    destination: LocationPoint
    stops: Optional[List[LocationPoint]] = Field(default_factory=list)
    waypoints: Optional[List[LocationPoint]] = Field(default_factory=list)
    distance_km: float = Field(..., example=440.3)
    duration_minutes: float = Field(..., example=336.2)
    route_geometry: List[List[float]] = Field(
        ...,
        example=[[85.8245, 20.2961], [88.3639, 22.5726]],
        description="Ordered list of [longitude, latitude] GeoJSON coordinates representing the road route",
    )
    route_summary: Optional[str] = Field(default=None, example="NH16")


# ---------------------------------------------------------------------------
# Authentication Dependency
# ---------------------------------------------------------------------------


async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Validate Bearer JWT token from Authorization header and return current user.
    Falls back gracefully to demo user if no token provided in development/prototype mode."""
    if not authorization:
        # Check if default demo user exists for seamless backward compatibility
        demo_user = database.get_user_by_id(database.DEFAULT_DEMO_USER_ID)
        if demo_user:
            return demo_user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Missing Bearer token.",
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Expected 'Bearer <token>'.",
        )

    token = parts[1]
    payload = auth.decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token. Please log in again.",
        )

    user_id = payload["sub"]
    user = database.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
        )

    return user


async def get_current_driver(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Validate that the authenticated user holds a Driver role."""
    if user.get("role") != "driver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted. Driver privileges required.",
        )
    return user


# ---------------------------------------------------------------------------
# Tracking In-Memory Cache
# ---------------------------------------------------------------------------

tracking_store: dict[str, list[TrackingStage]] = {}
TRACKING_STAGES = ["Planned", "Dispatched", "In Transit", "Delivered"]


def _init_tracking(shipment_id: str) -> None:
    """Initialize tracking stages for a shipment."""
    tracking_store[shipment_id] = [
        TrackingStage(
            name=TRACKING_STAGES[0],
            completed=True,
            timestamp=datetime.now(),
        ),
    ] + [
        TrackingStage(name=stage, completed=False, timestamp=None)
        for stage in TRACKING_STAGES[1:]
    ]


# ---------------------------------------------------------------------------
# Corridor Topology & Risk Calculation Engine
# ---------------------------------------------------------------------------

DESTINATION_CLUSTERS: list[set[str]] = [
    {"Kolkata", "Howrah"},
    {"Bhubaneswar", "Cuttack", "Puri"},
]

DEADLINE_WINDOW_DAYS = 3
TEMP_TOLERANCE_C = 4.0


def _get_active_available_vehicle(user_id: str) -> dict:
    """Fetch best available vehicle belonging to the user from SQLite."""
    all_v = database.get_all_vehicles(user_id)
    available = [v for v in all_v if v.get("status") == "Available"]
    if available:
        available.sort(key=lambda x: (x.get("is_refrigerated", False), x.get("capacity_kg", 0)), reverse=True)
        return available[0]
    return {
        "id": "VH-101",
        "type": "Refrigerated Truck (Heavy)",
        "capacity_kg": 5000.0,
        "base_cost": 18000.0,
        "status": "Available",
        "is_refrigerated": True,
    }


def _parse_temp_range(temp_str: str) -> tuple[float, float] | None:
    if not temp_str:
        return None
    match = re.match(r"(-?\d+(?:\.\d+)?)\s*[-–]\s*(-?\d+(?:\.\d+)?)", temp_str)
    if not match:
        return None
    return float(match.group(1)), float(match.group(2))


def _temp_midpoint(temp_str: str) -> float | None:
    parsed = _parse_temp_range(temp_str)
    if parsed is None:
        return None
    return (parsed[0] + parsed[1]) / 2.0


def _destinations_compatible(dest_a: str, dest_b: str) -> bool:
    if dest_a == dest_b:
        return True
    for cluster in DESTINATION_CLUSTERS:
        if dest_a in cluster and dest_b in cluster:
            return True
    return False


def _temps_compatible(temp_a: str, temp_b: str) -> bool:
    mid_a = _temp_midpoint(temp_a)
    mid_b = _temp_midpoint(temp_b)
    if mid_a is None or mid_b is None:
        return True
    return abs(mid_a - mid_b) <= TEMP_TOLERANCE_C


def _deadlines_compatible(deadlines: list[date]) -> bool:
    if not deadlines:
        return True
    return (max(deadlines) - min(deadlines)).days <= DEADLINE_WINDOW_DAYS


MASTER_CORRIDOR = ["Puri", "Bhubaneswar", "Cuttack", "Jamshedpur", "Kolkata", "Howrah"]
SEGMENT_DISTANCE_KM: dict[tuple[str, str], float] = {
    ("Puri", "Bhubaneswar"): 60,
    ("Bhubaneswar", "Cuttack"): 30,
    ("Cuttack", "Jamshedpur"): 200,
    ("Jamshedpur", "Kolkata"): 150,
    ("Kolkata", "Howrah"): 10,
}
AVG_SPEED_KMH = 50.0

CITY_STATE_MAP: dict[str, str] = {
    "Puri": "Odisha",
    "Bhubaneswar": "Odisha",
    "Cuttack": "Odisha",
    "Jamshedpur": "Jharkhand",
    "Kolkata": "West Bengal",
    "Howrah": "West Bengal",
}


def _corridor_index(city: str) -> int:
    try:
        return MASTER_CORRIDOR.index(city)
    except ValueError:
        return -1


def _corridor_distance(city_a: str, city_b: str) -> float:
    idx_a = _corridor_index(city_a)
    idx_b = _corridor_index(city_b)
    if idx_a == -1 or idx_b == -1:
        return 100.0
    lo, hi = sorted([idx_a, idx_b])
    total = 0.0
    for i in range(lo, hi):
        seg = (MASTER_CORRIDOR[i], MASTER_CORRIDOR[i + 1])
        total += SEGMENT_DISTANCE_KM.get(seg, 100.0)
    return total


def _build_route(trip_shipments: list[dict]) -> tuple[list[str], float, float]:
    locations: set[str] = set()
    for s in trip_shipments:
        if s.get("pickup_location"):
            locations.add(s["pickup_location"])
        if s.get("destination"):
            locations.add(s["destination"])

    route = sorted(locations, key=_corridor_index)
    total_km = 0.0
    for i in range(len(route) - 1):
        total_km += _corridor_distance(route[i], route[i + 1])

    # Default fallback: 50 km/h baseline
    duration_hrs = round(total_km / AVG_SPEED_KMH, 1)

    # ML Transit-Time Prediction with robust fallback
    if total_km > 0 and len(route) >= 2 and predict_travel_time is not None:
        try:
            first_s = trip_shipments[0] if trip_shipments else {}

            # 1. Parse departure hour
            pickup_time_str = first_s.get("pickup_time", "09:00")
            try:
                dep_hour = int(str(pickup_time_str).split(":")[0])
            except Exception:
                dep_hour = 9

            # 2. Parse departure day of week
            pickup_date_str = first_s.get("pickup_date", "2026-08-16")
            try:
                dep_dow = datetime.fromisoformat(str(pickup_date_str)).weekday()
            except Exception:
                dep_dow = 0

            is_weekend = 1 if dep_dow >= 5 else 0
            is_night = 1 if (dep_hour >= 21 or dep_hour <= 5) else 0

            # 3. Spatial & State Mapping
            src_city = route[0] if route else "Bhubaneswar"
            dst_city = route[-1] if route else "Kolkata"
            src_state = CITY_STATE_MAP.get(src_city, "Odisha")
            dst_state = CITY_STATE_MAP.get(dst_city, "West Bengal")
            is_interstate = 1 if src_state != dst_state else 0

            # 4. Routing Free-Flow Baseline
            osrm_time = max((total_km / 78.5) * 60.0, 1.0)
            osrm_speed = total_km / (osrm_time / 60.0)

            # 5. Execute ML Prediction
            pred = predict_travel_time(
                osrm_distance=float(total_km),
                osrm_time=float(osrm_time),
                osrm_speed_kmh=float(osrm_speed),
                num_intermediate_stops=len(route),
                is_ftl=1,
                departure_hour=dep_hour,
                departure_dayofweek=dep_dow,
                is_weekend=is_weekend,
                is_night_dispatch=is_night,
                is_interstate=is_interstate,
                source_state=src_state,
                destination_state=dst_state,
            )
            if pred and "predicted_hours" in pred and pred["predicted_hours"] > 0:
                duration_hrs = float(pred["predicted_hours"])
                print(
                    f"[ML Transit Prediction] OSRM Distance: {total_km:.1f} km | "
                    f"OSRM Time: {osrm_time:.1f} min | "
                    f"ML Predicted Time: {pred['predicted_minutes']:.1f} min ({duration_hrs:.2f} hrs) | "
                    f"ML Used: true"
                )
        except Exception as e:
            print(f"[ML Transit Prediction] ML Used: false | Fallback: 50 km/h | Reason: {e}")
            duration_hrs = round(total_km / AVG_SPEED_KMH, 1)

    return route, total_km, duration_hrs


def _parse_shipment_departure(s: dict) -> datetime:
    """Parse scheduled departure datetime from shipment."""
    p_date = s.get("pickup_date") or "2026-08-16"
    p_time = s.get("pickup_time") or "08:00"
    try:
        if isinstance(p_date, date) and not isinstance(p_date, datetime):
            p_date = p_date.isoformat()
        if "T" in str(p_date):
            return datetime.fromisoformat(str(p_date))
        time_part = str(p_time).strip()
        if len(time_part) == 5:
            time_part += ":00"
        return datetime.fromisoformat(f"{p_date}T{time_part}")
    except Exception:
        return datetime(2026, 8, 16, 8, 0, 0)


def _parse_shipment_deadline(s: dict) -> Optional[datetime]:
    """Parse SLA delivery deadline datetime from shipment."""
    dd = s.get("delivery_deadline")
    if dd:
        try:
            if isinstance(dd, datetime):
                return dd
            if isinstance(dd, date):
                return datetime.combine(dd, datetime.min.time()) + timedelta(hours=23, minutes=59)
            if "T" in str(dd):
                return datetime.fromisoformat(str(dd))
            return datetime.fromisoformat(f"{dd}T23:59:59")
        except Exception:
            pass

    d_date = s.get("delivery_date")
    d_time = s.get("delivery_time") or "23:59"
    if d_date:
        try:
            if isinstance(d_date, date) and not isinstance(d_date, datetime):
                d_date = d_date.isoformat()
            if "T" in str(d_date):
                return datetime.fromisoformat(str(d_date))
            time_part = str(d_time).strip()
            if len(time_part) == 5:
                time_part += ":00"
            return datetime.fromisoformat(f"{d_date}T{time_part}")
        except Exception:
            pass

    return None


def _is_trip_deadline_feasible(candidate_shipments: list[dict]) -> tuple[bool, Optional[str]]:
    """Determine whether the proposed candidate consolidation can meet ALL shipment delivery deadlines.

    Calculates progressive ETA at each intermediate stop along the route using ML predicted duration.
    Returns (True, None) if all deadlines are met, or (False, rejection_reason) if any deadline is violated.
    """
    if not candidate_shipments:
        return True, None

    route, total_km, total_duration_hrs = _build_route(candidate_shipments)
    if not route:
        return True, None

    # Earliest scheduled pickup timestamp among candidate shipments
    trip_departure = min(_parse_shipment_departure(s) for s in candidate_shipments)

    # Calculate cumulative distance to each stop along route
    cum_dist_to_stop: dict[str, float] = {}
    running_km = 0.0
    cum_dist_to_stop[route[0]] = 0.0
    for i in range(len(route) - 1):
        running_km += _corridor_distance(route[i], route[i + 1])
        cum_dist_to_stop[route[i + 1]] = running_km

    # Verify each shipment against its destination arrival ETA
    for s in candidate_shipments:
        deadline = _parse_shipment_deadline(s)
        if deadline is None:
            continue

        dest = s.get("destination")
        dest_km = cum_dist_to_stop.get(dest, total_km)

        # Scale ML duration progressively along the corridor
        dest_duration_hrs = (
            total_duration_hrs * (dest_km / total_km)
            if total_km > 0
            else total_duration_hrs
        )
        predicted_arrival = trip_departure + timedelta(hours=dest_duration_hrs)

        if predicted_arrival > deadline:
            shp_id = s.get("id") or s.get("product_type") or "Shipment"
            reason = (
                f"Consolidation rejected: {shp_id} destination ETA ({predicted_arrival.strftime('%Y-%m-%d %H:%M')}) "
                f"exceeds delivery SLA deadline ({deadline.strftime('%Y-%m-%d %H:%M')})."
            )
            print(f"[AI TRANSIT ANALYSIS] {reason}")
            return False, reason

    return True, None


def _is_compatible_with_trip(
    candidate: dict,
    trip_shipments: list[dict],
    current_load: float,
    vehicle_capacity: float,
) -> bool:
    candidate_weight = float(candidate.get("weight_kg") or 0)
    if current_load + candidate_weight > vehicle_capacity:
        return False

    candidate_dest = candidate.get("destination", "")
    candidate_temp = candidate.get("special_requirement") or candidate.get("temperature_requirement") or "Normal"

    for existing in trip_shipments:
        existing_dest = existing.get("destination", "")
        if not _destinations_compatible(candidate_dest, existing_dest):
            return False

        existing_temp = existing.get("special_requirement") or existing.get("temperature_requirement") or "Normal"
        if not _temps_compatible(candidate_temp, existing_temp):
            return False

    # ML-Powered SLA Delivery-Deadline Feasibility Check
    proposed_trip = trip_shipments + [candidate]
    is_feasible, _ = _is_trip_deadline_feasible(proposed_trip)
    if not is_feasible:
        return False

    return True


def _build_trips(all_shipments: list[dict], user_id: str) -> list[Trip]:
    active_vehicle = _get_active_available_vehicle(user_id)
    vehicle_cap = float(active_vehicle.get("capacity_kg") or 5000.0)
    vehicle_cost = float(active_vehicle.get("base_cost") or 18000.0)
    vehicle_type = str(active_vehicle.get("type") or "Refrigerated Truck")
    is_reefer = bool(active_vehicle.get("is_refrigerated", True))

    unassigned = list(all_shipments)
    trips: list[Trip] = []

    while unassigned:
        seed = unassigned.pop(0)
        trip_shipments: list[dict] = [seed]
        current_load = float(seed.get("weight_kg") or 0)

        still_unassigned: list[dict] = []
        for candidate in unassigned:
            if _is_compatible_with_trip(candidate, trip_shipments, current_load, vehicle_cap):
                trip_shipments.append(candidate)
                current_load += float(candidate.get("weight_kg") or 0)
            else:
                still_unassigned.append(candidate)

        unassigned = still_unassigned

        utilization = round(current_load / vehicle_cap * 100, 1)
        destinations = sorted({s.get("destination") for s in trip_shipments if s.get("destination")})

        separate_cost = len(trip_shipments) * vehicle_cost
        consolidated_cost = vehicle_cost
        savings = separate_cost - consolidated_cost
        savings_pct = round((savings / separate_cost) * 100, 2) if separate_cost else 0.0

        route, distance_km, duration_hrs = _build_route(trip_shipments)

        # Baseline & AI Transit Intelligence formatting
        baseline_duration_hours = round(distance_km / AVG_SPEED_KMH, 1)
        base_h = int(baseline_duration_hours)
        base_m = int(round((baseline_duration_hours - base_h) * 60))
        baseline_transit_formatted = f"{base_h}h {base_m:02d}m"

        pred_h = int(duration_hrs)
        pred_m = int(round((duration_hrs - pred_h) * 60))
        ai_predicted_transit_formatted = f"{pred_h}h {pred_m:02d}m"

        trip_departure = min(_parse_shipment_departure(s) for s in trip_shipments)
        predicted_arrival = trip_departure + timedelta(hours=duration_hrs)
        predicted_eta_formatted = predicted_arrival.strftime("%b %d, %H:%M")

        deadlines = [
            _parse_shipment_deadline(s)
            for s in trip_shipments
            if _parse_shipment_deadline(s) is not None
        ]
        if deadlines:
            earliest_deadline = min(deadlines)
            sla_deadline_formatted = earliest_deadline.strftime("%b %d, %H:%M")
            buffer_seconds = (earliest_deadline - predicted_arrival).total_seconds()
            if buffer_seconds >= 0:
                buf_hrs = int(buffer_seconds // 3600)
                buf_mins = int((buffer_seconds % 3600) // 60)
                sla_buffer_formatted = f"{buf_hrs}h {buf_mins:02d}m"
                ai_decision = "FEASIBLE"
                ai_reasoning = (
                    "AI predicts the consolidated route will reach all shipment deadlines "
                    "with sufficient SLA buffer."
                )
            else:
                over_seconds = abs(buffer_seconds)
                over_hrs = int(over_seconds // 3600)
                over_mins = int((over_seconds % 3600) // 60)
                sla_buffer_formatted = f"-{over_hrs}h {over_mins:02d}m"
                ai_decision = "NOT FEASIBLE"
                ai_reasoning = "AI-predicted freight transit exceeds delivery SLA deadline."
        else:
            sla_deadline_formatted = "Flexible SLA"
            sla_buffer_formatted = "Nominal Buffer"
            ai_decision = "FEASIBLE"
            ai_reasoning = "AI transit speed meets standard dispatch window."

        risk = _assess_risk(
            trip_shipments=trip_shipments,
            route=route,
            distance_km=distance_km,
            duration_hrs=duration_hrs,
            is_refrigerated=is_reefer,
        )

        # Damage-Risk ML Evaluation (Operational Feedback Pipeline)
        if damage_ml_service:
            damage_eval = damage_ml_service.assess_damage_risk(
                product_type=trip_shipments[0].get("product_type", "Normal Freight"),
                weight_kg=current_load,
                route_distance_km=distance_km,
                ml_predicted_transit_hours=duration_hrs,
                intermediate_stops_count=len(route) - 1,
                vehicle_type=vehicle_type,
            )
            damage_score = damage_eval["damage_risk_score"]
            damage_tier = damage_eval["damage_risk_tier"]
            damage_status = damage_eval["model_status"]
            if damage_eval.get("explanations"):
                risk["explanations"].extend(damage_eval["explanations"])
        else:
            damage_score = 28.0
            damage_tier = "LOW"
            damage_status = "COLLECTING DATA"

        trip = Trip(
            trip_id=f"trip-{uuid.uuid4().hex[:8]}",
            vehicle_type=vehicle_type,
            vehicle_capacity_kg=vehicle_cap,
            shipment_ids=[s.get("id") for s in trip_shipments if s.get("id")],
            total_load_kg=current_load,
            capacity_utilization_percent=utilization,
            destinations=destinations,
            status="Planned",
            separate_cost=separate_cost,
            consolidated_cost=consolidated_cost,
            savings=savings,
            savings_percent=savings_pct,
            route=route,
            route_distance_km=distance_km,
            estimated_duration_hours=duration_hrs,
            ml_used=True,
            model_name="Random Forest Regressor",
            baseline_duration_hours=baseline_duration_hours,
            ai_predicted_transit_hours=duration_hrs,
            ai_predicted_transit_formatted=ai_predicted_transit_formatted,
            baseline_transit_formatted=baseline_transit_formatted,
            predicted_eta_formatted=predicted_eta_formatted,
            sla_deadline_formatted=sla_deadline_formatted,
            sla_buffer_formatted=sla_buffer_formatted,
            ai_decision=ai_decision,
            ai_reasoning=ai_reasoning,
            damage_risk_score=damage_score,
            damage_risk_tier=damage_tier,
            damage_model_status=damage_status,
            **risk,
        )
        trips.append(trip)

    return trips




PRODUCT_SENSITIVITY: dict[str, float] = {
    "Dairy": 85,
    "Milk": 85,
    "Tomatoes": 70,
    "Vegetables": 65,
    "Fruits": 55,
    "Seafood": 90,
    "Meat": 80,
}
DEFAULT_SENSITIVITY = 20.0

ROUTE_RELIABILITY: dict[frozenset[str], float] = {
    frozenset({"Bhubaneswar", "Cuttack"}): 0.92,
    frozenset({"Cuttack", "Kolkata"}): 0.85,
    frozenset({"Bhubaneswar", "Kolkata"}): 0.80,
    frozenset({"Puri", "Bhubaneswar"}): 0.90,
    frozenset({"Puri", "Kolkata"}): 0.75,
}
DEFAULT_RELIABILITY = 0.78


def _get_route_reliability(route: list[str]) -> float:
    if len(route) < 2:
        return 1.0
    key = frozenset({route[0], route[-1]})
    return ROUTE_RELIABILITY.get(key, DEFAULT_RELIABILITY)


def _calc_delay_risk(
    distance_km: float,
    duration_hrs: float,
    days_until_deadline: int,
    reliability: float,
) -> tuple[float, list[str]]:
    explanations: list[str] = []

    if distance_km < 200:
        dist_score = 15.0
        explanations.append(f"Short route distance of {distance_km:.0f} km keeps delay risk low.")
    elif distance_km <= 400:
        dist_score = 30 + (distance_km - 200) / 200 * 30
        explanations.append(f"Moderate route distance of {distance_km:.0f} km adds some delay risk.")
    else:
        dist_score = 60 + min((distance_km - 400) / 200 * 20, 40)
        explanations.append(f"Long route distance of {distance_km:.0f} km increases delay risk.")

    dur_score = min(duration_hrs / 12.0 * 100, 100)
    if duration_hrs >= 6:
        explanations.append(f"Estimated journey of {duration_hrs:.1f} hours increases delay risk.")
    else:
        explanations.append(f"Short journey of {duration_hrs:.1f} hours helps keep delay risk low.")

    if days_until_deadline <= 0:
        deadline_score = 100.0
        explanations.append("Delivery deadline has passed or is today — critical risk.")
    elif days_until_deadline <= 1:
        deadline_score = 80.0
        explanations.append("Only 1 day until deadline — high deadline pressure.")
    elif days_until_deadline <= 3:
        deadline_score = 50.0
        explanations.append(f"{days_until_deadline} days until deadline — moderate time pressure.")
    else:
        deadline_score = max(20.0 - days_until_deadline, 5.0)
        explanations.append(f"{days_until_deadline} days until deadline — comfortable buffer.")

    rel_score = (1.0 - reliability) * 100
    if reliability < 0.80:
        explanations.append(f"Route reliability is low ({reliability:.0%}), increasing delay risk.")
    else:
        explanations.append(f"Route reliability is good ({reliability:.0%}).")

    delay_risk = (
        dist_score * 0.25
        + dur_score * 0.25
        + deadline_score * 0.30
        + rel_score * 0.20
    )
    return round(min(delay_risk, 100), 1), explanations


def _calc_spoilage_risk(
    trip_shipments: list[dict],
    duration_hrs: float,
    is_refrigerated: bool,
) -> tuple[float, list[str]]:
    explanations: list[str] = []
    max_sens = DEFAULT_SENSITIVITY
    most_sensitive = "General goods"

    for s in trip_shipments:
        pt = s.get("product_type", "")
        sens = PRODUCT_SENSITIVITY.get(pt, DEFAULT_SENSITIVITY)
        if sens > max_sens:
            max_sens = sens
            most_sensitive = pt
    sens_score = max_sens

    if max_sens >= 70:
        explanations.append(f"{most_sensitive} is highly perishable (sensitivity {max_sens:.0f}/100).")
    elif max_sens >= 40:
        explanations.append(f"{most_sensitive} has moderate perishability (sensitivity {max_sens:.0f}/100).")
    else:
        explanations.append(f"{most_sensitive} has low perishability — spoilage risk is minimal.")

    worst_temp_score = 0.0
    for s in trip_shipments:
        temp_req = s.get("special_requirement") or s.get("temperature_requirement") or ""
        parsed = _parse_temp_range(temp_req)
        if parsed is None:
            continue
        low, high = parsed
        midpoint = (low + high) / 2.0
        temp_score = max(70 - midpoint * 8, 10)
        worst_temp_score = max(worst_temp_score, temp_score)

    temp_score_val = worst_temp_score if worst_temp_score > 0 else 10.0
    dur_spoilage_score = min(duration_hrs / 12.0 * 100, 100)

    if is_refrigerated:
        reefer_adjustment = -15.0
        explanations.append("Active cold-chain refrigeration reduces spoilage risk by 15%.")
    else:
        reefer_adjustment = 0.0
        if sens_score >= 40:
            explanations.append("Non-refrigerated vehicle increases spoilage risk for perishables.")

    raw_spoilage = (
        sens_score * 0.35
        + temp_score_val * 0.25
        + dur_spoilage_score * 0.25
        + reefer_adjustment
    )
    spoilage_risk = max(0.0, min(raw_spoilage, 100.0))
    return round(spoilage_risk, 1), explanations


def _risk_level(overall_risk: float) -> str:
    if overall_risk <= 30:
        return "LOW"
    elif overall_risk <= 60:
        return "MEDIUM"
    else:
        return "HIGH"


def _assess_risk(
    trip_shipments: list[dict],
    route: list[str],
    distance_km: float,
    duration_hrs: float,
    is_refrigerated: bool = True,
) -> dict:
    reliability = _get_route_reliability(route)
    delay, delay_expl = _calc_delay_risk(distance_km, duration_hrs, 2, reliability)
    spoilage, spoilage_expl = _calc_spoilage_risk(trip_shipments, duration_hrs, is_refrigerated)
    overall = round(delay * 0.5 + spoilage * 0.5, 1)
    level = _risk_level(overall)

    return {
        "delay_risk_percent": delay,
        "spoilage_risk_percent": spoilage,
        "overall_risk_percent": overall,
        "risk_level": level,
        "explanations": delay_expl + spoilage_expl,
    }


# ---------------------------------------------------------------------------
# API Endpoints - Authentication & Profile
# ---------------------------------------------------------------------------


@app.post("/auth/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_user(data: UserRegisterRequest):
    """Register a new user (Consumer or Driver) with salted PBKDF2 password hash."""
    try:
        user = database.create_user(
            name=data.name,
            email=data.email,
            plain_password=data.password,
            role=data.role or "consumer",
            driver_status=data.driver_status or "Available",
            assigned_vehicle=data.assigned_vehicle or "Refrigerated Van (Medium)",
            license_number=data.license_number or "OD-02-2024-DRV-8821",
            phone=data.phone or "+91 98765 43210",
        )
        token = auth.create_access_token(user["id"], user["email"], user["name"], role=user.get("role", "consumer"))
        return AuthResponse(token=token, user=UserResponse(**user))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/auth/login", response_model=AuthResponse)
def login_user(data: UserLoginRequest):
    """Authenticate email & password and return a signed JWT token with role."""
    user_record = database.get_user_by_email(data.email)
    if not user_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    is_valid = auth.verify_password(
        data.password,
        user_record["password_hash"],
        user_record["salt"],
    )
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    safe_user = {
        "id": user_record["id"],
        "name": user_record["name"],
        "email": user_record["email"],
        "role": user_record.get("role", "consumer"),
        "driver_status": user_record.get("driver_status", "Available"),
        "assigned_vehicle": user_record.get("assigned_vehicle", "Refrigerated Van (Medium)"),
        "license_number": user_record.get("license_number", "OD-02-2024-DRV-8821"),
        "phone": user_record.get("phone", "+91 98765 43210"),
        "created_at": user_record.get("created_at"),
    }
    token = auth.create_access_token(
        safe_user["id"],
        safe_user["email"],
        safe_user["name"],
        role=safe_user["role"],
    )
    return AuthResponse(token=token, user=UserResponse(**safe_user))


@app.get("/auth/me", response_model=UserResponse)
def get_current_user_profile(user: Dict[str, Any] = Depends(get_current_user)):
    """Return the profile of the currently authenticated user."""
    return UserResponse(**user)


# ---------------------------------------------------------------------------
# API Endpoints - Driver Workspace & Assigned Shipments
# ---------------------------------------------------------------------------


@app.get("/driver/me", response_model=UserResponse)
def get_driver_profile(driver: Dict[str, Any] = Depends(get_current_driver)):
    """Return profile and asset metadata for the authenticated driver."""
    return UserResponse(**driver)


@app.patch("/driver/me", response_model=UserResponse)
def update_driver_status(
    data: DriverProfileUpdate,
    driver: Dict[str, Any] = Depends(get_current_driver),
):
    """Update driver availability status or vehicle assignment."""
    payload = data.model_dump(exclude_unset=True)
    updated = database.update_driver_profile(driver["id"], payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Driver profile not found")
    return UserResponse(**updated)


@app.get("/driver/shipments", response_model=List[Shipment])
def get_driver_shipments(driver: Dict[str, Any] = Depends(get_current_driver)):
    """Retrieve all shipments assigned strictly to the authenticated driver."""
    return database.get_driver_assigned_shipments(driver["id"])


@app.patch("/driver/shipments/{shipment_id}/status", response_model=Shipment)
def update_driver_shipment_stage(
    shipment_id: str,
    data: DriverShipmentStatusUpdate,
    driver: Dict[str, Any] = Depends(get_current_driver),
):
    """Update lifecycle status of an assigned shipment strictly by the assigned driver."""
    # Check if shipment exists and belongs to this driver
    existing = database.get_driver_shipment_by_id(shipment_id, driver["id"])
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Shipment {shipment_id} is not assigned to your driver account.",
        )

    valid_statuses = ["Assigned", "Accepted", "Picked Up", "In Transit", "Arrived", "Delivered"]
    if data.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid shipment status '{data.status}'. Must be one of {valid_statuses}",
        )

    updated = database.update_driver_shipment_status(shipment_id, driver["id"], data.status)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Shipment {shipment_id} update failed")

    # If tracking cache exists, update matching stage
    if shipment_id in tracking_store:
        for stage in tracking_store[shipment_id]:
            if stage.name.lower() == data.status.lower():
                stage.completed = True
                stage.timestamp = datetime.now()

    return updated


# ---------------------------------------------------------------------------
# API Endpoints - Cargo Incidents & Driver Damage Reporting
# ---------------------------------------------------------------------------


@app.post("/incidents/upload-photo")
async def upload_incident_photo(
    file: UploadFile = File(...),
    driver: Dict[str, Any] = Depends(get_current_driver),
):
    """Driver uploads real photo evidence for a cargo damage / exception report."""
    filename = file.filename or "evidence.jpg"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: JPG, JPEG, PNG, WEBP.",
        )

    safe_name = f"INC_PHOTO_{uuid.uuid4().hex[:10]}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, safe_name)

    contents = await file.read()
    with open(dest_path, "wb") as f:
        f.write(contents)

    return {
        "photo_name": safe_name,
        "photo_url": f"/uploads/incidents/{safe_name}",
        "original_name": filename,
        "size_bytes": len(contents),
    }


@app.post("/incidents", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def report_cargo_incident(
    data: IncidentCreate,
    driver: Dict[str, Any] = Depends(get_current_driver),
):
    """Driver reports a cargo damage or operational incident for an assigned shipment."""
    # Verify shipment is assigned to driver
    assigned = database.get_driver_shipment_by_id(data.shipment_id, driver["id"])
    if not assigned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Shipment {data.shipment_id} is not assigned to your driver account.",
        )

    payload = data.model_dump()
    if not payload.get("vehicle_id"):
        payload["vehicle_id"] = driver.get("assigned_vehicle")

    incident = database.create_cargo_incident(payload, driver_id=driver["id"])
    return incident


@app.get("/incidents/{shipment_id}", response_model=List[IncidentResponse])
def list_shipment_incidents(
    shipment_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Retrieve all incidents associated with a shipment for customer or driver."""
    incidents = database.get_incidents_by_shipment(shipment_id, user_id=user["id"] if user.get("role") == "consumer" else None)
    return incidents


@app.get("/incidents/{shipment_id}/latest", response_model=Optional[IncidentResponse])
def get_latest_shipment_incident(
    shipment_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Retrieve the latest incident for a shipment."""
    incident = database.get_latest_incident_by_shipment(shipment_id, user_id=user["id"] if user.get("role") == "consumer" else None)
    return incident


@app.get("/customer/incidents", response_model=List[Dict[str, Any]])
def list_customer_incidents(
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Retrieve all incidents reported against the authenticated customer's shipments."""
    return database.get_customer_incidents(user_id=user["id"])


@app.patch("/incidents/{incident_id}/status", response_model=IncidentResponse)
def update_incident_lifecycle(
    incident_id: str,
    data: IncidentStatusUpdate,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Advance incident lifecycle status: REPORTED -> UNDER INSPECTION -> RESOLVED / DISMISSED.
    Marks is_verified_damage = 1 when damage is confirmed, converting it into verified training data."""
    valid_statuses = ["REPORTED", "UNDER INSPECTION", "RESOLVED", "DISMISSED", "DAMAGE VERIFIED"]
    if data.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid incident status '{data.status}'. Must be one of {valid_statuses}",
        )

    updated = database.update_incident_status(
        incident_id=incident_id,
        status=data.status,
        resolution_note=data.resolution_note,
        is_verified_damage=data.is_verified_damage,
        user_id=user["id"],
        role=user.get("role", "driver"),
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    return updated


@app.get("/shipments/{shipment_id}/damage-risk")
def get_shipment_damage_risk_profile(
    shipment_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Retrieve comprehensive damage risk status, incident logs, and Model 2 data loop status for a shipment."""
    incidents = database.get_incidents_by_shipment(shipment_id, user_id=user["id"] if user.get("role") == "consumer" else None)
    verified_stats = database.get_damage_statistics()
    verified_count = verified_stats.get("verified_damage_count", 0)

    # Determine condition from incident lifecycle
    if not incidents:
        condition = "Normal"
        risk_status = "Low"
        has_verified_damage = False
        last_inspection = None
    else:
        latest = incidents[0]
        st = latest.get("status", "REPORTED")
        if st == "REPORTED":
            condition = "Incident Reported"
            risk_status = "High" if latest.get("severity") == "High" else "Medium"
        elif st == "UNDER INSPECTION":
            condition = "Under Inspection"
            risk_status = "High" if latest.get("severity") == "High" else "Medium"
        elif st in ["RESOLVED", "DAMAGE VERIFIED"]:
            if latest.get("is_verified_damage") == 1:
                condition = "Damage Verified"
                risk_status = "Medium"
            else:
                condition = "Resolved"
                risk_status = "Low"
        elif st == "DISMISSED":
            condition = "Resolved"
            risk_status = "Low"
        else:
            condition = "Monitoring"
            risk_status = "Low"

        is_latest_verified = bool(latest and latest.get("is_verified_damage") == 1 and latest.get("status") in ["RESOLVED", "DAMAGE VERIFIED"])
        has_verified_damage = any(i.get("is_verified_damage") == 1 for i in incidents)
        last_inspection = latest.get("inspected_at") or latest.get("resolved_at") or latest.get("timestamp")

    has_temp = any(i.get("incident_type") == "Temperature Issue" for i in incidents)
    has_spill = any(i.get("incident_type") in ["Spillage", "Package Damage", "Seal Broken"] for i in incidents)

    return {
        "shipment_id": shipment_id,
        "cargo_condition": condition,
        "risk_status": risk_status,
        "incident_count": len(incidents),
        "latest_incident": incidents[0] if incidents else None,
        "incidents": incidents,
        "has_temperature_issue": has_temp,
        "has_damage_spillage": has_spill,
        "last_inspection": last_inspection,
        "model_2_pipeline": {
            "status": "DATA COLLECTION" if verified_count < 50 else "SUFFICIENT DATA",
            "verified_damage_samples": verified_count,
            "threshold_required": 50,
            "is_included_in_training": is_latest_verified,
            "has_verified_damage": has_verified_damage,
            "status_message": (
                f"Model 2 is currently collecting verified operational data ({verified_count}/50 verified incidents). "
                "Training begins after sufficient verified examples are available."
            ) if verified_count < 50 else f"Sufficient verified operational data collected ({verified_count} verified samples). Ready for training.",
        },
    }


# ---------------------------------------------------------------------------
# API Endpoints - Human-in-the-Loop Telemetry Anomaly Detection
# ---------------------------------------------------------------------------


@app.post("/telemetry/evaluate")
def evaluate_telemetry_anomaly(
    data: TelemetryEvaluateRequest,
    driver: Dict[str, Any] = Depends(get_current_driver),
):
    """Evaluate live/simulated telemetry. Anomaly triggers Driver Alert for physical inspection.
    Telemetry anomaly does NOT automatically declare cargo damaged (Human-in-the-loop)."""
    anomalies = []
    if data.temperature is not None and data.temperature > 8.0:
        anomalies.append({
            "type": "Temperature Issue",
            "metric": f"{data.temperature:.1f}°C",
            "threshold": "8.0°C Max for Cold-Chain",
            "message": "Reefer temperature excursion detected. Immediate cargo seal inspection advised.",
        })
    if data.g_force is not None and data.g_force > 2.5:
        anomalies.append({
            "type": "Accident / Impact",
            "metric": f"{data.g_force:.2f} G",
            "threshold": "2.5 G Impact Limit",
            "message": "Severe dynamic impact / emergency braking event detected.",
        })

    has_alert = len(anomalies) > 0
    return {
        "shipment_id": data.shipment_id,
        "has_alert": has_alert,
        "anomalies": anomalies,
        "recommended_action": "INSPECT" if has_alert else "NORMAL_OPERATION",
        "notice": "Telemetry alert requires physical driver inspection before confirmation.",
    }


@app.post("/telemetry/dismiss")
def dismiss_telemetry_alert(
    data: TelemetryDismissRequest,
    driver: Dict[str, Any] = Depends(get_current_driver),
):
    """Driver physically verifies cargo and dismisses false telemetry alert.
    Dismissed alerts are NOT recorded as confirmed damage in ML training dataset."""
    return {
        "shipment_id": data.shipment_id,
        "dismissed": True,
        "dismissed_by": driver["name"],
        "reason": data.reason or "Normal road vibration / verified undamaged",
        "timestamp": datetime.now().isoformat(),
        "is_verified_damage": False,
    }


# ---------------------------------------------------------------------------
# API Endpoints - Damage Risk ML Pipeline & Statistics
# ---------------------------------------------------------------------------


@app.get("/damage-risk/stats")
def get_damage_statistics(user: Dict[str, Any] = Depends(get_current_user)):
    """Return historical damage statistics from SQLite for fleet and corridor risk modeling."""
    return database.get_damage_statistics()


@app.get("/damage-risk/pipeline-status")
def get_damage_pipeline_status():
    """Return the operational status and data collection progress for Future Model 2 (Damage Risk)."""
    if damage_ml_service:
        return damage_ml_service.get_pipeline_status()
    return {
        "model_status": "COLLECTING DATA",
        "pipeline_name": "Cargo Damage-Risk Operational Learning Pipeline",
        "verified_damage_samples": 0,
        "threshold_required": 50,
        "is_training_ready": False,
        "status_message": "Damage-risk model is currently in the data-collection phase. Verified driver incidents are being accumulated.",
    }


# ---------------------------------------------------------------------------
# API Endpoints - System Health
# ---------------------------------------------------------------------------


@app.get("/health")
def health_check():
    """Returns system status and database telemetry."""
    return {
        "status": "ok",
        "service": "Smart Freight Multi-User API",
        "database": "SQLite (smart_freight.db)",
    }


@app.get("/api/health")
def api_health_check():
    """Alias for /health endpoint."""
    return health_check()


# ---------------------------------------------------------------------------
# API Endpoints - User Isolated Shipments (CRUD + SQLite)
# ---------------------------------------------------------------------------


@app.post("/shipments", response_model=Shipment, status_code=status.HTTP_201_CREATED)
def create_or_save_shipment(
    data: ShipmentCreate,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Create and persist a new shipment record isolated to the authenticated user."""
    payload = data.model_dump()
    saved = database.create_shipment(payload, user_id=user["id"])
    _init_tracking(saved["id"])
    return saved


@app.get("/shipments", response_model=List[Shipment])
def list_all_shipments(user: Dict[str, Any] = Depends(get_current_user)):
    """Return all saved shipments belonging strictly to the authenticated user."""
    return database.get_all_shipments(user_id=user["id"])


@app.get("/shipments/{shipment_id}", response_model=Shipment)
def get_shipment_by_id(
    shipment_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Return a single saved shipment by its ID belonging to user."""
    shipment = database.get_shipment_by_id(shipment_id, user_id=user["id"])
    if not shipment:
        raise HTTPException(status_code=404, detail=f"Shipment {shipment_id} not found")
    return shipment


@app.put("/shipments/{shipment_id}", response_model=Shipment)
@app.patch("/shipments/{shipment_id}", response_model=Shipment)
def update_existing_shipment(
    shipment_id: str,
    data: ShipmentUpdate,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Update fields of an existing shipment belonging to user in SQLite."""
    payload = data.model_dump(exclude_unset=True)
    updated = database.update_shipment(shipment_id, payload, user_id=user["id"])
    if not updated:
        raise HTTPException(status_code=404, detail=f"Shipment {shipment_id} not found")
    return updated


@app.delete("/shipments/{shipment_id}", status_code=status.HTTP_200_OK)
def delete_shipment_by_id(
    shipment_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Delete a shipment record belonging to user from SQLite."""
    success = database.delete_shipment(shipment_id, user_id=user["id"])
    if not success:
        raise HTTPException(status_code=404, detail=f"Shipment {shipment_id} not found")
    return {"message": f"Shipment {shipment_id} deleted successfully", "id": shipment_id}


# ---------------------------------------------------------------------------
# API Endpoints - User Isolated Fleet Vehicles (CRUD + SQLite)
# ---------------------------------------------------------------------------


@app.get("/vehicles", response_model=List[Vehicle])
def list_vehicles(user: Dict[str, Any] = Depends(get_current_user)):
    """Return all fleet vehicles belonging strictly to the authenticated user."""
    return database.get_all_vehicles(user_id=user["id"])


@app.post("/vehicles", response_model=Vehicle, status_code=status.HTTP_201_CREATED)
def add_vehicle(
    data: VehicleCreate,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Add and persist a new vehicle into user's fleet registry."""
    payload = data.model_dump()
    return database.create_vehicle(payload, user_id=user["id"])


@app.get("/vehicles/{vehicle_id}", response_model=Vehicle)
def get_vehicle_by_id(
    vehicle_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Retrieve a single vehicle by ID belonging to user."""
    vehicle = database.get_vehicle_by_id(vehicle_id, user_id=user["id"])
    if not vehicle:
        raise HTTPException(status_code=404, detail=f"Vehicle {vehicle_id} not found")
    return vehicle


@app.put("/vehicles/{vehicle_id}", response_model=Vehicle)
@app.patch("/vehicles/{vehicle_id}", response_model=Vehicle)
def update_vehicle(
    vehicle_id: str,
    data: VehicleUpdate,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Update vehicle specifications or availability status for user's fleet."""
    payload = data.model_dump(exclude_unset=True)
    updated = database.update_vehicle(vehicle_id, payload, user_id=user["id"])
    if not updated:
        raise HTTPException(status_code=404, detail=f"Vehicle {vehicle_id} not found")
    return updated


@app.delete("/vehicles/{vehicle_id}", status_code=status.HTTP_200_OK)
def delete_vehicle(
    vehicle_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Delete a vehicle from the user's fleet registry."""
    success = database.delete_vehicle(vehicle_id, user_id=user["id"])
    if not success:
        raise HTTPException(status_code=404, detail=f"Vehicle {vehicle_id} not found")
    return {"message": f"Vehicle {vehicle_id} deleted successfully", "id": vehicle_id}


# ---------------------------------------------------------------------------
# Optimization & Tracking Endpoints
# ---------------------------------------------------------------------------


@app.post("/optimize", response_model=OptimizeResponse)
def optimize(user: Dict[str, Any] = Depends(get_current_user)):
    """Run the greedy matching algorithm across shipments and fleet for authenticated user."""
    all_shipments = database.get_all_shipments(user_id=user["id"])
    if not all_shipments:
        return OptimizeResponse(
            trips=[],
            total_separate_cost=0,
            total_consolidated_cost=0,
            total_savings=0,
            total_savings_percent=0,
        )

    trips = _build_trips(all_shipments, user_id=user["id"])

    total_separate = sum(t.separate_cost for t in trips)
    total_consolidated = sum(t.consolidated_cost for t in trips)
    total_savings = total_separate - total_consolidated
    total_savings_pct = (
        round((total_savings / total_separate) * 100, 2) if total_separate else 0.0
    )

    return OptimizeResponse(
        trips=trips,
        total_separate_cost=total_separate,
        total_consolidated_cost=total_consolidated,
        total_savings=total_savings,
        total_savings_percent=total_savings_pct,
    )


@app.get("/shipments/{shipment_id}/tracking", response_model=TrackingResponse)
def get_tracking(
    shipment_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Return current tracking status and stages for user's shipment."""
    shipment = database.get_shipment_by_id(shipment_id, user_id=user["id"])
    if not shipment:
        raise HTTPException(status_code=404, detail=f"Shipment {shipment_id} not found")

    if shipment_id not in tracking_store:
        _init_tracking(shipment_id)

    stages = tracking_store[shipment_id]
    current_status = shipment.get("status") or "Planned"

    return TrackingResponse(
        shipment_id=shipment_id,
        current_status=current_status,
        stages=stages,
    )


@app.post("/shipments/{shipment_id}/tracking/status", response_model=TrackingResponse)
def advance_tracking(
    shipment_id: str,
    user: Dict[str, Any] = Depends(get_current_user),
):
    """Advance shipment to next tracking stage and update SQLite for user."""
    shipment = database.get_shipment_by_id(shipment_id, user_id=user["id"])
    if not shipment:
        raise HTTPException(status_code=404, detail=f"Shipment {shipment_id} not found")

    if shipment_id not in tracking_store:
        _init_tracking(shipment_id)

    stages = tracking_store[shipment_id]

    next_stage = None
    for stage in stages:
        if not stage.completed:
            next_stage = stage
            break

    if next_stage is None:
        raise HTTPException(
            status_code=400,
            detail="Shipment has already reached the final stage.",
        )

    next_stage.completed = True
    next_stage.timestamp = datetime.now()

    # Update persistent status in SQLite
    database.update_shipment(shipment_id, {"status": next_stage.name}, user_id=user["id"])

    return TrackingResponse(
        shipment_id=shipment_id,
        current_status=next_stage.name,
        stages=stages,
    )


# ---------------------------------------------------------------------------
# API Endpoints - Real Street Routing Layer (Nominatim + OSRM)
# ---------------------------------------------------------------------------


@app.get("/route", response_model=RouteResponse)
@app.get("/routes/calculate", response_model=RouteResponse)
def get_street_route_query(
    origin: Optional[str] = None,
    pickup: Optional[str] = None,
    pickup_location: Optional[str] = None,
    destination: Optional[str] = None,
    stops: Optional[str] = None,
    waypoints: Optional[str] = None,
):
    """Calculate real road route, geometry, distance and duration via OpenStreetMap / OSRM.
    Supports origin/pickup/pickup_location, destination, stops, and waypoints query parameters."""
    orig = (origin or pickup or pickup_location or "").strip()
    dest = (destination or "").strip()

    stops_list = [s.strip() for s in stops.split(",") if s.strip()] if stops else None
    waypoints_list = [w.strip() for w in waypoints.split(",") if w.strip()] if waypoints else None

    if not orig and not waypoints_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required query parameter: 'origin' or 'pickup'.",
        )
    if not dest and not waypoints_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required query parameter: 'destination'.",
        )

    try:
        result = routing_service.calculate_street_route(
            pickup_location=orig,
            destination=dest,
            stops=stops_list,
            waypoints=waypoints_list,
        )
        return RouteResponse(**result)
    except LocationNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except NoRouteFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except RateLimitError as e:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=e.message)
    except RoutingServiceError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.post("/route", response_model=RouteResponse)
@app.post("/routes/calculate", response_model=RouteResponse)
def get_street_route_post(data: RouteRequest):
    """Calculate real road route, geometry, distance and duration via JSON payload."""
    orig = (data.origin or data.pickup_location or "").strip()
    dest = (data.destination or "").strip()

    if not orig and not data.waypoints:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required field: 'origin' or 'pickup_location'.",
        )
    if not dest and not data.waypoints:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required field: 'destination'.",
        )

    try:
        result = routing_service.calculate_street_route(
            pickup_location=orig,
            destination=dest,
            stops=data.stops,
            waypoints=data.waypoints,
        )
        return RouteResponse(**result)
    except LocationNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except NoRouteFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=e.message)
    except RateLimitError as e:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=e.message)
    except RoutingServiceError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


