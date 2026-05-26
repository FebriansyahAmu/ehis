"use client";

/**
 * ClaimTabs — 6-tab navigation untuk halaman Klaim Detail (EK3.1).
 *
 * Layout: horizontal sticky tab bar dengan scroll-x untuk mobile.
 * Active indicator pakai `motion.layoutId="klaim-detail-tab-underline"` (spring).
 *
 * Tab definitions di `claimDetailShared.ts` (CLAIM_DETAIL_TABS).
 * Saat ini hanya "ringkasan" yang implemented = false untuk semua (placeholder).
 * Flag implemented akan di-flip per fase EK3.x saat tab content selesai.
 */

import { motion } from "framer-motion";
import { Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { CLAIM_DETAIL_TABS, type ClaimDetailTab } from "./claimDetailShared";

interface Props {
  active: ClaimDetailTab;
  onChange: (tab: ClaimDetailTab) => void;
}

export default function ClaimTabs({ active, onChange }: Props) {
  return (
    <nav
      aria-label="Tab Klaim Detail"
      className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur-sm"
    >
      <div className="flex items-stretch overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-4">
        {CLAIM_DETAIL_TABS.map((tab) => {
          const isActive = active === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              aria-pressed={isActive}
              aria-current={isActive ? "page" : undefined}
              title={tab.hint}
              className={cn(
                "group relative inline-flex shrink-0 items-center gap-2 px-3 py-2.5 text-[12.5px] font-semibold transition-colors duration-150",
                isActive
                  ? "text-teal-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors",
                  isActive
                    ? "bg-teal-50 text-teal-700 ring-1 ring-teal-200"
                    : "bg-slate-50 text-slate-500 group-hover:bg-slate-100 ring-1 ring-slate-200",
                )}
              >
                <Icon size={12} strokeWidth={2.4} />
              </span>
              <span className="flex flex-col items-start gap-0.5 leading-tight">
                <span className="flex items-center gap-1">
                  {tab.label}
                  {!tab.implemented && (
                    <Lock
                      size={9}
                      strokeWidth={2.6}
                      className={cn(
                        isActive ? "text-teal-400" : "text-slate-300",
                      )}
                    />
                  )}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-normal normal-case tracking-normal",
                    isActive ? "text-teal-500/80" : "text-slate-400",
                  )}
                >
                  {tab.hint}
                </span>
              </span>

              {/* Active underline via shared layoutId */}
              {isActive && (
                <motion.span
                  layoutId="klaim-detail-tab-underline"
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-linear-to-r from-teal-400 via-teal-500 to-sky-400"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
