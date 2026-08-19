"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import {
  BarChart3,
  TrendingUp,
  Sliders,
  DollarSign,
  ShieldAlert,
  Percent,
  RefreshCw,
  Activity,
  Layers,
  ArrowRight,
  TrendingDown,
} from "lucide-react";

export default function AnalyticsPage() {
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

  return (
    <div className="flex min-h-screen bg-[#F4EBDD] text-[#1F1D1A] font-sans selection:bg-[#C85A32] selection:text-[#FFFFFF]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-18 bg-[#FAF5EC] border-b border-[#E2D5C3] px-6 flex items-center justify-between sticky top-0 z-20 select-none">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FDFBF7] border border-[#E2D5C3] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#C85A32] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F1D1A]">
                ANALYTICS // FREIGHT PERFORMANCE ENGINE
              </span>
            </div>
            <span className="text-[#D4C3AC] text-xs">|</span>
            <div className="text-[11px] text-[#C85A32] hidden sm:flex items-center gap-1.5 font-mono">
              <span className="text-[#8A7E70]">METRICS ENGINE:</span>
              <span className="font-bold text-[#1F1D1A]">AGGREGATED KPI</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono select-none">
            <span className="hidden lg:block bg-[#FDFBF7] text-[#C85A32] px-3 py-1 rounded-lg border border-[#E2D5C3] font-bold shadow-xs">{currentTime}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
            
            {/* 4-KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
              <div className="bg-[#FAF5EC] border border-[#E2D5C3] rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                <div className="text-[9px] uppercase text-[#8A7E70] tracking-wider font-bold">Total Realized Savings</div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-bold text-[#4D6A42]">₹18,000</span>
                  <span className="text-[9px] text-[#4D6A42] font-bold">+33.3%</span>
                </div>
              </div>

              <div className="bg-[#FAF5EC] border border-[#E2D5C3] rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                <div className="text-[9px] uppercase text-[#8A7E70] tracking-wider font-bold">Consolidation Fit</div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-bold text-[#C85A32]">87.4%</span>
                  <span className="text-[9px] text-[#1F1D1A] font-bold">OPTIMAL</span>
                </div>
              </div>

              <div className="bg-[#FAF5EC] border border-[#E2D5C3] rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                <div className="text-[9px] uppercase text-[#8A7E70] tracking-wider font-bold">On-Time Linehaul</div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-bold text-[#1F1D1A]">98.6%</span>
                  <span className="text-[9px] text-[#4D6A42] font-bold">RELIABLE</span>
                </div>
              </div>

              <div className="bg-[#FAF5EC] border border-[#E2D5C3] rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                <div className="text-[9px] uppercase text-[#8A7E70] tracking-wider font-bold">Cold-Chain Accuracy</div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-bold text-[#4D6A42]">04.2°C</span>
                  <span className="text-[9px] text-[#4D6A42] font-bold">STABLE</span>
                </div>
              </div>
            </div>

            {/* Performance Ledger Section */}
            <div className="p-6 bg-[#FAF5EC] border border-[#E2D5C3] rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2D5C3] pb-3 font-mono">
                <span className="text-xs font-bold text-[#1F1D1A] uppercase tracking-wider">
                  Corridor Dispatch Performance History
                </span>
                <span className="text-[10px] text-[#8A7E70] font-bold">ODISHA-WB NH-16 CORRIDOR</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {[
                  { corridor: "Bhubaneswar → Kolkata", mode: "Consolidated Reefer", trips: "03 Manifests", savings: "₹18,000", status: "Nominal" },
                  { corridor: "Puri → Howrah", mode: "Direct Express", trips: "01 Manifest", savings: "₹4,200", status: "Delivered" },
                  { corridor: "Cuttack → Balasore", mode: "Ambient Linehaul", trips: "02 Manifests", savings: "₹6,800", status: "Nominal" },
                ].map((row, idx) => (
                  <div key={idx} className="p-3.5 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
                    <div>
                      <div className="font-bold text-[#1F1D1A]">{row.corridor}</div>
                      <div className="text-[10px] text-[#5C5349]">{row.mode} · {row.trips}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[#4D6A42] font-bold">+{row.savings} saved</span>
                      <span className="text-[9px] text-[#1F1D1A] px-2.5 py-0.5 rounded-full bg-[#EBF3EA] border border-[#C4DEC0] font-bold">
                        ● {row.status}
                      </span>
                    </div>
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
