"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Filter, AlertTriangle, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type ObatRecord, type ObatKategori,
  OBAT_KATEGORI_CFG, KATEGORI_OBAT_ORDER, BENTUK_CFG,
} from "@/lib/master/obatMock";
import { obatInitials } from "./katalogObatShared";

interface ObatListProps {
  items: ObatRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

type FilterFlag = "all" | "form" | "non_form" | "ham" | "lasa" | "narkotika";

export default function ObatList({ items, selectedId, onSelect, onAddNew }: ObatListProps) {
  const [search, setSearch] = useState("");
  const [activeKategori, setActiveKategori] = useState<ObatKategori | "all">("all");
  const [flag, setFlag] = useState<FilterFlag>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let arr = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((o) =>
        o.namaGenerik.toLowerCase().includes(q) ||
        o.namaDagang.toLowerCase().includes(q) ||
        o.kode.toLowerCase().includes(q) ||
        (o.pabrik ?? "").toLowerCase().includes(q),
      );
    }
    if (activeKategori !== "all") {
      arr = arr.filter((o) => o.kategori === activeKategori);
    }
    if (flag === "form") arr = arr.filter((o) => o.isFormularium);
    if (flag === "non_form") arr = arr.filter((o) => !o.isFormularium);
    if (flag === "ham") arr = arr.filter((o) => o.isHAM);
    if (flag === "lasa") arr = arr.filter((o) => o.isLASA);
    if (flag === "narkotika") arr = arr.filter((o) =>
      o.golongan?.startsWith("Narkotika") || o.golongan?.startsWith("Psikotropika"),
    );
    return arr;
  }, [items, search, activeKategori, flag]);

  return (
    <aside className="flex h-full w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:w-[340px]">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="m-sm font-bold text-slate-800">Daftar Obat</h3>
            <p className="m-mini text-slate-400">{filtered.length} dari {items.length} obat</p>
          </div>
          <motion.button
            type="button"
            onClick={onAddNew}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 m-mini font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            <Plus size={11} strokeWidth={2.5} />
            Tambah
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative mt-2">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, kode, pabrik..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 m-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
          />
        </div>

        {/* Filter toggle */}
        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          className="mt-2 flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 transition hover:bg-slate-100"
        >
          <span className="inline-flex items-center gap-1.5 m-mini font-semibold text-slate-600">
            <Filter size={10} />
            Filter
            {(activeKategori !== "all" || flag !== "all") && (
              <span className="rounded-full bg-violet-100 px-1.5 py-0 m-mini font-bold text-violet-700">
                {[activeKategori !== "all" ? 1 : 0, flag !== "all" ? 1 : 0].reduce((a, b) => a + b, 0)}
              </span>
            )}
          </span>
          <ChevronRight
            size={10}
            className={cn("text-slate-400 transition-transform", showFilters && "rotate-90")}
          />
        </button>

        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-2">
                <p className="m-mini font-semibold uppercase tracking-wide text-slate-400">Kategori</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <FilterChip
                    label="Semua"
                    active={activeKategori === "all"}
                    onClick={() => setActiveKategori("all")}
                  />
                  {KATEGORI_OBAT_ORDER.map((cat) => {
                    const cfg = OBAT_KATEGORI_CFG[cat];
                    return (
                      <FilterChip
                        key={cat}
                        label={cfg.short}
                        active={activeKategori === cat}
                        accent={cfg}
                        onClick={() => setActiveKategori(cat)}
                      />
                    );
                  })}
                </div>

                <p className="mt-2 m-mini font-semibold uppercase tracking-wide text-slate-400">Flag</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <FilterChip label="Semua"        active={flag === "all"}        onClick={() => setFlag("all")} />
                  <FilterChip label="Formularium"  active={flag === "form"}       onClick={() => setFlag("form")} />
                  <FilterChip label="Non-Form"     active={flag === "non_form"}   onClick={() => setFlag("non_form")} />
                  <FilterChip label="HAM"          active={flag === "ham"}        onClick={() => setFlag("ham")} />
                  <FilterChip label="LASA"         active={flag === "lasa"}       onClick={() => setFlag("lasa")} />
                  <FilterChip label="Nar/Psi"      active={flag === "narkotika"}  onClick={() => setFlag("narkotika")} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1.5">
        {filtered.length === 0 ? (
          <EmptyResult onAddNew={onAddNew} />
        ) : (
          <motion.ul layout className="flex flex-col gap-0.5">
            {filtered.map((o, i) => (
              <ObatRow
                key={o.id}
                obat={o}
                active={selectedId === o.id}
                onClick={() => onSelect(o.id)}
                index={i}
              />
            ))}
          </motion.ul>
        )}
      </div>
    </aside>
  );
}

