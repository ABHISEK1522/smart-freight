"""
Smart Freight - Street Routing & Geocoding Service
===================================================
Isolated routing layer using OpenStreetMap technologies:
- Nominatim: Geocoding location text into coordinates (lat/lon)
- OSRM (Open Source Routing Machine): Real driving road network routing,
  actual road geometry coordinates, distance, and duration.

Configurable via environment variables with safe defaults and fallback endpoints.
"""

import json
import logging
import os
import re
import time
import urllib.parse
import urllib.request
from functools import lru_cache
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("smart_freight.routing")

# ---------------------------------------------------------------------------
# Configuration & Environment Variables
# ---------------------------------------------------------------------------

NOMINATIM_BASE_URL = os.getenv(
    "NOMINATIM_BASE_URL", "https://nominatim.openstreetmap.org"
).rstrip("/")

OSRM_BASE_URL = os.getenv(
    "OSRM_BASE_URL", "http://router.project-osrm.org/route/v1/driving"
).rstrip("/")

OSRM_FALLBACK_URL = os.getenv(
    "OSRM_FALLBACK_URL", "https://routing.openstreetmap.de/routed-car/route/v1/driving"
).rstrip("/")

NOMINATIM_USER_AGENT = os.getenv(
    "NOMINATIM_USER_AGENT", "SmartFreight-Logistics/1.0 (contact@smartfreight.io)"
)

ROUTING_TIMEOUT_SECONDS = int(os.getenv("ROUTING_TIMEOUT_SECONDS", "10"))


# ---------------------------------------------------------------------------
# Custom Domain Exceptions
# ---------------------------------------------------------------------------


class RoutingError(Exception):
    """Base exception for routing and geocoding operations."""

    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class LocationNotFoundError(RoutingError):
    """Raised when Nominatim cannot resolve a location query."""

    def __init__(self, location_name: str):
        super().__init__(
            f"Location '{location_name}' could not be resolved. Please specify a valid city or address.",
            status_code=404,
        )
        self.location_name = location_name


class NoRouteFoundError(RoutingError):
    """Raised when no drivable road path exists between the coordinates."""

    def __init__(self, origin: str, destination: str):
        super().__init__(
            f"No drivable road route found between '{origin}' and '{destination}'.",
            status_code=404,
        )
        self.origin = origin
        self.destination = destination


class RoutingServiceError(RoutingError):
    """Raised when the geocoding or routing upstream service fails."""

    def __init__(self, detail: str):
        super().__init__(
            f"Routing service temporary failure: {detail}",
            status_code=503,
        )


class RateLimitError(RoutingError):
    """Raised when external geocoding/routing rate limit is encountered."""

    def __init__(self, service_name: str = "OpenStreetMap"):
        super().__init__(
            f"Rate limit exceeded for {service_name}. Please try again shortly.",
            status_code=429,
        )


# ---------------------------------------------------------------------------
# Geocoding Layer (Nominatim)
# ---------------------------------------------------------------------------


@lru_cache(maxsize=256)
def _cached_geocode_query(query: str) -> Optional[Dict[str, Any]]:
    """Query Nominatim search API with in-memory caching to avoid redundant calls.
    Returns the top result dictionary or None if not found.
    """
    clean_query = query.strip()
    if not clean_query:
        return None

    # Append country context if needed or search directly
    encoded_query = urllib.parse.quote(clean_query)
    url = f"{NOMINATIM_BASE_URL}/search?q={encoded_query}&format=json&limit=1&addressdetails=1"

    headers = {
        "User-Agent": NOMINATIM_USER_AGENT,
        "Accept": "application/json",
    }

    req = urllib.request.Request(url, headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=ROUTING_TIMEOUT_SECONDS) as response:
            if response.status == 429:
                raise RateLimitError("Nominatim Geocoding")

            raw_data = response.read().decode("utf-8")
            results = json.loads(raw_data)

            if not results or not isinstance(results, list):
                # Retry with ", India" suffix if the query was just a single city name
                if "," not in clean_query:
                    fallback_query = urllib.parse.quote(f"{clean_query}, India")
                    fallback_url = f"{NOMINATIM_BASE_URL}/search?q={fallback_query}&format=json&limit=1&addressdetails=1"
                    fallback_req = urllib.request.Request(fallback_url, headers=headers)
                    with urllib.request.urlopen(fallback_req, timeout=ROUTING_TIMEOUT_SECONDS) as fb_resp:
                        fb_results = json.loads(fb_resp.read().decode("utf-8"))
                        if fb_results and isinstance(fb_results, list):
                            return fb_results[0]
                return None

            return results[0]

    except urllib.error.HTTPError as e:
        if e.code == 429:
            raise RateLimitError("Nominatim Geocoding")
        logger.error("Nominatim HTTP Error: %s", e)
        raise RoutingServiceError(f"Nominatim returned HTTP {e.code}")
    except urllib.error.URLError as e:
        logger.error("Nominatim Network Error: %s", e)
        raise RoutingServiceError(f"Unable to reach geocoding service: {e.reason}")
    except Exception as e:
        logger.error("Nominatim Unexpected Error: %s", e)
        raise RoutingServiceError(str(e))


