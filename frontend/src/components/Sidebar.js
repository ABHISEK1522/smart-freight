"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  PackagePlus,
  ClipboardList,
  Truck,
  BarChart3,
  LogOut,
  LogIn,
  Layers,
  MapPin,
  Snowflake,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * SMART FREIGHT — NAVIGATION RAIL (GLOBAL LIGHT BEIGE SYSTEM)
 * ═════════════════════════════════════════════════════════════════════════════
 */

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();

  const isDriver = user?.role === "driver" || pathname === "/driver";

  const navigationItems = isDriver
    ? [
        { name: "Driver Terminal", href: "/driver", icon: Truck, code: "DRV-01" },
        { name: "My Shipments", href: "/shipments", icon: ClipboardList, code: "SHP-02" },
        { name: "Fleet Assets", href: "/fleet", icon: PackagePlus, code: "FLT-03" },
      ]
    : [
        { name: "Plan Shipment", href: "/", icon: PackagePlus, code: "PLN-01" },
        { name: "My Shipments", href: "/shipments", icon: ClipboardList, code: "SHP-02" },
        { name: "Fleet", href: "/fleet", icon: Truck, code: "FLT-03" },
        { name: "Routes", href: "/routes", icon: MapPin, code: "RTE-04" },
        { name: "Cost & Savings", href: "/costs", icon: TrendingDown, code: "CST-05" },
        { name: "Risk Analysis", href: "/risks", icon: ShieldCheck, code: "RSK-06" },
        { name: "Analytics", href: "/analytics", icon: BarChart3, code: "ANL-07" },
      ];

  return (
    <aside className="w-64 bg-[#FAF5EC] border-r border-[#E2D5C3] flex flex-col justify-between hidden md:flex shrink-0 select-none font-sans z-30 text-[#1F1D1A]">
      <div>
        {/* Top Brand Header */}
        <div className="h-18 px-5 border-b border-[#E2D5C3] flex items-center justify-between bg-[#F4EBDD]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-[#C85A32] text-[#FFFFFF] flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
              SF
            </div>
            <div>
              <div className="text-xs font-black tracking-wider text-[#1F1D1A] uppercase leading-tight group-hover:text-[#C85A32] transition-colors">
                SMART FREIGHT
              </div>
              <div className="text-[9px] text-[#8A7E70] font-mono tracking-widest uppercase">
                DISPATCH TOWER
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? "bg-[#FAF4E8] text-[#C85A32] border border-[#D4C3AC] shadow-xs font-bold"
                    : "text-[#5C5349] hover:text-[#1F1D1A] hover:bg-[#F4EBDD]/70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#C85A32]" : "text-[#8A7E70]"}`} />
                  <span>{item.name}</span>
                </div>
                <span className="text-[9px] font-mono text-[#8A7E70]">{item.code}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Corridor Telemetry & User Authentication Box */}
      <div className="p-3 border-t border-[#E2D5C3] bg-[#F4EBDD]/60 space-y-3">
        {/* Live Corridor Status Badge */}
        <div className="p-3 bg-[#FAF5EC] border border-[#E2D5C3] rounded-xl font-mono text-[10px] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between text-[#5C5349]">
            <span className="flex items-center gap-1.5 text-[#C85A32] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C85A32] animate-pulse" />
              ODISHA-WB CORRIDOR
            </span>
            <span className="text-[#1F1D1A] font-bold">NH-16</span>
          </div>
          <div className="flex items-center justify-between text-[#8A7E70] pt-0.5 border-t border-[#E2D5C3]">
            <span>REEFER TEMP</span>
            <span className="text-[#4D6A42] font-bold">4.2°C OPTIMAL</span>
          </div>
        </div>

        {/* User / Auth State */}
        {isAuthenticated ? (
          <div className="flex items-center justify-between px-2 text-xs">
            <div className="truncate">
              <div className="text-[#1F1D1A] font-bold truncate">{user?.name || "Dispatcher"}</div>
              <div className="text-[10px] text-[#8A7E70] font-mono capitalize">{user?.role || "Operator"}</div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-[#8A7E70] hover:text-[#BA4336] hover:bg-[#F4EBDD] transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="w-full py-2 rounded-xl bg-[#1F1D1A] hover:bg-[#3D352E] text-xs font-bold text-[#FDFBF7] flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5 text-[#EFE3D2]" />
            <span>SIGN IN TO FLEET</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
