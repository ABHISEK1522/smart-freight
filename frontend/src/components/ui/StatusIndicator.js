"use client";

import React from "react";

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * STATUS INDICATOR — REUSABLE DESIGN SYSTEM COMPONENT
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * Restrained operational status badge for vehicle states, cold-chain, and routes.
 * 
 * Props:
 * - label: Status text (e.g. "OPTIMAL", "CONSOLIDATED", "IN-TRANSIT", "DELAY ALERT")
 * - variant: "olive" | "amber" | "danger" | "neutral"
 * - pulse: boolean (adds subtle operational heartbeat)
 */
export default function StatusIndicator({
  label = "OPERATIONAL",
  variant = "olive",
  pulse = false,
  className = "",
}) {
  const getStyles = () => {
    switch (variant) {
      case "amber":
        return "sf-badge-amber";
      case "danger":
        return "sf-badge-danger";
      case "neutral":
        return "bg-[#1E1E1B] border border-[#32322C] text-[#8E8B82]";
      default:
        return "sf-badge-olive";
    }
  };

  const getDotColor = () => {
    switch (variant) {
      case "amber":
        return "bg-[#D9A05B]";
      case "danger":
        return "bg-[#C25450]";
      case "neutral":
        return "bg-[#8E8B82]";
      default:
        return "bg-[#A8B86B]";
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[10px] sf-data font-semibold tracking-wider uppercase select-none ${getStyles()} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()} ${pulse ? "animate-pulse" : ""}`} />
      <span>{label}</span>
    </div>
  );
}
