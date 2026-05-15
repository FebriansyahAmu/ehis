"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollText, FileX2, CalendarCheck, CheckCircle, FileText, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  type JenisSurat, type SuratPatient, type SuratDibuat,
  SURAT_CONFIG, COLOR_MAP,
} from "./suratDokumen/suratDokumenShared";
import SuratFormPane    from "./suratDokumen/SuratFormPane";
import SuratHistoryPane from "./suratDokumen/SuratHistoryPane";

// ── Types ─────────────────────────────────────────────────

interface Props {
  patient:          SuratPatient;
  initialRiwayat?:  SuratDibuat[];
}

// ── Jenis list ────────────────────────────────────────────

const JENIS_LIST: { id: JenisSurat; icon: LucideIcon }[] = [
  { id: "ket-sakit",     icon: FileX2        },
  { id: "surat-kontrol", icon: CalendarCheck },
  { id: "ket-sehat",     icon: CheckCircle   },
  { id: "resume-medis",  icon: FileText      },
];

// ── Type selector card ────────────────────────────────────

function JenisCard({
  id, icon: Icon, active, onClick,
}: {
  id:      JenisSurat;
  icon:    LucideIcon;
  active:  boolean;
  onClick: () => void;
}) {
  const cfg    = SURAT_CONFIG[id];
  const colors = COLOR_MAP[cfg.colorBase];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "flex flex-col gap-2.5 rounded-xl border-2 p-4 text-left shadow-sm transition-all duration-200",
        active
          ? cn(colors.cardActive, "shadow-md")
          : cn(colors.cardInactive, "shadow-xs hover:shadow-sm"),
      )}
    >
      <span className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
        active ? colors.iconActive : colors.iconInactive,
      )}>
        <Icon size={16} />
      </span>

      <div>
        <p className={cn(
          "text-[12px] font-bold leading-snug transition-colors",
          active ? colors.textActive : "text-slate-700",
        )}>
          {cfg.label}
        </p>
        <p className={cn(
          "mt-0.5 text-[10px] leading-snug transition-colors",
          active ? colors.subActive : "text-slate-400",
        )}>
          {cfg.description}
        </p>
      </div>
    </motion.button>
  );
}

// ── Main ─────────────────────────────────────────────────

export default function SuratDokumenTab({ patient, initialRiwayat = [] }: Props) {
  const [selected, setSelected] = useState<JenisSurat | null>(null);
  const [riwayat,  setRiwayat]  = useState<SuratDibuat[]>(initialRiwayat);

  function handleSelect(id: JenisSurat) {
    setSelected(prev => prev === id ? null : id);
  }

  function handleSubmit(surat: SuratDibuat) {
    setRiwayat(prev => [surat, ...prev]);
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
        <ScrollText size={16} className="text-indigo-500" />
        <span className="text-sm font-semibold text-slate-700">Surat & Dokumen</span>
        <span className="text-slate-300">·</span>
        <span className="text-xs text-slate-400">PMK 269/2008</span>
        {riwayat.length > 0 && (
          <motion.span
            key={riwayat.length}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="ml-auto rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700"
          >
            {riwayat.length} surat dibuat
          </motion.span>
        )}
      </div>

      {/* Jenis surat selector (2-col mobile → 4-col desktop) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {JENIS_LIST.map(({ id, icon }) => (
          <JenisCard
            key={id}
            id={id}
            icon={icon}
            active={selected === id}
            onClick={() => handleSelect(id)}
          />
        ))}
      </div>

      {/* Content: form + history */}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">

        {/* Form area */}
        <AnimatePresence mode="wait">
          {selected ? (
            <SuratFormPane
              key={selected}
              jenis={selected}
              patient={patient}
              onSubmit={handleSubmit}
            />
          ) : (
            <motion.div
              key="prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center"
            >
              <ScrollText size={28} className="mb-3 text-slate-200" />
              <p className="text-sm font-medium text-slate-400">Pilih jenis surat di atas</p>
              <p className="mt-1 text-xs text-slate-300">untuk mulai mengisi formulir</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        <SuratHistoryPane riwayat={riwayat} />
      </div>

    </div>
  );
}
