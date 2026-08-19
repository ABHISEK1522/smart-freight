"use client";

import React, { useState, useEffect } from "react";

/**
 * Realistic Miniature Logistics Vehicle Simulation Component
 * Uses Native Browser-Accelerated SVG <animateTransform> & <animate>
 * Guarantees 100% flawless 360° wheel rotation, suspension bounce, and road surface scrolling.
 * 
 * Props:
 * - type: "Refrigerated Van" | "Refrigerated Truck" | "Standard Freight Truck" | "Heavy Truck" | "Tanker"
 * - mode: "idle" | "driving" | "selected" | "arrive"
 * - isSelected: boolean
 * - isRecommended: boolean
 * - showRoad: boolean
 * - className: string
 */

export default function VehicleIllustration({
  type = "Refrigerated Van",
  mode = "idle",
  isSelected = false,
  isRecommended = false,
  showRoad = true,
  className = "w-full h-24",
}) {
  const [isHovered, setIsHovered] = useState(false);
  const normType = (type || "").toLowerCase().replace(/[\s_()]/g, "-");

  // Determine wheel and road speeds based on interaction state
  const isFastDriving = mode === "driving" || isHovered;
  const wheelDur = isFastDriving ? "0.38s" : mode === "arrive" ? "0.55s" : "0.85s";
  const roadDur = isFastDriving ? "0.28s" : mode === "arrive" ? "0.45s" : "0.75s";
  const suspensionDur = isFastDriving ? "0.35s" : "1.4s";

  // Render 6-Spoke Heavy-Duty Alloy Wheel with Native SVG 360° Continuous Rotation
  const renderWheel = (cx, cy, r = 8.5, id = "w1") => {
    return (
      <g key={id}>
        {/* Deep Rubber Tire with Outer Tread Rim */}
        <circle cx={cx} cy={cy} r={r} fill="#050811" stroke="#1e293b" strokeWidth="1.2" />
        <circle cx={cx} cy={cy} r={r - 1.4} fill="#0f172a" />
        <circle cx={cx} cy={cy} r={r - 0.6} stroke="#334155" strokeWidth="0.8" strokeDasharray="2 1.5" />

        {/* Silver Cast Rim Hub */}
        <circle cx={cx} cy={cy} r={r - 2.8} fill="#94a3b8" stroke="#334155" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={r - 4.2} fill="#334155" />

        {/* Rotating 6-Spoke Wheel Assembly using Native SVG <animateTransform> */}
        <g>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${cx} ${cy}`}
            to={`360 ${cx} ${cy}`}
            dur={wheelDur}
            repeatCount="indefinite"
          />

          {/* High-Contrast White/Silver Spokes */}
          <line x1={cx} y1={cy - (r - 3.2)} x2={cx} y2={cy + (r - 3.2)} stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
          <line
            x1={cx - (r - 3.2) * 0.866}
            y1={cy - (r - 3.2) * 0.5}
            x2={cx + (r - 3.2) * 0.866}
            y2={cy + (r - 3.2) * 0.5}
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <line
            x1={cx - (r - 3.2) * 0.866}
            y1={cy + (r - 3.2) * 0.5}
            x2={cx + (r - 3.2) * 0.866}
            y2={cy - (r - 3.2) * 0.5}
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Bolt Pattern Holes */}
          <circle cx={cx} cy={cy - 4.5} r="0.9" fill="#0f172a" />
          <circle cx={cx + 3.9} cy={cy + 2.25} r="0.9" fill="#0f172a" />
          <circle cx={cx - 3.9} cy={cy + 2.25} r="0.9" fill="#0f172a" />

          {/* Gold Center Axle Nut */}
          <circle cx={cx} cy={cy} r="2.2" fill="#0f172a" />
          <circle cx={cx} cy={cy} r="1.2" fill="#fbbf24" />
        </g>
      </g>
    );
  };

  // Render Vehicle Body Geometries
  const renderBody = () => {
    // 1. REFRIGERATED TRUCK (Heavy Reefer Carrier with Rooftop Chiller Unit)
    if (normType.includes("refrigerated-truck") || (normType.includes("refrigerated") && normType.includes("heavy"))) {
      return (
        <g>
          {/* Heavy Steel Chassis Frame & Fuel Tank */}
          <rect x="14" y="44" width="94" height="5" rx="1.5" fill="#0f172a" />
          <rect x="44" y="45" width="22" height="5.5" rx="1.2" fill="#334155" />
          <line x1="48" y1="45" x2="48" y2="50.5" stroke="#94a3b8" strokeWidth="1" />
          <line x1="62" y1="45" x2="62" y2="50.5" stroke="#94a3b8" strokeWidth="1" />

          {/* Wheel Arch Mudguards */}
          <path d="M 18 44 A 10.5 10.5 0 0 1 38 44" fill="#0f172a" />
          <path d="M 80 44 A 10.5 10.5 0 0 1 100 44" fill="#0f172a" />

          {/* Insulated Cold-Chain Freight Box */}
          <rect x="12" y="12" width="62" height="32" rx="2" fill="#ffffff" stroke="#475569" strokeWidth="1.8" />
          {/* Thermal Insulation Panel Ribs */}
          <line x1="28" y1="13" x2="28" y2="43" stroke="#e2e8f0" strokeWidth="1.8" />
          <line x1="44" y1="13" x2="44" y2="43" stroke="#e2e8f0" strokeWidth="1.8" />
          <line x1="60" y1="13" x2="60" y2="43" stroke="#e2e8f0" strokeWidth="1.8" />

          {/* Cold-Chain Seal Blue Banner */}
          <rect x="13" y="32" width="60" height="4.5" fill="#0284c7" />
          <text x="17" y="35.5" fontSize="3.2" fontWeight="bold" fill="#ffffff" fontFamily="monospace">SMART REEFER</text>

          {/* Rooftop ThermoKing Reefer Condenser */}
          <path d="M 64 7 L 78 7 Q 80 7 80 9 L 80 13 L 64 13 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="1.2" />
          <circle cx="69" cy="10" r="1.8" fill="#e0f2fe" />
          <circle cx="75" cy="10" r="1.8" fill="#e0f2fe" />

          {/* Driver Cabin */}
          <path d="M 74 18 L 88 18 Q 92 18 94 22 L 102 33 Q 104 36 104 40 L 104 44 L 74 44 Z" fill="#0f172a" />
          {/* Sun Visor & Panoramic Windshield */}
          <path d="M 86 17 L 96 22 L 86 22 Z" fill="#334155" />
          <path d="M 89 20 L 78 20 L 78 32 L 96 32 Z" fill="#38bdf8" opacity="0.88" />
          <line x1="86" y1="21" x2="93" y2="31" stroke="#bae6fd" strokeWidth="1.2" opacity="0.6" />

          {/* Side Door & Handle */}
          <rect x="76" y="34" width="16" height="9" fill="#1e293b" />
          <rect x="79" y="36" width="3" height="1" rx="0.5" fill="#f8fafc" />

          {/* Heavy Rearview Mirror */}
          <rect x="92" y="23" width="2.5" height="6.5" rx="0.8" fill="#475569" stroke="#0f172a" strokeWidth="0.8" />

          {/* Active Headlamp with Projected Light Cone */}
          <path d="M 102 36 L 104 36 L 104 42 L 100 42 Z" fill="#facc15" />
          <polygon points="104,36 122,32 122,46 104,42" fill="#fef08a" opacity="0.25" />

          {/* Taillamp */}
          <rect x="12" y="36" width="2" height="5" fill="#ef4444" />

          {/* Wheels */}
          {renderWheel(28, 45, 8.5, "w1")}
          {renderWheel(90, 45, 8.5, "w2")}
        </g>
      );
    }

    // 2. REFRIGERATED VAN (Medium Reefer Van Carrier)
    if (normType.includes("refrigerated-van") || (normType.includes("refrigerated") && normType.includes("van"))) {
      return (
        <g>
          {/* Chassis */}
          <rect x="14" y="44" width="86" height="5" rx="1.5" fill="#1e293b" />
          <path d="M 22 44 A 10.5 10.5 0 0 1 42 44" fill="#0f172a" />
          <path d="M 76 44 A 10.5 10.5 0 0 1 96 44" fill="#0f172a" />

          {/* Aerodynamic Van Body Profile */}
          <path d="M 12 22 Q 12 15 20 15 L 72 15 L 86 25 L 98 34 Q 100 37 100 40 L 100 44 L 12 44 Z" fill="#ffffff" stroke="#475569" strokeWidth="1.8" />

          {/* Low-Profile Rooftop Chiller Unit */}
          <path d="M 40 10 Q 52 9 64 10 L 66 15 L 38 15 Z" fill="#0ea5e9" stroke="#0284c7" strokeWidth="1.2" />
          <line x1="44" y1="12.5" x2="60" y2="12.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />

          {/* Dynamic Smart Freight Body Waves */}
          <path d="M 13 32 Q 54 32 98 36" stroke="#0284c7" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 13 37 Q 48 37 80 40" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />

          {/* Driver Cockpit Windows */}
          <path d="M 73 18 L 84 25 L 74 31 L 73 31 Z" fill="#38bdf8" opacity="0.88" />
          <line x1="50" y1="17" x2="50" y2="44" stroke="#94a3b8" strokeWidth="1.2" />
          <rect x="52" y="30" width="3" height="1.2" rx="0.5" fill="#334155" />

          {/* Side Mirror */}
          <rect x="85" y="24" width="2.2" height="5.5" rx="0.8" fill="#334155" />

          {/* Bright Headlamp with Projected Light Cone */}
          <path d="M 98 36 L 100 36 L 100 41 L 95 41 Z" fill="#facc15" />
          <polygon points="100,36 118,33 118,45 100,41" fill="#fef08a" opacity="0.25" />

          {/* Rear Taillamp */}
          <rect x="12" y="34" width="2" height="5" fill="#ef4444" />

          {/* Wheels */}
          {renderWheel(32, 45, 8.5, "w1")}
          {renderWheel(86, 45, 8.5, "w2")}
        </g>
      );
    }

    // 3. STANDARD FREIGHT TRUCK (Ambient Cargo Box Carrier)
    if (normType.includes("standard") || normType.includes("medium-truck")) {
      return (
        <g>
          {/* Chassis */}
          <rect x="14" y="44" width="90" height="5" rx="1.5" fill="#0f172a" />
          <rect x="44" y="45" width="18" height="5.5" rx="1.2" fill="#475569" />
          <path d="M 22 44 A 10.5 10.5 0 0 1 42 44" fill="#0f172a" />
          <path d="M 78 44 A 10.5 10.5 0 0 1 98 44" fill="#0f172a" />

          {/* Dry Freight Cargo Box */}
          <rect x="12" y="15" width="60" height="29" rx="2" fill="#f8fafc" stroke="#334155" strokeWidth="1.8" />
          <line x1="30" y1="16" x2="30" y2="44" stroke="#cbd5e1" strokeWidth="1.8" />
          <line x1="48" y1="16" x2="48" y2="44" stroke="#cbd5e1" strokeWidth="1.8" />

          <rect x="20" y="24" width="34" height="11" rx="1.5" fill="#e2e8f0" />
          <text x="24" y="31.5" fontSize="5" fontWeight="bold" fill="#1e293b" fontFamily="monospace">SMART</text>

          {/* Cab */}
          <path d="M 72 20 L 86 20 L 94 29 L 99 36 L 99 44 L 72 44 Z" fill="#1e293b" />
          <path d="M 85 22 L 76 22 L 76 31 L 91 31 Z" fill="#38bdf8" opacity="0.88" />
          <rect x="88" y="24" width="2.2" height="5.5" rx="0.8" fill="#475569" />

          {/* Headlamp */}
          <rect x="97" y="37" width="2.5" height="4.5" rx="0.8" fill="#facc15" />
          <polygon points="99,37 116,33 116,45 99,41" fill="#fef08a" opacity="0.25" />

          {/* Taillamp */}
          <rect x="12" y="35" width="2" height="5" fill="#ef4444" />

          {/* Wheels */}
          {renderWheel(32, 45, 8.5, "w1")}
          {renderWheel(88, 45, 8.5, "w2")}
        </g>
      );
    }

    // 4. HEAVY MULTI-AXLE TRUCK
    if (normType.includes("heavy")) {
      return (
        <g>
          <rect x="10" y="44" width="98" height="5" rx="1.5" fill="#0f172a" />
          <path d="M 16 44 A 9.5 9.5 0 0 1 34 44" fill="#0f172a" />
          <path d="M 32 44 A 9.5 9.5 0 0 1 50 44" fill="#0f172a" />
          <path d="M 82 44 A 9.5 9.5 0 0 1 100 44" fill="#0f172a" />

          <rect x="8" y="13" width="66" height="31" rx="2" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.8" />
          <line x1="26" y1="14" x2="26" y2="44" stroke="#cbd5e1" strokeWidth="1.8" />
          <line x1="44" y1="14" x2="44" y2="44" stroke="#cbd5e1" strokeWidth="1.8" />

          <path d="M 74 16 L 90 16 L 98 28 L 104 36 L 104 44 L 74 44 Z" fill="#0f172a" />
          <path d="M 89 18 L 78 18 L 78 30 L 95 30 Z" fill="#38bdf8" opacity="0.88" />

          <rect x="102" y="37" width="2.5" height="4.5" fill="#facc15" />
          <polygon points="104,37 122,34 122,46 104,42" fill="#fef08a" opacity="0.25" />

          {renderWheel(25, 45, 8, "w1")}
          {renderWheel(41, 45, 8, "w2")}
          {renderWheel(91, 45, 8, "w3")}
        </g>
      );
    }

    // Default Fallback Van
    return (
      <g>
        <rect x="14" y="44" width="86" height="5" rx="1.5" fill="#1e293b" />
        <path d="M 22 44 A 10.5 10.5 0 0 1 42 44" fill="#0f172a" />
        <path d="M 76 44 A 10.5 10.5 0 0 1 96 44" fill="#0f172a" />

        <path d="M 12 22 Q 12 15 20 15 L 72 15 L 86 25 L 98 34 Q 100 37 100 40 L 100 44 L 12 44 Z" fill="#ffffff" stroke="#475569" strokeWidth="1.8" />
        <path d="M 73 18 L 84 25 L 74 31 L 73 31 Z" fill="#38bdf8" opacity="0.88" />
        <rect x="98" y="36" width="2" height="4.5" fill="#facc15" />
        <polygon points="100,36 118,33 118,45 100,41" fill="#fef08a" opacity="0.25" />

        {renderWheel(32, 45, 8.5, "w1")}
        {renderWheel(86, 45, 8.5, "w2")}
      </g>
    );
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative inline-flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-300 ${
        mode === "arrive" ? "animate-drive-in" : ""
      } ${className}`}
    >
      <svg
        viewBox="0 0 125 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full overflow-visible transition-transform duration-300 ${
          isHovered
            ? "translate-x-1.5 -translate-y-0.5 scale-[1.03]"
            : isSelected
            ? "scale-[1.02]"
            : ""
        }`}
      >
        {/* Animated Ground Asphalt Highway Deck with Continuous Moving Dashed Lane Markers */}
        {showRoad && (
          <g className="asphalt-road-stage">
            <rect x="0" y="52" width="125" height="11" fill="#334155" rx="1.5" />
            <line x1="0" y1="52" x2="125" y2="52" stroke="#475569" strokeWidth="1.2" />

            {/* Moving Dashed Road Divider with Native SVG <animate> */}
            <line
              x1="0"
              y1="57.5"
              x2="125"
              y2="57.5"
              stroke="#f8fafc"
              strokeWidth="2"
              strokeDasharray="8 6"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-28"
                dur={roadDur}
                repeatCount="indefinite"
              />
            </line>
          </g>
        )}

        {/* Dynamic Vehicle Chassis with Native Suspension Heave & Vibration */}
        <g>
          {/* Subtle Vertical Suspension Bounce with Native SVG <animateTransform> */}
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 0,-0.8; 0,0.3; 0,-0.5; 0,0"
            keyTimes="0; 0.25; 0.5; 0.75; 1"
            dur={suspensionDur}
            repeatCount="indefinite"
          />

          {/* Ground Tire Shadow */}
          <ellipse
            cx="58"
            cy="52.5"
            rx="46"
            ry="2.8"
            fill="#090d16"
            opacity="0.4"
          >
            <animate
              attributeName="rx"
              values="46; 47.5; 45.5; 46"
              dur={suspensionDur}
              repeatCount="indefinite"
            />
          </ellipse>

          {renderBody()}
        </g>
      </svg>
    </div>
  );
}
