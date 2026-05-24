"use client";

import { motion } from "framer-motion";
import { ListChecks, Wallet, ShieldCheck, History } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvoiceDetail } from "./invoiceShared";

export type InvoiceTabKey = "rincian" | "pembayaran" | "klaim" | "riwayat";

interface TabDef {
  key: InvoiceTabKey;
  label: string;
  icon: typeof ListChecks;
  hint?: string;
  hideForUmum?: boolean;
}

const TABS: TabDef[] = [
  { key: "rincian",    label: "Rincian Charge", icon: ListChecks },
  { key: "pembayaran", label: "Pembayaran",     icon: Wallet     },
  { key: "klaim",      label: "Klaim Penjamin", icon: ShieldCheck, hideForUmum: true, hint: "BPJS / Asuransi / Jamkesda" },
  { key: "riwayat",    label: "Riwayat Audit",  icon: History    },
];

interface Props {
  detail: InvoiceDetail;
  active: InvoiceTabKey;
  onChange: (key: InvoiceTabKey) => void;
  // BL2.2 counts (preview)
  itemCount?: number;
}

export default function InvoiceTabs({ detail, active, onChange, itemCount }: Props) {
  const visibleTabs = TABS.filter((t) => !(t.hideForUmum && detail.penjamin.tipe === "umum"));

  return (
    <nav
      aria-label="Tab Invoice Detail"
      className="flex flex-wrap items-end gap-0.5 border-b border-slate-200 bg-slate-50/40 px-4 pt-2 dark:border-slate-800 dark:bg-slate-900/40"
    >
      {visibleTabs.map((tab) => {
        const isActive = active === tab.key;
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            aria-pressed={isActive}
            title={tab.hint}
            className={cn(
              "group relative inline-flex items-center gap-1.5 rounded-t-md px-3 py-2 text-[12.5px] font-medium transition-all",
              isActive
                ? "bg-white text-amber-700 ring-1 ring-slate-200 ring-b-0 dark:bg-slate-950 dark:text-amber-400 dark:ring-slate-800"
                : "text-slate-500 hover:bg-white/70 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-900/40 dark:hover:text-slate-200",
            )}
          >
            <Icon size={13} />
            <span>{tab.label}</span>
            {tab.key === "rincian" && typeof itemCount === "number" && (
              <span className={cn(
                "ml-0.5 rounded-full px-1.5 py-0 font-mono text-[10px] font-semibold tabular-nums",
                isActive
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400",
              )}>
                {itemCount}
              </span>
            )}
            {isActive && (
              <motion.span
                layoutId="invoice-tab-underline"
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
