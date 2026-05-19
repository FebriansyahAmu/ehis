"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Package, Warehouse, AlertTriangle, Search, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type ObatKategori, OBAT_KATEGORI_CFG, KATEGORI_OBAT_ORDER,
} from "@/lib/master/obatMock";
import { DEPO_TIPE_CFG } from "@/lib/master/depoMock";
import {
  type DistribusiMap,
  getObatList, getDepoList, initDistribusiMap, toggleStock, calcStats,
} from "./distribusiShared";
import DistribusiMatrix from "./DistribusiMatrix";

export default function DistribusiPane() {
  const allObat = useMemo(() => getObatList(), []);
  const allDepo = useMemo(() => getDepoList(), []);
  const [map, setMap] = useState<DistribusiMap>(() => initDistribusiMap(allObat, allDepo));
  const [activeDepoId, setActiveDepoId] = useState<string | "all">("all");
  const [search, setSearch] = useState("");
  const [visibleKategori, setVisibleKategori] = useState<Set<ObatKategori>>(
    () => new Set(KATEGORI_OBAT_ORDER),
  );

  const visibleDepo = useMemo(
    () => activeDepoId === "all" ? allDepo : allDepo.filter((d) => d.id === activeDepoId),
    [allDepo, activeDepoId],
  );

  const filteredObat = useMemo(() => {
    if (!search.trim()) return allObat;
    const q = search.toLowerCase();
    return allObat.filter((o) =>
      o.namaGenerik.toLowerCase().includes(q) ||
      o.namaDagang.toLowerCase().includes(q) ||
      o.kode.toLowerCase().includes(q),
    );
  }, [allObat, search]);

  const aggregateStats = useMemo(() => {
    let kritis = 0, rendah = 0, totalItems = 0;
    for (const d of visibleDepo) {
      const s = calcStats(map, d.id);
      kritis += s.kritis;
      rendah += s.rendah;
      totalItems += s.totalItems;
    }
    return { kritis, rendah, totalItems };
  }, [map, visibleDepo]);

  const handleToggleStock = (obatId: string, depoId: string) => {
    setMap((prev) => toggleStock(prev, depoId, obatId));
  };

  const handleResetDefault = () => {
    if (!confirm("Reset distribusi obat ke default berdasarkan tipe depo?")) return;
    setMap(initDistribusiMap(allObat, allDepo));
  };

  const toggleKategoriVisibility = (cat: ObatKategori) => {
    setVisibleKategori((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <PaneHeader
        stats={aggregateStats}
        totalObat={allObat.length}
        totalDepo={allDepo.length}
      />

      {/* Depo Tabs */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.03 }}
        className="shrink-0 overflow-x-auto rounded-2xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm"
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveDepoId("all")}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 m-xs font-semibold transition",
              activeDepoId === "all"
                ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                : "text-slate-500 hover:bg-slate-50",
            )}
          >
            <div className="flex items-center gap-1.5">
              <Warehouse size={11} />
              <span>Semua Depo</span>
              <span className="rounded bg-white/60 px-1 m-mini font-mono">{allDepo.length}</span>
            </div>
          </button>
          <span className="h-5 w-px bg-slate-200" />
          {allDepo.map((d) => {
            const cfg = DEPO_TIPE_CFG[d.tipe];
            const active = d.id === activeDepoId;
            const s = calcStats(map, d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setActiveDepoId(d.id)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 m-xs font-semibold transition",
                  active
                    ? cn(cfg.bg, cfg.text, "ring-1 ring-rose-200")
                    : "text-slate-500 hover:bg-slate-50",
                )}
                title={`${d.nama} — PIC: ${d.pic}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
                  <span>{d.kode}</span>
                  {(s.kritis > 0) && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-rose-100 px-1 m-mini font-bold text-rose-700">
                      <AlertTriangle size={9} />
                      {s.kritis}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
      >
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari obat / kode / merk..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 m-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
            />
          </div>
          <button
            type="button"
            onClick={handleResetDefault}
            className="flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 m-mini font-semibold text-rose-700 transition hover:bg-rose-50"
          >
            <RotateCcw size={10} />
            Reset Default
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1">
          <span className="m-mini font-semibold uppercase tracking-wide text-slate-400">Kategori:</span>
          {KATEGORI_OBAT_ORDER.map((cat) => {
            const cfg = OBAT_KATEGORI_CFG[cat];
            const active = visibleKategori.has(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleKategoriVisibility(cat)}
                className={cn(
                  "rounded-md border px-1.5 py-0.5 m-mini font-semibold transition",
                  active
                    ? cn("border-transparent", cfg.bg, cfg.text)
                    : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50",
                )}
              >
                {cfg.short}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setVisibleKategori(new Set(KATEGORI_OBAT_ORDER))}
            className="ml-1 rounded-md px-1.5 py-0.5 m-mini font-semibold text-rose-700 hover:bg-rose-50"
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setVisibleKategori(new Set())}
            className="rounded-md px-1.5 py-0.5 m-mini font-semibold text-slate-500 hover:bg-slate-100"
          >
            Kosong
          </button>
        </div>
      </motion.div>

      {/* Matrix */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <DistribusiMatrix
          obat={filteredObat}
          depo={visibleDepo}
          map={map}
          visibleKategori={visibleKategori}
          onToggleStock={handleToggleStock}
        />
      </motion.div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────

function PaneHeader({
  stats, totalObat, totalDepo,
}: {
  stats: { kritis: number; rendah: number; totalItems: number };
  totalObat: number;
  totalDepo: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="m-base font-bold text-slate-900">Distribusi Obat ↔ Depo</h2>
          <p className="mt-0.5 m-tiny text-slate-500">
            Pilih depo di atas → toggle ketersediaan obat. Sel berwarna menampilkan stok current vs kapasitas;
            kritis = pesan ulang segera.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Stat icon={Package}        label="Obat"      value={`${totalObat}`}        cls="bg-rose-50 text-rose-600" />
          <Stat icon={Warehouse}      label="Depo"      value={`${totalDepo}`}        cls="bg-violet-50 text-violet-600" />
          <Stat icon={AlertTriangle}  label="Kritis"    value={`${stats.kritis}`}     cls={stats.kritis > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-50 text-emerald-600"} />
        </div>
      </div>
    </motion.div>
  );
}

function Stat({
  icon: Icon, label, value, cls,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  cls: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
      <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", cls)}>
        <Icon size={12} />
      </span>
      <div>
        <p className="m-mini font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="m-base font-black leading-none text-slate-900">{value}</p>
      </div>
    </div>
  );
}
