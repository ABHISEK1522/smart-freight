"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  AlertTriangle,
  X,
  Upload,
  Camera,
  CheckCircle2,
  Check,
  AlertCircle,
  RefreshCw,
  Clock,
  Package,
  FileText,
  Trash2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { submitCargoIncident } from "@/services/incidentService";

const INCIDENT_TYPES = [
  { value: "Package Damage", label: "Package Damage", desc: "Crushed, punctured, or torn boxes" },
  { value: "Temperature Issue", label: "Temperature Issue", desc: "Chiller breach or spoiled cargo" },
  { value: "Leakage / Spillage", label: "Leakage / Spillage", desc: "Liquid or chemical residue" },
  { value: "Accident / Impact", label: "Accident / Impact", desc: "Sudden deceleration or collision" },
  { value: "Other", label: "Other", desc: "Unspecified cargo irregularity" },
];

const SEVERITY_LEVELS = [
  { value: "Low", label: "Low", color: "bg-[#EBF3EA] text-[#2D5926] border-[#C4DEC0]" },
  { value: "Medium", label: "Medium", color: "bg-[#FEF6E8] text-[#B8711E] border-[#F2D7A5]" },
  { value: "High", label: "High", color: "bg-[#FDF0EA] text-[#BA4336] border-[#F5CABA]" },
];

