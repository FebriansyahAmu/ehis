"use client";

import { useState } from "react";
import { Search, Plus, Package } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { PaketLayanan } from "@/lib/master/tarifMock";
import { emptyPaket } from "@/lib/master/tarifMock";
import { STATUS_CFG, fmtIDRShort } from "./tarifShared";

interface Props {
  items:    PaketLayanan[];
  selected: PaketLayanan | null;
  onSelect: (p: PaketLayanan) => void;
  onAdd:    (p: PaketLayanan) => void;
}

export default function PaketList({ items, selected, onSelect, onAdd }: Props) {
  const [q, setQ] = useState("");

  const filtered = items.filter((p) =>
    !q || [p.nama, p.kode].some((s) => s.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Daftar Paket</span>
          <button
            onClick={() => onAdd(emptyPaket())}
            className="flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-teal-700 transition"
          >
            <Plus size={11} /> Tambah
          </button>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Cari paket..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-700 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <Package size={28} className="text-slate-300" />
            <span className="text-xs text-slate-400">Tidak ada paket</span>
          </div>
        ) : (
          filtered.map((p, i) => {
            const stsCfg   = STATUS_CFG[p.status];
            const isActive = selected?.id === p.id;

            return (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onSelect(p)}
                className={cn(
                  "w-full px-4 py-3 text-left transition hover:bg-slate-50",
                  isActive && "bg-teal-50 hover:bg-teal-50",
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                    isActive ? "bg-teal-100" : "bg-slate-100",
                  )}>
                    <Package size={13} className={isActive ? "text-teal-700" : "text-slate-500"} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <span className={cn(
                        "text-xs font-semibold leading-tight",
                        isActive ? "text-teal-700" : "text-slate-800",
                      )}>
                        {p.nama}
                      </span>
                      <span className={cn(
                        "mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                        stsCfg.bg, stsCfg.text,
                      )}>
                        {stsCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-mono text-slate-400">{p.kode}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-[10px] text-slate-500">{p.items.length} item</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-[10px] font-semibold text-teal-600">
                        Rp {fmtIDRShort(p.tarifUmum)}
                      </span>
                    </div>
                    {p.diskon && (
                      <span className="mt-1 inline-block rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                        Diskon {p.diskon}%
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>

      <div className="shrink-0 border-t border-slate-100 px-4 py-2 text-[10px] text-slate-400">
        {filtered.length} paket
      </div>
    </div>
  );
}
