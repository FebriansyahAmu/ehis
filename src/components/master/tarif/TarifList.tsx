"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TarifRecord, KategoriTarif } from "@/lib/master/tarifMock";
import { emptyTarif } from "@/lib/master/tarifMock";
import { KATEGORI_CFG, STATUS_CFG, fmtIDRShort } from "./tarifShared";

const ALL = "Semua" as const;
type FilterKat = KategoriTarif | typeof ALL;

interface Props {
  items:      TarifRecord[];
  selected:   TarifRecord | null;
  onSelect:   (r: TarifRecord) => void;
  onAdd:      (r: TarifRecord) => void;
}

export default function TarifList({ items, selected, onSelect, onAdd }: Props) {
  const [q,      setQ]      = useState("");
  const [filter, setFilter] = useState<FilterKat>(ALL);

  const filtered = items.filter((r) => {
    const matchQ = !q || [r.nama, r.kode, r.kategori]
      .some((s) => s.toLowerCase().includes(q.toLowerCase()));
    const matchF = filter === ALL || r.kategori === filter;
    return matchQ && matchF;
  });

  const categories: FilterKat[] = [ALL, "Jasa Dokter", "Tindakan Medis", "Laboratorium",
    "Radiologi", "Kamar Rawat", "Ambulans", "Lainnya"];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Daftar Tarif</span>
          <button
            onClick={() => onAdd(emptyTarif())}
            className="flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-teal-700 transition"
          >
            <Plus size={11} /> Tambah
          </button>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama atau kode..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-700 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 placeholder:text-slate-400"
          />
        </div>
        {/* Category filter pills */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {categories.map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition",
                filter === k
                  ? "border-teal-500 bg-teal-50 text-teal-700"
                  : "border-slate-200 bg-white text-slate-500 hover:border-teal-300 hover:text-teal-600",
              )}
            >
              {k === ALL ? "Semua" : KATEGORI_CFG[k as KategoriTarif]?.short ?? k}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <span className="text-xs text-slate-400">Tidak ada tarif ditemukan</span>
          </div>
        ) : (
          filtered.map((r, i) => {
            const cfg    = KATEGORI_CFG[r.kategori];
            const stsCfg = STATUS_CFG[r.status];
            const Icon   = cfg.icon;
            const isActive = selected?.id === r.id;

            return (
              <motion.button
                key={r.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onSelect(r)}
                className={cn(
                  "w-full px-4 py-2.5 text-left transition hover:bg-slate-50",
                  isActive && "bg-teal-50 hover:bg-teal-50",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", cfg.bg)}>
                    <Icon size={13} className={cfg.text} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className={cn("truncate text-xs font-semibold", isActive ? "text-teal-700" : "text-slate-800")}>
                        {r.nama}
                      </span>
                      <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold", stsCfg.bg, stsCfg.text)}>
                        {stsCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-mono text-slate-400">{r.kode}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-[10px] font-semibold text-teal-600">
                        Rp {fmtIDRShort(r.tarifUmum)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>

      {/* Footer count */}
      <div className="shrink-0 border-t border-slate-100 px-4 py-2 text-[10px] text-slate-400">
        {filtered.length} dari {items.length} tarif
      </div>
    </div>
  );
}
