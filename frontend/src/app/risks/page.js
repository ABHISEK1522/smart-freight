"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  AlertOctagon,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Truck,
  ThermometerSnowflake,
  Clock,
  Activity,
  Layers,
  FileText,
  Sparkles,
  Zap,
  Check,
  MapPin,
  AlertCircle,
  TrendingDown,
  Scale,
  Snowflake,
  ArrowRight,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function RiskAnalysisPage() {
  const [currentTime, setCurrentTime] = useState("");

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

  const riskFactors = [
    {
      category: "Cold-Chain Thermal Drift",
      level: "LOW",
      score: "02.1%",
      color: "text-[#4D6A42]",
      desc: "Continuous IoT sensor calibration on NH-16 maintains 04.2°C nominal chiller regulation.",
    },
    {
      category: "Highway Congestion (Balasore)",
      level: "MEDIUM",
      score: "14.8%",
      color: "text-[#D49A29]",
      desc: "Moderate toll booth queue at Balasore junction; dynamic bypass buffer active.",
    },
    {
      category: "Cargo Fragility / Vibration",
      level: "LOW",
      score: "03.4%",
      color: "text-[#4D6A42]",
      desc: "Air-ride suspension active on primary heavy linehaul carrier.",
    },
    {
      category: "Delivery SLA Breach",
      level: "LOW",
      score: "01.2%",
      color: "text-[#4D6A42]",
      desc: "Current linehaul velocity maintains 42-minute margin ahead of delivery window.",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#F4EBDD] text-[#1F1D1A] font-sans selection:bg-[#C85A32] selection:text-[#FFFFFF]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-18 bg-[#FAF5EC] border-b border-[#E2D5C3] px-6 flex items-center justify-between sticky top-0 z-20 select-none">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FDFBF7] border border-[#E2D5C3] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#4D6A42] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F1D1A]">
                RISK RADAR // CORRIDOR SAFETY MATRIX
              </span>
            </div>
            <span className="text-[#D4C3AC] text-xs">|</span>
            <div className="text-[11px] text-[#4D6A42] hidden sm:flex items-center gap-1.5 font-mono">
              <span className="text-[#8A7E70]">OVERALL RISK:</span>
              <span className="font-bold">04.2% (LOW HAZARD)</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono select-none">
            <span className="hidden lg:block bg-[#FDFBF7] text-[#C85A32] px-3 py-1 rounded-lg border border-[#E2D5C3] font-bold shadow-xs">{currentTime}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">

            {/* VECTOR CORRIDOR RISK ENVIRONMENT CANVAS */}
            <div className="bg-[#FAF5EC] border border-[#E2D5C3] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between border-b border-[#E2D5C3] pb-3 gap-2 select-none">
                <div>
                  <div className="text-[9px] text-[#8A7E70] font-mono uppercase tracking-widest flex items-center gap-2 font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#C85A32]" />
                    <span>REAL-TIME CORRIDOR HAZARD SCAN</span>
                  </div>
                  <h2 className="text-base font-black text-[#1F1D1A] font-mono mt-0.5">
                    Odisha-West Bengal Freight Line Hazard Profile
                  </h2>
                </div>
                <span className="text-xs font-mono font-bold text-[#4D6A42] px-3 py-1 bg-[#EBF3EA] border border-[#C4DEC0] rounded-full">
                  NOMINAL LINEHAUL
                </span>
              </div>

              {/* Vector Hazard Diagram */}
              <div className="w-full h-56 bg-[#FDFBF7] rounded-2xl border border-[#E2D5C3] p-4 flex items-center justify-center relative overflow-hidden shadow-xs">
                <svg viewBox="0 0 680 180" className="w-full h-full">
                  <defs>
                    <linearGradient id="riskTrackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#4D6A42" />
                      <stop offset="45%" stopColor="#D49A29" />
                      <stop offset="60%" stopColor="#4D6A42" />
                      <stop offset="100%" stopColor="#4D6A42" />
                    </linearGradient>
                  </defs>

                  <path d="M 60 90 L 180 90 L 320 90 L 460 90 L 600 90" fill="none" stroke="url(#riskTrackGrad)" strokeWidth="3.5" />

                  {/* Hazard Zone Highlight at Balasore */}
                  <g transform="translate(320, 90)">
                    <circle cx="0" cy="0" r="22" fill="rgba(212, 154, 41, 0.15)" stroke="#D49A29" strokeWidth="1.2" strokeDasharray="3 3" className="animate-spin" />
                    <circle cx="0" cy="0" r="7" fill="#D49A29" />
                    <text x="0" y="36" fill="#D49A29" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      BALASORE [14.8% CONGESTION]
                    </text>
                  </g>

                  {/* Clear Nodes */}
                  {[
                    { name: "BHUBANESWAR", x: 60, risk: "02.1%" },
                    { name: "CUTTACK", x: 180, risk: "03.0%" },
                    { name: "KHARAGPUR", x: 460, risk: "02.4%" },
                    { name: "KOLKATA", x: 600, risk: "01.8%" },
                  ].map((node) => (
                    <g key={node.name} transform={`translate(${node.x}, 90)`}>
                      <circle cx="0" cy="0" r="5" fill="#4D6A42" stroke="#FAF5EC" strokeWidth="1.2" />
                      <text x="0" y="-14" fill="#1F1D1A" fontSize="7.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                        {node.name}
                      </text>
                      <text x="0" y="24" fill="#4D6A42" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                        {node.risk}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>

              {/* 4 Risk Categories Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {riskFactors.map((r) => (
                  <div key={r.category} className="p-4 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl space-y-1 font-mono shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1F1D1A]">{r.category}</span>
                      <span className={`text-[10px] font-bold ${r.color}`}>● {r.level} ({r.score})</span>
                    </div>
                    <p className="text-[10px] text-[#5C5349] font-sans font-medium leading-relaxed mt-1">
                      {r.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
