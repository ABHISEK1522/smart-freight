"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import VehicleIllustration from "@/components/VehicleIllustration";
import {
  Truck,
  Plus,
  RefreshCw,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle2,
  X,
  IndianRupee,
  ShieldCheck,
  Check,
  Package,
  Wrench,
  Ban,
  Activity,
  Snowflake,
  ArrowRight,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const STATUS_OPTIONS = ["Available", "In Transit", "Maintenance", "Unavailable"];
const CAPABILITY_OPTIONS = [
  "Refrigerated / Cold-Chain",
  "Normal / Ambient",
  "Fragile Dampening",
  "Heavy Freight",
];

const VEHICLE_TYPES = [
  "Refrigerated Truck (Heavy)",
  "Refrigerated Van (Medium)",
  "Standard Freight Truck",
  "Light Delivery Truck",
  "Express Heavy Carrier",
  "Container Freight Truck",
];

export default function FleetManagementPage() {
  const { user, getAuthHeaders, isAuthenticated } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [activeVehicleId, setActiveVehicleId] = useState(null);

  const [formVehicleId, setFormVehicleId] = useState("");
  const [formType, setFormType] = useState(VEHICLE_TYPES[0]);
  const [formCapacity, setFormCapacity] = useState(5000);
  const [formBaseCost, setFormBaseCost] = useState(18000);
  const [formStatus, setFormStatus] = useState("Available");
  const [formCapability, setFormCapability] = useState(CAPABILITY_OPTIONS[0]);

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

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

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeaders ? getAuthHeaders() : { "Content-Type": "application/json" };
      const res = await fetch(`${API_BASE_URL}/vehicles`, { headers });
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      } else {
        setError("Unable to load fleet registry.");
      }
    } catch (err) {
      setError("Network error connecting to vehicle service.");
      setVehicles([
        {
          id: "VH-101",
          type: "Refrigerated Truck (Heavy)",
          capacity_kg: 8000,
          base_cost: 24000,
          is_refrigerated: true,
          status: "Available",
          capability: "Refrigerated / Cold-Chain",
        },
        {
          id: "VH-102",
          type: "Refrigerated Van (Medium)",
          capacity_kg: 3500,
          base_cost: 14000,
          is_refrigerated: true,
          status: "In Transit",
          capability: "Refrigerated / Cold-Chain",
        },
        {
          id: "VH-103",
          type: "Standard Freight Truck",
          capacity_kg: 6000,
          base_cost: 16000,
          is_refrigerated: false,
          status: "Available",
          capability: "Normal / Ambient",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm(`Are you sure you want to delete vehicle ${id}?`)) return;
    setDeletingId(id);
    try {
      const headers = getAuthHeaders ? getAuthHeaders() : { "Content-Type": "application/json" };
      const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setVehicles((prev) => prev.filter((v) => v.id !== id));
        setActionSuccessMsg(`Vehicle ${id} removed from fleet registry.`);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const openModal = (mode, vehicle = null) => {
    setModalMode(mode);
    if (mode === "edit" && vehicle) {
      setActiveVehicleId(vehicle.id);
      setFormVehicleId(vehicle.id);
      setFormType(vehicle.type);
      setFormCapacity(vehicle.capacity_kg);
      setFormBaseCost(vehicle.base_cost);
      setFormStatus(vehicle.status);
      setFormCapability(
        vehicle.is_refrigerated
          ? "Refrigerated / Cold-Chain"
          : "Normal / Ambient"
      );
    } else {
      setActiveVehicleId(null);
      setFormVehicleId(`VH-${Math.floor(100 + Math.random() * 900)}`);
      setFormType(VEHICLE_TYPES[0]);
      setFormCapacity(5000);
      setFormBaseCost(18000);
      setFormStatus("Available");
      setFormCapability(CAPABILITY_OPTIONS[0]);
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const headers = getAuthHeaders ? getAuthHeaders() : { "Content-Type": "application/json" };
      const payload = {
        id: formVehicleId,
        type: formType,
        capacity_kg: Number(formCapacity),
        base_cost: Number(formBaseCost),
        is_refrigerated: formCapability.includes("Refrigerated"),
        status: formStatus,
      };

      let res;
      if (modalMode === "add") {
        res = await fetch(`${API_BASE_URL}/vehicles`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE_URL}/vehicles/${activeVehicleId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setModalOpen(false);
        fetchVehicles();
        setActionSuccessMsg(`Vehicle ${formVehicleId} successfully saved.`);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error("Form submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F4EBDD] text-[#1F1D1A] font-sans selection:bg-[#C85A32] selection:text-[#FFFFFF]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-18 bg-[#FAF5EC] border-b border-[#E2D5C3] px-6 flex items-center justify-between sticky top-0 z-20 select-none">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FDFBF7] border border-[#E2D5C3] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#C85A32] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F1D1A]">
                FLEET REGISTRY // ASSET MANAGEMENT
              </span>
            </div>
            <span className="text-[#D4C3AC] text-xs">|</span>
            <div className="text-[11px] text-[#C85A32] hidden sm:flex items-center gap-1.5 font-mono">
              <span className="text-[#8A7E70]">REGISTERED UNITS:</span>
              <span className="font-bold text-[#1F1D1A]">{vehicles.length} VEHICLES</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono select-none">
            <span className="hidden lg:block bg-[#FDFBF7] text-[#C85A32] px-3 py-1 rounded-lg border border-[#E2D5C3] font-bold shadow-xs">{currentTime}</span>
            <button
              onClick={() => openModal("add")}
              className="px-4 py-2 bg-[#1F1D1A] hover:bg-[#3D352E] text-[#FDFBF7] rounded-full text-xs font-bold font-sans uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#C85A32]" />
              <span>Register Vehicle</span>
            </button>
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

            {/* Fleet Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className="p-5 bg-[#FAF5EC] border border-[#E2D5C3] rounded-2xl shadow-sm flex flex-col justify-between space-y-4 relative group hover:border-[#C85A32] transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-[#E2D5C3] pb-3">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-xs font-bold text-[#C85A32]">{v.id}</span>
                        <span className="text-[10px] text-[#5C5349] font-bold">
                          {v.is_refrigerated ? "❄️ Reefer" : "📦 Ambient"}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                          v.status === "Available"
                            ? "bg-[#EBF3EA] text-[#2D5926] border-[#C4DEC0]"
                            : v.status === "In Transit"
                            ? "bg-[#FDF0EA] text-[#C85A32] border-[#F5CABA]"
                            : "bg-[#FDF0EA] text-[#BA4336] border-[#F5CABA]"
                        }`}
                      >
                        ● {v.status?.toUpperCase() || "AVAILABLE"}
                      </span>
                    </div>

                    <div className="py-3 my-3 flex items-center justify-center bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl overflow-hidden shadow-xs">
                      <VehicleIllustration
                        type={v.type}
                        mode={v.status === "In Transit" ? "driving" : "idle"}
                        isSelected={false}
                        showRoad={true}
                        className="w-36 h-20"
                      />
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-[#1F1D1A]">{v.type}</h3>
                      <p className="text-[10px] text-[#5C5349] font-mono mt-0.5">
                        Capacity: <strong className="text-[#1F1D1A]">{v.capacity_kg.toLocaleString()} kg</strong> · Base: ₹{v.base_cost.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E2D5C3] flex items-center justify-between font-mono text-xs">
                    <button
                      onClick={() => openModal("edit", v)}
                      className="text-[10px] text-[#C85A32] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Parameters</span>
                    </button>

                    <button
                      onClick={() => handleDelete(v.id)}
                      disabled={deletingId === v.id}
                      className="text-[10px] text-[#BA4336] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Decommission</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Dialog */}
            {modalOpen && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-[#FAF5EC] border border-[#E2D5C3] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E2D5C3] pb-3">
                    <h3 className="text-xs font-bold font-mono text-[#1F1D1A] uppercase tracking-wider">
                      {modalMode === "add" ? "Register New Fleet Asset" : `Configure Asset // ${formVehicleId}`}
                    </h3>
                    <button
                      onClick={() => setModalOpen(false)}
                      className="p-1 text-[#8A7E70] hover:text-[#1F1D1A] rounded cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
                    <div>
                      <label className="block text-[10px] text-[#5C5349] font-bold uppercase mb-1">Vehicle Identifier</label>
                      <input
                        type="text"
                        value={formVehicleId}
                        onChange={(e) => setFormVehicleId(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E2D5C3] rounded-xl text-[#1F1D1A] focus:outline-none focus:border-[#C85A32]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#5C5349] font-bold uppercase mb-1">Carrier Type</label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E2D5C3] rounded-xl text-[#1F1D1A] focus:outline-none focus:border-[#C85A32] cursor-pointer"
                      >
                        {VEHICLE_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-[#5C5349] font-bold uppercase mb-1">Capacity (KG)</label>
                        <input
                          type="number"
                          value={formCapacity}
                          onChange={(e) => setFormCapacity(e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E2D5C3] rounded-xl text-[#1F1D1A] focus:outline-none focus:border-[#C85A32]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#5C5349] font-bold uppercase mb-1">Base Cost (₹)</label>
                        <input
                          type="number"
                          value={formBaseCost}
                          onChange={(e) => setFormBaseCost(e.target.value)}
                          required
                          className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E2D5C3] rounded-xl text-[#1F1D1A] focus:outline-none focus:border-[#C85A32]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-[#5C5349] font-bold uppercase mb-1">Operational Status</label>
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E2D5C3] rounded-xl text-[#1F1D1A] focus:outline-none focus:border-[#C85A32] cursor-pointer"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#5C5349] font-bold uppercase mb-1">Cargo Capability</label>
                        <select
                          value={formCapability}
                          onChange={(e) => setFormCapability(e.target.value)}
                          className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E2D5C3] rounded-xl text-[#1F1D1A] focus:outline-none focus:border-[#C85A32] cursor-pointer"
                        >
                          {CAPABILITY_OPTIONS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="pt-3 flex justify-end gap-2 border-t border-[#E2D5C3]">
                      <button
                        type="button"
                        onClick={() => setModalOpen(false)}
                        className="px-4 py-2 bg-[#FAF5EC] hover:bg-[#FDFBF7] text-[#5C5349] rounded-full text-xs font-bold transition-all border border-[#E2D5C3] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2 bg-[#1F1D1A] hover:bg-[#3D352E] text-[#FDFBF7] rounded-full text-xs font-bold uppercase transition-all cursor-pointer shadow-md"
                      >
                        {submitting ? "Saving..." : "Save Vehicle"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
