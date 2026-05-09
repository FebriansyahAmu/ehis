"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, BarChart2, History, Droplets } from "lucide-react";
import type { IOEntry, IOTargetDPJP, RawatInapPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";

import EntriPane    from "./intakeOutput/EntriPane";
import RingkasanPane from "./intakeOutput/RingkasanPane";
import RiwayatPane  from "./intakeOutput/RiwayatPane";

// ── Sub-tab definition ───────────────────────────────────────

type SubTab = "entri" | "ringkasan" | "riwayat";

const SUB_TABS: { id: SubTab; label: string; Icon: React.ElementType }[] = [
  { id: "entri",     label: "Entri",     Icon: Plus      },
  { id: "ringkasan", label: "Ringkasan", Icon: BarChart2  },
  { id: "riwayat",   label: "Riwayat",   Icon: History    },
];

// ── Helpers ──────────────────────────────────────────────────

function genId(): string {
  return `io-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── Main ─────────────────────────────────────────────────────

export default function IntakeOutputTab({ patient }: { patient: RawatInapPatientDetail }) {
  const [active,     setActive]     = useState<SubTab>("entri");
  const [entries,    setEntries]    = useState<IOEntry[]>(patient.intakeOutput?.entries ?? []);
  const [targetDPJP, setTargetDPJP] = useState<IOTargetDPJP | undefined>(patient.intakeOutput?.targetDPJP);

  const today        = new Date().toISOString().slice(0, 10);
  const todayEntries = entries.filter((e) => e.tanggal === today);
  const totalEntries = entries.length;

  function handleAdd(entry: Omit<IOEntry, "id">) {
    setEntries((prev) => [...prev, { id: genId(), ...entry }]);
  }

  function handleRemove(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="flex flex-col gap-3">

      {/* ── Header bar ── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
        <Droplets size={16} className="text-sky-500" />
        <span className="text-sm font-semibold text-slate-700">Intake / Output</span>
        <span className="text-slate-300">·</span>
        <span className="text-xs text-slate-400">Balance Cairan · SNARS PP</span>
        {totalEntries > 0 && (
          <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
            {totalEntries} entri
          </span>
        )}
      </div>

      {/* ── Sub-tab nav ── */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex overflow-x-auto">
          {SUB_TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={cn(
                "relative flex shrink-0 cursor-pointer items-center gap-1.5 px-5 py-3 text-xs font-medium transition-colors",
                active === id ? "text-indigo-700" : "text-slate-500 hover:text-slate-700",
              )}
            >
              <Icon size={13} aria-hidden />
              {label}
              {id === "entri" && todayEntries.length > 0 && (
                <span className="ml-1 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">
                  {todayEntries.length}
                </span>
              )}
              {id === "riwayat" && totalEntries > 0 && (
                <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                  {totalEntries}
                </span>
              )}
              {active === id && (
                <motion.div
                  layoutId="io-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.14 }}
        >
          {active === "entri" && (
            <EntriPane
              todayEntries={todayEntries}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          )}

          {active === "ringkasan" && (
            <RingkasanPane
              entries={entries}
              patient={patient}
              targetDPJP={targetDPJP}
              onTargetChange={setTargetDPJP}
            />
          )}

          {active === "riwayat" && (
            <RiwayatPane
              entries={entries}
              patient={patient}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
