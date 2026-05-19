"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BadgePercent, Layers, TrendingUp, Search, RotateCcw, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type TindakanKategori, KATEGORI_CFG, KATEGORI_ORDER,
} from "@/lib/master/tindakanMock";
import {
  type KelasRawat, PENJAMIN_TIPE_CFG, fmtRupiahShort,
} from "@/lib/master/penjaminMock";
import {
  type TarifMap,
  getTindakanList, getPenjaminList, initTarifMap, setTarif,
  bulkAdjustTarif, resetTarifPenjamin, calcStats,
} from "./tarifShared";
import TarifMatrix from "./TarifMatrix";
import BulkAdjustModal from "./BulkAdjustModal";

export default function TarifPane() {
  const allTindakan = useMemo(() => getTindakanList(), []);
  const penjaminList = useMemo(() => getPenjaminList(), []);
  const [map, setMap] = useState<TarifMap>(() => initTarifMap(allTindakan, penjaminList));
  const [activePenjaminId, setActivePenjaminId] = useState(penjaminList[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [visibleKategori, setVisibleKategori] = useState<Set<TindakanKategori>>(
    () => new Set(KATEGORI_ORDER),
  );
  const [bulkOpen, setBulkOpen] = useState(false);

  const activePenjamin = useMemo(
    () => penjaminList.find((p) => p.id === activePenjaminId) ?? penjaminList[0],
    [penjaminList, activePenjaminId],
  );

  const filteredTindakan = useMemo(() => {
    if (!search.trim()) return allTindakan;
    const q = search.toLowerCase();
    return allTindakan.filter((t) =>
      t.nama.toLowerCase().includes(q) || t.kode.toLowerCase().includes(q),
    );
  }, [allTindakan, search]);

  const visibleIds = useMemo(
    () => filteredTindakan.filter((t) => visibleKategori.has(t.kategori)).map((t) => t.id),
    [filteredTindakan, visibleKategori],
  );

  const stats = useMemo(
    () => calcStats(map, activePenjaminId, visibleIds),
    [map, activePenjaminId, visibleIds],
  );

  const handleEdit = (tindakanId: string, kelasId: KelasRawat, value: number) => {
    setMap((prev) => setTarif(prev, activePenjaminId, tindakanId, kelasId, value));
  };

  const handleBulkAdjust = (percent: number) => {
    setMap((prev) => bulkAdjustTarif(prev, activePenjaminId, visibleIds, percent));
  };

  const handleResetPenjamin = () => {
    if (!confirm(`Reset semua tarif ${activePenjamin?.nama} ke default?`)) return;
    setMap((prev) => resetTarifPenjamin(prev, activePenjaminId, allTindakan, penjaminList));
  };

  const toggleKategoriVisibility = (cat: TindakanKategori) => {
    setVisibleKategori((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  if (!activePenjamin) return null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <PaneHeader stats={stats} totalTindakan={allTindakan.length} totalPenjamin={penjaminList.length} />

      {/* Penjamin Tabs */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.03 }}
        className="shrink-0 overflow-x-auto rounded-2xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm"
      >
        <div className="flex items-center gap-1">
          {penjaminList.map((p) => {
            const cfg = PENJAMIN_TIPE_CFG[p.tipe];
            const active = p.id === activePenjaminId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePenjaminId(p.id)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 m-xs font-semibold transition",
                  active
                    ? cn(cfg.bg, cfg.text, "ring-1 ring-amber-200")
                    : "text-slate-500 hover:bg-slate-50",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
                  <span>{p.nama}</span>
                  <span className={cn(
                    "rounded px-1 m-mini font-mono",
                    active ? "bg-white/60" : "bg-slate-100",
                  )}>
                    {p.kode}
                  </span>
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
              placeholder="Cari tindakan / kode ICD-9..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 m-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-100"
            />
          </div>
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            className="flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 m-mini font-semibold text-white transition hover:bg-amber-700"
          >
            <Calculator size={11} />
            Bulk Update
          </button>
          <button
            type="button"
            onClick={handleResetPenjamin}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 m-mini font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <RotateCcw size={10} />
            Reset Default
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1">
          <span className="m-mini font-semibold uppercase tracking-wide text-slate-400">Kategori:</span>
          {KATEGORI_ORDER.map((cat) => {
            const cfg = KATEGORI_CFG[cat];
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
            onClick={() => setVisibleKategori(new Set(KATEGORI_ORDER))}
            className="ml-1 rounded-md px-1.5 py-0.5 m-mini font-semibold text-amber-700 hover:bg-amber-50"
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
        <TarifMatrix
          tindakan={filteredTindakan}
          map={map}
          penjaminId={activePenjaminId}
          visibleKategori={visibleKategori}
          onEdit={handleEdit}
        />
      </motion.div>

      <BulkAdjustModal
        open={bulkOpen}
        penjamin={activePenjamin}
        affectedCount={visibleIds.length}
        onClose={() => setBulkOpen(false)}
        onConfirm={handleBulkAdjust}
      />
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────

function PaneHeader({
  stats, totalTindakan, totalPenjamin,
}: {
  stats: { count: number; avg: number; min: number; max: number };
  totalTindakan: number;
  totalPenjamin: number;
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
          <h2 className="m-base font-bold text-slate-900">Tarif Matrix</h2>
          <p className="mt-0.5 m-tiny text-slate-500">
            Tindakan × Kelas × Penjamin. Pilih penjamin di atas → klik sel untuk edit harga inline.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Stat icon={BadgePercent} label="Tindakan"  value={`${totalTindakan}`}                cls="bg-amber-50 text-amber-600" />
          <Stat icon={Layers}       label="Penjamin"  value={`${totalPenjamin}`}                cls="bg-sky-50 text-sky-600" />
          <Stat icon={TrendingUp}   label="Avg Tarif" value={stats.count ? fmtRupiahShort(stats.avg) : "—"} cls="bg-emerald-50 text-emerald-600" />
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
