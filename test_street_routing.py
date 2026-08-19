"""
Automated Test Suite for Smart Freight Street Routing Layer
===========================================================
Tests OpenStreetMap Nominatim geocoding, OSRM road routing,
FastAPI /route endpoints (GET & POST), error handling, and geometry structure.
"""

import json
import os
import sys
import urllib.parse
import urllib.request

import routing_service
from main import (
    RouteRequest,
    RouteResponse,
    get_street_route_post,
    get_street_route_query,
)


def test_geocoding():
    print("\n[TEST 1] Testing Nominatim Geocoding...")
    # Bhubaneswar
    bbsr = routing_service.geocode_location("Bhubaneswar")
    assert bbsr["name"] == "Bhubaneswar"
    assert 20.0 < bbsr["latitude"] < 21.0
    assert 85.0 < bbsr["longitude"] < 86.5
    print(f"  [PASS] Geocoded Bhubaneswar -> ({bbsr['latitude']}, {bbsr['longitude']})")

    # Kolkata
    kol = routing_service.geocode_location("Kolkata")
    assert kol["name"] == "Kolkata"
    assert 22.0 < kol["latitude"] < 23.5
    assert 88.0 < kol["longitude"] < 89.0
    print(f"  [PASS] Geocoded Kolkata -> ({kol['latitude']}, {kol['longitude']})")


def test_calculate_street_route_service():
    print("\n[TEST 2] Testing calculate_street_route Service Function...")
    result = routing_service.calculate_street_route("Bhubaneswar", "Kolkata")

    # Origin and Destination checks
    assert result["origin"]["name"] == "Bhubaneswar"
    assert result["destination"]["name"] == "Kolkata"
    assert isinstance(result["origin"]["latitude"], float)
    assert isinstance(result["origin"]["longitude"], float)
    assert isinstance(result["destination"]["latitude"], float)
    assert isinstance(result["destination"]["longitude"], float)

    # Road Distance and Duration checks (Bhubaneswar to Kolkata is ~440 km, ~300-400 mins)
    assert 400.0 < result["distance_km"] < 480.0
    assert 200.0 < result["duration_minutes"] < 600.0
    print(f"  [PASS] Road Distance: {result['distance_km']} km")
    print(f"  [PASS] Estimated Duration: {result['duration_minutes']} minutes")

    # Geometry checks (Ordered GeoJSON coordinates [lon, lat])
    geom = result["route_geometry"]
    assert isinstance(geom, list)
    assert len(geom) > 500, f"Expected rich road geometry, got {len(geom)} points"
    assert len(geom[0]) == 2  # [lon, lat]
    assert 85.0 < geom[0][0] < 86.5
    assert 20.0 < geom[0][1] < 21.0
    print(f"  [PASS] Route Geometry points: {len(geom)} coordinates")
    print(f"  [PASS] Start Point: {geom[0]}, End Point: {geom[-1]}")


def test_api_handlers_direct():
    print("\n[TEST 3] Testing FastAPI Route Handlers Directly...")

    # 1. GET /route handler
    res_get = get_street_route_query(origin="Bhubaneswar", destination="Kolkata")
    assert isinstance(res_get, RouteResponse)
    assert res_get.origin.name == "Bhubaneswar"
    assert res_get.destination.name == "Kolkata"
    assert res_get.distance_km > 400
    assert len(res_get.route_geometry) > 500
    print("  [PASS] get_street_route_query(origin='Bhubaneswar', destination='Kolkata') -> Valid RouteResponse")

    # 2. GET with pickup alias
    res_pickup = get_street_route_query(pickup="Puri", destination="Cuttack")
    assert res_pickup.origin.name == "Puri"
    assert res_pickup.destination.name == "Cuttack"
    assert 70.0 < res_pickup.distance_km < 120.0
    print(f"  [PASS] get_street_route_query(pickup='Puri', destination='Cuttack') -> {res_pickup.distance_km} km")

    # 3. POST /route handler
    req_body = RouteRequest(origin="Bhubaneswar", destination="Kolkata")
    res_post = get_street_route_post(req_body)
    assert isinstance(res_post, RouteResponse)
    assert res_post.origin.name == "Bhubaneswar"
    assert res_post.destination.name == "Kolkata"
    assert res_post.distance_km > 400
    print("  [PASS] get_street_route_post(RouteRequest) -> Valid RouteResponse")


def test_error_handling():
    print("\n[TEST 4] Testing Error Handling...")
    from fastapi import HTTPException

    # 1. Invalid Location -> 404
    try:
        get_street_route_query(origin="NonExistentFaketown99999", destination="Kolkata")
        assert False, "Should have raised 404 HTTPException"
    except HTTPException as e:
        assert e.status_code == 404
        assert "could not be resolved" in e.detail
        print(f"  [PASS] Invalid location correctly raised HTTP 404: {e.detail}")

    # 2. Missing parameter -> 400
    try:
        get_street_route_query(origin="", destination="Kolkata")
        assert False, "Should have raised 400 HTTPException"
    except HTTPException as e:
        assert e.status_code == 400
        print("  [PASS] Missing origin correctly raised HTTP 400")

    # 3. Missing destination in POST -> 400
    try:
        get_street_route_post(RouteRequest(origin="Bhubaneswar", destination=""))
        assert False, "Should have raised 400 HTTPException"
    except HTTPException as e:
        assert e.status_code == 400
        print("  [PASS] Missing destination in POST correctly raised HTTP 400")


if __name__ == "__main__":
    print("=" * 65)
    print("SMART FREIGHT - REAL STREET ROUTING LAYER TEST RUNNER")
    print("=" * 65)

    try:
        test_geocoding()
        test_calculate_street_route_service()
        test_api_handlers_direct()
        test_error_handling()
        print("\n" + "=" * 65)
        print(">>> ALL STREET ROUTING TESTS PASSED SUCCESSFULLY! <<<")
        print("=" * 65)
    except AssertionError as e:
        print(f"\n[FAIL] Assertion failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Unexpected exception: {e}")
        sys.exit(1)
