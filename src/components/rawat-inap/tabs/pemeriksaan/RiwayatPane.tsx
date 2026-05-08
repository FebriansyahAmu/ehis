"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, ClipboardList } from "lucide-react";
import type { PemeriksaanFisikEntry } from "@/lib/data";
import { cn } from "@/lib/utils";
import { SISTEM_DEF } from "./StatusFisikPane";

// ── Types ───────────────────────────────────────────────────

interface Props {
  entries: PemeriksaanFisikEntry[];
}

// ── Helpers ─────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

const KU_COLOR: Record<string, string> = {
  Baik:   "bg-emerald-100 text-emerald-700",
  Sedang: "bg-amber-100 text-amber-700",
  Berat:  "bg-rose-100 text-rose-700",
};

const KESADARAN_COLOR: Record<string, string> = {
  Composmentis: "bg-emerald-100 text-emerald-700",
  Apatis:       "bg-amber-100 text-amber-700",
  Delirium:     "bg-amber-100 text-amber-700",
  Somnolen:     "bg-rose-100 text-rose-700",
  Sopor:        "bg-rose-100 text-rose-700",
  Koma:         "bg-rose-100 text-rose-700",
};

// ── Entry card ──────────────────────────────────────────────

function RiwayatCard({ entry, index }: { entry: PemeriksaanFisikEntry; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const [sistemExpanded, setSistemExpanded] = useState(false);

  const filledSistem = SISTEM_DEF.filter((d) => entry.sistem[d.key]?.trim());
  const abnormalCount = entry.temuanAbnormal.length;

  return (
    <motion.div
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.05 }}
    >
      {/* Header */}
      <div
        className={cn(
          "flex cursor-pointer select-none items-center gap-3 px-4 py-3 transition-colors",
          expanded ? "bg-slate-50" : "hover:bg-slate-50",
        )}
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-800">{fmtDate(entry.tanggal)}</p>
          <p className="text-[11px] text-slate-400">{entry.jam} · {entry.dokter || "—"}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", KU_COLOR[entry.ku] ?? "bg-slate-100 text-slate-600")}>
            KU {entry.ku}
          </span>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", KESADARAN_COLOR[entry.kesadaran] ?? "bg-slate-100 text-slate-600")}>
            {entry.kesadaran}
          </span>
          {abnormalCount > 0 && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
              {abnormalCount} temuan
            </span>
          )}
        </div>
        {expanded
          ? <ChevronDown size={14} className="shrink-0 text-slate-400" />
          : <ChevronRight size={14} className="shrink-0 text-slate-300" />}
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-4 py-3 space-y-3">

              {/* Status row */}
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="text-slate-500">Gizi: <strong className="text-slate-700">{entry.gizi}</strong></span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500">
                  Orientasi:{" "}
                  <strong className="text-slate-700">
                    {[
                      entry.orientasi.waktu && "Waktu",
                      entry.orientasi.tempat && "Tempat",
                      entry.orientasi.orang && "Orang",
                    ].filter(Boolean).join(", ") || "Disorientasi"}
                  </strong>
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500">Perawat: <strong className="text-slate-700">{entry.perawat || "—"}</strong></span>
              </div>

              {/* Abnormal findings chips */}
              {entry.temuanAbnormal.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Temuan Abnormal</p>
                  <div className="flex flex-wrap gap-1">
                    {entry.temuanAbnormal.map((t) => (
                      <span key={t} className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-medium capitalize text-rose-700">
                        {t.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Per-sistem accordion toggle */}
              {filledSistem.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setSistemExpanded((p) => !p)}
                    className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-indigo-600 transition hover:text-indigo-800"
                  >
                    {sistemExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    Pemeriksaan Per Sistem ({filledSistem.length} sistem)
                  </button>
                  <AnimatePresence>
                    {sistemExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 flex flex-col gap-1.5">
                          {filledSistem.map((def) => (
                            <div key={def.key} className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">{def.label}</p>
                              <p className="text-[11px] leading-relaxed text-slate-600">{entry.sistem[def.key]}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Catatan umum */}
              {entry.catatanUmum && (
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Catatan Umum</p>
                  <p className="text-[11px] leading-relaxed text-slate-600">{entry.catatanUmum}</p>
                </div>
              )}

              {/* Body markings */}
              {entry.bodyMarkings.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Penandaan Tubuh</p>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.bodyMarkings.map((m) => (
                      <span key={m.region} className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] text-rose-700 ring-1 ring-rose-200">
                        {m.label}{m.catatan ? `: ${m.catatan}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main ────────────────────────────────────────────────────

export default function RiwayatPane({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-20 text-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <ClipboardList size={24} className="text-slate-300" />
        </div>
        <p className="text-sm font-semibold text-slate-400">Belum ada riwayat pemeriksaan</p>
        <p className="mt-1 max-w-[200px] text-xs leading-relaxed text-slate-400">
          Simpan pemeriksaan fisik dari tab Pemeriksaan untuk menambah riwayat
        </p>
      </motion.div>
    );
  }

  const sorted = [...entries].sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  return (
    <div className="flex flex-col gap-2.5">
      {sorted.map((entry, idx) => (
        <RiwayatCard key={entry.id} entry={entry} index={idx} />
      ))}
    </div>
  );
}
