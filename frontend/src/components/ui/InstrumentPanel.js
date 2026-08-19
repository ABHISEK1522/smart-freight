"use client";

import React from "react";

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * INSTRUMENT PANEL — REUSABLE DESIGN SYSTEM COMPONENT
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * Physical command-console surface with subtle 1px border and restrained radii.
 * 
 * Props:
 * - title: Panel header title
 * - status: "optimal" | "warning" | "alert" | "nominal"
 * - tag: Monospace tag text (e.g. "NODE-04", "SYS-ACTIVE")
 * - elevated: boolean (adds subtle depth)
 * - children: React content
 */
export default function InstrumentPanel({
  title,
  status = "nominal",
  tag,
  elevated = false,
  children,
  className = "",
}) {
  const getStatusDot = () => {
    switch (status) {
      case "optimal":
        return "bg-[#A8B86B]";
      case "warning":
        return "bg-[#D9A05B]";
      case "alert":
        return "bg-[#C25450]";
      default:
        return "bg-[#8E8B82]";
    }
  };

  return (
    <div
      className={`rounded-[4px] border ${
        elevated
          ? "bg-[#1B1B18] border-[#32322C] shadow-lg shadow-black/40"
          : "bg-[#141412] border-[#242420]"
      } text-[#F2EFE9] overflow-hidden ${className}`}
    >
      {/* Optional Panel Header */}
      {title && (
        <div className="px-4 py-2.5 bg-[#0B0B0A]/40 border-b border-[#242420] flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot()}`} />
            <span className="text-[11px] font-semibold tracking-wider text-[#F2EFE9] uppercase">
              {title}
            </span>
          </div>
          {tag && (
            <span className="text-[9px] sf-data tracking-widest text-[#8E8B82] uppercase">
              {tag}
            </span>
          )}
        </div>
      )}

      {/* Body Content */}
      <div className="p-4">{children}</div>
    </div>
  );
}
