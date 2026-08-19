import json
import re
import uuid
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
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

# ---------------------------------------------------------------------------
# App & Database Initialization
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Smart Freight API",
    description="Multi-user dispatch, fleet management, and corridor optimization platform",
    version="0.4.0",
)

# Initialize SQLite database and tables on startup
database.init_db()

# Allow requests from Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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

    # --- Risk assessment ---
    delay_risk_percent: float = Field(..., example=42.0)
    spoilage_risk_percent: float = Field(..., example=35.0)
    overall_risk_percent: float = Field(..., example=38.5)
    risk_level: str = Field(..., example="MEDIUM")
    explanations: list[str] = Field(
        ..., example=["Long route distance increases delay risk."]
    )


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


class RouteResponse(BaseModel):
    """Real road route geometry and journey telemetry."""

    origin: LocationPoint
    destination: LocationPoint
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

        risk = _assess_risk(
            trip_shipments=trip_shipments,
            route=route,
            distance_km=distance_km,
            duration_hrs=duration_hrs,
            is_refrigerated=is_reefer,
        )

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
            **risk,
        )
        trips.append(trip)

    return trips


MASTER_CORRIDOR = ["Puri", "Bhubaneswar", "Cuttack", "Jamshedpur", "Kolkata", "Howrah"]
SEGMENT_DISTANCE_KM: dict[tuple[str, str], float] = {
    ("Puri", "Bhubaneswar"): 60,
    ("Bhubaneswar", "Cuttack"): 30,
    ("Cuttack", "Jamshedpur"): 200,
    ("Jamshedpur", "Kolkata"): 150,
    ("Kolkata", "Howrah"): 10,
}
AVG_SPEED_KMH = 50.0


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

    duration_hrs = round(total_km / AVG_SPEED_KMH, 1)
    return route, total_km, duration_hrs


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
def get_street_route_query(
    origin: Optional[str] = None,
    pickup: Optional[str] = None,
    pickup_location: Optional[str] = None,
    destination: Optional[str] = None,
):
    """Calculate real road route, geometry, distance and duration via OpenStreetMap / OSRM.
    Supports origin/pickup/pickup_location and destination query parameters."""
    orig = (origin or pickup or pickup_location or "").strip()
    dest = (destination or "").strip()

    if not orig:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required query parameter: 'origin' or 'pickup'.",
        )
    if not dest:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required query parameter: 'destination'.",
        )

    try:
        result = routing_service.calculate_street_route(orig, dest)
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
def get_street_route_post(data: RouteRequest):
    """Calculate real road route, geometry, distance and duration via JSON payload."""
    orig = (data.origin or data.pickup_location or "").strip()
    dest = (data.destination or "").strip()

    if not orig:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required field: 'origin' or 'pickup_location'.",
        )
    if not dest:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required field: 'destination'.",
        )

    try:
        result = routing_service.calculate_street_route(orig, dest)
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

