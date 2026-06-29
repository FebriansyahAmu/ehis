"use client";

// Panel "Informasi Tempat Tidur" RI — ringkasan SELALU TAMPIL (bukan collapse). Menampilkan
// okupansi per-kelas (dari master bed + alokasi nyata) + BOR, dengan tombol membuka peta bed
// informatif (RIBedMapModal, read-only). Menggantikan panel collapse lama.

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { BedDouble, LayoutGrid, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RIKelas } from "@/lib/data";
import {
  type BedItem, RI_KELAS_CFG, RI_KELAS_ORDER, countBeds,
} from "./riLandingShared";
import { RIBedMapModal } from "./RIBedMapModal";

function borTone(bor: number): { bar: string; text: string } {
  if (bor >= 85) return { bar: "bg-rose-500", text: "text-rose-600" };
  if (bor >= 60) return { bar: "bg-amber-400", text: "text-amber-600" };
  return { bar: "bg-emerald-500", text: "text-emerald-600" };
}

export function RIBedInfoPanel({ items }: { items: BedItem[] }) {
  // null = tertutup · "Semua" = peta penuh · RIKelas = peta pra-filter ke kelas itu.
  const [open, setOpen] = useState<RIKelas | "Semua" | null>(null);

  const total = useMemo(() => countBeds(items), [items]);

  // Per-kelas (hanya kelas yang punya bed), urut prioritas.
  const perKelas = useMemo(() => {
    const map = new Map<RIKelas, BedItem[]>();
    for (const it of items) {
      const arr = map.get(it.kelas) ?? [];
      arr.push(it);
      map.set(it.kelas, arr);
    }
    return RI_KELAS_ORDER.filter((k) => map.has(k)).map((k) => ({ kelas: k, counts: countBeds(map.get(k)!) }));
  }, [items]);

  const tone = borTone(total.bor);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <BedDouble size={14} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-700">Informasi Tempat Tidur</p>
              <p className="text-[10px] text-slate-400">
                <span className="font-black tabular-nums text-slate-700">{total.occupied + total.reserved}</span>
                <span className="text-slate-400">/{total.total}</span> terisi ·{" "}
                <span className="font-semibold text-emerald-600">{total.available} tersedia</span>
                {total.reserved > 0 && <> · <span className="font-semibold text-amber-600">{total.reserved} dipesan</span></>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">BOR</span>
              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
                <div className={cn("h-full rounded-full transition-all duration-700", tone.bar)} style={{ width: `${total.bor}%` }} />
              </div>
              <span className={cn("text-sm font-black tabular-nums", tone.text)}>{total.bor}%</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen("Semua")}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
            >
              <LayoutGrid size={14} /> Peta Tempat Tidur
            </button>
          </div>
        </div>

        {/* Ringkasan per kelas — selalu tampil (grid) */}
        {perKelas.length === 0 ? (
          <div className="flex items-center gap-2 px-5 py-4 text-[12px] text-slate-400">
            <AlertTriangle size={13} className="text-amber-500" /> Belum ada tempat tidur rawat inap di master.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {perKelas.map(({ kelas, counts }) => {
              const cfg = RI_KELAS_CFG[kelas];
              const KIcon = cfg.icon;
              const pct = counts.active === 0 ? 0 : (counts.occupied + counts.reserved) / counts.active;
              const barCls = pct >= 0.85 ? "bg-rose-500" : pct >= 0.6 ? "bg-amber-400" : "bg-emerald-500";
              return (
                <button
                  key={kelas}
                  type="button"
                  onClick={() => setOpen(kelas)}
                  title={`Lihat tempat tidur ${cfg.label}`}
                  className="group flex flex-col gap-2 bg-white px-3.5 py-3 text-left transition hover:bg-slate-50"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={cn("flex h-5 w-5 items-center justify-center rounded-md text-white", cfg.header)}>
                      <KIcon size={11} />
                    </span>
                    <span className="text-[11px] font-bold text-slate-700">{cfg.label}</span>
                    {cfg.pulse && counts.occupied > 0 && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-rose-500" />
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base font-black tabular-nums text-slate-800">{counts.available}</span>
                    <span className="text-[10px] text-slate-400">tersedia</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={cn("h-full rounded-full transition-all duration-500", barCls)} style={{ width: `${pct * 100}%` }} />
                  </div>
                  <p className="text-[9px] text-slate-400">
                    <span className="font-bold text-slate-600">{counts.occupied + counts.reserved}</span>/{counts.active} terisi
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {open !== null && (
          <RIBedMapModal items={items} initialKelas={open} onClose={() => setOpen(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
