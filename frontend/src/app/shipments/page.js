"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import VehicleIllustration from "@/components/VehicleIllustration";
import SmartFreightRoute from "@/components/ui/SmartFreightRoute";
import SmartFreightPageHeader from "@/components/ui/SmartFreightPageHeader";
import {
  ClipboardList,
  Plus,
  Package,
  Clock,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
  X,
  MapPin,
  Calendar,
  IndianRupee,
  ShieldCheck,
  TrendingDown,
  Truck,
  Check,
  Navigation,
  Sparkles,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const STATUS_STAGES = ["Planned", "Dispatched", "In Transit", "Delivered"];

export default function MyShipmentsPage() {
  const { user, getAuthHeaders, isAuthenticated } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentTime, setCurrentTime] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

  const [viewMode, setViewMode] = useState("list");
  const [activeShipment, setActiveShipment] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }) + " IST"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchShipments = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeaders ? getAuthHeaders() : { "Content-Type": "application/json" };
      const res = await fetch(`${API_BASE_URL}/shipments`, { headers });
      if (res.ok) {
        const data = await res.json();
        setShipments(data);
      } else {
        setError("Unable to connect to Freight Registry.");
      }
    } catch (err) {
      setError("Network error loading shipments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleDeleteShipment = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm(`Confirm deleting shipment manifest ${id}?`)) return;

    setDeletingId(id);
    try {
      const headers = getAuthHeaders ? getAuthHeaders() : { "Content-Type": "application/json" };
      const res = await fetch(`${API_BASE_URL}/shipments/${id}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setShipments((prev) => prev.filter((s) => s.id !== id));
        if (activeShipment?.id === id) {
          setViewMode("list");
          setActiveShipment(null);
        }
        setActionSuccessMsg(`Shipment ${id} removed successfully.`);
        setTimeout(() => setActionSuccessMsg(null), 3000);
      } else {
        alert("Failed to delete shipment.");
      }
    } catch (err) {
      alert("Error deleting shipment.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!activeShipment) return;
    setUpdatingStatus(true);
    try {
      const headers = getAuthHeaders ? getAuthHeaders() : { "Content-Type": "application/json" };
      const res = await fetch(`${API_BASE_URL}/shipments/${activeShipment.id}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveShipment(updated);
        setShipments((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s))
        );
        setActionSuccessMsg(`Status updated to "${newStatus}".`);
        setTimeout(() => setActionSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredShipments = shipments.filter((s) => {
    const matchesSearch =
      (s.id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.product_type || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.pickup_location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.destination || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || (s.status || "").toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen bg-[#F4EBDD] text-[#1F1D1A] font-sans selection:bg-[#C85A32] selection:text-[#FFFFFF]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-18 bg-[#FAF5EC] border-b border-[#E2D5C3] px-6 flex items-center justify-between sticky top-0 z-20 select-none">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FDFBF7] border border-[#E2D5C3] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#C85A32] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F1D1A]">
                CARGO FLOW // SHIPMENTS MANIFEST
              </span>
            </div>
            <span className="text-[#D4C3AC] text-xs">|</span>
            <div className="text-[11px] text-[#C85A32] hidden sm:flex items-center gap-1.5 font-mono">
              <span className="text-[#8A7E70]">REGISTRY:</span>
              <span className="font-bold text-[#1F1D1A]">{shipments.length} ACTIVE MANIFESTS</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono select-none">
            <span className="hidden lg:block bg-[#FDFBF7] text-[#C85A32] px-3 py-1 rounded-lg border border-[#E2D5C3] font-bold shadow-xs">{currentTime}</span>
            <Link
              href="/"
              className="px-4 py-2 bg-[#1F1D1A] hover:bg-[#3D352E] text-[#FDFBF7] rounded-full text-xs font-bold font-sans uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>New Shipment</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
            
            {actionSuccessMsg && (
              <div className="p-4 bg-[#EBF3EA] border border-[#C4DEC0] rounded-2xl text-[#2D5926] text-xs font-mono flex items-center gap-2.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2D5926]" />
                <span>{actionSuccessMsg}</span>
              </div>
            )}

            {/* VIEW 1: SHIPMENTS LIST VIEW */}
            {viewMode === "list" && (
              <div className="space-y-6">
                
                {/* Search & Filter Toolbar */}
                <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E2D5C3] flex flex-wrap items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3 flex-1 min-w-[260px]">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-[#8A7E70] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search manifest ID, cargo type, or corridor hub..."
                        className="w-full pl-10 pr-4 py-2 bg-[#FFFFFF] border border-[#E2D5C3] focus:border-[#C85A32] rounded-xl text-xs text-[#1F1D1A] font-mono focus:outline-none placeholder:text-[#8A7E70]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    {["ALL", "Planned", "In Transit", "Delivered"].map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-full uppercase tracking-wider font-bold transition-all cursor-pointer ${
                          statusFilter.toUpperCase() === st.toUpperCase()
                            ? "bg-[#FAF4E8] text-[#C85A32] border border-[#C85A32]"
                            : "bg-[#FDFBF7] text-[#5C5349] border border-[#E2D5C3] hover:text-[#1F1D1A]"
                        }`}
                      >
                        {st}
                      </button>
                    ))}

                    <button
                      onClick={fetchShipments}
                      title="Refresh Shipments"
                      className="p-2 bg-[#FDFBF7] hover:bg-[#F4EBDD] text-[#5C5349] hover:text-[#1F1D1A] rounded-xl border border-[#E2D5C3] transition-colors cursor-pointer ml-2"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#C85A32]" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Shipments Grid */}
                {filteredShipments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredShipments.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setActiveShipment(s);
                          setViewMode("details");
                        }}
                        className="p-5 bg-[#FAF5EC] hover:bg-[#FAF4E8] border border-[#E2D5C3] hover:border-[#C85A32] rounded-2xl shadow-sm transition-all duration-150 cursor-pointer relative flex flex-col justify-between space-y-4 group"
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-[#E2D5C3] pb-3">
                            <div className="flex items-center gap-2 font-mono">
                              <span className="text-xs font-bold text-[#C85A32]">{s.id}</span>
                              <span className="text-[10px] text-[#8A7E70] uppercase font-bold">
                                [{s.priority || "Standard"}]
                              </span>
                            </div>
                            <span
                              className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                                s.status === "In Transit"
                                  ? "bg-[#FDF0EA] text-[#C85A32] border-[#F5CABA]"
                                  : s.status === "Delivered"
                                  ? "bg-[#EBF3EA] text-[#2D5926] border-[#C4DEC0]"
                                  : "bg-[#FDFBF7] text-[#5C5349] border-[#E2D5C3]"
                              }`}
                            >
                              ● {s.status || "PLANNED"}
                            </span>
                          </div>

                          <div className="mt-3">
                            <h3 className="text-sm font-bold text-[#1F1D1A] group-hover:text-[#C85A32] transition-colors">
                              {s.product_type}
                            </h3>
                            <p className="text-[11px] text-[#5C5349] font-mono mt-0.5">
                              Payload: <strong className="text-[#1F1D1A]">{s.weight_kg} kg</strong> · {s.special_requirement || "Normal"}
                            </p>
                          </div>

                          <div className="mt-3">
                            <SmartFreightRoute
                              origin={s.pickup_location}
                              destination={s.destination}
                              temp={s.special_requirement === "Refrigerated" ? "04.2°C" : "AMBIENT"}
                              weight={`${s.weight_kg} KG`}
                            />
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#E2D5C3] flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-[#1F1D1A]">
                              ₹{s.cost ? s.cost.toLocaleString() : "12,400"}
                            </span>
                            {s.savings && (
                              <span className="text-[#4D6A42] font-bold text-[10px]">
                                +₹{s.savings.toLocaleString()} saved
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] text-[#C85A32] font-bold inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            <span>Inspect Manifest</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#FAF5EC] border border-[#E2D5C3] rounded-3xl p-12 text-center space-y-4 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-[#FDF0EA] border border-[#F5CABA] flex items-center justify-center mx-auto text-[#C85A32]">
                      <Package className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 max-w-sm mx-auto">
                      <h4 className="text-sm font-bold text-[#1F1D1A] uppercase font-mono">No Matching Shipments</h4>
                      <p className="text-xs text-[#5C5349] leading-relaxed">
                        {searchQuery ? "No manifests match your current query." : "No shipments are currently registered in the database."}
                      </p>
                    </div>
                    <Link
                      href="/"
                      className="px-6 py-2.5 bg-[#1F1D1A] hover:bg-[#3D352E] text-[#FDFBF7] rounded-full text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-2 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#C85A32]" />
                      <span>Plan New Shipment</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: SHIPMENT DETAILS INSPECTOR */}
            {viewMode === "details" && activeShipment && (
              <div className="space-y-6">
                
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setViewMode("list");
                      setActiveShipment(null);
                    }}
                    className="px-4 py-2 bg-[#FAF5EC] hover:bg-[#FAF4E8] text-[#1F1D1A] rounded-full text-xs font-mono font-bold transition-all border border-[#E2D5C3] inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-[#C85A32]" />
                    <span>Return to Manifests List</span>
                  </button>

                  <button
                    onClick={(e) => handleDeleteShipment(activeShipment.id, e)}
                    disabled={deletingId === activeShipment.id}
                    className="px-4 py-2 bg-[#FDF0EA] hover:bg-[#FBE4DA] text-[#BA4336] rounded-full text-xs font-mono font-bold transition-all border border-[#F5CABA] inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Shipment</span>
                  </button>
                </div>

                <div className="bg-[#FAF5EC] border border-[#E2D5C3] rounded-3xl shadow-md overflow-hidden">
                  <div className="h-1 bg-[#C85A32] w-full" />

                  <div className="px-6 py-5 bg-[#FDFBF7] border-b border-[#E2D5C3] flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-[9px] text-[#8A7E70] font-mono uppercase tracking-widest flex items-center gap-2 font-bold">
                        <span>MANIFEST: {activeShipment.id}</span>
                        <span className="text-[#D4C3AC]">•</span>
                        <span className="text-[#4D6A42]">REGISTERED CARGO</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-[#1F1D1A] tracking-tight flex items-center gap-3 mt-1">
                        <span>{activeShipment.pickup_location}</span>
                        <ArrowRight className="w-5 h-5 text-[#C85A32]" />
                        <span>{activeShipment.destination}</span>
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-xs font-bold px-3 py-1 rounded-full border border-[#F5CABA] bg-[#FDF0EA] text-[#C85A32]">
                        {activeShipment.status?.toUpperCase() || "PLANNED"}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
                      <div className="p-3.5 bg-[#FDFBF7] rounded-xl border border-[#E2D5C3] shadow-xs">
                        <span className="text-[8px] text-[#8A7E70] uppercase tracking-wider block font-bold">PRODUCT TYPE</span>
                        <div className="text-sm font-bold text-[#1F1D1A] mt-1">{activeShipment.product_type}</div>
                        <span className="text-[9px] text-[#5C5349] mt-0.5 block">{activeShipment.weight_kg} kg weight</span>
                      </div>

                      <div className="p-3.5 bg-[#FDFBF7] rounded-xl border border-[#E2D5C3] shadow-xs">
                        <span className="text-[8px] text-[#8A7E70] uppercase tracking-wider block font-bold">CARRIER UNIT</span>
                        <div className="text-sm font-bold text-[#1F1D1A] mt-1 truncate">{activeShipment.assigned_vehicle || "Standard Reefer"}</div>
                        <span className="text-[9px] text-[#4D6A42] font-bold mt-0.5 block">Active Telemetry</span>
                      </div>

                      <div className="p-3.5 bg-[#FDFBF7] rounded-xl border border-[#E2D5C3] shadow-xs">
                        <span className="text-[8px] text-[#8A7E70] uppercase tracking-wider block font-bold">SETTLEMENT COST</span>
                        <div className="text-sm font-bold text-[#1F1D1A] mt-1">₹{activeShipment.cost ? activeShipment.cost.toLocaleString() : "12,400"}</div>
                        <span className="text-[9px] text-[#4D6A42] font-bold mt-0.5 block">+₹{activeShipment.savings ? activeShipment.savings.toLocaleString() : "4,200"} saved</span>
                      </div>

                      <div className="p-3.5 bg-[#FDFBF7] rounded-xl border border-[#E2D5C3] shadow-xs">
                        <span className="text-[8px] text-[#8A7E70] uppercase tracking-wider block font-bold">SCHEDULE</span>
                        <div className="text-sm font-bold text-[#1F1D1A] mt-1">{activeShipment.pickup_date || "2026-08-18"}</div>
                        <span className="text-[9px] text-[#C85A32] font-bold mt-0.5 block">Target: {activeShipment.delivery_time || "18:00"} IST</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-mono font-bold text-[#1F1D1A] uppercase tracking-wider">
                        Active Arterial Corridor
                      </div>
                      <SmartFreightRoute
                        origin={activeShipment.pickup_location}
                        destination={activeShipment.destination}
                        temp={activeShipment.special_requirement === "Refrigerated" ? "04.2°C" : "AMBIENT"}
                        weight={`${activeShipment.weight_kg} KG`}
                      />
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="text-xs font-mono font-bold text-[#1F1D1A] uppercase tracking-wider">
                        Update Lifecycle Status
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                        {STATUS_STAGES.map((st) => (
                          <button
                            key={st}
                            onClick={() => handleUpdateStatus(st)}
                            disabled={updatingStatus || activeShipment.status === st}
                            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                              activeShipment.status === st
                                ? "bg-[#FAF4E8] text-[#C85A32] border-[#C85A32] shadow-xs font-bold"
                                : "bg-[#FDFBF7] text-[#5C5349] border-[#E2D5C3] hover:text-[#1F1D1A]"
                            }`}
                          >
                            <div className="text-[8px] font-bold">
                              {activeShipment.status === st ? "● CURRENT" : "UPDATE TO"}
                            </div>
                            <div className="text-xs font-bold uppercase mt-0.5">{st}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
