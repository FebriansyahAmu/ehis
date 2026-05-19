"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Pill, Layers, ShieldCheck, Search, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type ObatKategori, OBAT_KATEGORI_CFG, KATEGORI_OBAT_ORDER,
} from "@/lib/master/obatMock";
import {
  type KelasRawat, PENJAMIN_TIPE_CFG,
} from "@/lib/master/penjaminMock";
import {
  type FormulariumMap,
  getObatList, getPenjaminListF, initFormulariumMap,
  toggleCell, bulkSetRow, bulkSetColumn, calcCoverage,
} from "./formulariumShared";
import FormulariumMatrix from "./FormulariumMatrix";

export default function FormulariumPane() {
  const allObat = useMemo(() => getObatList(), []);
  const penjaminList = useMemo(() => getPenjaminListF(), []);
  const [map, setMap] = useState<FormulariumMap>(() => initFormulariumMap(allObat, penjaminList));
  const [activePenjaminId, setActivePenjaminId] = useState(penjaminList[1]?.id ?? penjaminList[0]?.id ?? ""); // default BPJS
  const [search, setSearch] = useState("");
  const [visibleKategori, setVisibleKategori] = useState<Set<ObatKategori>>(
    () => new Set(KATEGORI_OBAT_ORDER),
  );

  const activePenjamin = useMemo(
    () => penjaminList.find((p) => p.id === activePenjaminId) ?? penjaminList[0],
    [penjaminList, activePenjaminId],
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

  const visibleIds = useMemo(
    () => filteredObat.filter((o) => visibleKategori.has(o.kategori)).map((o) => o.id),
    [filteredObat, visibleKategori],
  );

  const coverage = useMemo(
    () => calcCoverage(map, activePenjaminId, visibleIds),
    [map, activePenjaminId, visibleIds],
  );

  const handleToggle = (obatId: string, kelasId: KelasRawat) => {
    setMap((prev) => toggleCell(prev, activePenjaminId, obatId, kelasId));
  };

  const handleToggleRow = (obatId: string, allowed: boolean) => {
    setMap((prev) => bulkSetRow(prev, activePenjaminId, obatId, allowed));
  };

  const handleToggleColumn = (kelasId: KelasRawat, allowed: boolean) => {
    setMap((prev) => bulkSetColumn(prev, activePenjaminId, visibleIds, kelasId, allowed));
  };

  const handleResetDefault = () => {
    if (!confirm("Reset semua formularium ke default berdasarkan tipe penjamin?")) return;
    setMap(initFormulariumMap(allObat, penjaminList));
  };

  const toggleKategoriVisibility = (cat: ObatKategori) => {
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
      <PaneHeader coverage={coverage} totalObat={allObat.length} totalPenjamin={penjaminList.length} />

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
                    ? cn(cfg.bg, cfg.text, "ring-1 ring-violet-200")
                    : "text-slate-500 hover:bg-slate-50",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
                  <span>{p.nama}</span>
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
              placeholder="Cari obat / kode ATC / merk dagang..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 m-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <button
            type="button"
            onClick={handleResetDefault}
            className="flex items-center gap-1 rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 m-mini font-semibold text-violet-700 transition hover:bg-violet-50"
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
            className="ml-1 rounded-md px-1.5 py-0.5 m-mini font-semibold text-violet-700 hover:bg-violet-50"
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
        <FormulariumMatrix
          obat={filteredObat}
          map={map}
          penjaminId={activePenjaminId}
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
  coverage, totalObat, totalPenjamin,
}: {
  coverage: { granted: number; total: number; pct: number };
  totalObat: number;
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
          <h2 className="m-base font-bold text-slate-900">Formularium Penjamin</h2>
          <p className="mt-0.5 m-tiny text-slate-500">
            Obat × Kelas per Penjamin. Default rules: BPJS = formularium nasional, Jamkesda = Kelas 2-3+RJ.
            Cell amber = ada alasan substitusi.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Stat icon={Pill}        label="Obat"      value={`${totalObat}`}                                 cls="bg-violet-50 text-violet-600" />
          <Stat icon={Layers}      label="Penjamin"  value={`${totalPenjamin}`}                             cls="bg-sky-50 text-sky-600" />
          <Stat icon={ShieldCheck} label="Coverage"  value={`${coverage.granted} (${coverage.pct}%)`}      cls="bg-emerald-50 text-emerald-600" />
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
