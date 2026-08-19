"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, Activity, ShieldCheck, Zap, Layers, RefreshCw, Compass } from "lucide-react";

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * SMART FREIGHT — DESIGN LAB PROTOTYPE (/design-lab)
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * Living Freight Operating System:
 * - Abstract SVG Freight Network Topology (10 regional nodes + active routes)
 * - The Freight Thread: Luminous animated cargo movement line
 * - Geometric In-Transit Markers (No truck illustrations)
 * - Physical Control-Room Instrument Telemetry (Bloomberg/TVA density)
 * - Large Editorial Statement ("THE WORLD IS MOVING.")
 * - Interactive Node Highlights & Micro-Telemetry Inspect
 */

const NETWORK_NODES = [
  { id: "PURI", name: "PURI", x: 260, y: 520, region: "ODISHA", type: "hub", load: "92%", temp: "03.8°C", status: "optimal" },
  { id: "BBI", name: "BHUBANESWAR", x: 340, y: 440, region: "ODISHA", type: "core", load: "78%", temp: "04.0°C", status: "optimal", active: true },
  { id: "CTC", name: "CUTTACK", x: 390, y: 380, region: "ODISHA", type: "dock", load: "64%", temp: "04.1°C", status: "optimal" },
  { id: "BLS", name: "BALASORE", x: 520, y: 310, region: "ODISHA", type: "waypoint", load: "45%", temp: "03.9°C", status: "in-transit" },
  { id: "JSR", name: "JAMSHEDPUR", x: 440, y: 220, region: "JHARKHAND", type: "heavy", load: "88%", temp: "N/A", status: "optimal" },
  { id: "KGP", name: "KHARAGPUR", x: 620, y: 260, region: "WB", type: "junction", load: "81%", temp: "04.2°C", status: "in-transit" },
  { id: "CCU", name: "KOLKATA", x: 740, y: 210, region: "WB", type: "core", load: "94%", temp: "04.0°C", status: "optimal", active: true },
  { id: "HWH", name: "HOWRAH", x: 720, y: 170, region: "WB", type: "terminal", load: "70%", temp: "03.9°C", status: "optimal" },
  { id: "HYD", name: "HYDERABAD", x: 140, y: 360, region: "TELANGANA", type: "feeder", load: "58%", temp: "05.1°C", status: "optimal" },
  { id: "VTZ", name: "VISAKHAPATNAM", x: 180, y: 470, region: "AP", type: "coastal", load: "62%", temp: "04.5°C", status: "optimal" },
];

const NETWORK_EDGES = [
  { from: "HYD", to: "VTZ", key: "HYD-VTZ" },
  { from: "VTZ", to: "PURI", key: "VTZ-PURI" },
  { from: "PURI", to: "BBI", key: "PURI-BBI", isFreightThread: true },
  { from: "BBI", to: "CTC", key: "BBI-CTC", isFreightThread: true },
  { from: "CTC", to: "JSR", key: "CTC-JSR" },
  { from: "CTC", to: "BLS", key: "CTC-BLS", isFreightThread: true },
  { from: "JSR", to: "KGP", key: "JSR-KGP" },
  { from: "BLS", to: "KGP", key: "BLS-KGP", isFreightThread: true },
  { from: "KGP", to: "CCU", key: "KGP-CCU", isFreightThread: true },
  { from: "CCU", to: "HWH", key: "CCU-HWH", isFreightThread: true },
];

