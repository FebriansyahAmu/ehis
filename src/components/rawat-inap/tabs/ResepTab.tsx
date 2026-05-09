"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pill, CalendarCheck, RefreshCw } from "lucide-react";
import type { RawatInapPatientDetail, ResepRIItem, MAREntry, RekonsiliasItem } from "@/lib/data";
import { cn } from "@/lib/utils";

import ResepPane       from "./resep/ResepPane";
import MARPane         from "./resep/MARPane";
import RekonsiliasiPane from "./resep/RekonsiliasiPane";

// ── Sub-tab definition ───────────────────────────────────

type SubTab = "resep" | "mar" | "rekonsiliasi";

const SUB_TABS: { id: SubTab; label: string; Icon: React.ElementType }[] = [
  { id: "resep",        label: "Resep Aktif",   Icon: Pill         },
  { id: "mar",          label: "MAR Harian",    Icon: CalendarCheck },
  { id: "rekonsiliasi", label: "Rekonsiliasi",  Icon: RefreshCw    },
];

// ── Main ─────────────────────────────────────────────────

export default function ResepTab({ patient }: { patient: RawatInapPatientDetail }) {
  const [active,        setActive]        = useState<SubTab>("resep");
  const [items,         setItems]         = useState<ResepRIItem[]>(patient.resepRI?.items ?? []);
  const [marEntries,    setMarEntries]    = useState<MAREntry[]>(patient.resepRI?.mar ?? []);
  const [rekonsiliasi,  setRekonsiliasi]  = useState<RekonsiliasItem[]>(patient.resepRI?.rekonsiliasi ?? []);

  const activeItems = items.filter((i) => i.aktif);

  function handleSendOrder(draft: ResepRIItem[])      { setItems((p) => [...draft, ...p]); }
  function handleToggleAktif(id: string)              { setItems((p) => p.map((i) => i.id === id ? { ...i, aktif: !i.aktif } : i)); }
  function handleAddMAR(entry: MAREntry)              { setMarEntries((p) => [...p, entry]); }
  function handleUpdateMAR(entry: MAREntry)           { setMarEntries((p) => p.map((e) => e.id === entry.id ? entry : e)); }
  function handleUpdateRekonsiliasi(updated: RekonsiliasItem) {
    setRekonsiliasi((p) => p.map((r) => r.id === updated.id ? updated : r));
  }
  function handleAddRekonsiliasi(item: RekonsiliasItem) { setRekonsiliasi((p) => [...p, item]); }

  return (
    <div className="flex flex-col gap-3">

      {/* ── Header bar ── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
        <Pill size={16} className="text-indigo-500" />
        <span className="text-sm font-semibold text-slate-700">Resep & Obat</span>
        <span className="text-slate-300">·</span>
        <span className="text-xs text-slate-400">Rawat Inap · SNARS PP 3.1 · PMK 72/2016</span>
        {activeItems.length > 0 && (
          <span className="ml-auto rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
            {activeItems.length} obat aktif
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
              {id === "resep" && activeItems.length > 0 && (
                <span className="ml-1 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                  {activeItems.length}
                </span>
              )}
              {id === "mar" && marEntries.length > 0 && (
                <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                  {marEntries.length}
                </span>
              )}
              {active === id && (
                <motion.div
                  layoutId="resep-underline"
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
          {active === "resep" && (
            <ResepPane
              patient={patient}
              items={items}
              onSend={handleSendOrder}
              onToggleAktif={handleToggleAktif}
            />
          )}
          {active === "mar" && (
            <MARPane
              items={items}
              marEntries={marEntries}
              patient={patient}
              onAdd={handleAddMAR}
              onUpdate={handleUpdateMAR}
            />
          )}
          {active === "rekonsiliasi" && (
            <RekonsiliasiPane
              rekonsiliasi={rekonsiliasi}
              patient={patient}
              onUpdate={handleUpdateRekonsiliasi}
              onAdd={handleAddRekonsiliasi}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
