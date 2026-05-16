"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { BedDouble, Package } from "lucide-react";
import type { KunjunganRecord } from "@/lib/data";
import { PindahKelas } from "./paket/PindahKelas";
import { PaketLayanan } from "./paket/PaketLayanan";

// ─── Types ────────────────────────────────────────────────────

type SubTab = "pindah-kelas" | "paket-layanan";

const SUB_TABS: { id: SubTab; label: string; icon: React.ElementType; desc: string }[] = [
  {
    id: "pindah-kelas",   label: "Pindah Kelas",   icon: BedDouble,
    desc: "Ubah kelas rawat inap pasien",
  },
  {
    id: "paket-layanan",  label: "Paket Layanan",   icon: Package,
    desc: "MCU, persalinan, bedah, dll.",
  },
];

// ─── PaketForm ────────────────────────────────────────────────

export function PaketForm({ kunjungan }: { kunjungan: KunjunganRecord }) {
  const [active, setActive] = useState<SubTab>("pindah-kelas");

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div>
        <p className="text-[13px] font-bold text-slate-800">Ubah Paket Layanan</p>
        <p className="mt-0.5 text-[11px] text-slate-400">
          Pindah kelas rawat atau ganti paket layanan untuk kunjungan ini
        </p>
      </div>

      {/* Sub-tab switcher */}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
        {SUB_TABS.map(tab => {
          const Icon     = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-all duration-200",
                isActive ? "bg-white shadow-sm" : "hover:bg-white/50",
              )}
            >
              <div className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                isActive ? "bg-sky-100" : "bg-transparent",
              )}>
                <Icon size={14} className={isActive ? "text-sky-600" : "text-slate-400"} />
              </div>
              <div className="min-w-0">
                <p className={cn(
                  "text-[12px] font-bold leading-tight transition-colors duration-200",
                  isActive ? "text-sky-700" : "text-slate-500",
                )}>
                  {tab.label}
                </p>
                <p className="truncate text-[9.5px] text-slate-400">{tab.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Content — animated on sub-tab change */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {active === "pindah-kelas"  && <PindahKelas  kunjungan={kunjungan} />}
          {active === "paket-layanan" && <PaketLayanan kunjungan={kunjungan} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
