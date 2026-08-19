"use client";

import React from "react";

/**
 * SmartFreightRoute — Miniature Vector Route Diagram (Light Beige / Paper System)
 * Displays Origin → Destination corridor line with animated cargo marker and nodes.
 */
export default function SmartFreightRoute({
  origin = "Bhubaneswar",
  destination = "Kolkata",
  className = "",
  showDetails = true,
  temp = "04.2°C",
  weight = "1,200 KG",
}) {
  return (
    <div className={`p-3 bg-[#FAF5EC] border border-[#E2D5C3] rounded-xl font-mono text-xs shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C85A32] animate-pulse" />
          <span className="font-bold text-[#1F1D1A] tracking-wider uppercase text-[11px]">
            {origin} → {destination}
          </span>
        </div>
        {showDetails && (
          <span className="text-[9px] text-[#4D6A42] font-bold">
            {temp} · {weight}
          </span>
        )}
      </div>

      {/* Vector Line */}
      <svg viewBox="0 0 240 24" className="w-full h-6">
        <defs>
          <linearGradient id="miniRouteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C85A32" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#C85A32" stopOpacity="1" />
            <stop offset="100%" stopColor="#1F1D1A" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        
        {/* Track Line */}
        <line x1="10" y1="12" x2="230" y2="12" stroke="#D4C3AC" strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1="10" y1="12" x2="160" y2="12" stroke="url(#miniRouteGrad)" strokeWidth="2.5" />
        
        {/* Origin Node */}
        <circle cx="10" cy="12" r="3.5" fill="#C85A32" stroke="#FAF5EC" strokeWidth="1" />
        {/* Intermediate Node */}
        <circle cx="120" cy="12" r="2.5" fill="#D4C3AC" stroke="#8A7E70" strokeWidth="0.8" />
        {/* Destination Node */}
        <circle cx="230" cy="12" r="3.5" fill="#FAF5EC" stroke="#1F1D1A" strokeWidth="1.2" />
        
        {/* Moving Cargo Beacon */}
        <g transform="translate(140, 12)">
          <rect x="-3.5" y="-3.5" width="7" height="7" transform="rotate(45)" fill="#1F1D1A" stroke="#C85A32" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}
