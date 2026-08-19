"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";
import VehicleIllustration from "@/components/VehicleIllustration";

const StreetRouteMap = dynamic(() => import("@/components/StreetRouteMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 rounded border border-slate-300 bg-slate-900 flex flex-col items-center justify-center text-white space-y-2 font-mono">
      <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs text-slate-300">INITIALIZING OPENSTREETMAP CANVAS...</span>
    </div>
  ),
});


const Interactive3DWorldHomepage = dynamic(
  () => import("@/components/Interactive3DWorldHomepage"),
  { ssr: false }
);

const ConsumerVectorStory = dynamic(
  () => import("@/components/ConsumerVectorStory"),
  { ssr: false }
);

import { useAuth } from "@/context/AuthContext";
import {
  PackagePlus,
  Truck,
  MapPin,
  Clock,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Calendar,
  AlertCircle,
  AlertTriangle,
  Award,
  Navigation,
  Check,
  BookmarkCheck,
  LogIn,
  UserPlus,
  Sparkles,
  Zap,
  TrendingDown,
  Layers,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Corridor Highway Distances (matching backend SEGMENT_DISTANCE_KM)
const SEGMENTS = {
  "Puri-Bhubaneswar": 60,
  "Bhubaneswar-Cuttack": 30,
  "Cuttack-Jamshedpur": 200,
  "Jamshedpur-Kolkata": 150,
  "Kolkata-Howrah": 10,
};

// Route sequencing helper
function getCorridorRoute(origin, destination) {
  const corridorOrder = ["Puri", "Bhubaneswar", "Cuttack", "Jamshedpur", "Kolkata", "Howrah"];
  const startIdx = corridorOrder.indexOf(origin);
  const endIdx = corridorOrder.indexOf(destination);

  if (startIdx !== -1 && endIdx !== -1 && startIdx !== endIdx) {
    if (startIdx < endIdx) {
      return corridorOrder.slice(startIdx, endIdx + 1);
    } else {
      return corridorOrder.slice(endIdx, startIdx + 1).reverse();
    }
  }
  return [origin, "Cuttack", destination].filter((v, i, a) => a.indexOf(v) === i);
}

// Distance calculation
function getRouteDistance(route) {
  let totalKm = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const forward = `${route[i]}-${route[i + 1]}`;
    const reverse = `${route[i + 1]}-${route[i]}`;
    totalKm += SEGMENTS[forward] || SEGMENTS[reverse] || 80;
  }
  return totalKm || 380;
}

// Lightweight smooth number count-up component
function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0 }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayValue(value);
      return;
    }

    const startVal = prevValue.current;
    const endVal = Number(value) || 0;
    const duration = 350;
    const startTime = performance.now();

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = startVal + (endVal - startVal) * eased;

      setDisplayValue(decimals > 0 ? Number(current.toFixed(decimals)) : Math.round(current));

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        prevValue.current = endVal;
      }
    };

    requestAnimationFrame(updateCounter);
  }, [value, decimals]);

  return (
    <span>
      {prefix}
      {typeof displayValue === "number" ? displayValue.toLocaleString() : displayValue}
      {suffix}
    </span>
  );
}

