"use client";

import React from "react";

export default function SmartFreightPageHeader({
  title = "PAGE TITLE",
  subtitle = "ODISHA-WB NH-16 CORRIDOR",
  badge = "ACTIVE",
  icon: Icon,
  actions,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between bg-[#1E1717] rounded-[12px] border border-[#3D2E2E] px-6 py-4 shadow-lg gap-3 select-none">
      <div className="flex items-center gap-3.5">
        {Icon && (
          <div className="w-9 h-9 rounded-full bg-[#2B2020] border border-[#4D3838] flex items-center justify-center text-[#D19888]">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div>
          <h1 className="text-xs font-black uppercase tracking-wider text-[#FAF6F2]">
            {title}
          </h1>
          <p className="text-[10px] text-[#8E8B82] font-mono mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {badge && (
          <span className="text-[10px] text-[#D19888] font-mono font-bold px-3 py-1 bg-[#2B2020] border border-[#4D3838] rounded-full hidden sm:block">
            {badge}
          </span>
        )}
        {actions}
      </div>
    </div>
  );
}
