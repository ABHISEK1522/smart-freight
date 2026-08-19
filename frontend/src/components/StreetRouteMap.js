"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Navigation,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertCircle,
  Truck,
  MapPin,
  Clock,
  Milestone,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

/**
 * Calculate geographic compass bearing between two coordinates in degrees (0 - 360)
 * 0 = North (Up), 90 = East (Right), 180 = South (Down), 270 = West (Left)
 */
function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/**
 * Geodesic approximation for distance between two lat/lon points in meters (Haversine)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Preprocess raw route coordinates into a smooth, uniformly-sampled animation path
 * with continuous unwrapped and smoothed headings to guarantee jitter-free motion.
 */
function buildSmoothAnimationPath(rawLatLngs, sampleCount = 1200) {
  if (!rawLatLngs || rawLatLngs.length < 2) return null;

  // 1. Calculate cumulative distance along raw road coordinates
  const rawCumDists = [0];
  for (let i = 1; i < rawLatLngs.length; i++) {
    const d = haversineDistance(
      rawLatLngs[i - 1][0],
      rawLatLngs[i - 1][1],
      rawLatLngs[i][0],
      rawLatLngs[i][1]
    );
    rawCumDists.push(rawCumDists[i - 1] + d);
  }
  const totalDistance = rawCumDists[rawCumDists.length - 1];
  if (totalDistance <= 0) return null;

  const count = Math.max(200, Math.min(sampleCount, 2500));
  const samples = [];
  let rawIdx = 0;

  // 2. Uniformly resample along the exact road geometry
  for (let i = 0; i < count; i++) {
    const targetDist = (i / (count - 1)) * totalDistance;

    while (
      rawIdx < rawCumDists.length - 2 &&
      rawCumDists[rawIdx + 1] < targetDist
    ) {
      rawIdx++;
    }

    const segStartDist = rawCumDists[rawIdx];
    const segEndDist = rawCumDists[rawIdx + 1] || segStartDist + 0.0001;
    const ratio = Math.max(
      0,
      Math.min(1, (targetDist - segStartDist) / (segEndDist - segStartDist))
    );

    const p1 = rawLatLngs[rawIdx];
    const p2 = rawLatLngs[Math.min(rawIdx + 1, rawLatLngs.length - 1)];

    const lat = p1[0] + (p2[0] - p1[0]) * ratio;
    const lon = p1[1] + (p2[1] - p1[1]) * ratio;

    samples.push({ lat, lon, dist: targetDist });
  }

  // 3. Compute forward tangent heading using lookahead window (~150-250 meters ahead)
  const lookAheadOffset = Math.max(3, Math.floor(count / 150));
  const rawHeadings = [];

  for (let i = 0; i < count; i++) {
    const nextIdx = Math.min(i + lookAheadOffset, count - 1);
    let heading;
    if (nextIdx > i) {
      heading = calculateBearing(
        samples[i].lat,
        samples[i].lon,
        samples[nextIdx].lat,
        samples[nextIdx].lon
      );
    } else {
      const prevIdx = Math.max(0, i - lookAheadOffset);
      heading = calculateBearing(
        samples[prevIdx].lat,
        samples[prevIdx].lon,
        samples[i].lat,
        samples[i].lon
      );
    }
    rawHeadings.push(heading);
  }

  // 4. Unwrap angles to eliminate 0°/360° jump discontinuities
  const unwrappedHeadings = [rawHeadings[0]];
  for (let i = 1; i < count; i++) {
    const prev = unwrappedHeadings[i - 1];
    const curr = rawHeadings[i];
    const diff = (((curr - prev) % 360) + 540) % 360 - 180;
    unwrappedHeadings.push(prev + diff);
  }

  // 5. Apply localized Gaussian/box smoothing filter on headings to eliminate micro-jitter
  const smoothRadius = 4;
  const finalPoints = [];

  for (let i = 0; i < count; i++) {
    let sumHeading = 0;
    let weightSum = 0;

    for (let r = -smoothRadius; r <= smoothRadius; r++) {
      const neighborIdx = Math.max(0, Math.min(count - 1, i + r));
      const weight = smoothRadius + 1 - Math.abs(r);
      sumHeading += unwrappedHeadings[neighborIdx] * weight;
      weightSum += weight;
    }

    finalPoints.push({
      lat: samples[i].lat,
      lon: samples[i].lon,
      heading: sumHeading / weightSum,
    });
  }

  return {
    points: finalPoints,
    totalDistance,
    pointCount: count,
  };
}

