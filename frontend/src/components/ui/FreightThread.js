"use client";

import React from "react";

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * THE FREIGHT THREAD — REUSABLE DESIGN SYSTEM COMPONENT
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * A subtle, mechanical line representing cargo progression across network nodes.
 * Used for route corridors, shipment lifecycles, and telemetry timelines.
 * 
 * Props:
 * - nodes: Array of string names e.g. ["Puri", "Bhubaneswar", "Cuttack", "Kolkata"]
 * - activeIndex: Current progression index (0 to nodes.length - 1)
 * - status: "in-transit" | "optimal" | "alert"
 * - showTelemetry: boolean
 */
export default function FreightThread({
  nodes = ["Origin", "Hub", "Destination"],
  activeIndex = 1,
  status = "optimal",
  showTelemetry = false,
  className = "",
}) {
  const getStatusColor = () => {
    switch (status) {
      case "alert":
        return "#C25450";
      case "amber":
        return "#D9A05B";
      default:
        return "#A8B86B";
    }
  };

  const statusColor = getStatusColor();

  return (
    <div className={`w-full py-2.5 ${className}`}>
      {/* Node labels bar */}
      <div className="flex justify-between items-center text-[10px] sf-data uppercase tracking-wider text-[#8E8B82] mb-2 select-none">
        {nodes.map((node, idx) => {
          const isPassed = idx <= activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <div
              key={idx}
              className={`flex items-center gap-1.5 transition-colors ${
                isCurrent
                  ? "text-[#F2EFE9] font-bold"
                  : isPassed
                  ? "text-[#A8B86B]"
                  : "text-[#5C5A54]"
              }`}
            >
              <span>{node}</span>
              {isCurrent && (
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: statusColor }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* The Physical Thread Line */}
      <div className="relative w-full h-[2px] bg-[#242420] rounded-full overflow-visible">
        {/* Active progress segment */}
        <div
          className="absolute top-0 left-0 h-full transition-all duration-500 ease-out"
          style={{
            width: `${(activeIndex / Math.max(1, nodes.length - 1)) * 100}%`,
            background: `linear-gradient(90deg, rgba(168, 184, 107, 0.4) 0%, ${statusColor} 100%)`,
            boxShadow: `0 0 8px ${statusColor}33`,
          }}
        />

        {/* Node checkpoints */}
        {nodes.map((_, idx) => {
          const pct = (idx / Math.max(1, nodes.length - 1)) * 100;
          const isPassed = idx <= activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <div
              key={idx}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center transition-all duration-300"
              style={{ left: `${pct}%` }}
            >
              <div
                className={`rounded-full transition-all ${
                  isCurrent
                    ? "w-2.5 h-2.5 border border-[#0B0B0A]"
                    : isPassed
                    ? "w-1.5 h-1.5"
                    : "w-1 h-1 bg-[#48483F]"
                }`}
                style={{
                  backgroundColor: isPassed ? statusColor : "#32322C",
                  boxShadow: isCurrent ? `0 0 6px ${statusColor}88` : "none",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Optional Telemetry Footer */}
      {showTelemetry && (
        <div className="flex justify-between items-center text-[9px] sf-data text-[#5C5A54] mt-2 uppercase tracking-widest">
          <span>CORRIDOR LINK: NH-16</span>
          <span className="text-[#A8B86B]">FEED SYNCHRONIZED</span>
        </div>
      )}
    </div>
  );
}
