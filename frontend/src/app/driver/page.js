"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import {
  Truck,
  User,
  MapPin,
  Clock,
  Milestone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  ArrowRight,
  ShieldAlert,
  Navigation,
  Package,
  Check,
  Snowflake,
} from "lucide-react";

// Dynamic Imports
const StreetRouteMap = dynamic(() => import("@/components/StreetRouteMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 rounded-2xl border border-[#E2D5C3] bg-[#FAF5EC] flex flex-col items-center justify-center text-[#5C5349] space-y-2 font-mono">
      <div className="w-6 h-6 border-2 border-[#C85A32] border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs text-[#5C5349] font-bold">INITIALIZING HIGHWAY ROUTE NAVIGATION...</span>
    </div>
  ),
});

const DriverInteractiveScrubber = dynamic(
  () => import("@/components/DriverInteractiveScrubber"),
  { ssr: false }
);

const DriverVectorStory = dynamic(
  () => import("@/components/DriverVectorStory"),
  { ssr: false }
);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// Standard 6-Stage Delivery Lifecycle Progression
const STATUS_STAGES = ["Assigned", "Accepted", "Picked Up", "In Transit", "Arrived", "Delivered"];

export default function DriverDashboardPage() {
  const router = useRouter();
  const { user, logout, getAuthHeaders, loading: authLoading } = useAuth();

  const [driverProfile, setDriverProfile] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [activeShipment, setActiveShipment] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);

  const [loadingData, setLoadingData] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState("");
  const [statusError, setStatusError] = useState("");
  const [confirmingAction, setConfirmingAction] = useState(null);
  const [currentTime, setCurrentTime] = useState("");

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }) + " IST"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Driver Profile and Assigned Shipment
  const fetchDriverData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const headers = getAuthHeaders ? getAuthHeaders() : { "Content-Type": "application/json" };
      const driverRes = await fetch(`${API_BASE_URL}/driver/me`, { headers });
      if (driverRes.ok) {
        const dData = await driverRes.json();
        setDriverProfile(dData);
      }

      const shipRes = await fetch(`${API_BASE_URL}/driver/shipments`, { headers });
      if (shipRes.ok) {
        const sData = await shipRes.json();
        setShipments(sData);

        const current = sData.find((s) => s.status !== "Delivered") || sData[0] || null;
        setActiveShipment(current);

        if (current) {
          fetchRouteGeometry(current.pickup_location, current.destination);
        }
      }
    } catch (err) {
      console.error("Driver data fetch error:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchDriverData();
    }
  }, [user, authLoading]);

  // Fetch OSRM Route Geometry for active shipment
  const fetchRouteGeometry = async (origin, destination) => {
    setRouteLoading(true);
    setRouteError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/routes/calculate?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
      );
      if (res.ok) {
        const data = await res.json();
        setRouteData(data);
      } else {
        setRouteError("Unable to calculate exact corridor coordinates.");
      }
    } catch (err) {
      setRouteError("Route calculation service offline.");
    } finally {
      setRouteLoading(false);
    }
  };

  // Status Advance Handler
  const executeStatusAdvance = async (newStatus) => {
    if (!activeShipment) return;
    setUpdatingStatus(true);
    setStatusSuccess("");
    setStatusError("");
    setConfirmingAction(null);

    try {
      const headers = getAuthHeaders ? getAuthHeaders() : { "Content-Type": "application/json" };
      const res = await fetch(`${API_BASE_URL}/driver/shipments/${activeShipment.id}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setStatusSuccess(`Status successfully advanced to ${newStatus.toUpperCase()}`);
        setActiveShipment(updated);
        setShipments((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const errData = await res.json();
        setStatusError(errData.detail || "Failed to update trip status.");
      }
    } catch (err) {
      setStatusError("Network error while updating status.");
    } finally {
      setUpdatingStatus(false);
      setTimeout(() => {
        setStatusSuccess("");
        setStatusError("");
      }, 5000);
    }
  };

  // Toggle Driver Availability
  const handleToggleAvailability = async (newStatus) => {
    try {
      const headers = getAuthHeaders ? getAuthHeaders() : { "Content-Type": "application/json" };
      const res = await fetch(`${API_BASE_URL}/driver/me`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ driver_status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDriverProfile(updated);
      }
    } catch (err) {
      console.error("Availability update error:", err);
    }
  };

  const currentStageIndex = activeShipment
    ? STATUS_STAGES.indexOf(activeShipment.status || "Assigned")
    : 0;

  const getPrimaryAction = (currentStatus) => {
    switch (currentStatus) {
      case "Assigned":
        return { target: "Accepted", label: "ACCEPT TRIP MANIFEST", requiresConfirm: false, promptText: null };
      case "Accepted":
        return { target: "Picked Up", label: "CONFIRM CARGO LOADED", requiresConfirm: true, promptText: "Confirm cargo loaded and manifest signed at pickup depot?" };
      case "Picked Up":
        return { target: "In Transit", label: "INITIATE HIGHWAY TRANSIT", requiresConfirm: true, promptText: "Confirm departure from depot and start NH-16 transit?" };
      case "In Transit":
        return { target: "Arrived", label: "MARK DESTINATION ARRIVAL", requiresConfirm: false, promptText: null };
      case "Arrived":
        return { target: "Delivered", label: "COMPLETE FINAL HANDOVER", requiresConfirm: true, promptText: "Confirm final handover to recipient and complete trip?" };
      default:
        return null;
    }
  };

  const primaryAction = getPrimaryAction(activeShipment?.status || "Assigned");

  if (authLoading || (loadingData && !driverProfile)) {
    return (
      <div className="flex min-h-screen bg-[#F4EBDD] text-[#1F1D1A] font-mono">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-[#C85A32] animate-spin" />
            <span className="text-xs text-[#5C5349] font-bold">SYNCHRONIZING DRIVER TERMINAL TELEMETRY...</span>
          </div>
        </div>
      </div>
    );
  }

  if (user && user.role === "consumer") {
    return (
      <div className="flex min-h-screen bg-[#F4EBDD] text-[#1F1D1A] font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-18 bg-[#FAF5EC] border-b border-[#E2D5C3] px-6 flex items-center justify-between sticky top-0 z-20 select-none">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C85A32] animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1F1D1A]">
                DRIVER TERMINAL // ROLE RESTRICTION
              </span>
            </div>
            <Link href="/" className="text-xs text-[#C85A32] hover:underline font-bold">
              ← Return to Consumer Dashboard
            </Link>
          </header>
          <main className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-[#FAF5EC] border border-[#E2D5C3] rounded-3xl p-8 text-center space-y-4 shadow-md">
              <div className="w-12 h-12 rounded-full bg-[#FDF0EA] border border-[#F5CABA] text-[#C85A32] flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6 text-[#C85A32]" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-[#1F1D1A] uppercase">Consumer Account Active</h2>
                <p className="text-xs text-[#5C5349] leading-relaxed">
                  You are signed in as <strong>{user.name}</strong> (Shipper). The Driver Terminal is tailored for fleet drivers with active road manifests.
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/"
                  className="w-full py-3 bg-[#1F1D1A] hover:bg-[#3D352E] text-[#FDFBF7] rounded-full text-xs font-bold uppercase tracking-wider transition-all text-center shadow-xs"
                >
                  Go to Consumer Dashboard
                </Link>
                <button
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                  className="w-full py-3 bg-[#FDFBF7] hover:bg-[#F4EBDD] text-[#1F1D1A] text-xs font-bold uppercase tracking-wider border border-[#E2D5C3] rounded-full transition-all cursor-pointer"
                >
                  Sign In as Driver
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const currentDriverStatus = driverProfile?.driver_status || "Available";
  const displayStatus =
    activeShipment && activeShipment.status !== "Delivered"
      ? "On Trip"
      : currentDriverStatus === "Off Duty"
      ? "Offline"
      : currentDriverStatus;

  return (
    <div className="flex min-h-screen bg-[#F4EBDD] text-[#1F1D1A] font-sans selection:bg-[#C85A32] selection:text-[#FFFFFF]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-18 bg-[#FAF5EC] border-b border-[#E2D5C3] px-6 flex items-center justify-between sticky top-0 z-20 select-none">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FDFBF7] border border-[#E2D5C3] shadow-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  displayStatus === "On Trip"
                    ? "bg-[#C85A32] animate-pulse"
                    : displayStatus === "Offline"
                    ? "bg-[#8A7E70]"
                    : "bg-[#4D6A42] animate-pulse"
                }`}
              />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F1D1A]">
                DRIVER TERMINAL // {displayStatus.toUpperCase()}
              </span>
            </div>
            <span className="text-[#D4C3AC] text-xs hidden sm:inline">|</span>
            <div className="text-[11px] text-[#C85A32] hidden sm:flex items-center gap-1.5 font-mono">
              <span className="text-[#8A7E70]">VEHICLE:</span>
              <span className="font-bold text-[#1F1D1A]">
                {driverProfile?.assigned_vehicle || "Refrigerated Van (Medium)"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono select-none">
            <span className="hidden lg:block bg-[#FDFBF7] text-[#C85A32] px-3 py-1 rounded-lg border border-[#E2D5C3] font-bold shadow-xs">{currentTime}</span>
            {driverProfile && (
              <span className="text-[10px] font-bold bg-[#FDFBF7] text-[#1F1D1A] px-2.5 py-1 rounded-lg border border-[#E2D5C3] shadow-xs">
                DRIVER: {driverProfile.name || "Rajesh Kumar"}
              </span>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">

            {/* DRIVER LOGISTICS VECTOR SCROLL STORY */}
            <div className="w-full">
              <DriverVectorStory shipmentId={activeShipment?.id || "SF-E35749"} />
            </div>

            {/* DRIVER STATUS & TELEMETRY STRIP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
              <div className="bg-[#FAF5EC] border border-[#E2D5C3] rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                <div className="text-[9px] uppercase text-[#8A7E70] tracking-wider flex items-center justify-between font-bold">
                  <span>Driver Identity</span>
                  <User className="w-3.5 h-3.5 text-[#C85A32]" />
                </div>
                <div className="mt-2">
                  <div className="text-xs font-bold text-[#1F1D1A] truncate">
                    {driverProfile?.name || user?.name || "Rajesh Kumar"}
                  </div>
                  <div className="text-[9px] text-[#5C5349] font-mono mt-0.5">
                    {driverProfile?.license_number || "OD-02-2024-DRV-8821"}
                  </div>
                </div>
              </div>

              <div className="bg-[#FAF5EC] border border-[#E2D5C3] rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                <div className="text-[9px] uppercase text-[#8A7E70] tracking-wider flex items-center justify-between font-bold">
                  <span>Assigned Carrier</span>
                  <Truck className="w-3.5 h-3.5 text-[#C85A32]" />
                </div>
                <div className="mt-2">
                  <div className="text-xs font-bold text-[#1F1D1A] truncate">
                    {driverProfile?.assigned_vehicle || "Refrigerated Van (Medium)"}
                  </div>
                  <div className="text-[9px] text-[#4D6A42] font-bold mt-0.5">
                    COLD-CHAIN IOT SYNCHRONIZED
                  </div>
                </div>
              </div>

              <div className="bg-[#FAF5EC] border border-[#E2D5C3] rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                <div className="text-[9px] uppercase text-[#8A7E70] tracking-wider flex items-center justify-between font-bold">
                  <span>Duty State</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      displayStatus === "On Trip"
                        ? "bg-[#C85A32] animate-pulse"
                        : displayStatus === "Offline"
                        ? "bg-[#8A7E70]"
                        : "bg-[#4D6A42]"
                    }`}
                  />
                </div>
                <div className="mt-2">
                  <select
                    value={
                      displayStatus === "On Trip"
                        ? "On Trip"
                        : currentDriverStatus === "Off Duty"
                        ? "Offline"
                        : "Available"
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      handleToggleAvailability(val === "Offline" ? "Off Duty" : "Available");
                    }}
                    disabled={displayStatus === "On Trip"}
                    className="w-full bg-[#FFFFFF] border border-[#E2D5C3] rounded-lg px-2.5 py-1 text-xs font-bold text-[#1F1D1A] focus:outline-none cursor-pointer disabled:opacity-60"
                  >
                    <option value="Available">AVAILABLE</option>
                    <option value="On Trip" disabled>ON TRIP (ACTIVE)</option>
                    <option value="Offline">OFFLINE</option>
                  </select>
                </div>
              </div>

              <div className="bg-[#FAF5EC] border border-[#E2D5C3] rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                <div className="text-[9px] uppercase text-[#8A7E70] tracking-wider flex items-center justify-between font-bold">
                  <span>Manifest ID</span>
                  <Package className="w-3.5 h-3.5 text-[#C85A32]" />
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-xs font-bold font-mono text-[#C85A32]">
                    {activeShipment ? activeShipment.id : "NO ACTIVE TRIP"}
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#E2D5C3] bg-[#FDFBF7] text-[#1F1D1A]">
                    {activeShipment?.status?.toUpperCase() || "STANDBY"}
                  </span>
                </div>
              </div>
            </div>

            {/* Status alerts */}
            {statusSuccess && (
              <div className="p-4 bg-[#EBF3EA] border border-[#C4DEC0] rounded-2xl text-[#2D5926] text-xs font-mono flex items-center gap-2.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2D5926]" />
                <span>{statusSuccess}</span>
              </div>
            )}
            {statusError && (
              <div className="p-4 bg-[#FDF0EA] border border-[#F5CABA] rounded-2xl text-[#BA4336] text-xs font-mono flex items-center gap-2.5 shadow-sm">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#BA4336]" />
                <span>{statusError}</span>
              </div>
            )}

            {/* SECTION 2: CURRENT TRIP // UNIFIED NAVIGATION WORKSPACE */}
            {activeShipment ? (
              <div className="space-y-6">
                <div className="bg-[#FAF5EC] border border-[#E2D5C3] rounded-3xl shadow-md overflow-hidden">
                  <div className="h-1.5 bg-[#C85A32] w-full" />

                  {/* Header: Origin → Destination */}
                  <div className="px-6 py-5 bg-[#FDFBF7] border-b border-[#E2D5C3] flex flex-wrap items-center justify-between gap-4 select-none">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#FDF0EA] border border-[#F5CABA] text-[#C85A32] flex items-center justify-center font-bold">
                        <Truck className="w-5 h-5 text-[#C85A32]" />
                      </div>
                      <div>
                        <div className="text-[9px] text-[#8A7E70] font-mono uppercase tracking-widest flex items-center gap-2 font-bold">
                          <span>MANIFEST: {activeShipment.id}</span>
                          <span className="text-[#D4C3AC]">•</span>
                          <span className="text-[#4D6A42]">COLD-CHAIN ACTIVE (04.2°C)</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-[#1F1D1A] tracking-tight flex items-center gap-3 mt-0.5">
                          <span>{activeShipment.pickup_location}</span>
                          <ArrowRight className="w-5 h-5 text-[#C85A32]" />
                          <span>{activeShipment.destination}</span>
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-[#8A7E70] uppercase font-mono font-bold">STAGE:</span>
                      <span className="text-xs font-bold px-3 py-1 rounded-full border border-[#F5CABA] bg-[#FDF0EA] text-[#C85A32] font-mono">
                        {activeShipment.status?.toUpperCase() || "ASSIGNED"}
                      </span>
                    </div>
                  </div>

                  {/* Operational Telemetry Strip */}
                  <div className="px-6 py-4 bg-[#FAF5EC] border-b border-[#E2D5C3] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-[9px] text-[#8A7E70] uppercase tracking-wider block font-bold">
                        DISTANCE & CORRIDOR
                      </span>
                      <div className="text-base font-bold text-[#1F1D1A] mt-0.5 flex items-center gap-1.5">
                        <Milestone className="w-4 h-4 text-[#C85A32]" />
                        <span>{routeData?.distance_km ? `${routeData.distance_km} km` : activeShipment.eta || "440.3 km"}</span>
                      </div>
                      <span className="text-[9px] text-[#5C5349]">NH-16 Freight Spine</span>
                    </div>

                    <div>
                      <span className="text-[9px] text-[#8A7E70] uppercase tracking-wider block font-bold">
                        ESTIMATED TRANSIT TIME
                      </span>
                      <div className="text-base font-bold text-[#1F1D1A] mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#4D6A42]" />
                        <span>{routeData?.duration_minutes ? `${Math.floor(routeData.duration_minutes / 60)}h ${Math.round(routeData.duration_minutes % 60)}m` : "5h 37m"}</span>
                      </div>
                      <span className="text-[9px] text-[#5C5349]">Target: {activeShipment.delivery_time || "18:00"} IST</span>
                    </div>

                    <div>
                      <span className="text-[9px] text-[#8A7E70] uppercase tracking-wider block font-bold">
                        CARGO PAYLOAD
                      </span>
                      <div className="text-base font-bold text-[#1F1D1A] mt-0.5 truncate">
                        {activeShipment.product_type}
                      </div>
                      <span className="text-[9px] text-[#5C5349]">
                        <strong className="text-[#1F1D1A]">{activeShipment.weight_kg.toLocaleString()} kg</strong> · {activeShipment.special_requirement || "Standard"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-[#8A7E70] uppercase tracking-wider block font-bold">
                        ASSIGNED CARRIER
                      </span>
                      <div className="text-base font-bold text-[#1F1D1A] mt-0.5 truncate">
                        {driverProfile?.assigned_vehicle || "Refrigerated Van (Medium)"}
                      </div>
                      <span className="text-[9px] text-[#4D6A42] font-bold">Chiller Active (2-8°C)</span>
                    </div>
                  </div>

                  {/* 6-Stage Visual Stepper */}
                  <div className="px-6 py-5 bg-[#FDFBF7] border-b border-[#E2D5C3] space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-[#1F1D1A] uppercase tracking-wider flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#EBF3EA] border border-[#C4DEC0] text-[#2D5926] text-[10px] flex items-center justify-center font-bold">
                          ✓
                        </span>
                        <span>Trip Lifecycle Progression</span>
                      </span>
                      <span className="text-[10px] text-[#C85A32] font-bold">
                        STAGE {currentStageIndex + 1} OF 6
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono">
                      {STATUS_STAGES.map((stage, idx) => {
                        const isPassed = idx < currentStageIndex;
                        const isCurrent = idx === currentStageIndex;
                        return (
                          <div
                            key={stage}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              isCurrent
                                ? "bg-[#FAF4E8] border-[#C85A32] text-[#1F1D1A] shadow-xs font-bold"
                                : isPassed
                                ? "bg-[#EBF3EA] border-[#C4DEC0] text-[#2D5926]"
                                : "bg-[#F4EBDD]/60 border-[#E2D5C3] text-[#8A7E70] opacity-70"
                            }`}
                          >
                            <div className="text-[8px] font-bold">
                              {isPassed ? "✓ COMPLETED" : isCurrent ? "● ACTIVE" : `STAGE 0${idx + 1}`}
                            </div>
                            <div className="text-xs font-bold uppercase truncate mt-0.5">
                              {stage}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Context-Aware Primary Driver Action */}
                    {primaryAction && (
                      <div className="pt-2">
                        {!confirmingAction ? (
                          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#FAF5EC] rounded-2xl border border-[#E2D5C3]">
                            <div className="text-xs text-[#5C5349] font-mono">
                              Current Status: <strong className="text-[#1F1D1A]">{activeShipment.status || "Assigned"}</strong>. Ready for next operational milestone:
                            </div>
                            <button
                              onClick={() => {
                                if (primaryAction.requiresConfirm) {
                                  setConfirmingAction(primaryAction.target);
                                } else {
                                  executeStatusAdvance(primaryAction.target);
                                }
                              }}
                              disabled={updatingStatus}
                              className="px-6 py-3 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 bg-[#1F1D1A] hover:bg-[#3D352E] text-[#FDFBF7] shadow-sm active:scale-[0.98]"
                            >
                              {updatingStatus ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin text-[#C85A32]" />
                                  <span>Syncing Status...</span>
                                </>
                              ) : (
                                <>
                                  <span>{primaryAction.label}</span>
                                  <ArrowRight className="w-4 h-4 text-[#C85A32]" />
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 bg-[#FDF0EA] border border-[#F5CABA] rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
                            <div className="flex items-center gap-2 text-xs font-mono text-[#1F1D1A]">
                              <AlertCircle className="w-4 h-4 text-[#C85A32] shrink-0" />
                              <span>{primaryAction.promptText || `Confirm advancing status to ${primaryAction.target}?`}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setConfirmingAction(null)}
                                className="px-4 py-2 bg-[#FAF5EC] border border-[#E2D5C3] rounded-full text-xs font-mono text-[#5C5349] hover:bg-[#FDFBF7] transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => executeStatusAdvance(primaryAction.target)}
                                disabled={updatingStatus}
                                className="px-5 py-2 bg-[#C85A32] hover:bg-[#B8532B] text-white rounded-full text-xs font-mono font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                              >
                                {updatingStatus ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Updating...</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Yes, Confirm</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeShipment.status === "Delivered" && (
                      <div className="p-4 bg-[#EBF3EA] border border-[#C4DEC0] rounded-2xl text-center text-xs text-[#2D5926] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2D5926]" />
                        <span>TRIP COMPLETED — RECIPIENT SIGNED & MANIFEST CLOSED</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 pb-0">
                    <DriverInteractiveScrubber currentStatus={activeShipment.status} />
                  </div>

                  <div className="p-6">
                    <StreetRouteMap
                      originName={activeShipment.pickup_location}
                      destinationName={activeShipment.destination}
                      vehicleType={driverProfile?.assigned_vehicle || "Refrigerated Van (Medium)"}
                      routeData={routeData}
                      loading={routeLoading}
                      error={routeError}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#FAF5EC] border border-[#E2D5C3] rounded-3xl p-12 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-[#FDF0EA] border border-[#F5CABA] flex items-center justify-center mx-auto text-[#C85A32]">
                  <Package className="w-7 h-7" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h4 className="text-sm font-bold text-[#1F1D1A] uppercase font-mono">No active trip manifest</h4>
                  <p className="text-xs text-[#5C5349] leading-relaxed">
                    You don't currently have an assigned shipment manifest. When a freight operator assigns a trip to your vehicle, it will appear here immediately.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={fetchDriverData}
                    className="px-6 py-3 bg-[#1F1D1A] hover:bg-[#3D352E] text-[#FDFBF7] rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#C85A32]" />
                    <span>Poll Assignment Registry</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