export default function DesignLabPage() {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [activeTab, setActiveTab] = useState("NETWORK");
  const [transitProgress, setTransitProgress] = useState(0.42);

  // Smooth periodic telemetry pulsation
  useEffect(() => {
    const interval = setInterval(() => {
      setTransitProgress((prev) => (prev >= 1 ? 0 : prev + 0.006));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const selectedNode = hoveredNode
    ? NETWORK_NODES.find((n) => n.id === hoveredNode)
    : NETWORK_NODES.find((n) => n.id === "BBI");

  return (
    <div className="min-h-screen w-full bg-[#0B0B0A] text-[#F2EFE9] flex flex-col justify-between relative overflow-hidden font-mono selection:bg-[#A8B86B] selection:text-[#0B0B0A]">
      
      {/* ═══════════════════════════════════════════════════════════
          LAYER 0: TOPOGRAPHIC GRID MATRIX & SUBTLE VIGNETTE
      ═══════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg className="w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="controlGrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#F2EFE9" strokeWidth="0.5" />
              <circle cx="0" cy="0" r="1" fill="#A8B86B" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#controlGrid)" />
        </svg>
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#0B0B0A]/40 to-[#0B0B0A]" />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          HEADER: WORDMARK + OPERATING SYSTEM PROTOCOL
      ═══════════════════════════════════════════════════════════ */}
      <header className="relative z-20 h-16 border-b border-[#242420] px-6 lg:px-12 flex items-center justify-between bg-[#0B0B0A]/85 backdrop-blur-md select-none">
        <div className="flex items-center gap-4">
          <div className="w-7 h-7 rounded-[2px] bg-[#141412] border border-[#32322C] flex items-center justify-center font-bold text-xs text-[#A8B86B]">
            SF
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-[0.24em] text-[#F2EFE9] uppercase leading-none">
              SMART FREIGHT
            </div>
            <div className="text-[8px] tracking-[0.2em] text-[#8E8B82] uppercase mt-1">
              FREIGHT OPERATING SYSTEM / 01
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6 text-[10px] tracking-widest text-[#8E8B82]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A8B86B] animate-pulse"></span>
            <span className="text-[#F2EFE9]">TOPOLOGY SYNCHRONIZED</span>
          </div>
          <div>CORRIDOR: NH-16 ARTERIAL</div>
          <div className="text-[#A8B86B]">LATENCY: 14 MS</div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-[2px] bg-[#141412] hover:bg-[#1B1B18] border border-[#242420] text-[#8E8B82] hover:text-[#F2EFE9] text-[10px] tracking-wider uppercase transition-colors"
          >
            Exit Lab
          </Link>
          <span className="px-2.5 py-1 rounded-[2px] bg-[#A8B86B]/15 border border-[#A8B86B]/30 text-[#A8B86B] text-[9px] font-bold tracking-widest uppercase">
            ACTIVE PROTOTYPE
          </span>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════
          MAIN CANVAS: DUAL-LAYER TOPOLOGY + EDITORIAL STATEMENT
      ═══════════════════════════════════════════════════════════ */}
      <main className="flex-1 relative z-10 flex flex-col justify-between px-6 lg:px-12 py-6 overflow-hidden">
        
        {/* TOP STATEMENT + TELEMETRY ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start select-none">
          
          {/* Left: Dramatic Large Editorial Typography */}
          <div className="lg:col-span-6 space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-[-0.03em] text-[#F2EFE9] uppercase leading-[0.88] drop-shadow-sm font-sans">
              THE WORLD<br />
              IS MOVING.
            </h1>
            <div className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-[#A8B86B] uppercase leading-snug">
              SMART FREIGHT<br />
              <span className="text-[#8E8B82]">MOVES IT BETTER.</span>
            </div>
          </div>

          {/* Right: Operational Telemetry Bar (Bloomberg / Physical Instruments) */}
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            
            {/* Metric 01 */}
            <div className="p-3 bg-[#141412]/80 border border-[#242420] rounded-[2px]">
              <div className="text-[9px] tracking-widest text-[#8E8B82] uppercase mb-1">
                ACTIVE SHIPMENTS
              </div>
              <div className="text-xl font-bold tracking-tight text-[#F2EFE9]">
                03 <span className="text-xs text-[#8E8B82] font-normal">UNITS</span>
              </div>
              <div className="text-[9px] text-[#A8B86B] mt-0.5 tracking-wider uppercase">
                IN TRANSIT
              </div>
            </div>

            {/* Metric 02 */}
            <div className="p-3 bg-[#141412]/80 border border-[#242420] rounded-[2px]">
              <div className="text-[9px] tracking-widest text-[#8E8B82] uppercase mb-1">
                NETWORK LOAD
              </div>
              <div className="text-xl font-bold tracking-tight text-[#A8B86B]">
                74%
              </div>
              <div className="text-[9px] text-[#8E8B82] mt-0.5 tracking-wider uppercase">
                CAPACITY OPTIMAL
              </div>
            </div>

            {/* Metric 03 */}
            <div className="p-3 bg-[#141412]/80 border border-[#242420] rounded-[2px]">
              <div className="text-[9px] tracking-widest text-[#8E8B82] uppercase mb-1">
                COLD CHAIN
              </div>
              <div className="text-xl font-bold tracking-tight text-[#F2EFE9]">
                04.0°C
              </div>
              <div className="text-[9px] text-[#A8B86B] mt-0.5 tracking-wider uppercase">
                STABLE SEAL
              </div>
            </div>

            {/* Metric 04 */}
            <div className="p-3 bg-[#141412]/80 border border-[#242420] rounded-[2px]">
              <div className="text-[9px] tracking-widest text-[#8E8B82] uppercase mb-1">
                EST. SAVINGS
              </div>
              <div className="text-xl font-bold tracking-tight text-[#D9A05B]">
                ₹18,000
              </div>
              <div className="text-[9px] text-[#8E8B82] mt-0.5 tracking-wider uppercase">
                LINEHAUL CONSOL.
              </div>
            </div>

            {/* Metric 05 */}
            <div className="p-3 bg-[#141412]/80 border border-[#242420] rounded-[2px]">
              <div className="text-[9px] tracking-widest text-[#8E8B82] uppercase mb-1">
                RISK INDEX
              </div>
              <div className="text-xl font-bold tracking-tight text-[#A8B86B]">
                23 <span className="text-xs text-[#8E8B82] font-normal">/ 100</span>
              </div>
              <div className="text-[9px] text-[#A8B86B] mt-0.5 tracking-wider uppercase">
                LOW RISK TIER
              </div>
            </div>

            {/* Metric 06: Node Inspector */}
            <div className="p-3 bg-[#1B1B18] border border-[#32322C] rounded-[2px]">
              <div className="text-[9px] tracking-widest text-[#8E8B82] uppercase mb-1">
                INSPECTED NODE
              </div>
              <div className="text-sm font-bold tracking-tight text-[#F2EFE9] truncate">
                {selectedNode?.name || "BHUBANESWAR"}
              </div>
              <div className="text-[9px] text-[#D9A05B] mt-0.5 tracking-wider uppercase">
                LOAD: {selectedNode?.load}
              </div>
            </div>

          </div>

        </div>

        {/* ═══════════════════════════════════════════════════════════
            CENTERPIECE: ABSTRACT FREIGHT NETWORK TOPOLOGY SVG
        ═══════════════════════════════════════════════════════════ */}
        <div className="relative w-full h-[460px] my-auto flex items-center justify-center">
          
          <svg
            viewBox="0 0 900 600"
            className="w-full h-full max-h-[500px] select-none"
            style={{ filter: "drop-shadow(0 0 20px rgba(0,0,0,0.8))" }}
          >
            <defs>
              {/* Glow filter for active nodes & freight thread */}
              <filter id="oliveGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              
              {/* Linear gradient for the animated Freight Thread */}
              <linearGradient id="threadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A8B86B" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#A8B86B" stopOpacity="1" />
                <stop offset="100%" stopColor="#D9A05B" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* 1. Base Network Routes (Subtle 1px lines) */}
            {NETWORK_EDGES.map((edge) => {
              const nodeA = NETWORK_NODES.find((n) => n.id === edge.from);
              const nodeB = NETWORK_NODES.find((n) => n.id === edge.to);
              if (!nodeA || !nodeB) return null;

              const isHighlighted = hoveredNode === edge.from || hoveredNode === edge.to;

              return (
                <line
                  key={edge.key}
                  x1={nodeA.x}
                  y1={nodeA.y}
                  x2={nodeB.x}
                  y2={nodeB.y}
                  stroke={isHighlighted ? "#A8B86B" : "#242420"}
                  strokeWidth={isHighlighted ? 1.5 : 1}
                  strokeDasharray={edge.isFreightThread ? "none" : "3 4"}
                  className="transition-colors duration-200"
                />
              );
            })}

            {/* 2. THE FREIGHT THREAD: Continuous Arterial Movement Corridor */}
            <path
              d="M 260 520 L 340 440 L 390 380 L 520 310 L 620 260 L 740 210 L 720 170"
              fill="none"
              stroke="url(#threadGradient)"
              strokeWidth="2"
              filter="url(#oliveGlow)"
            />

            {/* 3. In-Transit Geometric Cargo Marker (Traveling slowly along corridor) */}
            {/* Unit A: Moving between Cuttack (390, 380) and Balasore (520, 310) */}
            <g
              transform={`translate(${390 + (520 - 390) * transitProgress}, ${
                380 + (310 - 380) * transitProgress
              })`}
            >
              <rect
                x="-4"
                y="-4"
                width="8"
                height="8"
                transform="rotate(45)"
                fill="#F2EFE9"
                stroke="#A8B86B"
                strokeWidth="1.5"
              />
              <circle cx="0" cy="0" r="10" fill="none" stroke="#A8B86B" strokeWidth="0.6" strokeDasharray="2 2" className="animate-spin" />
              <text x="10" y="-8" fill="#F2EFE9" fontSize="8" fontFamily="monospace" fontWeight="bold">
                SF-081 [REEFER]
              </text>
            </g>

            {/* Unit B: Moving between Kharagpur (620, 260) and Kolkata (740, 210) */}
            <g
              transform={`translate(${620 + (740 - 620) * ((transitProgress + 0.3) % 1)}, ${
                260 + (210 - 260) * ((transitProgress + 0.3) % 1)
              })`}
            >
              <rect
                x="-3.5"
                y="-3.5"
                width="7"
                height="7"
                fill="#D9A05B"
                stroke="#F2EFE9"
                strokeWidth="1"
              />
              <text x="10" y="12" fill="#D9A05B" fontSize="8" fontFamily="monospace">
                SF-142 [EXPRESS]
              </text>
            </g>

            {/* 4. Network Nodes (Interactive physical points) */}
            {NETWORK_NODES.map((node) => {
              const isHovered = hoveredNode === node.id;
              const isCore = node.type === "core";

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Outer pulse aura */}
                  <circle
                    cx="0"
                    cy="0"
                    r={isHovered ? 14 : isCore ? 10 : 7}
                    fill={node.active || isHovered ? "rgba(168, 184, 107, 0.15)" : "transparent"}
                    stroke={node.active || isHovered ? "#A8B86B" : "#32322C"}
                    strokeWidth="0.8"
                    className="transition-all duration-200"
                  />

                  {/* Inner physical node */}
                  <circle
                    cx="0"
                    cy="0"
                    r={isCore ? 4.5 : 3}
                    fill={node.active || isHovered ? "#A8B86B" : "#1B1B18"}
                    stroke={isHovered ? "#F2EFE9" : "#32322C"}
                    strokeWidth="1"
                  />

                  {/* Node Label */}
                  <text
                    x="10"
                    y="3"
                    fill={isHovered ? "#F2EFE9" : node.active ? "#A8B86B" : "#8E8B82"}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight={isCore || isHovered ? "bold" : "normal"}
                    letterSpacing="0.1em"
                    className="transition-colors duration-150"
                  >
                    {node.name}
                  </text>

                  {/* Micro Load Tag on Hover */}
                  {isHovered && (
                    <g transform="translate(10, 16)">
                      <rect x="-2" y="-9" width="70" height="12" fill="#141412" stroke="#32322C" rx="1" />
                      <text x="2" y="0" fill="#D9A05B" fontSize="7.5" fontFamily="monospace">
                        LOAD: {node.load} · {node.temp}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

        </div>

      </main>

      {/* ═══════════════════════════════════════════════════════════
          BOTTOM NAVIGATION / OPERATIONAL TABS (PROTOTYPE CONTROLS)
      ═══════════════════════════════════════════════════════════ */}
      <footer className="relative z-20 h-14 border-t border-[#242420] px-6 lg:px-12 flex items-center justify-between bg-[#0B0B0A]/90 backdrop-blur-md select-none">
        
        {/* Visual Prototype Tabs */}
        <div className="flex items-center gap-1 sm:gap-2">
          {["NETWORK", "SHIPMENTS", "VEHICLES", "OPTIMIZE", "RISK"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-[2px] text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-[#1B1B18] text-[#A8B86B] border border-[#32322C] shadow-sm"
                  : "text-[#8E8B82] hover:text-[#F2EFE9] border border-transparent"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Status / Coordinate Strip */}
        <div className="flex items-center gap-6 text-[10px] text-[#5C5A54] tracking-widest uppercase">
          <span className="hidden sm:inline">20.2961° N, 85.8245° E</span>
          <span className="text-[#A8B86B] font-bold">DISPATCH LAB ACTIVE</span>
        </div>

      </footer>

    </div>
  );
}