export default function DispatchPlannerPage() {
  const { user, isAuthenticated, loading: authLoading, getAuthHeaders } = useAuth();

  // If unauthenticated, allow user to explore in guest mode or see landing page
  const [guestMode, setGuestMode] = useState(false);

  // Navigation & View Mode: "form" | "results"
  const [viewMode, setViewMode] = useState("form");

  // 1. Section 1: Shipment Details
  const [productType, setProductType] = useState("Fresh Tomatoes / Produce");
  const [weightKg, setWeightKg] = useState(500);

  // 2. Section 2: Journey Details
  const [origin, setOrigin] = useState("Bhubaneswar");
  const [destination, setDestination] = useState("Kolkata");

  const todayStr = new Date().toISOString().split("T")[0];
  const targetDateStr = new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0];

  const [pickupDate, setPickupDate] = useState(todayStr);
  const [pickupTime, setPickupTime] = useState("08:00");
  const [deliveryDate, setDeliveryDate] = useState(targetDateStr);
  const [deliveryTime, setDeliveryTime] = useState("18:00");

  // 3. Section 3: Requirements
  const [priority, setPriority] = useState("Standard"); // Standard | Express | Urgent
  const [specialRequirement, setSpecialRequirement] = useState("Refrigerated"); // Normal | Refrigerated | Fragile

  // Validation & Plan Persistence State
  const [validationErrors, setValidationErrors] = useState({});
  const [savingPlan, setSavingPlan] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);
  const [savedShipmentId, setSavedShipmentId] = useState(null);
  const [saveError, setSaveError] = useState(null);

  // Optimization State & Sequence
  const [optimizing, setOptimizing] = useState(false);
  const [optimizingStep, setOptimizingStep] = useState(0);
  const [resultsRevealKey, setResultsRevealKey] = useState(0);
  const [routeTransitKey, setRouteTransitKey] = useState(0);
  const [currentTime, setCurrentTime] = useState("");

  // Live Fleet Data & Recommendation State
  const [fleetVehicles, setFleetVehicles] = useState([]);
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [hasSuitableVehicle, setHasSuitableVehicle] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [recommendedId, setRecommendedId] = useState(null);

  // Real OpenStreetMap & OSRM Street Route State
  const [streetRouteData, setStreetRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);

  const OPTIMIZATION_STEPS = [
    "Querying live fleet database & availability status...",
    "Validating cargo payload against vehicle capacities...",
    "Calculating optimal NH-16 highway route & segments...",
    "Evaluating transit delay & cold-chain thermal risk...",
    "Generating multi-factor smart recommendation...",
  ];

  // Live IST Clock & 3D Scroll-Driven Storytelling Progress
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [heroMode, setHeroMode] = useState("showcase"); // "showcase" | "diorama"

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          const current = maxScroll > 0 ? window.scrollY / maxScroll : 0;
          setScrollProgress(Math.min(1, Math.max(0, current)));
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) +
          " " +
          now.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }) +
          " IST"
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real fleet data from backend on mount
  const fetchFleet = async () => {
    try {
      const headers = getAuthHeaders ? getAuthHeaders() : {};
      const res = await fetch(`${API_BASE_URL}/vehicles`, { cache: "no-store", headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setFleetVehicles(data);
          return data;
        }
      }
    } catch (err) {
      console.error("Error fetching fleet:", err);
    }
    return null;
  };

  useEffect(() => {
    fetchFleet().then((fleet) => {
      calculateVehicleComparison(fleet, Number(weightKg), productType, specialRequirement, origin, destination, pickupDate, deliveryDate, priority);
    });
  }, [isAuthenticated]);

  // Form Validation Logic
  const validateForm = () => {
    const errors = {};

    if (!productType || !productType.trim()) {
      errors.productType = "Product / Cargo description is required.";
    }

    const weightNum = Number(weightKg);
    if (isNaN(weightNum) || weightNum <= 0) {
      errors.weightKg = "Weight must be a positive number greater than 0.";
    } else if (weightNum > 50000) {
      errors.weightKg = "Weight exceeds allowable single-cargo limits.";
    }

    if (origin === destination) {
      errors.destination = "Destination cannot be identical to pickup location.";
    }

    if (pickupDate && deliveryDate && pickupTime && deliveryTime) {
      const pickupTimestamp = new Date(`${pickupDate}T${pickupTime}`).getTime();
      const deliveryTimestamp = new Date(`${deliveryDate}T${deliveryTime}`).getTime();

      if (isNaN(pickupTimestamp) || isNaN(deliveryTimestamp)) {
        errors.schedule = "Please provide valid pickup and delivery date/time.";
      } else if (deliveryTimestamp <= pickupTimestamp) {
        errors.schedule = "Delivery date/time cannot be earlier than or equal to pickup date/time.";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Fleet-Connected Multi-Factor Vehicle Recommendation Engine
   */
  const calculateVehicleComparison = (
    fleetList,
    currentWeight,
    currentProduct,
    currentReq,
    currentOrigin,
    currentDest,
    pDate,
    dDate,
    currentPriority
  ) => {
    const route = getCorridorRoute(currentOrigin, currentDest);
    const distanceKm = getRouteDistance(route);
    const baseDurationHours = Math.round((distanceKm / 50.0) * 10) / 10;

    const isReeferReq = currentReq === "Refrigerated";
    const isFragileReq = currentReq === "Fragile";

    const pTime = new Date(pDate || todayStr).getTime();
    const dTime = new Date(dDate || targetDateStr).getTime();
    const diffDays = Math.max(1, Math.round((dTime - pTime) / (1000 * 60 * 60 * 24)));

    const sourceFleet = (fleetList && fleetList.length > 0) ? fleetList : [
      {
        id: "VH-101",
        type: "Refrigerated Truck (Heavy)",
        capacity_kg: 5000,
        base_cost: 18000,
        status: "Available",
        special_capability: "Refrigerated / Cold-Chain",
        is_refrigerated: true,
      },
      {
        id: "VH-102",
        type: "Refrigerated Van (Medium)",
        capacity_kg: 2500,
        base_cost: 14500,
        status: "Available",
        special_capability: "Refrigerated / Cold-Chain",
        is_refrigerated: true,
      },
      {
        id: "VH-103",
        type: "Standard Freight Truck",
        capacity_kg: 5000,
        base_cost: 12000,
        status: "Available",
        special_capability: "Normal / Ambient",
        is_refrigerated: false,
      },
    ];

    const computed = sourceFleet.map((v) => {
      const isAvailable = v.status === "Available";
      const isCapacityFit = Number(v.capacity_kg) >= currentWeight;
      const isReeferCapable = Boolean(v.is_refrigerated || (v.special_capability && v.special_capability.includes("Refrigerated")) || v.type.includes("Refrigerated"));
      const isSpecialFit = isReeferReq ? isReeferCapable : true;
      const isEligible = isAvailable && isCapacityFit && isSpecialFit;

      let speedFactor = 1.0;
      if (v.capacity_kg <= 2500) speedFactor = 0.94;
      else if (v.capacity_kg >= 5000) speedFactor = 1.02;
      const durationHours = Math.round((baseDurationHours * speedFactor) * 10) / 10;

      const baseCost = Number(v.base_cost) || 14000;
      const separateCost = baseCost * 2;
      const savings = separateCost - baseCost;
      const savingsPercent = Math.round((savings / separateCost) * 100);

      const distScore = Math.min((distanceKm / 500.0) * 100, 100);
      const durScore = Math.min((durationHours / 12.0) * 100, 100);
      const deadlineScore = diffDays <= 1 ? 80 : diffDays <= 3 ? 50 : 20;
      const relScore = 20;
      const delayRisk = Math.round((distScore * 0.25 + durScore * 0.25 + deadlineScore * 0.3 + relScore * 0.2) * 10) / 10;

      let handlingRisk = 8.0;
      if (isReeferReq) {
        handlingRisk = isReeferCapable ? 12.0 : 88.5;
      } else if (isFragileReq) {
        handlingRisk = v.capacity_kg <= 2500 ? 15.0 : 32.0;
      }

      const overallRisk = Math.round(((delayRisk + handlingRisk) / 2.0) * 10) / 10;
      const riskLevel = overallRisk > 60 ? "HIGH" : overallRisk > 30 ? "MEDIUM" : "LOW";

      let capacitySuitabilityScore = 0;
      if (isCapacityFit) {
        const loadRatio = currentWeight / Number(v.capacity_kg);
        if (loadRatio >= 0.5 && loadRatio <= 0.95) {
          capacitySuitabilityScore = 100;
        } else if (loadRatio > 0.95) {
          capacitySuitabilityScore = 85;
        } else {
          capacitySuitabilityScore = Math.max(50, Math.round(50 + (loadRatio * 50)));
        }
      }

      let compositeScore = 0;
      if (isEligible) {
        const riskScore = Math.max(0, 100 - overallRisk);
        const costScore = (12000 / baseCost) * 100;
        const speedScore = (6.5 / durationHours) * 100;
        const savingsScore = (savings / 18000) * 100;

        if (currentPriority === "Urgent") {
          compositeScore =
            speedScore * 0.40 +
            riskScore * 0.25 +
            capacitySuitabilityScore * 0.20 +
            savingsScore * 0.10 +
            costScore * 0.05;
        } else if (currentPriority === "Express") {
          compositeScore =
            speedScore * 0.25 +
            capacitySuitabilityScore * 0.25 +
            riskScore * 0.25 +
            savingsScore * 0.15 +
            costScore * 0.10;
        } else {
          compositeScore =
            capacitySuitabilityScore * 0.35 +
            riskScore * 0.30 +
            costScore * 0.20 +
            savingsScore * 0.15;
        }
      } else {
        compositeScore = -100;
      }

      const whyPoints = [];
      if (isCapacityFit) {
        whyPoints.push({
          title: "Capacity is suitable",
          detail: `${currentWeight} kg payload fits efficiently within ${v.capacity_kg.toLocaleString()} kg capacity (${Math.round((currentWeight / v.capacity_kg) * 100)}% load fit)`,
        });
      } else {
        whyPoints.push({
          title: "Capacity insufficient",
          detail: `Payload of ${currentWeight} kg exceeds vehicle capacity of ${v.capacity_kg} kg`,
        });
      }

      if (isReeferReq && isReeferCapable) {
        whyPoints.push({
          title: "Risk is low/acceptable",
          detail: `Active cold-chain unit protects against thermal spoilage (${overallRisk}% risk)`,
        });
      } else if (isReeferReq && !isReeferCapable) {
        whyPoints.push({
          title: "Critical thermal risk",
          detail: `Severe risk (${overallRisk}%) due to lack of certified refrigeration`,
        });
      } else {
        whyPoints.push({
          title: "Risk is low/acceptable",
          detail: `Minimal delay risk (${overallRisk}%) with ${diffDays} days scheduling buffer`,
        });
      }

      whyPoints.push({
        title: "Savings are strong",
        detail: `Consolidated rate saves ₹${savings.toLocaleString()} (${savingsPercent}% reduction vs separate run)`,
      });

      whyPoints.push({
        title: "Delivery requirements are met",
        detail: `${durationHours} hrs transit fulfills ${currentPriority} priority requirements`,
      });

      return {
        ...v,
        name: v.type,
        cost: baseCost,
        separateCost,
        savings,
        savingsPercent,
        delayRisk,
        spoilageRisk: handlingRisk,
        riskPercent: overallRisk,
        riskLevel,
        durationHours,
        distanceKm,
        route,
        isAvailable,
        isCapacityFit,
        isReeferCapable,
        isSpecialFit,
        isEligible,
        whyPoints,
        score: Math.round(compositeScore * 10) / 10,
      };
    });

    const eligibleVehicles = computed.filter((c) => c.isEligible);
    const sortedEligible = [...eligibleVehicles].sort((a, b) => b.score - a.score);

    if (sortedEligible.length > 0) {
      const best = sortedEligible[0];
      setHasSuitableVehicle(true);
      setRecommendedId(best.id);
      setSelectedVehicleId(best.id);

      const finalized = computed.map((item) => {
        const isBest = item.id === best.id;
        let reason = "";

        if (isBest) {
          if (currentPriority === "Urgent") {
            reason = `Urgent priority: Selected for fastest delivery (${item.durationHours} hrs) with acceptable risk (${item.riskPercent}%).`;
          } else if (currentPriority === "Express") {
            reason = `Express priority: Optimal balance between expedited transit (${item.durationHours} hrs), low risk, and cost.`;
          } else {
            reason = `Standard priority: Right-sized carrier with lowest cost and balanced load fit.`;
          }
        } else if (!item.isAvailable) {
          reason = `Currently unavailable (${item.status}) in fleet database.`;
        } else if (!item.isCapacityFit) {
          reason = `Capacity insufficient: max ${item.capacity_kg} kg < ${currentWeight} kg payload.`;
        } else if (!item.isSpecialFit) {
          reason = `Excluded: Lacks active refrigeration for cold-chain cargo.`;
        } else if (item.cost > best.cost) {
          reason = `Higher operating cost than the recommended right-sized vehicle.`;
        } else {
          reason = `Higher transit duration or lower suitability score than recommended carrier.`;
        }

        return {
          ...item,
          isRecommended: isBest,
          recommendationReason: reason,
        };
      });

      setVehicleOptions(finalized);
    } else {
      setHasSuitableVehicle(false);
      setRecommendedId(null);
      setSelectedVehicleId(null);

      const finalized = computed.map((item) => {
        let reason = "";
        if (!item.isAvailable) reason = `Currently unavailable (${item.status}).`;
        else if (!item.isCapacityFit) reason = `Capacity insufficient (${item.capacity_kg} kg < ${currentWeight} kg).`;
        else if (!item.isSpecialFit) reason = `Lacks required refrigeration unit.`;
        else reason = `Excluded due to fleet status.`;

        return {
          ...item,
          isRecommended: false,
          recommendationReason: reason,
        };
      });

      setVehicleOptions(finalized);
    }

    setResultsRevealKey((prev) => prev + 1);
    setRouteTransitKey((prev) => prev + 1);
  };

  // Multi-step professional optimization workflow connecting to Fleet & Real Street Routing
  const handleFindBestPlan = async (e) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setOptimizing(true);
    setPlanSaved(false);
    setSaveError(null);
    setOptimizingStep(0);
    setRouteLoading(true);
    setRouteError(null);

    const stepInterval = setInterval(() => {
      setOptimizingStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 200);

    try {
      const headers = getAuthHeaders ? getAuthHeaders() : {};

      // 1. Fetch Fleet Vehicles
      const fleetPromise = fetch(`${API_BASE_URL}/vehicles`, { cache: "no-store", headers })
        .then((res) => (res.ok ? res.json() : null))
        .catch((err) => {
          console.warn("Fleet fetch fallback:", err);
          return null;
        });

      // 2. Fetch Real OpenStreetMap / OSRM Road Route
      const routePromise = fetch(
        `${API_BASE_URL}/route?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`,
        { cache: "no-store", headers }
      )
        .then(async (res) => {
          if (res.ok) {
            return await res.json();
          }
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.detail || "Unable to fetch street route from server.");
        })
        .catch((err) => {
          console.warn("Route API error:", err);
          setRouteError(err.message || "Failed to load road route.");
          return null;
        });

      const [liveFleet, routeResult] = await Promise.all([
        fleetPromise,
        routePromise,
        new Promise((r) => setTimeout(r, 450)),
      ]);

      if (liveFleet) {
        setFleetVehicles(liveFleet);
      }

      if (routeResult) {
        setStreetRouteData(routeResult);
      }

      calculateVehicleComparison(
        liveFleet,
        Number(weightKg),
        productType,
        specialRequirement,
        origin,
        destination,
        pickupDate,
        deliveryDate,
        priority
      );
      setViewMode("results");
    } catch (err) {
      console.error("Optimization query error:", err);
      calculateVehicleComparison(
        null,
        Number(weightKg),
        productType,
        specialRequirement,
        origin,
        destination,
        pickupDate,
        deliveryDate,
        priority
      );
      setViewMode("results");
    } finally {
      clearInterval(stepInterval);
      setOptimizing(false);
      setRouteLoading(false);
    }
  };

  const activePlan =
    vehicleOptions.find((v) => v.id === selectedVehicleId) ||
    vehicleOptions.find((v) => v.isRecommended) ||
    vehicleOptions[0];

  // Save Plan Action connecting to backend POST /shipments
  const handleSavePlan = async () => {
    if (savingPlan || planSaved || !activePlan) return;
    setSavingPlan(true);
    setSaveError(null);

    try {
      const payload = {
        product_type: productType.trim() || "General Cargo",
        weight_kg: Number(weightKg),
        pickup_location: origin,
        destination: destination,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        delivery_date: deliveryDate,
        delivery_time: deliveryTime,
        delivery_priority: priority,
        special_requirement: specialRequirement,
        selected_vehicle: `${activePlan.name} (${activePlan.id})`,
        route: activePlan.route || [origin, destination],
        cost: Number(activePlan.cost || 0),
        savings: Number(activePlan.savings || 0),
        risk_percentage: Number(activePlan.riskPercent || 0),
        eta: `${activePlan.durationHours || 7.2} hrs`,
        status: "Planned",
      };

      const headers = getAuthHeaders ? getAuthHeaders() : { "Content-Type": "application/json" };
      const res = await fetch(`${API_BASE_URL}/shipments`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const saved = await res.json();
      setSavedShipmentId(saved.id);
      setPlanSaved(true);
    } catch (err) {
      console.error("Error saving shipment plan:", err);
      setSaveError("Failed to save shipment to database. Please verify server connection.");
    } finally {
      setSavingPlan(false);
    }
  };

  const routeWaypoints = activePlan?.route
    ? activePlan.route.map((name, idx) => ({
        name,
        type: idx === 0 ? "origin" : idx === activePlan.route.length - 1 ? "destination" : "waypoint",
      }))
    : [
        { name: origin, type: "origin" },
        { name: "Cuttack", type: "waypoint" },
        { name: destination, type: "destination" },
      ];

  // ─────────────────────────────────────────────────────────────
  // PUBLIC LANDING VIEW: REAL-TIME INTERACTIVE 3D/WEBGL DIGITAL WORLD
  // ─────────────────────────────────────────────────────────────
  if (!isAuthenticated && !guestMode && !authLoading) {
    return <Interactive3DWorldHomepage onLaunchWorkspace={() => setGuestMode(true)} />;
  }

  // ─────────────────────────────────────────────────────────────
  // PROTECTED WORKSPACE VIEW (Plan Shipment Form + Results)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-[#EFE2CE] text-[#1F1D1A] font-sans selection:bg-[#C85A32] selection:text-[#FFFFFF] relative overflow-x-hidden">
      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 0: LIVING HIGHWAY BACKGROUND VIDEO + INDIAN MATERIAL TEXTURE
          Continuous natural playback with warm parchment wash & physical paper grain
          ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-25 scale-105"
        >
          <source src="/videos/hero_background.mp4" type="video/mp4" />
        </video>

        {/* Warm Indian atmospheric parchment overlay (translucent so video breathes through) */}
        <div className="absolute inset-0 bg-[#EFE2CE]/82 backdrop-blur-[1.5px]" />

        {/* Physical Handmade Paper Grain Texture Filter */}
        <svg className="absolute inset-0 w-full h-full opacity-35 mix-blend-multiply" xmlns="http://www.w3.org/2000/svg">
          <filter id="indianPaperGrain">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 0.85   0 0 0 0 0.78   0 0 0 0 0.68   0 0 0 0.24 0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#indianPaperGrain)" />
        </svg>

        {/* Subtle Indian Highway & Regional Coordinate Watermark */}
        <div className="absolute bottom-6 right-8 text-[9px] font-mono text-[#827263]/40 tracking-widest uppercase select-none pointer-events-none">
          NH-16 ARTERIAL EXPRESS // 20.2961°N 85.8245°E // ODISHA ⇄ WEST BENGAL
        </div>
      </div>

      {/* INDUSTRIAL NAVIGATION RAIL */}
      <Sidebar />

      {/* MAIN DISPATCH WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* TOP BAR */}
        <header className="h-18 bg-[#FAF2E4]/92 backdrop-blur-md border-b border-[#DCCFBC] px-6 flex items-center justify-between sticky top-0 z-20 select-none shadow-[0_1px_6px_rgba(80,65,50,0.05)]">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FDF7EC] border border-[#DCCFBC] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#C85A32] animate-pulse"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F1D1A]">
                DISPATCH CONTROL TOWER // CONSUMER WORKSPACE
              </span>
            </div>
            <span className="text-[#CBB9A2] text-xs">|</span>
            <div className="text-[11px] text-[#C85A32] hidden sm:flex items-center gap-1.5 font-mono">
              <span className="text-[#827263]">CORRIDOR:</span>
              <span className="font-bold text-[#3D2E24] bg-[#FDF7EC] px-2.5 py-0.5 rounded border border-[#DCCFBC]">{origin} → {destination}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono select-none">
            <span className="hidden lg:block bg-[#FDF7EC] text-[#C85A32] px-3 py-1 rounded-lg border border-[#DCCFBC] font-bold shadow-xs">{currentTime}</span>
            {isAuthenticated && user && (
              <span className="text-[10px] font-bold bg-[#FDF7EC] text-[#3D2E24] px-2.5 py-1 rounded-lg border border-[#DCCFBC] shadow-xs">
                {user.name || user.email}
              </span>
            )}
          </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
          
          {/* CONFIDENT INDIAN LOGISTICS METRICS STRIP */}
          <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-4 bg-[#FAF2E4]/95 backdrop-blur-xs border border-[#DCCFBC] rounded-2xl shadow-xs sf-tactile-card flex flex-col justify-between">
              <span className="text-[9px] text-[#827263] uppercase font-bold tracking-wider">ACTIVE CORRIDOR</span>
              <div className="text-xl font-black text-[#1F1D1A] mt-1">NH-16 ARTERIAL</div>
              <span className="text-[9px] text-[#4D6A42] font-bold mt-0.5">● 100% NOMINAL FLOW</span>
            </div>

            <div className="p-4 bg-[#FAF2E4]/95 backdrop-blur-xs border border-[#DCCFBC] rounded-2xl shadow-xs sf-tactile-card flex flex-col justify-between">
              <span className="text-[9px] text-[#827263] uppercase font-bold tracking-wider">READY FLEET ASSETS</span>
              <div className="text-xl font-black text-[#1F1D1A] mt-1">{fleetVehicles.length || "05"} CARRIERS</div>
              <span className="text-[9px] text-[#C85A32] font-bold mt-0.5">REEFER & HEAVY TRUCKS</span>
            </div>

            <div className="p-4 bg-[#FAF2E4]/95 backdrop-blur-xs border border-[#DCCFBC] rounded-2xl shadow-xs sf-tactile-card flex flex-col justify-between">
              <span className="text-[9px] text-[#827263] uppercase font-bold tracking-wider">CONSOLIDATION YIELD</span>
              <div className="text-xl font-black text-[#4D6A42] mt-1">+33.3%</div>
              <span className="text-[9px] text-[#4D6A42] font-bold mt-0.5">AVG ₹18,000 PER DISPATCH</span>
            </div>

            <div className="p-4 bg-[#FAF2E4]/95 backdrop-blur-xs border border-[#DCCFBC] rounded-2xl shadow-xs sf-tactile-card flex flex-col justify-between">
              <span className="text-[9px] text-[#827263] uppercase font-bold tracking-wider">COLD-CHAIN TELEMETRY</span>
              <div className="text-xl font-black text-[#1F1D1A] mt-1">04.2°C</div>
              <span className="text-[9px] text-[#4D6A42] font-bold mt-0.5">ACTIVE CHILLER CALIBRATED</span>
            </div>
          </div>

          {/* DEDICATED CONSUMER LOGISTICS VECTOR SCROLL STORY */}
          <div className="max-w-5xl mx-auto">
            <ConsumerVectorStory />
          </div>

          {/* VIEW 1: PLAN SHIPMENT FORM */}
          {viewMode === "form" && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
              {/* Form Title Bar */}
              <div className="flex items-center justify-between bg-[#FAF2E4]/95 backdrop-blur-xs rounded-2xl border border-[#DCCFBC] px-6 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#FDF7EC] border border-[#DCCFBC] text-[#C85A32]">
                    <PackagePlus className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1F1D1A] block">
                      MANDI & CARGO DISPATCH PROTOCOL
                    </span>
                    <span className="text-[10px] text-[#827263] font-mono">ODISHA-WB NH-16 CORRIDOR // SEAL: SF-NH16</span>
                  </div>
                </div>
                <span className="text-[10px] text-[#C85A32] font-mono font-bold px-3 py-1 bg-[#FDF7EC] border border-[#DCCFBC] rounded-full hidden sm:block">
                  FLEET OPTIMIZER V2.4
                </span>
              </div>

              {/* MAIN FORM */}
              <form onSubmit={handleFindBestPlan} className="space-y-4">
                {/* ── SECTION 1: SHIPMENT DETAILS ──────────────── */}
                <div className="p-6 bg-[#FAF2E4]/95 backdrop-blur-xs border border-[#DCCFBC] rounded-2xl space-y-4 shadow-sm sf-tactile-card">
                  <div className="flex items-center justify-between border-b border-[#DCCFBC] pb-3">
                    <span className="text-xs font-bold text-[#1F1D1A] uppercase tracking-wide flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#FDF7EC] border border-[#DCCFBC] text-[#C85A32] text-[10px] flex items-center justify-center font-bold font-mono">1</span>
                      <span>Cargo & Mandi Produce Details</span>
                    </span>
                    <span className="text-[10px] text-[#827263] font-mono uppercase tracking-widest font-bold">CARGO & PAYLOAD</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    {/* 1.1 Product / Cargo */}
                    <div className="sm:col-span-8">
                      <label className="block font-mono font-bold text-[#5C4E42] mb-1.5 text-[10px] uppercase tracking-widest">
                        PRODUCT / CARGO <span className="text-[#C85A32]">*</span>
                      </label>
                      <input
                        type="text"
                        value={productType}
                        onChange={(e) => {
                          setProductType(e.target.value);
                          if (validationErrors.productType) {
                            setValidationErrors((prev) => ({ ...prev, productType: null }));
                          }
                        }}
                        placeholder="e.g. Fresh Tomatoes, Mustard Seeds, Jute, Dairy"
                        required
                        className={`w-full px-3.5 py-2.5 bg-[#F8F1E5] border rounded-xl text-[#1F1D1A] font-bold focus:outline-none transition-colors text-xs placeholder:text-[#827263] shadow-xs ${
                          validationErrors.productType
                            ? "border-[#BA4336] bg-[#FDF0EA]"
                            : "border-[#DCCFBC] focus:border-[#C85A32] focus:bg-[#FAF4EB]"
                        }`}
                      />
                      {validationErrors.productType && (
                        <span className="text-[10px] text-[#BA4336] font-mono font-bold mt-1 block">{validationErrors.productType}</span>
                      )}
                    </div>

                    {/* 1.2 Weight / Quantity */}
                    <div className="sm:col-span-4">
                      <label className="block font-mono font-bold text-[#5C4E42] mb-1.5 text-[10px] uppercase tracking-widest">
                        WEIGHT / QUANTITY (KG) <span className="text-[#C85A32]">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50000"
                        step="10"
                        value={weightKg}
                        onChange={(e) => {
                          setWeightKg(e.target.value);
                          if (validationErrors.weightKg) {
                            setValidationErrors((prev) => ({ ...prev, weightKg: null }));
                          }
                        }}
                        required
                        className={`w-full px-3.5 py-2.5 bg-[#F8F1E5] border rounded-xl text-[#1F1D1A] font-mono font-bold focus:outline-none transition-colors text-xs shadow-xs ${
                          validationErrors.weightKg
                            ? "border-[#BA4336] bg-[#FDF0EA]"
                            : "border-[#DCCFBC] focus:border-[#C85A32] focus:bg-[#FAF4EB]"
                        }`}
                      />
                      {validationErrors.weightKg ? (
                        <span className="text-[10px] text-[#BA4336] font-mono font-bold mt-1 block">{validationErrors.weightKg}</span>
                      ) : (
                        <span className="text-[10px] text-[#827263] font-mono mt-1 block font-bold">Payload in kilograms</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── SECTION 2: JOURNEY ───────────────────────── */}
                <div className="p-6 bg-[#FAF2E4]/95 backdrop-blur-xs border border-[#DCCFBC] rounded-2xl space-y-4 shadow-sm sf-tactile-card">
                  <div className="flex items-center justify-between border-b border-[#DCCFBC] pb-3">
                    <span className="text-xs font-bold text-[#1F1D1A] uppercase tracking-wide flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#FDF7EC] border border-[#DCCFBC] text-[#C85A32] text-[10px] flex items-center justify-center font-bold font-mono">2</span>
                      <span>Highway Nodes & Timing</span>
                    </span>
                    <span className="text-[10px] text-[#827263] font-mono uppercase tracking-widest font-bold">CORRIDOR ROUTE</span>
                  </div>

                  {/* Locations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono font-bold text-[#5C4E42] mb-1.5 text-[10px] uppercase tracking-widest">
                        ORIGIN PICKUP LOCATION
                      </label>
                      <select
                        value={origin}
                        onChange={(e) => {
                          setOrigin(e.target.value);
                          if (validationErrors.destination) {
                            setValidationErrors((prev) => ({ ...prev, destination: null }));
                          }
                        }}
                        className="w-full px-3.5 py-2.5 bg-[#F8F1E5] border border-[#DCCFBC] focus:border-[#C85A32] focus:bg-[#FAF4EB] rounded-xl text-[#1F1D1A] font-bold focus:outline-none transition-colors text-xs cursor-pointer shadow-xs"
                      >
                        <option value="Bhubaneswar">Bhubaneswar (Odisha Hub)</option>
                        <option value="Puri">Puri (Coastal Node)</option>
                        <option value="Cuttack">Cuttack (Central Dock)</option>
                        <option value="Jamshedpur">Jamshedpur (Industrial)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono font-bold text-[#5C4E42] mb-1.5 text-[10px] uppercase tracking-widest">
                        DESTINATION DROP LOCATION
                      </label>
                      <select
                        value={destination}
                        onChange={(e) => {
                          setDestination(e.target.value);
                          if (validationErrors.destination) {
                            setValidationErrors((prev) => ({ ...prev, destination: null }));
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 bg-[#F8F1E5] border rounded-xl text-[#1F1D1A] font-bold focus:outline-none transition-colors text-xs cursor-pointer shadow-xs ${
                          validationErrors.destination ? "border-[#BA4336]" : "border-[#DCCFBC] focus:border-[#C85A32] focus:bg-[#FAF4EB]"
                        }`}
                      >
                        <option value="Kolkata">Kolkata (Terminal)</option>
                        <option value="Howrah">Howrah (Logistics Dock)</option>
                        <option value="Cuttack">Cuttack (Hub)</option>
                        <option value="Bhubaneswar">Bhubaneswar (Depot)</option>
                      </select>
                    </div>
                  </div>
                  {validationErrors.destination && (
                    <span className="text-[10px] text-[#BA4336] font-mono font-bold block">{validationErrors.destination}</span>
                  )}

                  {/* Pickup & Delivery Targets */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block font-mono font-bold text-[#5C4E42] mb-1.5 text-[10px] uppercase tracking-widest">
                        PICKUP SCHEDULE
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={pickupDate}
                          onChange={(e) => {
                            setPickupDate(e.target.value);
                            if (validationErrors.schedule) setValidationErrors((prev) => ({ ...prev, schedule: null }));
                          }}
                          required
                          className="w-full px-2.5 py-2 bg-[#F8F1E5] border border-[#DCCFBC] focus:border-[#C85A32] focus:bg-[#FAF4EB] rounded-xl text-[#1F1D1A] font-mono text-xs focus:outline-none shadow-xs"
                        />
                        <input
                          type="time"
                          value={pickupTime}
                          onChange={(e) => {
                            setPickupTime(e.target.value);
                            if (validationErrors.schedule) setValidationErrors((prev) => ({ ...prev, schedule: null }));
                          }}
                          required
                          className="w-full px-2.5 py-2 bg-[#F8F1E5] border border-[#DCCFBC] focus:border-[#C85A32] focus:bg-[#FAF4EB] rounded-xl text-[#1F1D1A] font-mono text-xs focus:outline-none shadow-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono font-bold text-[#5C4E42] mb-1.5 text-[10px] uppercase tracking-widest">
                        DELIVERY TARGET
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={deliveryDate}
                          onChange={(e) => {
                            setDeliveryDate(e.target.value);
                            if (validationErrors.schedule) setValidationErrors((prev) => ({ ...prev, schedule: null }));
                          }}
                          required
                          className="w-full px-2.5 py-2 bg-[#F8F1E5] border border-[#DCCFBC] focus:border-[#C85A32] focus:bg-[#FAF4EB] rounded-xl text-[#1F1D1A] font-mono text-xs focus:outline-none shadow-xs"
                        />
                        <input
                          type="time"
                          value={deliveryTime}
                          onChange={(e) => {
                            setDeliveryTime(e.target.value);
                            if (validationErrors.schedule) setValidationErrors((prev) => ({ ...prev, schedule: null }));
                          }}
                          required
                          className="w-full px-2.5 py-2 bg-[#F8F1E5] border border-[#DCCFBC] focus:border-[#C85A32] focus:bg-[#FAF4EB] rounded-xl text-[#1F1D1A] font-mono text-xs focus:outline-none shadow-xs"
                        />
                      </div>
                    </div>
                  </div>
                  {validationErrors.schedule && (
                    <span className="text-[10px] text-[#BA4336] font-mono font-bold mt-1 block">{validationErrors.schedule}</span>
                  )}
                </div>

                {/* ── SECTION 3: REQUIREMENTS ─────────────────── */}
                <div className="p-6 bg-[#FAF2E4]/95 backdrop-blur-xs border border-[#DCCFBC] rounded-2xl space-y-4 shadow-sm sf-tactile-card">
                  <div className="flex items-center justify-between border-b border-[#DCCFBC] pb-3">
                    <span className="text-xs font-bold text-[#1F1D1A] uppercase tracking-wide flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#FDF7EC] border border-[#DCCFBC] text-[#C85A32] text-[10px] flex items-center justify-center font-bold font-mono">3</span>
                      <span>Operational & Cold-Chain Policies</span>
                    </span>
                    <span className="text-[10px] text-[#827263] font-mono uppercase tracking-widest font-bold">SLA & HANDLING</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono font-bold text-[#5C4E42] mb-1.5 text-[10px] uppercase tracking-widest">
                        DELIVERY PRIORITY
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#F8F1E5] border border-[#DCCFBC] focus:border-[#C85A32] focus:bg-[#FAF4EB] rounded-xl text-[#1F1D1A] text-xs font-bold cursor-pointer shadow-xs"
                      >
                        <option value="Standard">Standard (Lowest Cost & Multi-Shipper Yield)</option>
                        <option value="Express">Express (Balanced Velocity & Consolidation)</option>
                        <option value="Urgent">Urgent (Fastest Highway Linehaul)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono font-bold text-[#5C4E42] mb-1.5 text-[10px] uppercase tracking-widest">
                        SPECIAL REQUIREMENT
                      </label>
                      <select
                        value={specialRequirement}
                        onChange={(e) => setSpecialRequirement(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#F8F1E5] border border-[#DCCFBC] focus:border-[#C85A32] focus:bg-[#FAF4EB] rounded-xl text-[#1F1D1A] text-xs font-bold cursor-pointer shadow-xs"
                      >
                        <option value="Normal">Normal (Standard Ambient Freight)</option>
                        <option value="Refrigerated">Refrigerated (Active Cold-Chain 2-8°C Produce)</option>
                        <option value="Fragile">Fragile (High-Care Cushioning & Handled)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={optimizing}
                    className="w-full sm:w-auto px-9 py-4 bg-[#1F1D1A] hover:bg-[#3D2E24] text-[#FDF7EC] rounded-full text-xs font-bold tracking-[0.2em] uppercase shadow-[0_2px_8px_rgba(31,29,26,0.18)] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 active:translate-y-0.5 active:shadow-xs"
                  >
                    <RefreshCw className={`w-4 h-4 text-[#C85A32] ${optimizing ? "animate-spin" : ""}`} />
                    <span>{optimizing ? "CALCULATING HIGHWAY PLAN..." : "FIND BEST PLAN →"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* OPTIMIZATION PROGRESS OVERLAY */}
          {optimizing && (
            <div className="p-6 bg-[#FAF2E4] text-[#1F1D1A] rounded-2xl border border-[#DCCFBC] text-xs shadow-md animate-fade-in flex items-center justify-between max-w-4xl mx-auto">
              <div className="flex items-center gap-3.5">
                <RefreshCw className="w-6 h-6 text-[#C85A32] animate-spin shrink-0" />
                <div>
                  <div className="font-bold text-[#1F1D1A] flex items-center gap-2">
                    <span>EVALUATING FLEET CORRIDOR MATRIX</span>
                    <span className="text-[10px] text-[#C85A32] font-mono font-bold">[{optimizingStep + 1}/5]</span>
                  </div>
                  <div className="text-[11px] text-[#5C4E42] font-mono mt-0.5">
                    {OPTIMIZATION_STEPS[optimizingStep]}
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                {[0, 1, 2, 3, 4].map((step) => (
                  <span
                    key={step}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      step <= optimizingStep ? "w-6 bg-[#C85A32]" : "w-2 bg-[#DCCFBC]"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* VIEW 2: BEST PLAN RESULTS VIEW */}
          {viewMode === "results" && (
            <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
              {/* PLAN SAVED BANNER */}
              {planSaved && activePlan && (
                <div className="p-4 bg-[#E6EFE2] border border-[#B8D6B0] rounded-2xl text-[#2D5224] text-xs font-mono flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-[#2D5224] shrink-0" />
                    <span>
                      <strong className="text-[#2D5224]">Shipment registered:</strong> Plan for {productType} ({weightKg} kg) assigned to {activePlan.name} is persisted in database (ID: {savedShipmentId || "SAVED"}).
                    </span>
                  </div>
                  <Link
                    href="/shipments"
                    className="text-[10px] font-bold text-[#FDF7EC] bg-[#1F1D1A] hover:bg-[#3D2E24] px-4 py-1.5 rounded-full transition-all inline-flex items-center gap-1.5 uppercase tracking-wider shadow-xs"
                  >
                    <span>View Shipments</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C85A32]" />
                  </Link>
                </div>
              )}

              {saveError && (
                <div className="p-4 bg-[#FDF0EA] border border-[#F5CABA] rounded-2xl text-xs font-mono text-[#BA4336] flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#BA4336] shrink-0" />
                    <span>{saveError}</span>
                  </div>
                  <button onClick={() => setSaveError(null)} className="text-[#C85A32] hover:underline font-bold">
                    Dismiss
                  </button>
                </div>
              )}

              {/* 1. YOUR BEST PLAN SHOWCASE */}
              {hasSuitableVehicle && activePlan && (
                <section
                  key={`best-plan-${resultsRevealKey}-${selectedVehicleId}`}
                  className="bg-[#FAF2E4]/95 backdrop-blur-xs border border-[#DCCFBC] rounded-3xl shadow-md overflow-hidden sf-tactile-card"
                >
                  <div className="h-1.5 bg-[#C85A32] w-full" />

                  {/* Header */}
                  <div className="px-6 py-4 bg-[#FDF7EC] border-b border-[#DCCFBC] flex items-center justify-between select-none">
                    <div className="flex items-center gap-2.5">
                      <Award className="w-5 h-5 text-[#C85A32]" />
                      <h2 className="text-xs font-bold uppercase tracking-widest text-[#1F1D1A] font-mono">
                        OPTIMAL DISPATCH PLAN // {activePlan.name}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F8ECE4] text-[#B44E29] border border-[#EAC8B8]">
                        {activePlan.isRecommended ? "★ RECOMMENDED FIT" : "CUSTOM SELECTED"}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E6EFE2] text-[#2D5224] border border-[#B8D6B0]">
                        ● AVAILABLE
                      </span>
                      <span className="text-[10px] text-[#5C4E42] hidden sm:inline font-bold">
                        {activePlan.is_refrigerated ? "❄️ COLD-CHAIN ACTIVE" : "📦 AMBIENT FREIGHT"}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Top Details Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                      {/* Recommended Vehicle Box */}
                      <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-[#FDF7EC] border border-[#DCCFBC] rounded-2xl text-center shadow-xs">
                        <VehicleIllustration
                          type={activePlan.name}
                          mode="arrive"
                          isSelected={true}
                          isRecommended={activePlan.isRecommended}
                          showRoad={true}
                          className="w-44 h-22"
                        />
                        <h3 className="text-xs font-bold text-[#1F1D1A] mt-3">
                          {activePlan.name} <span className="text-[#C85A32] font-mono">({activePlan.id})</span>
                        </h3>
                        <p className="text-[11px] text-[#5C4E42] font-mono mt-1">
                          Payload: <strong className="text-[#1F1D1A]">{weightKg} kg</strong> / {activePlan.capacity_kg.toLocaleString()} kg ({Math.round((weightKg / activePlan.capacity_kg) * 100)}% load fit)
                        </p>
                      </div>

                      {/* Key Metric Blocks */}
                      <div className="lg:col-span-8 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {/* Cost */}
                          <div className="p-3.5 bg-[#FDF7EC] rounded-xl border border-[#DCCFBC] font-mono shadow-xs">
                            <span className="text-[9px] uppercase text-[#827263] font-bold tracking-wider block">Cost</span>
                            <strong className="text-lg font-bold text-[#1F1D1A] block mt-0.5">
                              <AnimatedNumber value={activePlan.cost} prefix="₹" />
                            </strong>
                            <span className="text-[9px] text-[#827263]">Base ₹{activePlan.separateCost?.toLocaleString()}</span>
                          </div>

                          {/* Savings */}
                          <div className="p-3.5 bg-[#E6EFE2] rounded-xl border border-[#B8D6B0] font-mono shadow-xs">
                            <span className="text-[9px] uppercase text-[#2D5224] font-bold tracking-wider block">Savings</span>
                            <strong className="text-lg font-bold text-[#2D5224] block mt-0.5">
                              +<AnimatedNumber value={activePlan.savings} prefix="₹" />
                            </strong>
                            <span className="text-[9px] text-[#2D5224] font-bold">
                              +<AnimatedNumber value={activePlan.savingsPercent} suffix="%" /> Net
                            </span>
                          </div>

                          {/* Risk */}
                          <div className="p-3.5 bg-[#FDF7EC] rounded-xl border border-[#DCCFBC] font-mono shadow-xs">
                            <span className="text-[9px] uppercase text-[#827263] font-bold tracking-wider block">Risk Level</span>
                            <strong
                              className={`text-lg font-bold block mt-0.5 ${
                                activePlan.riskLevel === "HIGH"
                                  ? "text-[#BA4336]"
                                  : activePlan.riskLevel === "MEDIUM"
                                  ? "text-[#D49A29]"
                                  : "text-[#4D6A42]"
                              }`}
                            >
                              <AnimatedNumber value={activePlan.riskPercent} decimals={1} suffix="%" />
                            </strong>
                            <span className="text-[9px] text-[#5C4E42]">{activePlan.riskLevel} Tier</span>
                          </div>

                          {/* Duration */}
                          <div className="p-3.5 bg-[#FDF7EC] rounded-xl border border-[#DCCFBC] font-mono shadow-xs">
                            <span className="text-[9px] uppercase text-[#827263] font-bold tracking-wider block">Transit Time</span>
                            <strong className="text-lg font-bold text-[#1F1D1A] block mt-0.5">
                              <AnimatedNumber value={activePlan.durationHours} decimals={1} suffix=" hrs" />
                            </strong>
                            <span className="text-[9px] text-[#5C4E42]">{activePlan.distanceKm} km NH-16</span>
                          </div>
                        </div>

                        {/* Route Strip */}
                        <div className="p-3 bg-[#FDF7EC] border border-[#DCCFBC] rounded-xl flex flex-wrap items-center justify-between text-xs font-mono gap-2 shadow-xs">
                          <div className="flex items-center gap-2">
                            <Navigation className="w-3.5 h-3.5 text-[#C85A32]" />
                            <span className="text-[#5C4E42] font-bold">Route:</span>
                            <span className="text-[#3D2E24] font-bold bg-[#FAF2E4] px-2 py-0.5 rounded border border-[#DCCFBC]">
                              {origin} → {destination}
                            </span>
                            <span className="text-[#827263] text-[10px]">({activePlan.distanceKm} km via NH-16 Arterial)</span>
                          </div>
                          <div className="text-[10px] text-[#C85A32] font-bold">
                            Pickup: {pickupDate} @ {pickupTime} | Target: {deliveryDate} @ {deliveryTime}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Street Routing Map Canvas */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs font-mono select-none">
                        <div className="flex items-center gap-2 text-[#1F1D1A] font-bold uppercase tracking-wider">
                          <Navigation className="w-3.5 h-3.5 text-[#C85A32]" />
                          <span>Highway Corridor Navigation // Street Routing</span>
                        </div>
                        <span className="text-[10px] text-[#C85A32] font-bold px-2.5 py-0.5 bg-[#FDF7EC] border border-[#DCCFBC] rounded-full">
                          OSRM ENGINE CONNECTED
                        </span>
                      </div>

                      <StreetRouteMap
                        originName={origin}
                        destinationName={destination}
                        vehicleType={activePlan.name}
                        routeData={streetRouteData}
                        loading={routeLoading}
                        error={routeError}
                      />
                    </div>

                    {/* Action Bar */}
                    <div className="pt-4 flex flex-wrap items-center justify-between border-t border-[#DCCFBC] gap-3">
                      <button
                        onClick={() => setViewMode("form")}
                        className="px-5 py-2.5 bg-[#FDF7EC] hover:bg-[#FAF2E4] text-[#1F1D1A] rounded-full text-xs font-mono font-bold transition-all border border-[#DCCFBC] flex items-center gap-1.5 cursor-pointer shadow-xs active:translate-y-0.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 text-[#C85A32]" />
                        <span>Reconfigure Requirements</span>
                      </button>

                      <button
                        onClick={handleSavePlan}
                        disabled={savingPlan || planSaved}
                        className={`px-8 py-3 rounded-full text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:translate-y-0.5 disabled:opacity-75 ${
                          planSaved
                            ? "bg-[#E6EFE2] text-[#2D5224] border border-[#B8D6B0] cursor-default"
                            : "bg-[#1F1D1A] hover:bg-[#3D2E24] text-[#FDF7EC] font-bold"
                        }`}
                      >
                        {savingPlan ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-[#C85A32]" />
                        ) : (
                          <BookmarkCheck className="w-4 h-4 text-[#C85A32]" />
                        )}
                        <span>
                          {savingPlan
                            ? "Persisting Plan..."
                            : planSaved
                            ? "✓ Shipment Persisted"
                            : "Save This Shipment Plan"}
                        </span>
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* 2. FLEET MATRIX / ALTERNATIVE VEHICLES */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1 text-xs font-mono">
                  <div className="flex items-center gap-2 font-bold text-[#1F1D1A] uppercase tracking-wider">
                    <Truck className="w-4 h-4 text-[#C85A32]" />
                    <span>Fleet Vehicle Comparison ({vehicleOptions.length} Vehicles in Registry)</span>
                  </div>
                  <span className="text-[10px] text-[#C85A32] font-bold px-2.5 py-0.5 bg-[#FDF7EC] border border-[#DCCFBC] rounded-full">
                    LIVE ASSETS
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {vehicleOptions.map((veh, idx) => {
                    const isSelected = selectedVehicleId === veh.id;
                    const isRecommended = veh.isRecommended;
                    const isAvailable = veh.status === "Available";
                    const isSelectable = veh.isEligible;

                    return (
                      <div
                        key={veh.id}
                        onClick={() => {
                          if (isSelectable) {
                            setSelectedVehicleId(veh.id);
                            setRouteTransitKey((prev) => prev + 1);
                            setPlanSaved(false);
                            if (!hasSuitableVehicle) setHasSuitableVehicle(true);
                          }
                        }}
                        style={{ animationDelay: `${idx * 80}ms` }}
                        className={`border rounded-2xl p-5 transition-all duration-200 ease-out relative flex flex-col justify-between sf-tactile-card ${
                          isSelected
                            ? "bg-[#FAF0DC] border-[#C85A32] shadow-md"
                            : !isSelectable
                            ? "bg-[#FAF2E4]/40 border-[#DCCFBC] opacity-50"
                            : "bg-[#FAF2E4] hover:bg-[#FAF0DC] border-[#DCCFBC] cursor-pointer"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1.5">
                              {isRecommended ? (
                                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#F8ECE4] text-[#B44E29] border border-[#EAC8B8] flex items-center gap-1">
                                  <Award className="w-3 h-3 text-[#C85A32]" />
                                  RECOMMENDED
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FDF7EC] text-[#5C4E42] border border-[#DCCFBC]">
                                  {veh.id}
                                </span>
                              )}
                            </div>

                            {isAvailable ? (
                              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E6EFE2] text-[#2D5224] border border-[#B8D6B0]">
                                ● Available
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FDF7EC] text-[#827263] border border-[#DCCFBC]">
                                Unavailable
                              </span>
                            )}
                          </div>

                          <div className="py-3 flex items-center justify-center bg-[#FDF7EC] border border-[#DCCFBC] rounded-xl mb-3 overflow-hidden shadow-xs">
                            <VehicleIllustration
                              type={veh.name}
                              mode={isSelected ? "selected" : veh.status === "In Transit" ? "driving" : "idle"}
                              isSelected={isSelected}
                              isRecommended={isRecommended}
                              showRoad={true}
                              className="w-36 h-20"
                            />
                          </div>

                          <div className="mb-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-[#1F1D1A]">{veh.name}</h4>
                              <span className="text-[10px] font-mono text-[#C85A32] font-bold">
                                {veh.is_refrigerated ? "❄️ Reefer" : "📦 Ambient"}
                              </span>
                            </div>
                            <p className="text-[10px] font-mono text-[#5C4E42] mt-0.5">
                              Cap: <strong className="text-[#1F1D1A]">{veh.capacity_kg.toLocaleString()} kg</strong> ({Math.round((weightKg / veh.capacity_kg) * 100)}% fit)
                            </p>
                          </div>

                          <div className="p-3 bg-[#FDF7EC] border border-[#DCCFBC] rounded-xl space-y-1.5 mb-3 font-mono text-xs shadow-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-[#827263] text-[9px] uppercase font-bold">Cost</span>
                              <span className="font-bold text-[#1F1D1A]"><AnimatedNumber value={veh.cost} prefix="₹" /></span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[#2D5224] text-[9px] uppercase font-bold">Savings</span>
                              <span className="font-bold text-[#2D5224]">+<AnimatedNumber value={veh.savings} prefix="₹" /></span>
                            </div>
                          </div>

                          <div className={`text-[10px] font-mono leading-snug mb-3 ${!isSelectable ? "text-[#BA4336] bg-[#FDF0EA] p-2 rounded-lg border border-[#F5CABA]" : "text-[#5C4E42]"}`}>
                            {veh.recommendationReason}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#DCCFBC]">
                          {isSelectable ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVehicleId(veh.id);
                                setRouteTransitKey((prev) => prev + 1);
                                setPlanSaved(false);
                                if (!hasSuitableVehicle) setHasSuitableVehicle(true);
                              }}
                              className={`w-full py-2 rounded-full text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-0.5 ${
                                isSelected
                                  ? "bg-[#1F1D1A] text-[#FDF7EC] shadow-sm"
                                  : "bg-[#FDF7EC] hover:bg-[#FAF2E4] text-[#1F1D1A] border border-[#DCCFBC]"
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 text-[#C85A32]" />
                              <span>{isSelected ? "Currently Active" : "Select Vehicle"}</span>
                            </button>
                          ) : (
                            <div className="w-full py-2 rounded-full text-[10px] font-mono text-[#827263] bg-[#FAF2E4] border border-[#DCCFBC] text-center select-none">
                              Ineligible for Cargo
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}