/**
 * Return tailored vector illustration & dimension metadata for each Smart Freight vehicle type.
 * All illustrations are drawn facing forward/North (0°) so that rotating by `bearing` aligns
 * the front of the vehicle directly with the road direction.
 */
function getVehicleIllustrationConfig(type) {
  const norm = (type || "").toLowerCase().replace(/[\s_()]/g, "-");

  // 1. HEAVY TRUCK / MULTI-AXLE TRAILER (e.g. Refrigerated Truck (Heavy), Express Heavy Carrier)
  if (
    norm.includes("heavy") ||
    (norm.includes("refrigerated") && norm.includes("truck"))
  ) {
    return {
      label: "Heavy Reefer Trailer",
      width: 28,
      height: 58,
      svg: `
        <svg viewBox="0 0 28 58" width="28" height="58" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.55));">
          <!-- Main Chassis Outline Shadow -->
          <rect x="3" y="2" width="22" height="54" rx="3.5" fill="#090d16" />

          <!-- Articulated Trailer Cargo Box (Insulated Cold-Chain White Body) -->
          <rect x="3" y="15" width="22" height="40" rx="2" fill="#f8fafc" stroke="#334155" stroke-width="1.2" />
          
          <!-- Cold-Chain Cyan/Blue Identification Stripe -->
          <rect x="4" y="24" width="20" height="3" fill="#0284c7" />
          <line x1="4" y1="36" x2="24" y2="36" stroke="#0ea5e9" stroke-width="0.8" stroke-dasharray="2 2" />

          <!-- Trailer Roof Aerodynamic Thermal Ribs -->
          <line x1="7" y1="18" x2="21" y2="18" stroke="#cbd5e1" stroke-width="1" stroke-linecap="round" />
          <line x1="7" y1="44" x2="21" y2="44" stroke="#cbd5e1" stroke-width="1" stroke-linecap="round" />
          <line x1="7" y1="50" x2="21" y2="50" stroke="#cbd5e1" stroke-width="1" stroke-linecap="round" />

          <!-- Rooftop Chiller / Condenser Unit -->
          <rect x="8" y="16" width="12" height="5" rx="1" fill="#0284c7" stroke="#0369a1" stroke-width="0.8" />
          <circle cx="11" cy="18.5" r="1.2" fill="#e0f2fe" />
          <circle cx="17" cy="18.5" r="1.2" fill="#e0f2fe" />

          <!-- Articulation Gap / Fifth Wheel Hitch -->
          <rect x="10" y="12.5" width="8" height="2.5" rx="0.5" fill="#1e293b" />

          <!-- Heavy Tractor Cab (Dark Slate Commercial Cab) -->
          <path d="M 5 13 L 5 6 Q 5 2 14 2 Q 23 2 23 6 L 23 13 Z" fill="#0f172a" stroke="#334155" stroke-width="1" />
          
          <!-- Panoramic Windshield (Reflective Sky Blue Tint) -->
          <path d="M 7 9 L 7 6 Q 7 4 14 4 Q 21 4 21 6 L 21 9 Q 14 8 7 9 Z" fill="#38bdf8" opacity="0.9" />
          <line x1="12" y1="5" x2="16" y2="8" stroke="#ffffff" stroke-width="0.8" opacity="0.75" />

          <!-- Side Mirrors -->
          <rect x="2" y="7" width="2" height="3" rx="0.5" fill="#475569" />
          <rect x="24" y="7" width="2" height="3" rx="0.5" fill="#475569" />

          <!-- Amber Headlights -->
          <rect x="6" y="2" width="3" height="1.5" rx="0.5" fill="#facc15" />
          <rect x="19" y="2" width="3" height="1.5" rx="0.5" fill="#facc15" />

          <!-- Red Rear Taillamps -->
          <rect x="4" y="54" width="3" height="1" rx="0.3" fill="#ef4444" />
          <rect x="21" y="54" width="3" height="1" rx="0.3" fill="#ef4444" />
        </svg>
      `,
    };
  }

  // 2. REFRIGERATED VAN (MEDIUM REEFER VAN) (e.g. Refrigerated Van (Medium), Mini Van)
  if (norm.includes("refrigerated") || norm.includes("van")) {
    return {
      label: "Refrigerated Van",
      width: 24,
      height: 44,
      svg: `
        <svg viewBox="0 0 24 44" width="24" height="44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.55));">
          <!-- Van Body Shell -->
          <path d="M 4 8 Q 4 2 12 2 Q 20 2 20 8 L 20 40 Q 20 42 18 42 L 6 42 Q 4 42 4 40 Z" fill="#ffffff" stroke="#334155" stroke-width="1.2" />

          <!-- Cold-Chain Wave Stripe -->
          <path d="M 4 20 Q 12 18 20 22 L 20 25 Q 12 21 4 23 Z" fill="#0284c7" />

          <!-- Rooftop Chiller Unit -->
          <rect x="7" y="14" width="10" height="4" rx="1" fill="#0ea5e9" stroke="#0284c7" stroke-width="0.8" />
          <line x1="9" y1="16" x2="15" y2="16" stroke="#ffffff" stroke-width="0.8" stroke-linecap="round" />

          <!-- Front Windshield -->
          <path d="M 6 10 L 6 7 Q 6 4.5 12 4.5 Q 18 4.5 18 7 L 18 10 Q 12 9 6 10 Z" fill="#38bdf8" opacity="0.9" />
          <line x1="10" y1="5.5" x2="14" y2="8.5" stroke="#ffffff" stroke-width="0.7" opacity="0.75" />

          <!-- Side Mirrors -->
          <rect x="2.5" y="8" width="1.8" height="2.5" rx="0.4" fill="#334155" />
          <rect x="19.7" y="8" width="1.8" height="2.5" rx="0.4" fill="#334155" />

          <!-- Headlights -->
          <rect x="5" y="2.5" width="2.5" height="1.2" rx="0.4" fill="#facc15" />
          <rect x="16.5" y="2.5" width="2.5" height="1.2" rx="0.4" fill="#facc15" />

          <!-- Rear Doors Center Seam & Taillights -->
          <line x1="12" y1="28" x2="12" y2="42" stroke="#cbd5e1" stroke-width="0.8" />
          <rect x="4.5" y="40.5" width="2.5" height="1" rx="0.3" fill="#ef4444" />
          <rect x="17" y="40.5" width="2.5" height="1" rx="0.3" fill="#ef4444" />
        </svg>
      `,
    };
  }

  // 3. LIGHT DELIVERY TRUCK (e.g. Light Delivery Truck, Agile Cargo)
  if (norm.includes("light")) {
    return {
      label: "Light Delivery Truck",
      width: 24,
      height: 42,
      svg: `
        <svg viewBox="0 0 24 42" width="24" height="42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.55));">
          <!-- Light Truck Cargo Bed (Covered Canvas / Steel Bed) -->
          <rect x="4" y="14" width="16" height="26" rx="1.8" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.2" />
          <line x1="6" y1="20" x2="18" y2="20" stroke="#94a3b8" stroke-width="0.8" />
          <line x1="6" y1="28" x2="18" y2="28" stroke="#94a3b8" stroke-width="0.8" />
          <line x1="6" y1="34" x2="18" y2="34" stroke="#94a3b8" stroke-width="0.8" />

          <!-- Cab Frame -->
          <path d="M 5 13 L 5 6 Q 5 2.5 12 2.5 Q 19 2.5 19 6 L 19 13 Z" fill="#1e293b" stroke="#334155" stroke-width="1" />
          
          <!-- Windshield -->
          <path d="M 6.5 9 L 6.5 6.5 Q 6.5 4.5 12 4.5 Q 17.5 4.5 17.5 6.5 L 17.5 9 Z" fill="#38bdf8" opacity="0.9" />

          <!-- Side Mirrors -->
          <rect x="2.5" y="7" width="1.8" height="2.5" rx="0.4" fill="#475569" />
          <rect x="19.7" y="7" width="1.8" height="2.5" rx="0.4" fill="#475569" />

          <!-- Headlights -->
          <rect x="5.5" y="2.5" width="2.5" height="1.2" rx="0.4" fill="#facc15" />
          <rect x="16" y="2.5" width="2.5" height="1.2" rx="0.4" fill="#facc15" />

          <!-- Taillights -->
          <rect x="4.5" y="39" width="2.2" height="1" rx="0.3" fill="#ef4444" />
          <rect x="17.3" y="39" width="2.2" height="1" rx="0.3" fill="#ef4444" />
        </svg>
      `,
    };
  }

  // 4. PICKUP / UTILITY VEHICLE (e.g. Pickup, Small Utility)
  if (norm.includes("pickup") || norm.includes("utility")) {
    return {
      label: "Pickup Utility",
      width: 22,
      height: 38,
      svg: `
        <svg viewBox="0 0 22 38" width="22" height="38" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.55));">
          <!-- Open Cargo Bed with Tie-Down Rails -->
          <rect x="3.5" y="16" width="15" height="20" rx="1.5" fill="#334155" stroke="#1e293b" stroke-width="1.1" />
          <rect x="5.5" y="18" width="11" height="16" rx="1" fill="#1e293b" />
          <line x1="7" y1="26" x2="15" y2="26" stroke="#475569" stroke-width="0.8" />

          <!-- Cab -->
          <path d="M 4 15 L 4 6 Q 4 2.5 11 2.5 Q 18 2.5 18 6 L 18 15 Z" fill="#0f172a" stroke="#334155" stroke-width="1" />
          
          <!-- Tinted Windshield -->
          <path d="M 5.5 10 L 5.5 6.5 Q 5.5 4.5 11 4.5 Q 16.5 4.5 16.5 6.5 L 16.5 10 Z" fill="#38bdf8" opacity="0.9" />

          <!-- Mirrors -->
          <rect x="1.8" y="7" width="1.6" height="2.2" rx="0.3" fill="#475569" />
          <rect x="18.6" y="7" width="1.6" height="2.2" rx="0.3" fill="#475569" />

          <!-- Lights -->
          <rect x="4.5" y="2.5" width="2.2" height="1" fill="#facc15" />
          <rect x="15.3" y="2.5" width="2.2" height="1" fill="#facc15" />
          <rect x="4" y="35" width="2" height="1" fill="#ef4444" />
          <rect x="16" y="35" width="2" height="1" fill="#ef4444" />
        </svg>
      `,
    };
  }

  // 5. STANDARD FREIGHT TRUCK (MEDIUM RIGID CARGO TRUCK - DEFAULT)
  return {
    label: "Standard Cargo Truck",
    width: 26,
    height: 50,
    svg: `
      <svg viewBox="0 0 26 50" width="26" height="50" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.55));">
        <!-- Main Chassis Outline Shadow -->
        <rect x="3" y="2" width="20" height="46" rx="3" fill="#090d16" />

        <!-- Dry Freight Cargo Box (Solid Light Slate / White Box) -->
        <rect x="3" y="13" width="20" height="35" rx="1.8" fill="#f1f5f9" stroke="#334155" stroke-width="1.2" />
        
        <!-- Cargo Body Texture & Logo Panel -->
        <line x1="5" y1="20" x2="21" y2="20" stroke="#cbd5e1" stroke-width="0.8" />
        <line x1="5" y1="28" x2="21" y2="28" stroke="#cbd5e1" stroke-width="0.8" />
        <line x1="5" y1="36" x2="21" y2="36" stroke="#cbd5e1" stroke-width="0.8" />
        <line x1="5" y1="42" x2="21" y2="42" stroke="#cbd5e1" stroke-width="0.8" />
        
        <rect x="6" y="22" width="14" height="4.5" rx="0.8" fill="#1e293b" />
        <text x="7.5" y="25.5" font-size="3" font-weight="bold" fill="#ffffff" font-family="monospace">SMART</text>

        <!-- Driver Cab -->
        <path d="M 4.5 12 L 4.5 5.5 Q 4.5 2 13 2 Q 21.5 2 21.5 5.5 L 21.5 12 Z" fill="#1e293b" stroke="#334155" stroke-width="1" />
        
        <!-- Windshield -->
        <path d="M 6 8.5 L 6 6 Q 6 4 13 4 Q 20 4 20 6 L 20 8.5 Q 13 7.5 6 8.5 Z" fill="#38bdf8" opacity="0.9" />
        <line x1="11" y1="5" x2="15" y2="8" stroke="#ffffff" stroke-width="0.7" opacity="0.75" />

        <!-- Side Mirrors -->
        <rect x="2" y="6.5" width="1.8" height="2.8" rx="0.4" fill="#475569" />
        <rect x="22.2" y="6.5" width="1.8" height="2.8" rx="0.4" fill="#475569" />

        <!-- Headlights -->
        <rect x="5.5" y="2" width="2.5" height="1.2" rx="0.4" fill="#facc15" />
        <rect x="18" y="2" width="2.5" height="1.2" rx="0.4" fill="#facc15" />

        <!-- Rear Taillamps -->
        <rect x="4" y="47" width="2.5" height="1" rx="0.3" fill="#ef4444" />
        <rect x="19.5" y="47" width="2.5" height="1" rx="0.3" fill="#ef4444" />
      </svg>
    `,
  };
}