export default function CargoIncidentModal({
  isOpen,
  onClose,
  activeShipment,
  authHeaders = {},
  onIncidentReported,
  prefillData = null,
}) {
  const [incidentType, setIncidentType] = useState("Package Damage");
  const [severity, setSeverity] = useState("Medium");
  const [description, setDescription] = useState("");
  const [photoData, setPhotoData] = useState(null);
  const [photoName, setPhotoName] = useState("");
  const [photoSize, setPhotoSize] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [formError, setFormError] = useState("");

  const fileInputRef = useRef(null);

  // Initialize or pre-fill form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (prefillData) {
        setIncidentType(prefillData.incidentType || "Package Damage");
        setSeverity(prefillData.severity || "Medium");
        setDescription(prefillData.description || "");
      } else {
        setIncidentType("Package Damage");
        setSeverity("Medium");
        setDescription("");
      }
      setPhotoData(null);
      setPhotoName("");
      setPhotoSize("");
      setIsSubmitting(false);
      setSubmissionResult(null);
      setFormError("");
    }
  }, [isOpen, prefillData]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Selected photo exceeds 5MB limit. Please attach a smaller image.");
      return;
    }

    setFormError("");
    setPhotoName(file.name);
    setPhotoSize((file.size / 1024).toFixed(1) + " KB");

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setPhotoData(uploadEvent.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoData(null);
    setPhotoName("");
    setPhotoSize("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!description.trim()) {
      setFormError("Please provide a brief description of the incident.");
      return;
    }

    if (description.trim().length < 10) {
      setFormError("Description is too short. Please describe the observed cargo condition (minimum 10 characters).");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        shipmentId: activeShipment?.id || "SF-DEMO-001",
        incidentType,
        severity,
        description: description.trim(),
        photo: photoData,
        photoName,
      };

      const result = await submitCargoIncident(payload, authHeaders);

      if (result.success) {
        setSubmissionResult(result);
        if (onIncidentReported) {
          onIncidentReported(result.data);
        }
      } else {
        setFormError(result.error || "Unable to report incident. Please try again.");
      }
    } catch (err) {
      setFormError("Unable to report incident. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1D1A]/60 backdrop-blur-xs select-none">
      <div
        className="w-full max-w-xl bg-[#FAF5EC] border border-[#E2D5C3] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-[#FDFBF7] border-b border-[#E2D5C3] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FDF0EA] border border-[#F5CABA] text-[#C85A32] flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4 text-[#C85A32]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#1F1D1A] uppercase tracking-wide">
                Cargo Incident Report
              </h3>
              <p className="text-[10px] text-[#8A7E70] font-mono">
                FASTAPI REAL-TIME INCIDENT TELEMETRY
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-full text-[#8A7E70] hover:text-[#1F1D1A] hover:bg-[#E2D5C3]/40 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs font-sans">
          {/* SUCCESS STATE */}
          {submissionResult ? (
            <div className="space-y-5 text-center py-4">
              <div className="w-14 h-14 rounded-full bg-[#EBF3EA] border border-[#C4DEC0] text-[#2D5926] flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8 text-[#2D5926]" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-black text-[#1F1D1A] uppercase tracking-tight font-mono">
                  Incident Reported
                </h4>
                <p className="text-xs text-[#5C5349]">
                  {submissionResult.message || "Your incident has been recorded successfully."}
                </p>
              </div>

              {/* Confirmation Details Card */}
              <div className="bg-[#FDFBF7] border border-[#E2D5C3] rounded-2xl p-5 text-left font-mono space-y-3">
                <div className="flex items-center justify-between border-b border-[#E2D5C3] pb-2 text-[11px]">
                  <span className="text-[#8A7E70] uppercase font-bold">Incident Reference:</span>
                  <span className="font-bold text-xs text-[#C85A32]">
                    {submissionResult.data.incident_id || submissionResult.data.id}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#8A7E70] uppercase">Shipment / Manifest ID:</span>
                  <span className="font-bold text-[#1F1D1A]">
                    {submissionResult.data.shipment_id || submissionResult.data.shipmentId}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#8A7E70] uppercase">Incident Type:</span>
                  <span className="font-bold text-[#1F1D1A]">
                    {submissionResult.data.incident_type || submissionResult.data.incidentType}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#8A7E70] uppercase">Severity:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full border text-[10px] ${
                      String(submissionResult.data.severity).toUpperCase() === "HIGH"
                        ? "bg-[#FDF0EA] text-[#BA4336] border-[#F5CABA]"
                        : String(submissionResult.data.severity).toUpperCase() === "MEDIUM"
                        ? "bg-[#FEF6E8] text-[#B8711E] border-[#F2D7A5]"
                        : "bg-[#EBF3EA] text-[#2D5926] border-[#C4DEC0]"
                    }`}
                  >
                    {String(submissionResult.data.severity).toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#8A7E70] uppercase">Time Reported:</span>
                  <span className="text-[#1F1D1A]">
                    {submissionResult.data.reportedAtIST || submissionResult.data.timestamp}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#8A7E70] uppercase">Status:</span>
                  <span className="font-bold px-2 py-0.5 rounded-full bg-[#EBF3EA] border border-[#C4DEC0] text-[#2D5926] text-[10px]">
                    {submissionResult.data.status || "REPORTED"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#8A7E70] uppercase">Customer notification:</span>
                  <span className="font-bold px-2 py-0.5 rounded-full bg-[#EBF3EA] border border-[#C4DEC0] text-[#2D5926] text-[10px] flex items-center gap-1">
                    <Check className="w-3 h-3 text-[#2D5926]" />
                    <span>SENT TO CUSTOMER DASHBOARD</span>
                  </span>
                </div>

                {submissionResult.data.photo_name && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#8A7E70] uppercase">Attached Photo:</span>
                    <span className="text-[#4D6A42] truncate max-w-[200px]">
                      {submissionResult.data.photo_name}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-[#E2D5C3] text-[10px] text-[#4D6A42] flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4D6A42]" />
                  <span>{submissionResult.data.storageNotice}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-[#1F1D1A] hover:bg-[#3D352E] text-[#FDFBF7] rounded-full text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                Close & Return to Navigation
              </button>
            </div>
          ) : (
            /* INCIDENT ENTRY FORM */
            <form onSubmit={handleSubmit} className="space-y-4">
              {prefillData?.source === "AUTOMATIC_TELEMETRY" && (
                <div className="p-3 bg-[#FEF6E8] border border-[#F2D7A5] rounded-xl flex items-center justify-between gap-2 font-mono text-[11px] text-[#B8711E]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#C85A32] animate-pulse" />
                    <span>
                      <strong>PRE-FILLED VIA TELEMETRY:</strong> Verify observation before confirming report.
                    </span>
                  </div>
                  <span className="text-[9px] uppercase font-bold bg-[#FAF5EC] px-2 py-0.5 rounded border border-[#F2D7A5]">
                    AUTO-DETECTED
                  </span>
                </div>
              )}

              {/* Manifest Banner (Auto Associated) */}
              <div className="p-3.5 bg-[#FDFBF7] border border-[#E2D5C3] rounded-2xl flex items-center justify-between font-mono">
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-[#C85A32]" />
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-[#8A7E70] block">
                      Active Manifest
                    </span>
                    <span className="font-bold text-xs text-[#1F1D1A]">
                      {activeShipment?.id || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-[#8A7E70] block">
                    Corridor
                  </span>
                  <span className="font-bold text-[11px] text-[#5C5349]">
                    {activeShipment ? `${activeShipment.pickup_location} → ${activeShipment.destination}` : "Standby"}
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {formError && (
                <div className="p-3 bg-[#FDF0EA] border border-[#F5CABA] rounded-xl text-[#BA4336] text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#BA4336]" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Incident Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#8A7E70] font-mono flex items-center gap-1.5">
                  <span>1. Incident Classification</span>
                  <span className="text-[#C85A32]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {INCIDENT_TYPES.map((t) => {
                    const isSelected = incidentType === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setIncidentType(t.value)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#FAF4E8] border-[#C85A32] text-[#1F1D1A] shadow-xs"
                            : "bg-[#FDFBF7] border-[#E2D5C3] text-[#5C5349] hover:border-[#D4C3AC]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold font-mono ${isSelected ? "text-[#C85A32]" : "text-[#1F1D1A]"}`}>
                            {t.label}
                          </span>
                          {isSelected && <span className="text-[10px] text-[#C85A32] font-bold">✓</span>}
                        </div>
                        <span className="text-[10px] text-[#8A7E70] block mt-0.5">
                          {t.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Severity Level */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#8A7E70] font-mono flex items-center gap-1.5">
                  <span>2. Severity Assessment</span>
                  <span className="text-[#C85A32]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SEVERITY_LEVELS.map((s) => {
                    const isSelected = severity === s.value;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setSeverity(s.value)}
                        className={`py-2 px-3 rounded-xl border text-center font-mono font-bold text-xs transition-all cursor-pointer ${
                          isSelected
                            ? `${s.color} ring-1 ring-[#C85A32] shadow-xs`
                            : "bg-[#FDFBF7] border-[#E2D5C3] text-[#5C5349] hover:bg-[#FAF5EC]"
                        }`}
                      >
                        {s.label.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#8A7E70] font-mono flex items-center justify-between">
                  <span>3. Incident Description & Observation *</span>
                  <span className="text-[9px] text-[#8A7E70]">{description.length} chars</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what happened to the cargo, carton condition, odor, or temperature fluctuations..."
                  rows={3}
                  className="w-full p-3 bg-[#FDFBF7] border border-[#E2D5C3] rounded-xl text-xs text-[#1F1D1A] placeholder-[#8A7E70] focus:outline-none focus:border-[#C85A32] transition-colors resize-none"
                />
              </div>

              {/* 4. Photo Evidence */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#8A7E70] font-mono flex items-center justify-between">
                  <span>4. Photo Evidence (Optional)</span>
                  <span className="text-[9px] text-[#8A7E70]">JPEG / PNG up to 5MB</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!photoData ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 border border-dashed border-[#D4C3AC] hover:border-[#C85A32] bg-[#FDFBF7] hover:bg-[#FAF4E8] rounded-2xl flex flex-col items-center justify-center text-center space-y-1 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#FAF5EC] border border-[#E2D5C3] flex items-center justify-center text-[#8A7E70] group-hover:text-[#C85A32]">
                      <Camera className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-mono font-bold text-[#1F1D1A] group-hover:text-[#C85A32]">
                      Attach Cargo Photo
                    </span>
                    <span className="text-[10px] text-[#8A7E70]">
                      Click to browse or take snapshot with device camera
                    </span>
                  </button>
                ) : (
                  <div className="p-3 bg-[#FDFBF7] border border-[#E2D5C3] rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={photoData}
                        alt="Cargo damage preview"
                        className="w-12 h-12 rounded-lg object-cover border border-[#E2D5C3]"
                      />
                      <div className="font-mono">
                        <div className="text-xs font-bold text-[#1F1D1A] truncate max-w-[240px]">
                          {photoName}
                        </div>
                        <div className="text-[10px] text-[#4D6A42] font-semibold">
                          {photoSize} · Ready to submit
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-2 text-[#BA4336] hover:bg-[#FDF0EA] rounded-lg transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Timestamp Notice */}
              <div className="pt-2 text-[10px] text-[#8A7E70] font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#8A7E70]" />
                <span>Incident will be time-stamped in IST and recorded against driver terminal ID.</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#E2D5C3]">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-full border border-[#E2D5C3] bg-[#FDFBF7] hover:bg-[#FAF5EC] text-xs font-mono font-bold text-[#5C5349] transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full bg-[#C85A32] hover:bg-[#B8532B] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Incident</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
