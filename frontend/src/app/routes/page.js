"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Route,
  Navigation,
  Truck,
  Package,
  Clock,
  Scale,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  MapPin,
  ArrowRight,
  Layers,
  Sparkles,
  Sliders,
  AlertCircle,
  TrendingDown,
  ThermometerSnowflake,
  CornerDownRight,
  Milestone,
  Check,
  Zap,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const MASTER_CORRIDOR = [
  { name: "Puri", kmFromStart: 0, deltaKm: 0 },
  { name: "Bhubaneswar", kmFromStart: 60, deltaKm: 60 },
  { name: "Cuttack", kmFromStart: 90, deltaKm: 30 },
  { name: "Balasore", kmFromStart: 235, deltaKm: 145 },
  { name: "Kharagpur", kmFromStart: 350, deltaKm: 115 },
  { name: "Kolkata", kmFromStart: 440, deltaKm: 90 },
];

export default function RouteOptimizationPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState("");

  const [origin, setOrigin] = useState("Bhubaneswar");
  const [destination, setDestination] = useState("Kolkata");
  const [cargoType, setCargoType] = useState("Fresh Tomatoes");
  const [weightKg, setWeightKg] = useState(1200);
  const [temperature, setTemperature] = useState("04.2°C (2-8°C)");
  const [selectedVehicle, setSelectedVehicle] = useState("VH-101");

  const [routeMode, setRouteMode] = useState("recommended");

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

  const handleRunOptimizer = () => {
    setOptimizing(true);
    setTimeout(() => {
      setOptimizing(false);
    }, 800);
  };

  return (
    <div className="flex min-h-screen bg-[#F4EBDD] text-[#1F1D1A] font-sans selection:bg-[#C85A32] selection:text-[#FFFFFF]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-18 bg-[#FAF5EC] border-b border-[#E2D5C3] px-6 flex items-center justify-between sticky top-0 z-20 select-none">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FDFBF7] border border-[#E2D5C3] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#C85A32] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F1D1A]">
                CORRIDOR INTELLIGENCE // ROUTE OPTIMIZATION
              </span>
            </div>
            <span className="text-[#D4C3AC] text-xs">|</span>
            <div className="text-[11px] text-[#C85A32] hidden sm:flex items-center gap-1.5 font-mono">
              <span className="text-[#8A7E70]">CORRIDOR:</span>
              <span className="font-bold text-[#1F1D1A]">NH-16 ARTERIAL SPINE</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono select-none">
            <span className="hidden lg:block bg-[#FDFBF7] text-[#C85A32] px-3 py-1 rounded-lg border border-[#E2D5C3] font-bold shadow-xs">{currentTime}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
            
            {/* Main Interactive Route Inspector */}
            <div className="p-6 bg-[#FAF5EC] border border-[#E2D5C3] rounded-3xl shadow-sm space-y-6">
              
              {/* Header & Mode Selector */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2D5C3] pb-4">
                <div>
                  <div className="text-[9px] text-[#8A7E70] font-mono uppercase tracking-widest flex items-center gap-2 font-bold">
                    <span>ODISHA → WEST BENGAL</span>
                    <span className="text-[#D4C3AC]">•</span>
                    <span className="text-[#4D6A42]">REAL-TIME HIGHWAY ANALYSIS</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#1F1D1A] tracking-tight flex items-center gap-3 mt-1">
                    <span>{origin}</span>
                    <ArrowRight className="w-5 h-5 text-[#C85A32]" />
                    <span>{destination}</span>
                  </h2>
                </div>

                <div className="flex items-center p-1 bg-[#F4EBDD] border border-[#E2D5C3] rounded-xl font-mono text-xs">
                  <button
                    onClick={() => setRouteMode("original")}
                    className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                      routeMode === "original"
                        ? "bg-[#FDFBF7] text-[#BA4336] border border-[#F5CABA] shadow-xs"
                        : "text-[#5C5349] hover:text-[#1F1D1A]"
                    }`}
                  >
                    Original Route (Unoptimized)
                  </button>
                  <button
                    onClick={() => setRouteMode("recommended")}
                    className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                      routeMode === "recommended"
                        ? "bg-[#FDFBF7] text-[#C85A32] border border-[#C85A32] shadow-xs"
                        : "text-[#5C5349] hover:text-[#1F1D1A]"
                    }`}
                  >
                    Recommended Route (87% Fit)
                  </button>
                </div>
              </div>

              {/* Vector Highway Canvas */}
              <div className="w-full h-64 bg-[#FDFBF7] rounded-2xl border border-[#E2D5C3] p-4 flex items-center justify-center relative overflow-hidden shadow-xs">
                <svg viewBox="0 0 720 220" className="w-full h-full">
                  <defs>
                    <linearGradient id="recRouteGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#C85A32" stopOpacity="0.4" />
                      <stop offset="60%" stopColor="#C85A32" />
                      <stop offset="100%" stopColor="#1F1D1A" />
                    </linearGradient>
                  </defs>

                  {/* Original Inefficient Route */}
                  {routeMode === "original" ? (
                    <g>
                      <path
                        d="M 60 170 C 180 80, 320 220, 480 90 S 600 140, 660 50"
                        fill="none"
                        stroke="#BA4336"
                        strokeWidth="2.8"
                        strokeDasharray="4 4"
                      />
                      <g transform="translate(340, 180)">
                        <rect x="-45" y="-10" width="90" height="18" fill="#FAF5EC" stroke="#BA4336" rx="4" />
                        <text x="0" y="2" fill="#BA4336" fontSize="7.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                          CONGESTION RISK (+2.4h)
                        </text>
                      </g>
                    </g>
                  ) : (
                    /* Recommended Optimized Route */
                    <g>
                      <path
                        d="M 60 170 L 180 140 L 340 110 L 480 80 L 660 50"
                        fill="none"
                        stroke="url(#recRouteGrad)"
                        strokeWidth="3.5"
                      />

                      {/* Moving Vehicle Beacon */}
                      <g transform="translate(340, 110)">
                        <rect x="-5" y="-5" width="10" height="10" transform="rotate(45)" fill="#FAF5EC" stroke="#C85A32" strokeWidth="2" />
                        <circle cx="0" cy="0" r="14" fill="none" stroke="#C85A32" strokeWidth="1" strokeDasharray="2 2" className="animate-spin" />
                        <g transform="translate(14, -12)">
                          <rect x="-2" y="-9" width="120" height="18" fill="#FAF5EC" stroke="#E2D5C3" rx="4" />
                          <text x="3" y="0" fill="#1F1D1A" fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                            LINEHAUL OPTIMIZED
                          </text>
                          <text x="3" y="6.5" fill="#C85A32" fontSize="6" fontFamily="monospace" fontWeight="bold">
                            87% LOAD · 04.2°C STABLE
                          </text>
                        </g>
                      </g>
                    </g>
                  )}

                  {/* Waypoint Nodes */}
                  {MASTER_CORRIDOR.map((n, idx) => (
                    <g key={n.name} transform={`translate(${60 + idx * 120}, ${170 - idx * 24})`}>
                      <circle cx="0" cy="0" r="8" fill="rgba(200, 90, 50, 0.15)" stroke="#C85A32" strokeWidth="1.2" />
                      <circle cx="0" cy="0" r="3" fill="#C85A32" />
                      <text x="10" y="3" fill="#1F1D1A" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                        {n.name}
                      </text>
                      <text x="10" y="11" fill="#8A7E70" fontSize="6.5" fontFamily="monospace">
                        {n.kmFromStart} KM
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              {/* 5-Metric Comparison Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
                <div className="p-3.5 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl shadow-xs">
                  <span className="text-[8px] text-[#8A7E70] uppercase tracking-wider block font-bold">DISTANCE</span>
                  <div className="text-base font-bold text-[#1F1D1A] mt-1">
                    {routeMode === "recommended" ? "428 KM" : "485 KM (+57)"}
                  </div>
                  <span className="text-[9px] text-[#4D6A42] font-bold">Direct NH-16 Line</span>
                </div>

                <div className="p-3.5 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl shadow-xs">
                  <span className="text-[8px] text-[#8A7E70] uppercase tracking-wider block font-bold">LINEHAUL COST</span>
                  <div className="text-base font-bold text-[#1F1D1A] mt-1">
                    {routeMode === "recommended" ? "₹18,000" : "₹27,500"}
                  </div>
                  <span className="text-[9px] text-[#4D6A42] font-bold">
                    {routeMode === "recommended" ? "34.5% Reduction" : "Unconsolidated"}
                  </span>
                </div>

                <div className="p-3.5 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl shadow-xs">
                  <span className="text-[8px] text-[#8A7E70] uppercase tracking-wider block font-bold">DELAY RISK</span>
                  <div className={`text-base font-bold mt-1 ${routeMode === "recommended" ? "text-[#4D6A42]" : "text-[#BA4336]"}`}>
                    {routeMode === "recommended" ? "04.2% LOW" : "28.4% HIGH"}
                  </div>
                  <span className="text-[9px] text-[#5C5349]">Toll Bypass Active</span>
                </div>

                <div className="p-3.5 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl shadow-xs">
                  <span className="text-[8px] text-[#8A7E70] uppercase tracking-wider block font-bold">SPOILAGE RISK</span>
                  <div className={`text-base font-bold mt-1 ${routeMode === "recommended" ? "text-[#4D6A42]" : "text-[#C85A32]"}`}>
                    {routeMode === "recommended" ? "01.1% STABLE" : "14.2% AT RISK"}
                  </div>
                  <span className="text-[9px] text-[#5C5349]">04.2°C Cold Chain</span>
                </div>

                <div className="p-3.5 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl shadow-xs">
                  <span className="text-[8px] text-[#8A7E70] uppercase tracking-wider block font-bold">CAPACITY FIT</span>
                  <div className="text-base font-bold text-[#C85A32] mt-1">
                    {routeMode === "recommended" ? "87.4% OPTIMAL" : "32.0% UNDERFIT"}
                  </div>
                  <span className="text-[9px] text-[#5C5349]">Consolidated Load</span>
                </div>
              </div>
            </div>

            {/* Reconfiguration Controls */}
            <div className="p-6 bg-[#FAF5EC] border border-[#E2D5C3] rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2D5C3] pb-3">
                <span className="text-xs font-bold font-mono text-[#1F1D1A] uppercase tracking-wider">
                  Corridor Parameters
                </span>
                <span className="text-[10px] text-[#8A7E70] font-mono font-bold">CALIBRATED LOGISTICS ENGINE</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div>
                  <label className="block text-[9px] text-[#5C5349] font-bold uppercase mb-1">Origin Node</label>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E2D5C3] rounded-xl text-[#1F1D1A] focus:outline-none focus:border-[#C85A32] cursor-pointer"
                  >
                    <option value="Bhubaneswar">Bhubaneswar</option>
                    <option value="Puri">Puri</option>
                    <option value="Cuttack">Cuttack</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] text-[#5C5349] font-bold uppercase mb-1">Destination Node</label>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E2D5C3] rounded-xl text-[#1F1D1A] focus:outline-none focus:border-[#C85A32] cursor-pointer"
                  >
                    <option value="Kolkata">Kolkata</option>
                    <option value="Howrah">Howrah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] text-[#5C5349] font-bold uppercase mb-1">Payload (KG)</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E2D5C3] rounded-xl text-[#1F1D1A] focus:outline-none focus:border-[#C85A32]"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleRunOptimizer}
                    disabled={optimizing}
                    className="w-full py-2.5 bg-[#1F1D1A] hover:bg-[#3D352E] text-[#FDFBF7] rounded-full text-xs font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[#C85A32] ${optimizing ? "animate-spin" : ""}`} />
                    <span>{optimizing ? "Recalculating..." : "Optimize Route →"}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