export default function StreetRouteMap({
  originName = "Bhubaneswar",
  destinationName = "Kolkata",
  vehicleType = "Refrigerated Van",
  routeData = null,
  loading = false,
  error = null,
  className = "",
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const animRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const polylineRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);
  const [animProgress, setAnimProgress] = useState(0);
  const [animCompleted, setAnimCompleted] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);

  // Extract coordinates from routeData: backend returns [[lon, lat], ...] GeoJSON format
  const rawCoords = routeData?.route_geometry || [];
  const distanceKm = routeData?.distance_km;
  const durationMinutes = routeData?.duration_minutes;
  const routeSummary = routeData?.route_summary;

  // Convert GeoJSON [lon, lat] -> Leaflet [lat, lon]
  const latlngs = useMemo(() => {
    if (!rawCoords || !rawCoords.length) return [];
    return rawCoords.map((coord) => [coord[1], coord[0]]);
  }, [rawCoords]);

  // Precompute smooth animation path lookup table once when latlngs change
  const animPathData = useMemo(() => {
    return buildSmoothAnimationPath(latlngs, 1200);
  }, [latlngs]);

  // Determine illustration config matching the active/recommended vehicle type
  const vehicleConfig = useMemo(() => {
    return getVehicleIllustrationConfig(vehicleType);
  }, [vehicleType]);

  // Initialize Leaflet Map Instance
  useEffect(() => {
    let isMounted = true;

    if (typeof window === "undefined" || !mapContainerRef.current) return;

    // Dynamically import Leaflet to avoid SSR window is not defined
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Default center: Eastern corridor
      const defaultCenter = [21.4, 87.1];
      const defaultZoom = 7;

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: false, // Custom controls positioned cleanly
        attributionControl: true,
      });

      // Standard OpenStreetMap Tile Layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
    });

    return () => {
      isMounted = false;
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Route Geometry, Markers, and Trigger Silky-Smooth Continuous Transit Animation
  useEffect(() => {
    if (
      !mapReady ||
      !mapInstanceRef.current ||
      !latlngs ||
      latlngs.length < 2 ||
      !animPathData
    ) {
      return;
    }

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapInstanceRef.current) return;
      const map = mapInstanceRef.current;

      // Clear previous layers & markers
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }
      if (vehicleMarkerRef.current) {
        map.removeLayer(vehicleMarkerRef.current);
        vehicleMarkerRef.current = null;
      }

      // Clear any other non-tile layers
      map.eachLayer((layer) => {
        if (
          layer instanceof L.Marker ||
          (layer instanceof L.Polyline && !(layer instanceof L.TileLayer))
        ) {
      map.removeLayer(layer);
        }
      });

      const startPt = latlngs[0];
      const endPt = latlngs[latlngs.length - 1];

      // 1. Draw Casing (High-Contrast Outer Route Border)
      L.polyline(latlngs, {
        color: "#5C5349",
        weight: 6.5,
        opacity: 0.7,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      // 2. Draw Vibrant Main Road Line (Warm Terracotta Route)
      const routeLine = L.polyline(latlngs, {
        color: "#C85A32",
        weight: 4.5,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      polylineRef.current = routeLine;

      // 3. Fit Map Bounds to Route with generous viewport padding
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 14 });

      // 4. Custom Start Marker (Pickup)
      const startIcon = L.divIcon({
        className: "custom-map-marker-origin",
        html: `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
            <span class="absolute w-7 h-7 rounded-full bg-emerald-600/20 animate-ping"></span>
            <span class="relative w-4 h-4 rounded-full bg-[#4D6A42] border-2 border-white shadow-md flex items-center justify-center">
              <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
            </span>
            <div class="absolute top-5 left-1/2 -translate-x-1/2 bg-[#FAF5EC]/95 text-[#1F1D1A] text-[10px] font-bold font-mono px-2 py-0.5 rounded border border-[#E2D5C3] whitespace-nowrap shadow-md pointer-events-none">
              PICKUP: ${originName}
            </div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker(startPt, { icon: startIcon, zIndexOffset: 500 }).addTo(map);

      // 5. Custom End Marker (Destination)
      const endIcon = L.divIcon({
        className: "custom-map-marker-dest",
        html: `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
            <span class="relative w-4 h-4 rounded-full bg-[#C85A32] border-2 border-white shadow-md flex items-center justify-center">
              <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
            </span>
            <div class="absolute top-5 left-1/2 -translate-x-1/2 bg-[#FAF5EC]/95 text-[#1F1D1A] text-[10px] font-bold font-mono px-2 py-0.5 rounded border border-[#E2D5C3] whitespace-nowrap shadow-md pointer-events-none">
              DESTINATION: ${destinationName}
            </div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker(endPt, { icon: endIcon, zIndexOffset: 500 }).addTo(map);

      // 6. Setup Polished Miniature Logistics Vehicle Marker
      const { points: animPoints, pointCount } = animPathData;
      const initialHeading = animPoints[0]?.heading || 0;
      const { width: iconW, height: iconH, svg: vehicleSvg } = vehicleConfig;

      const vehicleDivIcon = L.divIcon({
        className: "custom-vehicle-marker",
        html: `
          <div id="active-vehicle-marker-wrapper" style="width: ${iconW}px; height: ${iconH}px; transform: translate(-50%, -50%) rotate(${Math.round(initialHeading)}deg); transform-origin: center center; will-change: transform;">
            ${vehicleSvg}
          </div>
        `,
        iconSize: [iconW, iconH],
        iconAnchor: [iconW / 2, iconH / 2], // Centered pivot pinned precisely on road centerline
      });

      const vehicleMarker = L.marker(startPt, {
        icon: vehicleDivIcon,
        zIndexOffset: 1000,
      }).addTo(map);
      vehicleMarkerRef.current = vehicleMarker;

      // 7. Time-based Silky-Smooth Continuous Animation Loop (Realistic Constant Speed)
      const animationDuration = 6800; // ms
      let startTime = null;
      setAnimCompleted(false);

      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const rawProgress = Math.min(elapsed / animationDuration, 1.0);

        // Realistic Highway Cruising Velocity Profile:
        // Gentle 5% ease-in acceleration at departure, constant cruising speed across 90% of journey, gentle 5% decel into destination depot
        let progress;
        if (rawProgress < 0.05) {
          const t = rawProgress / 0.05;
          progress = 0.05 * (0.5 * t * t);
        } else if (rawProgress > 0.95) {
          const t = (rawProgress - 0.95) / 0.05;
          progress = 0.95 + 0.05 * (t - 0.5 * t * t);
        } else {
          progress = rawProgress;
        }

        setAnimProgress(Math.round(rawProgress * 100));

        // Sub-sample linear interpolation between precomputed high-density road samples
        const sampleIndexFloat = progress * (pointCount - 1);
        const idx = Math.floor(sampleIndexFloat);
        const frac = sampleIndexFloat - idx;

        const p1 = animPoints[idx];
        const p2 = animPoints[Math.min(idx + 1, pointCount - 1)];

        const currLat = p1.lat + (p2.lat - p1.lat) * frac;
        const currLon = p1.lon + (p2.lon - p1.lon) * frac;
        const currHeading = p1.heading + (p2.heading - p1.heading) * frac;

        if (vehicleMarkerRef.current) {
          vehicleMarkerRef.current.setLatLng([currLat, currLon]);

          const wrapper = document.getElementById(
            "active-vehicle-marker-wrapper"
          );
          if (wrapper) {
            wrapper.style.transform = `translate(-50%, -50%) rotate(${currHeading.toFixed(1)}deg)`;
          }
        }

        if (rawProgress < 1.0) {
          animRef.current = requestAnimationFrame(step);
        } else {
          // Animation finished: place exactly at destination coordinate and stop cleanly
          if (vehicleMarkerRef.current) {
            vehicleMarkerRef.current.setLatLng(endPt);
            const wrapper = document.getElementById(
              "active-vehicle-marker-wrapper"
            );
            if (wrapper) {
              const lastHeading = animPoints[pointCount - 1].heading;
              wrapper.style.transform = `translate(-50%, -50%) rotate(${lastHeading.toFixed(1)}deg)`;
            }
          }
          setAnimCompleted(true);
          setIsReplaying(false);
        }
      };

      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
      animRef.current = requestAnimationFrame(step);
    });

    return () => {
      isMounted = false;
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [
    mapReady,
    latlngs,
    animPathData,
    originName,
    destinationName,
    vehicleType,
    vehicleConfig,
    isReplaying,
  ]);

  // Replay animation action
  const handleReplay = () => {
    setIsReplaying(true);
    setAnimCompleted(false);
    setAnimProgress(0);
    setTimeout(() => {
      setIsReplaying(false);
    }, 50);
  };

  // Recenter / Fit bounds
  const handleFitBounds = () => {
    if (!mapInstanceRef.current || !latlngs || latlngs.length < 2) return;
    import("leaflet").then((L) => {
      const bounds = L.latLngBounds(latlngs);
      mapInstanceRef.current.fitBounds(bounds, { padding: [45, 45] });
    });
  };

  // Custom Zoom Handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  return (
    <div
      className={`relative w-full rounded-2xl border border-[#DCCFBC] bg-[#FAF2E4] overflow-hidden shadow-md font-mono ${className}`}
      style={{ height: "420px" }}
    >
      {/* MAP CANVAS CONTAINER */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* TOP FLOATING TELEMETRY STRIP */}
      <div className="absolute top-3 left-3 right-3 z-10 pointer-events-none flex flex-wrap items-center justify-between gap-2">
        <div className="bg-[#FAF2E4]/95 backdrop-blur-md border border-[#DCCFBC] px-3.5 py-1.5 rounded-xl text-xs text-[#1F1D1A] flex items-center gap-3 shadow-md pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C85A32] animate-pulse"></span>
            <span className="font-bold text-[#1F1D1A] uppercase tracking-wider text-[11px]">
              {originName} → {destinationName}
            </span>
          </div>

          <span className="text-[#CBB9A2]">|</span>

          <div className="flex items-center gap-3 text-[11px] text-[#5C4E42]">
            {distanceKm && (
              <span className="flex items-center gap-1">
                <Milestone className="w-3.5 h-3.5 text-[#C85A32]" />
                <strong className="text-[#1F1D1A]">{distanceKm} km</strong>
              </span>
            )}

            {durationMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#4D6A42]" />
                <strong className="text-[#1F1D1A]">
                  {Math.floor(durationMinutes / 60)}h{" "}
                  {Math.round(durationMinutes % 60)}m
                </strong>
              </span>
            )}
          </div>
        </div>

        {/* REPLAY & MAP CONTROLS */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-[#FAF2E4]/95 backdrop-blur-md border border-[#DCCFBC] p-1 rounded-xl shadow-md">
          <button
            onClick={handleReplay}
            title="Replay Vehicle Transit Animation"
            className="px-2.5 py-1 bg-[#FDF7EC] hover:bg-[#FAF2E4] text-[#1F1D1A] rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#DCCFBC]"
          >
            <RotateCcw className="w-3 h-3 text-[#C85A32]" />
            <span>Replay Transit</span>
          </button>

          <button
            onClick={handleFitBounds}
            title="Recenter & Fit Route"
            className="p-1.5 hover:bg-[#FDF7EC] text-[#5C4E42] hover:text-[#1F1D1A] rounded-lg transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 hover:bg-[#FDF7EC] text-[#5C4E42] hover:text-[#1F1D1A] rounded-lg transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 hover:bg-[#FDF7EC] text-[#5C4E42] hover:text-[#1F1D1A] rounded-lg transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* BOTTOM TRANSIT STATUS STRIP */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
        <div className="bg-[#FAF2E4]/95 backdrop-blur-md border border-[#DCCFBC] px-3.5 py-1.5 rounded-xl text-[10px] text-[#5C4E42] flex items-center gap-2 shadow-md">
          <Truck className="w-3.5 h-3.5 text-[#C85A32]" />
          <span>
            ASSIGNED ASSET: <strong className="text-[#1F1D1A]">{vehicleType}</strong>
          </span>
          <span className="text-[#CBB9A2]">•</span>
          <span>
            STATUS:{" "}
            <strong
              className={animCompleted ? "text-[#4D6A42]" : "text-[#C85A32]"}
            >
              {animCompleted
                ? "ARRIVED AT DESTINATION"
                : "HIGHWAY IN-TRANSIT (LIVE)"}
            </strong>
          </span>
        </div>
      </div>

      {/* LOADING OVERLAY */}
      {loading && (
        <div className="absolute inset-0 z-20 bg-[#FAF2E4]/85 backdrop-blur-xs flex flex-col items-center justify-center text-[#1F1D1A] space-y-2">
          <RefreshCw className="w-6 h-6 text-[#C85A32] animate-spin" />
          <p className="text-xs font-bold font-mono text-[#1F1D1A]">
            FETCHING REAL STREET ROUTE & GEOMETRY...
          </p>
          <span className="text-[10px] text-[#827263]">
            Querying OpenStreetMap / OSRM
          </span>
        </div>
      )}

      {/* ERROR OVERLAY */}
      {error && !loading && (
        <div className="absolute inset-0 z-20 bg-[#FAF2E4]/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-[#1F1D1A] space-y-2">
          <div className="w-10 h-10 rounded-full bg-[#FDF0EA] border border-[#F5CABA] text-[#C85A32] flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#C85A32]">
            Street Routing Unavailable
          </h4>
          <p className="text-[11px] text-[#5C4E42] max-w-sm">{error}</p>
          <button
            onClick={handleReplay}
            className="mt-2 px-3.5 py-1.5 bg-[#FDF7EC] hover:bg-[#FAF2E4] border border-[#DCCFBC] rounded-lg text-xs font-bold text-[#1F1D1A]"
          >
            Retry Route
          </button>
        </div>
      )}
    </div>
  );
}
