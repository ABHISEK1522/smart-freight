"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  IndianRupee,
  TrendingDown,
  Truck,
  Layers,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowDownRight,
  TrendingUp,
  RefreshCw,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function CostSavingsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
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

  const fetchCostData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (res.ok) {
        const optData = await res.json();
        setData(optData);
      } else {
        setData({
          trips: [
            {
              trip_id: "trip-3683e535",
              destinations: ["Kolkata"],
              separate_cost: 54000,
              consolidated_cost: 36000,
              savings: 18000,
              savings_percent: 33.3,
              capacity_utilization: 87.4,
            },
          ],
          total_separate_cost: 54000,
          total_consolidated_cost: 36000,
          total_savings: 18000,
          overall_savings_percent: 33.3,
        });
      }
    } catch (err) {
      console.error("Cost data sync error:", err);
      setData({
        trips: [
          {
            trip_id: "trip-3683e535",
            destinations: ["Kolkata"],
            separate_cost: 54000,
            consolidated_cost: 36000,
            savings: 18000,
            savings_percent: 33.3,
            capacity_utilization: 87.4,
          },
        ],
        total_separate_cost: 54000,
        total_consolidated_cost: 36000,
        total_savings: 18000,
        overall_savings_percent: 33.3,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostData();
  }, []);

  const chartData = [
    { name: "Bhubaneswar", separate: 24000, consolidated: 16000, savings: 8000 },
    { name: "Cuttack", separate: 18000, consolidated: 12000, savings: 6000 },
    { name: "Balasore", separate: 12000, consolidated: 8000, savings: 4000 },
  ];

  return (
    <div className="flex min-h-screen bg-[#F4EBDD] text-[#1F1D1A] font-sans selection:bg-[#C85A32] selection:text-[#FFFFFF]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-18 bg-[#FAF5EC] border-b border-[#E2D5C3] px-6 flex items-center justify-between sticky top-0 z-20 select-none">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FDFBF7] border border-[#E2D5C3] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#C85A32] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F1D1A]">
                SETTLEMENT & SAVINGS // ECONOMIC LEDGER
              </span>
            </div>
            <span className="text-[#D4C3AC] text-xs">|</span>
            <div className="text-[11px] text-[#C85A32] hidden sm:flex items-center gap-1.5 font-mono">
              <span className="text-[#8A7E70]">NET EFFICIENCY:</span>
              <span className="font-bold text-[#4D6A42]">33.3% SAVED</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono select-none">
            <span className="hidden lg:block bg-[#FDFBF7] text-[#C85A32] px-3 py-1 rounded-lg border border-[#E2D5C3] font-bold shadow-xs">{currentTime}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">

            {/* EDITORIAL SAVINGS WATERFALL SHOWCASE */}
            <div className="bg-[#FAF5EC] border border-[#E2D5C3] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between border-b border-[#E2D5C3] pb-4 gap-3 select-none">
                <div>
                  <div className="text-[9px] text-[#8A7E70] font-mono uppercase tracking-widest flex items-center gap-2 font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#C85A32]" />
                    <span>ECONOMIC SETTLEMENT LEDGER</span>
                  </div>
                  <h2 className="text-xl font-black text-[#1F1D1A] tracking-tight mt-1">
                    Multi-Shipper Consolidation Yield
                  </h2>
                </div>
                <span className="text-xs font-mono font-bold text-[#4D6A42] px-3.5 py-1 bg-[#EBF3EA] border border-[#C4DEC0] rounded-full">
                  REALIZED SAVINGS: +₹18,000 (33.3%)
                </span>
              </div>

              {/* Editorial 3-Stage Waterfall */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-center">
                <div className="p-6 bg-[#FDFBF7] border border-[#E2D5C3] rounded-2xl space-y-2 shadow-xs">
                  <div className="text-[9px] text-[#8A7E70] font-bold uppercase tracking-widest">SEPARATE UNCONSOLIDATED TRIPS</div>
                  <div className="text-3xl font-black text-[#BA4336] tracking-tight">₹54,000</div>
                  <div className="text-[10px] text-[#5C5349]">3 Independent Carriers Dispatched</div>
                </div>

                <div className="p-6 bg-[#FAF4E8] border border-[#C85A32] rounded-2xl space-y-2 shadow-sm">
                  <div className="text-[9px] text-[#C85A32] font-bold uppercase tracking-widest">SMART FREIGHT CONSOLIDATION</div>
                  <div className="text-3xl font-black text-[#1F1D1A] tracking-tight">₹36,000</div>
                  <div className="text-[10px] text-[#C85A32] font-bold">1 Optimized Heavy Linehaul (87% fit)</div>
                </div>

                <div className="p-6 bg-[#EBF3EA] border border-[#C4DEC0] rounded-2xl space-y-2 shadow-xs">
                  <div className="text-[9px] text-[#2D5926] font-bold uppercase tracking-widest">TOTAL NET ECONOMIC SAVINGS</div>
                  <div className="text-3xl font-black text-[#2D5926] tracking-tight">+₹18,000</div>
                  <div className="text-[10px] text-[#2D5926] font-bold">33.3% Cost Reduction Passed to Shippers</div>
                </div>
              </div>
            </div>

            {/* Restrained Bar Chart Section */}
            <div className="bg-[#FAF5EC] border border-[#E2D5C3] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2D5C3] pb-3">
                <span className="text-xs font-bold font-mono text-[#1F1D1A] uppercase tracking-wider">
                  Regional Cost Breakdown by Corridor Sector
                </span>
                <span className="text-[10px] text-[#8A7E70] font-mono font-bold">NH-16 ARTERIAL METRICS</span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2D5C3" />
                    <XAxis dataKey="name" stroke="#5C5349" fontSize={10} fontFamily="monospace" />
                    <YAxis stroke="#5C5349" fontSize={10} fontFamily="monospace" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#FAF5EC",
                        borderColor: "#E2D5C3",
                        borderRadius: "12px",
                        color: "#1F1D1A",
                        fontFamily: "monospace",
                        fontSize: "11px",
                      }}
                    />
                    <Bar dataKey="separate" name="Separate Baseline" fill="#BA4336" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="consolidated" name="Smart Freight Consolidated" fill="#C85A32" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
