"use client";

import React, { useState } from "react";
import { Milestone, Clock, Thermometer, ShieldCheck, MapPin, Truck, ChevronRight } from "lucide-react";

/**
 * Interactive Driver Journey Timeline Scrubber
 * Light Beige / Parchment / Charcoal System
 */
export default function DriverInteractiveScrubber({
  currentStatus = "In Transit",
  className = "",
}) {
  const [scrubProgress, setScrubProgress] = useState(55); // 0% to 100%

  const checkpoints = [
    { name: "Puri Depot", km: 0, time: "08:00", temp: "03.2°C", status: "Loaded" },
    { name: "Bhubaneswar Hub", km: 60, time: "09:15", temp: "03.4°C", status: "Consolidated" },
    { name: "Cuttack Ring Rd", km: 88, time: "10:00", temp: "03.1°C", status: "Departed" },
    { name: "Balasore Toll", km: 235, time: "12:45", temp: "03.8°C", status: "In Transit" },
    { name: "Kharagpur Bypass", km: 350, time: "14:50", temp: "03.5°C", status: "Approaching" },
    { name: "Howrah Terminal", km: 440, time: "16:40", temp: "03.3°C", status: "Destination" },
  ];

  const totalDistance = 440;
  const currentKm = Math.round((scrubProgress / 100) * totalDistance);
  const remainingKm = Math.max(0, totalDistance - currentKm);
  const remainingMinutes = Math.round(remainingKm * 0.76);
  const hours = Math.floor(remainingMinutes / 60);
  const mins = remainingMinutes % 60;

  const activeCheckpoint = checkpoints.reduce((prev, curr) => {
    return curr.km <= currentKm ? curr : prev;
  }, checkpoints[0]);

  return (
    <div className={`p-5 bg-[#FAF5EC] border border-[#E2D5C3] rounded-2xl shadow-sm font-mono text-[#1F1D1A] space-y-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2D5C3] pb-3">
        <div className="flex items-center gap-2.5">
          <Truck className="w-4 h-4 text-[#C85A32]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#1F1D1A]">
            Corridor Progress Scrubber // Live Telemetry
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[#5C5349]">
          <span>POSITION: <strong className="text-[#1F1D1A]">{currentKm} / 440 KM</strong></span>
          <span>•</span>
          <span>REMAINING ETA: <strong className="text-[#4D6A42] font-bold">{hours}h {mins}m</strong></span>
        </div>
      </div>

      {/* Range Scrubber Slider */}
      <div className="space-y-2 pt-1">
        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            value={scrubProgress}
            onChange={(e) => setScrubProgress(Number(e.target.value))}
            className="w-full h-2.5 bg-[#EFE3D2] border border-[#E2D5C3] rounded-full appearance-none cursor-pointer accent-[#C85A32] focus:outline-none"
          />
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 pointer-events-none flex justify-between px-1">
            {checkpoints.map((cp) => {
              const posPercent = (cp.km / totalDistance) * 100;
              const isPassed = scrubProgress >= posPercent;
              return (
                <div
                  key={cp.name}
                  style={{ left: `${posPercent}%` }}
                  className={`absolute w-2 h-2 rounded-full -translate-x-1/2 border border-[#FAF5EC] ${
                    isPassed ? "bg-[#C85A32]" : "bg-[#D4C3AC]"
                  }`}
                />
              );
            })}
          </div>
        </div>

        <div className="flex justify-between text-[8px] text-[#8A7E70] uppercase select-none font-bold">
          <span>PURI (0 KM)</span>
          <span>BHUBANESWAR</span>
          <span>BALASORE</span>
          <span>KHARAGPUR</span>
          <span>HOWRAH (440 KM)</span>
        </div>
      </div>

      {/* Dynamic Telemetry Matrix for Scrubbed Location */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
        <div className="p-3 bg-[#FDFBF7] rounded-xl border border-[#E2D5C3] shadow-xs">
          <span className="text-[8px] text-[#8A7E70] uppercase tracking-wider block">CURRENT SECTOR</span>
          <div className="text-xs font-bold text-[#1F1D1A] mt-1 truncate flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#C85A32]" />
            <span>{activeCheckpoint.name}</span>
          </div>
          <span className="text-[9px] text-[#5C5349] mt-0.5 block">{activeCheckpoint.status}</span>
        </div>

        <div className="p-3 bg-[#FDFBF7] rounded-xl border border-[#E2D5C3] shadow-xs">
          <span className="text-[8px] text-[#8A7E70] uppercase tracking-wider block">SECTOR TIME</span>
          <div className="text-xs font-bold text-[#1F1D1A] mt-1 truncate flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#4D6A42]" />
            <span>{activeCheckpoint.time} IST</span>
          </div>
          <span className="text-[9px] text-[#4D6A42] mt-0.5 block">On Schedule</span>
        </div>

        <div className="p-3 bg-[#FDFBF7] rounded-xl border border-[#E2D5C3] shadow-xs">
          <span className="text-[8px] text-[#8A7E70] uppercase tracking-wider block">CHILLER TELEMETRY</span>
          <div className="text-xs font-bold text-[#1F1D1A] mt-1 truncate flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-[#4D6A42]" />
            <span>{activeCheckpoint.temp}</span>
          </div>
          <span className="text-[9px] text-[#4D6A42] mt-0.5 block">Nominal (2-8°C)</span>
        </div>

        <div className="p-3 bg-[#FDFBF7] rounded-xl border border-[#E2D5C3] shadow-xs">
          <span className="text-[8px] text-[#8A7E70] uppercase tracking-wider block">HIGHWAY HAZARD</span>
          <div className="text-xs font-bold text-[#1F1D1A] mt-1 truncate flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#4D6A42]" />
            <span>Low Risk (04.2%)</span>
          </div>
          <span className="text-[9px] text-[#5C5349] mt-0.5 block">Toll Bypass Nominal</span>
        </div>
      </div>
    </div>
  );
}
