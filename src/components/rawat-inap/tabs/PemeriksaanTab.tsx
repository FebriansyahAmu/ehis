"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, MapPin, History } from "lucide-react";
import type { RawatInapPatientDetail, PemeriksaanFisikEntry } from "@/lib/data";
import { cn } from "@/lib/utils";

import StatusFisikPane, { type PemeriksaanFormState, emptyFormState } from "@/components/shared/medical-records/pemeriksaan/StatusFisikPane";
import BodyMapPane from "./pemeriksaan/BodyMapPane";
import RiwayatPane from "./pemeriksaan/RiwayatPane";

// ── Types ───────────────────────────────────────────────────

type SubTab = "fisik" | "bodymap" | "riwayat";

const SUB_TABS: { id: SubTab; label: string; Icon: React.ElementType }[] = [
  { id: "fisik",    label: "Pemeriksaan Fisik",  Icon: ScanLine  },
  { id: "bodymap",  label: "Penandaan Tubuh",    Icon: MapPin    },
  { id: "riwayat",  label: "Riwayat",            Icon: History   },
];

function genId() { return `pf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

// ── Metadata header ─────────────────────────────────────────

function MetaHeader({
  tanggal, jam, dokter, perawat,
  onChange,
}: {
  tanggal: string; jam: string; dokter: string; perawat: string;
  onChange: (field: "tanggal" | "jam" | "dokter" | "perawat", v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs sm:grid-cols-4">
      {([
        { id: "tanggal", label: "Tanggal",          type: "date"   },
        { id: "jam",     label: "Jam",              type: "time"   },
        { id: "dokter",  label: "Dokter Pemeriksa", type: "text"   },
        { id: "perawat", label: "Perawat",          type: "text"   },
      ] as const).map(({ id, label, type }) => (
        <div key={id}>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <input
            type={type}
            value={id === "tanggal" ? tanggal : id === "jam" ? jam : id === "dokter" ? dokter : perawat}
            onChange={(e) => onChange(id, e.target.value)}
            placeholder={type === "text" ? "—" : undefined}
            className="w-full border-b border-slate-200 bg-transparent py-1 text-xs font-medium text-slate-700 placeholder:text-slate-300 outline-none focus:border-indigo-400"
          />
        </div>
      ))}
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────

export default function PemeriksaanTab({ patient }: { patient: RawatInapPatientDetail }) {
  const [entries, setEntries] = useState<PemeriksaanFisikEntry[]>(
    patient.pemeriksaanFisik ?? []
  );
  const [active, setActive] = useState<SubTab>("fisik");

  const [meta, setMeta] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    jam:     new Date().toTimeString().slice(0, 5),
    dokter:  patient.dpjp,
    perawat: "",
  });

  const [formState, setFormState] = useState<PemeriksaanFormState>(() => ({
    ...emptyFormState(),
    tanggal: meta.tanggal,
    jam:     meta.jam,
    dokter:  meta.dokter,
    perawat: meta.perawat,
  }));

  function handleMetaChange(field: "tanggal" | "jam" | "dokter" | "perawat", v: string) {
    setMeta((p) => ({ ...p, [field]: v }));
    setFormState((p) => ({ ...p, [field]: v }));
  }

  function handleBodyMarkChange(markings: PemeriksaanFisikEntry["bodyMarkings"]) {
    setFormState((p) => ({ ...p, bodyMarkings: markings }));
  }

  function handleSave(data: PemeriksaanFormState) {
    const newEntry: PemeriksaanFisikEntry = { id: genId(), ...data };
    setEntries((p) => [...p, newEntry]);
    setActive("riwayat");
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
        <ScanLine size={16} className="text-indigo-500" />
        <span className="text-sm font-semibold text-slate-700">Pemeriksaan Fisik</span>
        <span className="text-slate-300">·</span>
        <span className="text-xs text-slate-400">Head-to-toe · SNARS AP 1</span>
        {entries.length > 0 && (
          <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
            {entries.length} riwayat
          </span>
        )}
      </div>

      {/* Metadata header — always visible */}
      <MetaHeader
        tanggal={meta.tanggal}
        jam={meta.jam}
        dokter={meta.dokter}
        perawat={meta.perawat}
        onChange={handleMetaChange}
      />

      {/* Sub-tab nav */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex overflow-x-auto">
          {SUB_TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={cn(
                "relative flex shrink-0 cursor-pointer items-center gap-1.5 px-4 py-3 text-xs font-medium transition-colors",
                active === id ? "text-indigo-700" : "text-slate-500 hover:text-slate-700",
              )}
            >
              <Icon size={13} aria-hidden />
              {label}
              {id === "riwayat" && entries.length > 0 && (
                <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                  {entries.length}
                </span>
              )}
              {active === id && (
                <motion.div
                  layoutId="pemfis-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.14 }}
        >
          {active === "fisik" && (
            <StatusFisikPane
              initial={formState}
              onSave={handleSave}
            />
          )}

          {active === "bodymap" && (
            <BodyMapPane
              value={formState.bodyMarkings}
              onChange={handleBodyMarkChange}
            />
          )}

          {active === "riwayat" && (
            <RiwayatPane entries={entries} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
