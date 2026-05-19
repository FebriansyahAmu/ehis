"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, MapPin, Link2, Search, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type TindakanKategori, KATEGORI_CFG, KATEGORI_ORDER, CLINICAL_UNITS_FOR_LAYANAN,
} from "@/lib/master/tindakanMock";
import {
  type LayananMap,
  getTindakanList, initLayananMap, countAllLayanan,
} from "./layananShared";
import LayananUnitMatrix from "./LayananUnitMatrix";

export default function LayananUnitPane() {
  const allTindakan = useMemo(() => getTindakanList(), []);
  const [map, setMap] = useState<LayananMap>(() => initLayananMap(allTindakan));
  const [search, setSearch] = useState("");
  const [visibleKategori, setVisibleKategori] = useState<Set<TindakanKategori>>(
    () => new Set(KATEGORI_ORDER),
  );

  const filteredTindakan = useMemo(() => {
    if (!search.trim()) return allTindakan;
    const q = search.toLowerCase();
    return allTindakan.filter((t) =>
      t.nama.toLowerCase().includes(q) || t.kode.toLowerCase().includes(q),
    );
  }, [allTindakan, search]);

  const stats = useMemo(() => {
    const totalCells = allTindakan.length * CLINICAL_UNITS_FOR_LAYANAN.length;
    const granted = countAllLayanan(map);
    const pct = totalCells ? Math.round((granted / totalCells) * 100) : 0;
    return { totalCells, granted, pct };
  }, [allTindakan, map]);

  const handleToggle = (tindakanId: string, unitKode: string) => {
    setMap((prev) => {
      const current = prev[tindakanId] ?? [];
      const has = current.includes(unitKode);
      return {
        ...prev,
        [tindakanId]: has ? current.filter((u) => u !== unitKode) : [...current, unitKode],
      };
    });
  };

  const handleToggleRow = (tindakanId: string, granted: boolean) => {
    setMap((prev) => ({
      ...prev,
      [tindakanId]: granted ? CLINICAL_UNITS_FOR_LAYANAN.map((u) => u.kode) : [],
    }));
  };

  const handleToggleColumn = (unitKode: string, granted: boolean) => {
    setMap((prev) => {
      const next = { ...prev };
      for (const t of filteredTindakan) {
        if (!visibleKategori.has(t.kategori)) continue;
        const current = next[t.id] ?? [];
        const has = current.includes(unitKode);
        if (granted && !has) next[t.id] = [...current, unitKode];
        if (!granted && has) next[t.id] = current.filter((u) => u !== unitKode);
      }
      return next;
    });
  };

  const handleResetDefault = () => {
    if (!confirm("Reset semua mapping ke default berdasarkan katalog?")) return;
    setMap(initLayananMap(allTindakan));
  };

  const toggleKategoriVisibility = (cat: TindakanKategori) => {
    setVisibleKategori((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <PaneHeader stats={stats} totalTindakan={allTindakan.length} totalUnit={CLINICAL_UNITS_FOR_LAYANAN.length} />

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
              placeholder="Cari tindakan / kode..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 m-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <button
            type="button"
            onClick={handleResetDefault}
            className="flex items-center gap-1 rounded-lg border border-teal-200 bg-white px-2.5 py-1.5 m-mini font-semibold text-teal-700 transition hover:bg-teal-50"
          >
            <RotateCcw size={10} />
            Reset Default
          </button>
        </div>

        {/* Kategori filter chips */}
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <span className="m-mini font-semibold uppercase tracking-wide text-slate-400">
            Kategori:
          </span>
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
            className="ml-1 rounded-md px-1.5 py-0.5 m-mini font-semibold text-teal-700 hover:bg-teal-50"
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
        <LayananUnitMatrix
          tindakan={filteredTindakan}
          map={map}
          visibleKategori={visibleKategori}
          onToggle={handleToggle}
          onToggleRow={handleToggleRow}
          onToggleColumn={handleToggleColumn}
        />
      </motion.div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────

function PaneHeader({
  stats, totalTindakan, totalUnit,
}: {
  stats: { granted: number; totalCells: number; pct: number };
  totalTindakan: number;
  totalUnit: number;
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
          <h2 className="m-base font-bold text-slate-900">Layanan Unit</h2>
          <p className="mt-0.5 m-tiny text-slate-500">
            Atur tindakan apa boleh dilakukan di unit mana. Klik judul kolom = toggle semua tindakan;
            klik judul baris = toggle semua unit.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Stat icon={Activity} label="Tindakan" value={`${totalTindakan}`}              cls="bg-teal-50 text-teal-600" />
          <Stat icon={MapPin}   label="Unit"     value={`${totalUnit}`}                  cls="bg-sky-50 text-sky-600" />
          <Stat icon={Link2}    label="Mapping"  value={`${stats.granted} (${stats.pct}%)`} cls="bg-emerald-50 text-emerald-600" />
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
