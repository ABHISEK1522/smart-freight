"use client";

import React from "react";

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * TELEMETRY DISPLAY — REUSABLE DESIGN SYSTEM COMPONENT
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * High-density monospace information block for distances, costs, temperatures, etc.
 * 
 * Props:
 * - label: Description label (e.g. "DISTANCE", "COLD-CHAIN TEMP", "ESTIMATED SAVINGS")
 * - value: Main metric value (e.g. "440 KM", "04.0°C", "₹18,000")
 * - subtext: Secondary context (e.g. "NH-16 ARTERIAL", "DIGITAL SEAL VERIFIED")
 * - accent: "olive" | "amber" | "danger" | "neutral"
 * - size: "sm" | "md" | "lg"
 */
export default function TelemetryDisplay({
  label,
  value,
  subtext,
  accent = "neutral",
  size = "md",
  className = "",
}) {
  const getAccentColor = () => {
    switch (accent) {
      case "olive":
        return "text-[#A8B86B]";
      case "amber":
        return "text-[#D9A05B]";
      case "danger":
        return "text-[#C25450]";
      default:
        return "text-[#F2EFE9]";
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "text-sm";
      case "lg":
        return "text-2xl sm:text-3xl";
      default:
        return "text-lg sm:text-xl";
    }
  };

  return (
    <div className={`p-3 bg-[#0B0B0A]/60 border border-[#242420] rounded-[2px] ${className}`}>
      {label && (
        <div className="text-[9px] sf-data tracking-widest text-[#8E8B82] uppercase mb-1">
          {label}
        </div>
      )}
      <div className={`sf-data font-bold tracking-tight ${getSizeClass()} ${getAccentColor()}`}>
        {value}
      </div>
      {subtext && (
        <div className="text-[10px] text-[#5C5A54] mt-1 sf-data uppercase tracking-wider">
          {subtext}
        </div>
      )}
    </div>
  );
}
