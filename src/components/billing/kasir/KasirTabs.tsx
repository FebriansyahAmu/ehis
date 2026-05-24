"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Zap, PiggyBank, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type KasirTabKey = "dashboard" | "quick" | "deposit";

interface TabDef {
  key: KasirTabKey;
  label: string;
  icon: LucideIcon;
  hint: string;
  disabledIfNoShift?: boolean;
}

const TABS: TabDef[] = [
  { key: "dashboard", label: "Dashboard",   icon: LayoutDashboard, hint: "Monitor shift & breakdown lintas counter" },
  { key: "quick",     label: "Quick Bayar", icon: Zap,             hint: "Search tagihan & terima pembayaran cepat", disabledIfNoShift: true },
  { key: "deposit",   label: "Deposit Awal", icon: PiggyBank,      hint: "Buka deposit untuk pasien baru admisi RI / pre-op", disabledIfNoShift: true },
];

interface Props {
  active: KasirTabKey;
  onChange: (key: KasirTabKey) => void;
  hasActiveShift: boolean;
  /** Count badge — payment in shift / suggested admissions */
  counts?: Partial<Record<KasirTabKey, number>>;
}

export default function KasirTabs({ active, onChange, hasActiveShift, counts }: Props) {
  return (
    <nav
      aria-label="Tab Kasir Counter"
      className="flex flex-wrap items-end gap-0.5 border-b border-slate-200 bg-slate-50/40 px-6 pt-2 dark:border-slate-800 dark:bg-slate-900/40"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.key;
        const disabled = tab.disabledIfNoShift && !hasActiveShift;
        const count = counts?.[tab.key];
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => !disabled && onChange(tab.key)}
            disabled={disabled}
            aria-pressed={isActive}
            title={disabled ? "Buka shift dulu untuk aksi ini" : tab.hint}
            className={cn(
              "group relative inline-flex items-center gap-1.5 rounded-t-md px-3 py-2 text-[12.5px] font-medium transition-all",
              isActive
                ? "bg-white text-amber-700 ring-1 ring-slate-200 ring-b-0 dark:bg-slate-950 dark:text-amber-400 dark:ring-slate-800"
                : disabled
                  ? "cursor-not-allowed text-slate-300 dark:text-slate-700"
                  : "text-slate-500 hover:bg-white/70 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-900/40 dark:hover:text-slate-200",
            )}
          >
            <Icon size={13} />
            <span>{tab.label}</span>
            {typeof count === "number" && count > 0 && (
              <span className={cn(
                "ml-0.5 rounded-full px-1.5 py-0 font-mono text-[10px] font-semibold tabular-nums",
                isActive
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400",
              )}>
                {count}
              </span>
            )}
            {isActive && (
              <motion.span
                layoutId="kasir-tab-underline"
                className="absolute inset-x-2 bottom-0 h-0.5 rounded-t-full bg-amber-500"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