def geocode_location(location_name: str) -> Dict[str, Any]:
    """Geocode a location text string into standardized coordinates.

    Returns:
        dict: {
            "name": str,
            "latitude": float,
            "longitude": float,
            "display_name": str
        }
    """
    if not location_name or not location_name.strip():
        raise LocationNotFoundError("(empty location)")

    result = _cached_geocode_query(location_name.strip())
    if not result or "lat" not in result or "lon" not in result:
        raise LocationNotFoundError(location_name)

    try:
        lat = round(float(result["lat"]), 6)
        lon = round(float(result["lon"]), 6)
    except (ValueError, TypeError):
        raise LocationNotFoundError(location_name)

    # Use first component of display_name or query name
    display_name = result.get("display_name", location_name)

    return {
        "name": location_name.strip(),
        "latitude": lat,
        "longitude": lon,
        "display_name": display_name,
    }


# ---------------------------------------------------------------------------
# Routing Layer (OSRM Driving Route Engine)
# ---------------------------------------------------------------------------


def _fetch_osrm_multi_route(
    base_url: str,
    coords_list: List[Tuple[float, float]],
) -> Optional[Dict[str, Any]]:
    """Query an OSRM-compatible routing endpoint with arbitrary waypoints.
    coords_list is a list of (lon, lat) tuples in travel sequence.
    """
    if len(coords_list) < 2:
        return None

    # OSRM expects: {lon1},{lat1};{lon2},{lat2};{lon3},{lat3}...
    coords_path = ";".join(f"{round(lon, 6)},{round(lat, 6)}" for lon, lat in coords_list)
    url = f"{base_url}/{coords_path}?overview=full&geometries=geojson&steps=false"

    headers = {
        "User-Agent": NOMINATIM_USER_AGENT,
        "Accept": "application/json",
    }

    req = urllib.request.Request(url, headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=ROUTING_TIMEOUT_SECONDS) as response:
            if response.status == 200:
                raw_data = response.read().decode("utf-8")
                data = json.loads(raw_data)
                if data.get("code") == "Ok" and data.get("routes"):
                    return data
            elif response.status == 429:
                raise RateLimitError("OSRM Routing")
    except urllib.error.HTTPError as e:
        if e.code == 429:
            raise RateLimitError("OSRM Routing")
        logger.warning("OSRM error from %s: HTTP %s", base_url, e.code)
    except Exception as e:
        logger.warning("OSRM connection error from %s: %s", base_url, e)

    return None


def _fetch_osrm_route(
    base_url: str,
    lon1: float,
    lat1: float,
    lon2: float,
    lat2: float,
) -> Optional[Dict[str, Any]]:
    """Query an OSRM-compatible routing endpoint for 2 points."""
    return _fetch_osrm_multi_route(base_url, [(lon1, lat1), (lon2, lat2)])


