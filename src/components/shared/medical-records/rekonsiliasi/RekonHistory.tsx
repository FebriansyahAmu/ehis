"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History, ChevronRight, AlertTriangle, Check, Pill, Loader2, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RekonsiliasiDTO } from "@/lib/api/rekonsiliasi/rekonsiliasi";
import { KEPUTUSAN_CFG, type Keputusan } from "./rekonsiliasiShared";

// Fase → label + warna (lintas-konteks; tak bergantung igd/ri).
const FASE_CFG: Record<string, { label: string; cls: string; dot: string }> = {
  admisi:    { label: "Admisi",    cls: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",   dot: "bg-indigo-400" },
  transfer:  { label: "Transfer",  cls: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",            dot: "bg-sky-400" },
  discharge: { label: "Discharge", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-400" },
};

function fmtWaktu(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

interface Props {
  history: RekonsiliasiDTO[];
  isPersisted: boolean;
  loading: boolean;
}

export default function RekonHistory({ history, isPersisted, loading }: Props) {
  if (!isPersisted) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Riwayat tidak tersedia (mode demo)"
        desc="Rekonsiliasi pasien contoh tidak dipersist. Buka dari pasien terdaftar untuk melihat riwayat tersimpan."
      />
    );
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-12 text-slate-400">
        <Loader2 size={15} className="animate-spin text-indigo-500" />
        <span className="text-xs">Memuat riwayat rekonsiliasi…</span>
      </div>
    );
  }
  if (history.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Belum ada rekonsiliasi tersimpan"
        desc="Setiap kali Anda menyimpan rekonsiliasi (Admisi / Transfer / Discharge), snapshot-nya muncul di sini sebagai jejak audit."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-1">
        <History size={13} className="text-indigo-500" />
        <span className="text-xs font-semibold text-slate-700">Riwayat Rekonsiliasi</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
          {history.length} catatan
        </span>
      </div>
      {history.map((r, i) => (
        <HistoryCard key={r.id} rekon={r} index={i} />
      ))}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────

function HistoryCard({ rekon, index }: { rekon: RekonsiliasiDTO; index: number }) {
  const [open, setOpen] = useState(false);
  const fase = FASE_CFG[rekon.fase] ?? { label: rekon.fase, cls: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };
  const hamCount = rekon.obatList.filter((o) => o.isHAM).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.2) }}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50/80"
      >
        <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold", fase.cls)}>{fase.label}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-800">{fmtWaktu(rekon.waktu)}</p>
          <p className="truncate text-[11px] text-slate-400">{rekon.petugas}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {hamCount > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
              <AlertTriangle size={8} />{hamCount} HAM
            </span>
          )}
          <span className="flex items-center gap-0.5 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
            <Pill size={8} />{rekon.obatList.length}
          </span>
          {rekon.selesai && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check size={10} />
            </span>
          )}
          <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.18 }}>
            <ChevronRight size={14} className="text-slate-400" />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.04, 0.62, 0.23, 0.98] }}
            style={{ overflow: "hidden" }}
          >
            <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-3">
              {rekon.obatList.length === 0 ? (
                <p className="py-2 text-center text-[11px] text-slate-400">Tidak ada obat dicatat</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {rekon.obatList.map((o) => {
                    const cfg = KEPUTUSAN_CFG[o.keputusan as Keputusan] ?? KEPUTUSAN_CFG.Lanjut;
                    return (
                      <div key={o.id} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-1.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-xs font-semibold text-slate-800">{o.namaObat}</span>
                            {o.isHAM && (
                              <span className="rounded bg-red-600 px-1 py-0 text-[9px] font-black uppercase tracking-wide text-white">HAM</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {[o.dosis, o.rute, o.frekuensi, o.sumber && `dari ${o.sumber}`].filter(Boolean).join(" · ") || "—"}
                            {o.keputusan === "Sesuaikan" && o.gantiDengan ? ` → ${o.gantiDengan}` : ""}
                          </p>
                        </div>
                        <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold", cfg.cls)}>
                          {o.keputusan}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              {rekon.catatan && (
                <p className="mt-2 rounded-lg bg-white px-3 py-1.5 text-[11px] text-slate-600 ring-1 ring-slate-100">
                  <span className="font-semibold text-slate-500">Catatan:</span> {rekon.catatan}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EmptyState({ icon: Icon, title, desc }: { icon: typeof History; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <Icon size={22} className="text-slate-300" />
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      <p className="max-w-sm text-[11px] text-slate-400">{desc}</p>
    </div>
  );
}
