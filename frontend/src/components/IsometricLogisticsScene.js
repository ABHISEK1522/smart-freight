"use client";

import React, { useEffect, useState, useRef } from "react";

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * SMART FREIGHT — 3D CAMERA / SCROLL-DRIVEN ISOMETRIC LOGISTICS DIORAMA
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * Implements a true 3D spatial camera system for the isometric logistics world:
 * 
 * 1. Wide Shot (0%)           -> Establishing wide shot of the diorama
 * 2. Push-In (15-25%)         -> Camera pushes in towards Warehouse Dock & Cargo
 * 3. Camera Rotation (30-45%) -> Subtle 3D yaw/pitch shift revealing depth & layers
 * 4. Route Tracking (50-65%)  -> Lateral tracking shot along the highway corridor
 * 5. Vehicle Follow (70-85%)  -> Dynamic camera follow as the reefer truck cruises
 * 6. Pull-Back (90-100%)      -> Smooth pull-back revealing origin-to-destination beacon
 *
 * - Smooth physics-based interpolation (LERP) on requestAnimationFrame
 * - Multi-layer 3D parallax depth (Ground, Platform, Warehouse, Cargo, Truck, Drone)
 * - Deterministic, bi-directional scroll reversal with zero snapping
 * - 60 FPS GPU-accelerated transforms & subtle mouse micro-parallax
 */