def get_road_route(
    origin_lon: float,
    origin_lat: float,
    dest_lon: float,
    dest_lat: float,
    origin_name: str = "Origin",
    dest_name: str = "Destination",
    coords_list: Optional[List[Tuple[float, float]]] = None,
) -> Dict[str, Any]:
    """Retrieve actual road route geometry, distance, and duration between coordinates.
    Supports 2 coordinates or a full multi-waypoint coordinates list [(lon, lat), ...].

    Returns:
        dict: {
            "distance_km": float,
            "duration_minutes": float,
            "route_geometry": list of [lon, lat] coordinates,
            "route_summary": Optional[str]
        }
    """
    points = coords_list if coords_list and len(coords_list) >= 2 else [(origin_lon, origin_lat), (dest_lon, dest_lat)]

    # 1. Try Primary OSRM Endpoint
    osrm_data = _fetch_osrm_multi_route(OSRM_BASE_URL, points)

    # 2. Try Fallback OSRM Endpoint if primary failed
    if not osrm_data and OSRM_FALLBACK_URL:
        logger.info("Attempting fallback routing provider: %s", OSRM_FALLBACK_URL)
        osrm_data = _fetch_osrm_multi_route(OSRM_FALLBACK_URL, points)

    if not osrm_data or not osrm_data.get("routes"):
        raise NoRouteFoundError(origin_name, dest_name)

    route = osrm_data["routes"][0]

    distance_meters = float(route.get("distance", 0.0))
    duration_seconds = float(route.get("duration", 0.0))

    distance_km = round(distance_meters / 1000.0, 1)
    duration_minutes = round(duration_seconds / 60.0, 1)

    geometry = route.get("geometry", {})
    coordinates = geometry.get("coordinates", [])

    # Ensure coordinates is a list of [lon, lat] points
    if not coordinates or not isinstance(coordinates, list):
        # Fallback to direct path between waypoints if geometry was empty
        coordinates = [[lon, lat] for lon, lat in points]

    # Route summary / road names (e.g. "NH16", "Grand Trunk Rd")
    legs = route.get("legs", [])
    summaries = [leg.get("summary") for leg in legs if leg.get("summary")]
    route_summary = ", ".join(dict.fromkeys(summaries)) if summaries else (route.get("weight_name", "") or None)

    return {
        "distance_km": distance_km,
        "duration_minutes": duration_minutes,
        "route_geometry": coordinates,
        "route_summary": route_summary or None,
    }


# ---------------------------------------------------------------------------
# Workflow Orchestrator
# ---------------------------------------------------------------------------


def calculate_street_route(
    pickup_location: str,
    destination: str,
    stops: Optional[List[str]] = None,
    waypoints: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Execute complete workflow:
    1. Parse and geocode all waypoints (origin, intermediate stops, destination)
    2. Calculate continuous road route via OSRM through all waypoints
    3. Return standardized route object with coordinates and real road geometry.
    """
    # Parse waypoints from args or corridor notation (e.g. "Bhubaneswar → Cuttack → Kolkata")
    location_chain: List[str] = []

    if waypoints and len(waypoints) >= 2:
        location_chain = [w.strip() for w in waypoints if w and w.strip()]
    else:
        # Check for arrow / delimiter notation
        if "→" in pickup_location or "->" in pickup_location:
            parts = [p.strip() for p in re.split(r"→|->", pickup_location) if p.strip()]
            location_chain = parts
        elif "→" in destination or "->" in destination:
            parts = [pickup_location.strip()] + [p.strip() for p in re.split(r"→|->", destination) if p.strip()]
            location_chain = parts
        else:
            orig = pickup_location.strip()
            dest = destination.strip()
            intermediate = [s.strip() for s in (stops or []) if s and s.strip()]
            location_chain = [orig] + intermediate + [dest]

    if len(location_chain) < 2:
        raise LocationNotFoundError("Route requires at least an origin and a destination.")

    # Geocode all waypoints
    geocoded_chain: List[Dict[str, Any]] = []
    for loc in location_chain:
        geo = geocode_location(loc)
        geocoded_chain.append(geo)

    origin_geo = geocoded_chain[0]
    dest_geo = geocoded_chain[-1]
    stops_geo = geocoded_chain[1:-1] if len(geocoded_chain) > 2 else []

    coords_list = [(g["longitude"], g["latitude"]) for g in geocoded_chain]

    # Calculate Continuous Road Route via OSRM
    route_data = get_road_route(
        origin_lon=origin_geo["longitude"],
        origin_lat=origin_geo["latitude"],
        dest_lon=dest_geo["longitude"],
        dest_lat=dest_geo["latitude"],
        origin_name=origin_geo["name"],
        dest_name=dest_geo["name"],
        coords_list=coords_list,
    )

    return {
        "origin": {
            "name": origin_geo["name"],
            "latitude": origin_geo["latitude"],
            "longitude": origin_geo["longitude"],
        },
        "destination": {
            "name": dest_geo["name"],
            "latitude": dest_geo["latitude"],
            "longitude": dest_geo["longitude"],
        },
        "stops": [
            {
                "name": s["name"],
                "latitude": s["latitude"],
                "longitude": s["longitude"],
            }
            for s in stops_geo
        ],
        "waypoints": [
            {
                "name": g["name"],
                "latitude": g["latitude"],
                "longitude": g["longitude"],
            }
            for g in geocoded_chain
        ],
        "distance_km": route_data["distance_km"],
        "duration_minutes": route_data["duration_minutes"],
        "route_geometry": route_data["route_geometry"],
        "route_summary": route_data.get("route_summary"),
    }

