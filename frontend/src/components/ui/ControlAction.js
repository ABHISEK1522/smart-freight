"use client";

import React from "react";
import Link from "next/link";

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * CONTROL ACTION BUTTON — REUSABLE DESIGN SYSTEM COMPONENT
 * ═════════════════════════════════════════════════════════════════════════════
 * 
 * Restrained mechanical command buttons with subtle hover feedback.
 * 
 * Props:
 * - variant: "primary" (olive/warm white) | "secondary" (dark surface) | "ghost" (outline)
 * - size: "sm" | "md" | "lg"
 * - href: Optional Link destination
 * - onClick: Click handler
 * - icon: Optional React icon
 * - children: Button label
 */
export default function ControlAction({
  variant = "primary",
  size = "md",
  href,
  onClick,
  icon: Icon,
  disabled = false,
  children,
  className = "",
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case "secondary":
        return "bg-[#1B1B18] hover:bg-[#242420] text-[#F2EFE9] border border-[#32322C] hover:border-[#48483F]";
      case "ghost":
        return "bg-transparent hover:bg-[#141412] text-[#8E8B82] hover:text-[#F2EFE9] border border-[#242420] hover:border-[#32322C]";
      default:
        return "bg-[#A8B86B] hover:bg-[#B8C87A] text-[#0B0B0A] font-bold border border-[#A8B86B] shadow-sm";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "px-3 py-1.5 text-[10px]";
      case "lg":
        return "px-6 py-3 text-xs tracking-widest";
      default:
        return "px-4 py-2 text-[11px] tracking-wider";
    }
  };

  const baseStyles = `inline-flex items-center justify-center gap-2 rounded-[3px] sf-data uppercase transition-all duration-150 active:scale-[0.98] select-none ${
    disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
  } ${getVariantStyles()} ${getSizeStyles()} ${className}`;

  if (href && !disabled) {
    return (
      <Link href={href} className={baseStyles}>
        <span>{children}</span>
        {Icon && <Icon className="w-3.5 h-3.5" />}
      </Link>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={baseStyles}>
      <span>{children}</span>
      {Icon && <Icon className="w-3.5 h-3.5" />}
    </button>
  );
}