export default function IsometricLogisticsScene({
  scrollProgress = 0,
  stageIndex = 0,
  mouseX = 0,
  mouseY = 0,
  className = "",
}) {
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);

  // Smoothed state references for 60fps interpolation (inertia)
  const currentProgressRef = useRef(scrollProgress);
  const currentMouseRef = useRef({ x: mouseX, y: mouseY });
  const timeRef = useRef(0);

  // Render state driven by 60fps raf
  const [renderState, setRenderState] = useState({
    p: 0,
    time: 0,
    camX: 0,
    camY: 0,
    camZ: 0,
    rotX: 12,
    rotY: -6,
    rotZ: 0,
    scale: 1,
    truckOffset: 0,
    truckBounce: 0,
    droneHover: 0,
  });

  // Keep target progress and mouse updated
  const targetProgressRef = useRef(scrollProgress);
  const targetMouseRef = useRef({ x: mouseX, y: mouseY });

  useEffect(() => {
    targetProgressRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    targetMouseRef.current = { x: mouseX, y: mouseY };
  }, [mouseX, mouseY]);

  useEffect(() => {
    let lastTimestamp = performance.now();

    const loop = (now) => {
      const delta = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;
      timeRef.current += delta;

      // Spring-like smoothing (Inertia lerp)
      const pTarget = targetProgressRef.current;
      const mTarget = targetMouseRef.current;

      const pCurrent = currentProgressRef.current;
      const pDiff = pTarget - pCurrent;
      currentProgressRef.current += pDiff * 0.085; // smooth damping factor

      currentMouseRef.current.x += (mTarget.x - currentMouseRef.current.x) * 0.06;
      currentMouseRef.current.y += (mTarget.y - currentMouseRef.current.y) * 0.06;

      const p = currentProgressRef.current;
      const mx = currentMouseRef.current.x;
      const my = currentMouseRef.current.y;
      const t = timeRef.current;

      // ─────────────────────────────────────────────────────────────
      // CINEMATIC CAMERA PATH SPLINE / PARAMETRIC INTERPOLATION
      // ─────────────────────────────────────────────────────────────
      let camX = 0;
      let camY = 0;
      let camZ = 0;
      let rotX = 12; // base isometric pitch
      let rotY = -6; // base isometric yaw
      let rotZ = 0;
      let scale = 1.0;

      // Piecewise smooth interpolation across the 5 scroll zones
      if (p <= 0.20) {
        // SCROLL 1: PUSH-IN (0% to 20%)
        const f = p / 0.20; // 0 to 1
        const ease = f * f * (3 - 2 * f); // smoothstep
        scale = 1.0 + ease * 0.38; // push-in zoom from 1.0x to 1.38x
        camX = -ease * 55; // shift camera toward warehouse dock & loading bay
        camY = ease * 35;
        camZ = ease * 40;
        rotX = 12 + ease * 6; // tilt down slightly (12 -> 18 deg)
        rotY = -6 + ease * 4; // slight rotation (-6 -> -2 deg)
      } else if (p <= 0.45) {
        // SCROLL 2: CAMERA ROTATION & CARGO FOCUS (20% to 45%)
        const f = (p - 0.20) / 0.25; // 0 to 1
        const ease = f * f * (3 - 2 * f);
        scale = 1.38 + ease * 0.12; // 1.38x to 1.50x
        camX = -55 + ease * 70; // pan across from bay to stacked cargo
        camY = 35 - ease * 25;
        camZ = 40 + ease * 50;
        rotX = 18 + ease * 7; // pitch: 18 -> 25 deg
        rotY = -2 + ease * 18; // yaw rotation: -2 -> +16 deg (reveals side & 3D crate depth)
        rotZ = ease * 1.5;
      } else if (p <= 0.68) {
        // SCROLL 3: ROUTE TRACKING (45% to 68%)
        const f = (p - 0.45) / 0.23; // 0 to 1
        const ease = f * f * (3 - 2 * f);
        scale = 1.50 - ease * 0.12; // 1.50x to 1.38x
        camX = 15 + ease * 95; // tracking laterally right along the highway corridor
        camY = 10 - ease * 35;
        camZ = 90 - ease * 20;
        rotX = 25 - ease * 8; // pitch settles to 17 deg
        rotY = 16 - ease * 22; // yaw sweeps back: +16 -> -6 deg
        rotZ = 1.5 - ease * 3.0; // slight dynamic banking
      } else if (p <= 0.86) {
        // SCROLL 4: VEHICLE FOLLOW (68% to 86%)
        const f = (p - 0.68) / 0.18; // 0 to 1
        const ease = f * f * (3 - 2 * f);
        scale = 1.38 + ease * 0.08; // 1.38x to 1.46x
        camX = 110 + ease * 45; // camera tracks the truck cruising on highway
        camY = -25 - ease * 15;
        camZ = 70 + ease * 15;
        rotX = 17 + ease * 5; // 17 -> 22 deg
        rotY = -6 + ease * 14; // -6 -> +8 deg
        rotZ = -1.5 + ease * 1.5;
      } else {
        // SCROLL 5: PULL-BACK / GRAND FINALE (86% to 100%)
        const f = (p - 0.86) / 0.14; // 0 to 1
        const ease = f * f * (3 - 2 * f);
        scale = 1.46 - ease * 0.44; // pull-back zoom from 1.46x to 1.02x
        camX = 155 - ease * 155; // center the full diorama
        camY = -40 + ease * 40;
        camZ = 85 - ease * 85;
        rotX = 22 - ease * 10; // returns to comfortable 12 deg
        rotY = 8 - ease * 14; // returns to natural -6 deg
        rotZ = 0;
      }

      // Add subtle mouse micro-parallax tilt
      rotX += -my * 3.5;
      rotY += mx * 4.5;
      camX += mx * 18;
      camY += my * 12;

      // Dynamic animated secondary object offsets
      const truckOffset = Math.min(260, p * 300);
      const truckBounce = Math.sin(t * 7) * 1.8;
      const droneHover = Math.sin(t * 3.2) * 8;

      setRenderState({
        p,
        time: t,
        camX,
        camY,
        camZ,
        rotX,
        rotY,
        rotZ,
        scale,
        truckOffset,
        truckBounce,
        droneHover,
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const { p, time, camX, camY, camZ, rotX, rotY, rotZ, scale, truckOffset, truckBounce, droneHover } = renderState;

  // Crate dynamic floating micro-animations
  const crateBob1 = Math.sin(time * 2.8 + 0.5) * 3;
  const crateBob2 = Math.sin(time * 2.8 + 1.8) * 3.5;
  const crateBob3 = Math.sin(time * 2.8 + 3.2) * 2.8;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center select-none overflow-visible perspective-[1200px] ${className}`}
      style={{
        perspective: "1200px",
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════
          3D CAMERA STAGE GIMBAL (Translates, Rotates, Zooms with Scroll)
      ═══════════════════════════════════════════════════════════════ */}
      <div
        className="w-full h-full max-w-[920px] max-h-[700px] flex items-center justify-center will-change-transform"
        style={{
          transformStyle: "preserve-3d",
          transform: `translate3d(${camX}px, ${camY}px, ${camZ}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${scale})`,
          transition: "none", // driven directly by 60fps RAF loop
        }}
      >
        <svg
          viewBox="0 0 900 650"
          className="w-full h-full drop-shadow-2xl overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="goldPlatform" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F9D968" />
              <stop offset="100%" stopColor="#E5B22B" />
            </linearGradient>
            <linearGradient id="orangeRamp" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EB7E2D" />
              <stop offset="100%" stopColor="#C85A18" />
            </linearGradient>
            <linearGradient id="truckCab" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F8D659" />
              <stop offset="100%" stopColor="#E4A91E" />
            </linearGradient>
            <linearGradient id="truckBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FAF6ED" />
              <stop offset="100%" stopColor="#EDE5D4" />
            </linearGradient>
            <linearGradient id="roadSurface" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2E2A25" />
              <stop offset="100%" stopColor="#1E1C19" />
            </linearGradient>

            {/* Hard Charcoal Shadows */}
            <filter id="hardShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="6" dy="8" stdDeviation="0" floodColor="#1E1C19" floodOpacity="0.85" />
            </filter>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* ═══════════════════════════════════════════════════════════════
              LAYER 1: MAIN ISOMETRIC BASE PLATFORM (Warm Golden Ochre Slab)
              Spatial Depth: Z = 0
          ═══════════════════════════════════════════════════════════════ */}
          <g style={{ transform: "translateZ(0px)" }}>
            {/* Isometric Platform Base Shadow */}
            <polygon
              points="450,560 810,380 450,200 90,380"
              fill="#1A1815"
              opacity="0.4"
              transform="translate(8, 16)"
            />

            {/* Platform Bottom Thickness (3D Edge) */}
            <polygon points="90,380 450,560 450,585 90,405" fill="#B37E17" stroke="#1E1C19" strokeWidth="3" />
            <polygon points="450,560 810,380 810,405 450,585" fill="#8C5F0E" stroke="#1E1C19" strokeWidth="3" />

            {/* Platform Top Surface */}
            <polygon
              points="450,560 810,380 450,200 90,380"
              fill="url(#goldPlatform)"
              stroke="#1E1C19"
              strokeWidth="3.5"
            />

            {/* Isometric Grid Tile Lines on Platform */}
            <g stroke="#D9A420" strokeWidth="1.5" opacity="0.6">
              <line x1="180" y1="335" x2="540" y2="515" />
              <line x1="270" y1="290" x2="630" y2="470" />
              <line x1="360" y1="245" x2="720" y2="425" />
              <line x1="270" y1="470" x2="630" y2="290" />
              <line x1="360" y1="515" x2="720" y2="335" />
              <line x1="180" y1="425" x2="540" y2="245" />
            </g>
          </g>

          {/* ═══════════════════════════════════════════════════════════════
              LAYER 2: ISOMETRIC HIGHWAY ROAD & LANE MARKERS
              Spatial Depth: Z = +10px
          ═══════════════════════════════════════════════════════════════ */}
          <g style={{ transform: "translateZ(10px)" }}>
            {/* Curved Highway Strip across platform */}
            <polygon
              points="135,395 380,518 730,342 485,220"
              fill="url(#roadSurface)"
              stroke="#1E1C19"
              strokeWidth="3"
            />

            {/* Road Golden Edge Curbs */}
            <polyline points="135,395 380,518 730,342" fill="none" stroke="#F6CD46" strokeWidth="3.5" />
            <polyline points="485,220 240,342" fill="none" stroke="#F6CD46" strokeWidth="2.5" />

            {/* Dashed Center Route Line (Animated Draw along transit) */}
            <path
              d="M 200 370 L 430 485 L 670 365"
              fill="none"
              stroke="#F8D659"
              strokeWidth="3"
              strokeDasharray="14 12"
              strokeDashoffset={-time * 28}
            />
          </g>

          {/* ═══════════════════════════════════════════════════════════════
              LAYER 3: WAREHOUSE & LOADING BAY STRUCTURE (Top-Left)
              Spatial Depth: Z = +30px
          ═══════════════════════════════════════════════════════════════ */}
          <g transform="translate(140, 160)" style={{ transform: "translate(140px, 160px) translateZ(30px)" }}>
            {/* Warehouse Base Shadow */}
            <polygon points="120,160 260,90 140,30 0,100" fill="#181614" opacity="0.35" />

            {/* Left Wall (Charcoal / Rich Slate) */}
            <polygon points="0,100 120,160 120,60 0,0" fill="#2E333D" stroke="#1E1C19" strokeWidth="3" />

            {/* Right Wall / Loading Dock Opening */}
            <polygon points="120,160 260,90 260,-10 120,60" fill="#3D4552" stroke="#1E1C19" strokeWidth="3" />

            {/* Roof (Warm Terracotta / Ochre) */}
            <polygon points="0,0 120,60 260,-10 140,-70" fill="#D96E28" stroke="#1E1C19" strokeWidth="3" />

            {/* Roll-up Shutter Loading Door (Yellow/Black Striped Header) */}
            <polygon points="135,140 245,85 245,15 135,70" fill="#1E2229" stroke="#1E1C19" strokeWidth="2" />
            
            {/* Door Louvers */}
            <line x1="135" y1="80" x2="245" y2="25" stroke="#4C5565" strokeWidth="2" />
            <line x1="135" y1="95" x2="245" y2="40" stroke="#4C5565" strokeWidth="2" />
            <line x1="135" y1="110" x2="245" y2="55" stroke="#4C5565" strokeWidth="2" />
            <line x1="135" y1="125" x2="245" y2="70" stroke="#4C5565" strokeWidth="2" />

            {/* Warehouse Canopy Overhang */}
            <polygon points="110,65 265,-12 280,-5 125,72" fill="#F7CD46" stroke="#1E1C19" strokeWidth="2" />

            {/* Terminal ID Badge */}
            <rect x="25" y="25" width="60" height="22" rx="3" fill="#F8D659" stroke="#1E1C19" strokeWidth="2" />
            <text x="32" y="40" fill="#1E1C19" fontSize="9" fontWeight="900" fontFamily="monospace">
              BAY-01
            </text>

            {/* Loading Ramp (Orange) */}
            <polygon points="120,160 170,185 220,160 170,135" fill="url(#orangeRamp)" stroke="#1E1C19" strokeWidth="2.5" />
          </g>

          {/* ═══════════════════════════════════════════════════════════════
              LAYER 4: ISOMETRIC CARGO CRATES & PARCELS (Stack on Dock)
              Spatial Depth: Z = +45px
          ═══════════════════════════════════════════════════════════════ */}
          <g style={{ transform: "translateZ(45px)" }}>
            {/* Crate 1 (Puri Chilled Dairy - Ochre) */}
            <g transform={`translate(280, ${410 + crateBob1})`}>
              <polygon points="0,20 30,35 60,20 30,5" fill="#D9742B" stroke="#1E1C19" strokeWidth="2" />
              <polygon points="0,20 30,35 30,65 0,50" fill="#BA541A" stroke="#1E1C19" strokeWidth="2" />
              <polygon points="30,35 60,20 60,50 30,65" fill="#A04412" stroke="#1E1C19" strokeWidth="2" />
              {/* Strapping Tape */}
              <line x1="15" y1="27" x2="15" y2="57" stroke="#F7CD46" strokeWidth="2" />
              <line x1="45" y1="27" x2="45" y2="57" stroke="#F7CD46" strokeWidth="2" />
              {/* Label Pin */}
              <rect x="8" y="38" width="14" height="8" fill="#FFF" stroke="#1E1C19" strokeWidth="1" />
            </g>

            {/* Crate 2 (Bhubaneswar Fresh Tomatoes - Golden Yellow) */}
            <g transform={`translate(325, ${380 + crateBob2})`}>
              <polygon points="0,15 25,27 50,15 25,3" fill="#F8D659" stroke="#1E1C19" strokeWidth="2" />
              <polygon points="0,15 25,27 25,52 0,40" fill="#E5B22B" stroke="#1E1C19" strokeWidth="2" />
              <polygon points="25,27 50,15 50,40 25,52" fill="#C99419" stroke="#1E1C19" strokeWidth="2" />
              <line x1="12" y1="21" x2="12" y2="46" stroke="#1E1C19" strokeWidth="1.5" />
              <line x1="37" y1="21" x2="37" y2="46" stroke="#1E1C19" strokeWidth="1.5" />
            </g>

            {/* Crate 3 (Cuttack Pharma Goods - Sage/Plum) */}
            <g transform={`translate(295, ${360 + crateBob3})`}>
              <polygon points="0,12 20,22 40,12 20,2" fill="#EDE5D4" stroke="#1E1C19" strokeWidth="2" />
              <polygon points="0,12 20,22 20,42 0,32" fill="#D3C9B4" stroke="#1E1C19" strokeWidth="2" />
              <polygon points="20,22 40,12 40,32 20,42" fill="#B8AC94" stroke="#1E1C19" strokeWidth="2" />
              <circle cx="20" cy="27" r="4" fill="#D96E28" />
            </g>
          </g>

          {/* ═══════════════════════════════════════════════════════════════
              LAYER 5: ISOMETRIC REFRIGERATED FREIGHT TRUCK (Center Piece)
              Spatial Depth: Z = +65px
          ═══════════════════════════════════════════════════════════════ */}
          <g
            transform={`translate(${330 + truckOffset * 0.8}, ${290 - truckOffset * 0.4 + truckBounce})`}
            style={{ transform: `translate(${330 + truckOffset * 0.8}px, ${290 - truckOffset * 0.4 + truckBounce}px) translateZ(65px)` }}
          >
            {/* Truck Shadow */}
            <ellipse cx="60" cy="95" rx="110" ry="40" fill="#1A1815" opacity="0.45" />

            {/* Wheels (Isometric Cylinders with Ochre Rims) */}
            {/* Back Left Wheel */}
            <g transform="translate(-35, 75)">
              <ellipse cx="0" cy="0" rx="14" ry="18" fill="#1E1C19" />
              <ellipse cx="0" cy="0" rx="7" ry="9" fill="#E5A81E" stroke="#1E1C19" strokeWidth="2" />
            </g>

            {/* Middle Wheel */}
            <g transform="translate(15, 98)">
              <ellipse cx="0" cy="0" rx="14" ry="18" fill="#1E1C19" />
              <ellipse cx="0" cy="0" rx="7" ry="9" fill="#E5A81E" stroke="#1E1C19" strokeWidth="2" />
            </g>

            {/* Front Wheel */}
            <g transform="translate(110, 80)">
              <ellipse cx="0" cy="0" rx="14" ry="18" fill="#1E1C19" />
              <ellipse cx="0" cy="0" rx="7" ry="9" fill="#E5A81E" stroke="#1E1C19" strokeWidth="2" />
            </g>

            {/* Truck Chassis Under-carriage */}
            <polygon points="-50,65 130,45 130,68 -50,88" fill="#2E2A25" stroke="#1E1C19" strokeWidth="2.5" />

            {/* Cargo Reefer Box (Off-white / Warm Cream Container) */}
            {/* Container Left Face (Shadowed) */}
            <polygon points="-55,30 55,85 55,-25 -55,-80" fill="#DDD5C4" stroke="#1E1C19" strokeWidth="3" />
            
            {/* Container Side Face (Main) */}
            <polygon points="55,85 65,80 65,-30 55,-25" fill="#C7BEAC" stroke="#1E1C19" strokeWidth="2" />

            {/* Container Right Face */}
            <polygon points="55,85 55,-25 -45,-75 -45,35" fill="url(#truckBody)" stroke="#1E1C19" strokeWidth="3" />

            {/* Container Roof */}
            <polygon points="-55,-80 55,-25 -10, -58 -120,-113" fill="#FAF6ED" stroke="#1E1C19" strokeWidth="3" />

            {/* Reefer Chiller Unit Mounted on Top/Front (Cold-Chain 2°C) */}
            <polygon points="-30,-75 25,-48 25,-68 -30,-95" fill="#2B323D" stroke="#1E1C19" strokeWidth="2" />
            <circle cx="0" cy="-62" r="4" fill="#52C41A" className="animate-pulse" />

            {/* Smart Freight Logo & Stripe on Container */}
            <polygon points="-35,15 45,55 45,38 -35,-2" fill="#F7CD46" stroke="#1E1C19" strokeWidth="1.5" />
            <polygon points="-35,32 45,72 45,64 -35,24" fill="#D96E28" />
            <text x="-15" y="32" fill="#1E1C19" fontSize="9" fontWeight="900" fontFamily="monospace" transform="rotate(27 -15 32)">
              SMART FREIGHT
            </text>

            {/* Truck Cab (Golden Yellow Front) */}
            {/* Cab Left Face */}
            <polygon points="55,65 125,30 125,-20 55,15" fill="url(#truckCab)" stroke="#1E1C19" strokeWidth="3" />
            
            {/* Cab Windshield Glass */}
            <polygon points="65,30 115,5 115,-10 65,15" fill="#688BA6" stroke="#1E1C19" strokeWidth="2" opacity="0.9" />

            {/* Cab Roof */}
            <polygon points="55,15 125,-20 95,-35 25,0" fill="#FCE280" stroke="#1E1C19" strokeWidth="3" />

            {/* Cab Front Grill & Headlight */}
            <polygon points="125,30 135,25 135,-5 125,0" fill="#2E2A25" stroke="#1E1C19" strokeWidth="2" />
            <circle cx="128" cy="22" r="3.5" fill="#FFF59D" />

            {/* Temperature Telemetry Pill floating above truck */}
            <g transform="translate(0, -115)">
              <rect x="-35" y="-12" width="70" height="22" rx="11" fill="#1E1C19" stroke="#F7CD46" strokeWidth="2" />
              <circle cx="-22" cy="-1" r="3.5" fill="#52C41A" />
              <text x="-12" y="3" fill="#F7CD46" fontSize="9" fontWeight="800" fontFamily="monospace">
                2.8°C OK
              </text>
            </g>
          </g>

          {/* ═══════════════════════════════════════════════════════════════
              LAYER 6: DESTINATION BEACON PIN (Right Side Terminal)
              Spatial Depth: Z = +50px
          ═══════════════════════════════════════════════════════════════ */}
          <g transform="translate(680, 310)" style={{ transform: "translate(680px, 310px) translateZ(50px)" }}>
            {/* Pulsing Aura Rings */}
            <ellipse
              cx="0"
              cy="0"
              rx={24 + Math.sin(time * 4) * 6}
              ry={12 + Math.sin(time * 4) * 3}
              fill="none"
              stroke="#D9742B"
              strokeWidth="2"
              opacity={0.6 - Math.sin(time * 4) * 0.2}
            />
            <ellipse cx="0" cy="0" rx="14" ry="7" fill="#F7CD46" stroke="#1E1C19" strokeWidth="2" />

            {/* Flagpole & Destination Banner */}
            <line x1="0" y1="0" x2="0" y2="-65" stroke="#1E1C19" strokeWidth="3" />
            <polygon points="0,-65 42,-50 0,-35" fill="#D96E28" stroke="#1E1C19" strokeWidth="2.5" />
            <text x="6" y="-48" fill="#FAF6ED" fontSize="8" fontWeight="900" fontFamily="monospace">
              KOLKATA
            </text>
          </g>

          {/* ═══════════════════════════════════════════════════════════════
              LAYER 7: AUTONOMOUS DELIVERY DRONE (Hovering Upper Right)
              Spatial Depth: Z = +85px
          ═══════════════════════════════════════════════════════════════ */}
          <g
            transform={`translate(${620 + Math.cos(time * 2) * 12}, ${130 + droneHover})`}
            style={{ transform: `translate(${620 + Math.cos(time * 2) * 12}px, ${130 + droneHover}px) translateZ(85px)` }}
          >
            {/* Drone Shadow on Ground */}
            <ellipse cx="0" cy="180" rx="18" ry="8" fill="#1A1815" opacity="0.25" />

            {/* Tether Cable */}
            <line x1="0" y1="15" x2="0" y2="40" stroke="#1E1C19" strokeWidth="1.5" strokeDasharray="2 2" />

            {/* Tethered Parcel Box */}
            <g transform="translate(-10, 40)">
              <rect x="0" y="0" width="20" height="16" rx="2" fill="#F7CD46" stroke="#1E1C19" strokeWidth="2" />
              <line x1="10" y1="0" x2="10" y2="16" stroke="#1E1C19" strokeWidth="1.5" />
            </g>

            {/* Drone Central Pod Body */}
            <ellipse cx="0" cy="0" rx="22" ry="12" fill="#1E1C19" stroke="#F7CD46" strokeWidth="2.5" />
            <circle cx="0" cy="-2" r="5" fill="#F7CD46" />

            {/* Drone Quad Rotor Arms */}
            <line x1="-32" y1="-12" x2="32" y2="12" stroke="#1E1C19" strokeWidth="3" />
            <line x1="-32" y1="12" x2="32" y2="-12" stroke="#1E1C19" strokeWidth="3" />

            {/* Spinning Propeller Blades */}
            <ellipse cx="-32" cy="-12" rx={14 * Math.sin(time * 30)} ry="3" fill="#D9742B" opacity="0.85" />
            <ellipse cx="32" cy="12" rx={14 * Math.sin(time * 30)} ry="3" fill="#D9742B" opacity="0.85" />
            <ellipse cx="-32" cy="12" rx={14 * Math.cos(time * 30)} ry="3" fill="#D9742B" opacity="0.85" />
            <ellipse cx="32" cy="-12" rx={14 * Math.cos(time * 30)} ry="3" fill="#D9742B" opacity="0.85" />
          </g>
        </svg>
      </div>
    </div>
  );
}
