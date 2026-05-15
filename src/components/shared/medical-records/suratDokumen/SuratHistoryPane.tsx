"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScrollText, Printer, Clock, ChevronDown, ChevronUp,
  FileX2, CalendarCheck, CheckCircle, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type SuratDibuat, type JenisSurat,
  SURAT_CONFIG, COLOR_MAP, fmtTanggalSurat,
} from "./suratDokumenShared";

// ── Config ────────────────────────────────────────────────

const JENIS_ICON: Record<JenisSurat, React.ElementType> = {
  "ket-sakit":     FileX2,
  "surat-kontrol": CalendarCheck,
  "ket-sehat":     CheckCircle,
  "resume-medis":  FileText,
};

// ── Sub-components ────────────────────────────────────────

function SuratCard({ surat }: { surat: SuratDibuat }) {
  const [expanded, setExpanded] = useState(false);
  const cfg    = SURAT_CONFIG[surat.jenis];
  const colors = COLOR_MAP[cfg.colorBase];
  const Icon   = JENIS_ICON[surat.jenis];

  const dataEntries = Object.entries(surat.data).filter(([, v]) => v.trim());

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
    >
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", colors.iconInactive)}>
          <Icon size={13} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-800">{cfg.label}</p>
          <p className="flex items-center gap-1 text-[11px] text-slate-400">
            <Clock size={9} className="shrink-0" />
            {fmtTanggalSurat(surat.tanggalBuat)}
            <span className="mx-0.5 text-slate-200">·</span>
            <span className="font-mono text-[10px]">{surat.nomorSurat}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
          >
            <Printer size={10} />
            Cetak
          </button>
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Expandable detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="grid gap-2 px-4 py-3 sm:grid-cols-2">
              {dataEntries.map(([key, val]) => {
                const fieldCfg = cfg.fields.find(f => f.id === key);
                return (
                  <div key={key} className={fieldCfg?.type === "textarea" ? "sm:col-span-2" : ""}>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {fieldCfg?.label ?? key}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-700 whitespace-pre-line">{val}</p>
                  </div>
                );
              })}
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Dokter Pembuat</p>
                <p className="mt-0.5 text-xs text-slate-700">{surat.dokterPembuat}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main ─────────────────────────────────────────────────

interface Props {
  riwayat: SuratDibuat[];
}

export default function SuratHistoryPane({ riwayat }: Props) {
  if (riwayat.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center"
      >
        <ScrollText size={22} className="mb-2 text-slate-200" />
        <p className="text-xs font-medium text-slate-400">Belum ada surat dibuat</p>
        <p className="mt-0.5 text-[11px] text-slate-300">Surat yang dibuat akan muncul di sini</p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <p className="px-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Riwayat Surat ({riwayat.length})
      </p>
      <AnimatePresence initial={false}>
        {riwayat.map(s => <SuratCard key={s.id} surat={s} />)}
      </AnimatePresence>
    </div>
  );
}
