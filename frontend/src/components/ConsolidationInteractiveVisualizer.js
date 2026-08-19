"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2, TrendingDown, ShieldCheck, Zap, RotateCcw, Truck, Box, Sparkles } from "lucide-react";

/**
 * Interactive Consolidation Visualizer Component
 * Bronze / Charcoal / Warm-White Theme (Homepage Design System Compliant)
 */
export default function ConsolidationInteractiveVisualizer({ className = "" }) {
  const [isConsolidated, setIsConsolidated] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const toggleConsolidation = () => {
    setIsAnimating(true);
    setIsConsolidated((prev) => !prev);
    setTimeout(() => setIsAnimating(false), 900);
  };

  const shipments = [
    {
      id: "SHP-01",
      origin: "Puri",
      cargo: "Organic Chilled Dairy",
      weight: 1200,
      sepCost: 18000,
      consCost: 12000,
      temp: "2°C - 4°C",
      color: "#D19888",
    },
    {
      id: "SHP-02",
      origin: "Bhubaneswar",
      cargo: "Hydroponic Tomatoes",
      weight: 1500,
      sepCost: 19500,
      consCost: 13000,
      temp: "4°C - 8°C",
      color: "#A8B86B",
    },
    {
      id: "SHP-03",
      origin: "Cuttack",
      cargo: "Cold Pharma Consumables",
      weight: 800,
      sepCost: 16500,
      consCost: 11000,
      temp: "2°C - 6°C",
      color: "#D9A05B",
    },
  ];

  return (
    <div className={`bg-[#1E1717] border border-[#3D2E2E] rounded-[14px] shadow-lg p-5 font-mono text-[#FAF6F2] space-y-4 ${className}`}>
      {/* Visualizer Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3D2E2E] pb-3.5 select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#2B2020] border border-[#4D3838] flex items-center justify-center text-[#D19888]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#FAF6F2]">
              Consolidation Dynamics Simulation
            </h3>
            <p className="text-[9px] text-[#8E8B82]">
              Multi-shipper corridor clustering & payload optimization
            </p>
          </div>
        </div>

        {/* State Toggle Switch */}
        <div className="flex items-center gap-1 bg-[#2B2020] p-1 rounded-full border border-[#3D2E2E] text-[10px]">
          <button
            onClick={() => setIsConsolidated(false)}
            className={`px-3 py-1 font-bold uppercase rounded-full transition-all cursor-pointer ${
              !isConsolidated
                ? "bg-[#3D2E2E] text-[#C25450]"
                : "text-[#8E8B82] hover:text-[#FAF6F2]"
            }`}
          >
            3 Dispatches (Unconsolidated)
          </button>
          <button
            onClick={() => setIsConsolidated(true)}
            className={`px-3 py-1 font-bold uppercase rounded-full transition-all cursor-pointer ${
              isConsolidated
                ? "bg-[#3D2C2C] text-[#FAF6F2] border border-[#D19888]"
                : "text-[#8E8B82] hover:text-[#FAF6F2]"
            }`}
          >
            ★ 1 Consolidated Linehaul
          </button>
        </div>
      </div>

      {/* Interactive Graphic Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {shipments.map((s, idx) => (
          <div
            key={s.id}
            className={`p-3.5 rounded-[8px] border transition-all duration-300 ${
              isConsolidated
                ? "bg-[#2B2020] border-[#D19888]"
                : "bg-[#241B1B] border-[#3D2E2E]"
            }`}
          >
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#D19888] font-bold">{s.id}</span>
              <span className="text-[#8E8B82]">{s.origin} → Kolkata</span>
            </div>
            <div className="text-xs font-bold text-[#FAF6F2] mt-1">{s.cargo}</div>
            <div className="flex items-center justify-between text-[10px] pt-2 border-t border-[#3D2E2E] mt-2">
              <span className="text-[#8E8B82]">{s.weight} kg · {s.temp}</span>
              <span className="font-bold text-[#A8B86B]">
                ₹{isConsolidated ? s.consCost.toLocaleString() : s.sepCost.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Summary Strip */}
      <div className="p-3.5 bg-[#2B2020] border border-[#3D2E2E] rounded-[8px] flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-4">
          <span className="text-[#8E8B82]">TOTAL SETTLEMENT:</span>
          <span className="text-base font-bold text-[#FAF6F2]">
            {isConsolidated ? "₹36,000" : "₹54,000"}
          </span>
        </div>
        <div className="text-[10px] text-[#A8B86B] font-bold">
          {isConsolidated ? "+₹18,000 SAVED (33.3% REDUCTION)" : "0.0% SAVINGS"}
        </div>
      </div>
    </div>
  );
}