// ── Sub-components ───────────────────────────────────────

function FilterChip({
  label, active, accent, onClick,
}: {
  label: string;
  active: boolean;
  accent?: { bg: string; text: string };
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-1.5 py-0.5 m-mini font-semibold transition",
        active
          ? accent
            ? cn("border-transparent", accent.bg, accent.text)
            : "border-transparent bg-violet-100 text-violet-700"
          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
      )}
    >
      {label}
    </button>
  );
}

function ObatRow({
  obat, active, onClick, index,
}: {
  obat: ObatRecord;
  active: boolean;
  onClick: () => void;
  index: number;
}) {
  const catCfg = OBAT_KATEGORI_CFG[obat.kategori];
  const bentukCfg = BENTUK_CFG[obat.bentuk];

  return (
    <motion.li
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.015, 0.2) }}
      layout
    >
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.99 }}
        className={cn(
          "group flex w-full items-start gap-2 rounded-lg border px-2 py-2 text-left transition",
          active
            ? "border-violet-200 bg-violet-50/70 ring-1 ring-violet-200"
            : "border-transparent hover:border-slate-200 hover:bg-slate-50",
        )}
      >
        <span className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold m-tiny",
          catCfg.bg, catCfg.text,
        )}>
          {obatInitials(obat)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className={cn("truncate m-xs font-semibold", active ? "text-violet-900" : "text-slate-800")}>
              {obat.namaGenerik}
            </p>
            {obat.isHAM && (
              <span className="shrink-0 rounded bg-rose-100 px-1 py-0 m-mini font-bold text-rose-700">HAM</span>
            )}
            {obat.isLASA && (
              <span className="shrink-0 rounded bg-amber-100 px-1 py-0 m-mini font-bold text-amber-700">LASA</span>
            )}
          </div>
          <p className="mt-0.5 truncate m-mini text-slate-500">
            {obat.namaDagang} {obat.pabrik && `· ${obat.pabrik}`}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="rounded px-1 py-0 m-mini font-mono text-slate-400 bg-slate-100">
              {bentukCfg.short}
            </span>
            <span className="m-mini text-slate-500">{obat.kekuatan}</span>
            {obat.golongan && (obat.golongan.startsWith("Narkotika") || obat.golongan.startsWith("Psikotropika")) && (
              <span className="ml-auto inline-flex items-center gap-0.5 m-mini font-bold text-rose-700">
                <AlertTriangle size={9} />
                {obat.golongan.split("_")[0].charAt(0)}
              </span>
            )}
          </div>
        </div>
      </motion.button>
    </motion.li>
  );
}

function EmptyResult({ onAddNew }: { onAddNew: () => void }) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center px-4 py-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
        <Sparkles size={18} className="text-slate-400" />
      </span>
      <p className="mt-3 m-sm font-semibold text-slate-700">Tidak ada obat cocok</p>
      <p className="mt-1 m-mini text-slate-400">Ubah filter atau tambah obat baru.</p>
      <button
        type="button"
        onClick={onAddNew}
        className="mt-3 inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-white px-2.5 py-1 m-mini font-semibold text-violet-700 transition hover:bg-violet-50"
      >
        <Plus size={10} />
        Tambah Obat Baru
      </button>
    </div>
  );
}
