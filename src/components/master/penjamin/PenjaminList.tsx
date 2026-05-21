"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, ShieldCheck, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PenjaminRecord, PenjaminTipe } from "@/lib/master/penjaminStore";
import { TIPE_CFG, STATUS_CFG, TIPE_LIST, penjaminInitials } from "./penjaminShared";

interface Props {
  items: PenjaminRecord[];
  selected: PenjaminRecord | null;
  onSelect: (p: PenjaminRecord) => void;
  onAdd: () => void;
}

export default function PenjaminList({ items, selected, onSelect, onAdd }: Props) {
  const [search,     setSearch]     = useState("");
  const [filterTipe, setFilterTipe] = useState<"all" | PenjaminTipe>("all");
  const [showFilter, setShowFilter] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((p) => {
      if (filterTipe !== "all" && p.tipe !== filterTipe) return false;
      if (!q) return true;
      return (
        p.nama.toLowerCase().includes(q) ||
        p.kode.toLowerCase().includes(q) ||
        p.kontak.picNama.toLowerCase().includes(q)
      );
    });
  }, [items, search, filterTipe]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Master</p>
            <p className="text-sm font-bold text-slate-800">Daftar Penjamin</p>
          </div>
          <button
            onClick={onAdd}
            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus size={12} /> Baru
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="shrink-0 space-y-2 border-b border-slate-100 p-3">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari penjamin / PIC..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
          />
        </div>
        <button
          onClick={() => setShowFilter((v) => !v)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition",
            showFilter || filterTipe !== "all"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
          )}
        >
          <span className="flex items-center gap-1.5">
            <ListFilter size={11} />
            Filter
          </span>
          {filterTipe !== "all" && (
            <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
              {TIPE_CFG[filterTipe].short}
            </span>
          )}
        </button>
        {showFilter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.15 }}
            className="flex flex-wrap gap-1 pt-1"
          >
            <FilterChip active={filterTipe === "all"} onClick={() => setFilterTipe("all")}>
              Semua
            </FilterChip>
            {TIPE_LIST.map((t) => (
              <FilterChip
                key={t}
                active={filterTipe === t}
                onClick={() => setFilterTipe(t)}
                tone={t}
              >
                {TIPE_CFG[t].short}
              </FilterChip>
            ))}
          </motion.div>
        )}
      </div>

      {/* List */}
      <nav className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
              <ShieldCheck size={14} className="text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-400">
              {search || filterTipe !== "all" ? "Tidak ada hasil" : "Belum ada penjamin"}
            </p>
          </div>
        )}
        {filtered.map((p, i) => (
          <PenjaminRow
            key={p.id}
            penjamin={p}
            active={selected?.id === p.id}
            onClick={() => onSelect(p)}
            index={i}
          />
        ))}
      </nav>

      {/* Footer count */}
      <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-3 py-2">
        <p className="text-[10px] text-slate-500">
          {filtered.length} dari {items.length} penjamin
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────

function FilterChip({
  children, active, onClick, tone,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  tone?: PenjaminTipe;
}) {
  const cfg = tone ? TIPE_CFG[tone] : null;
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md border px-2 py-1 text-[10px] font-semibold transition",
        active
          ? cfg
            ? cn(cfg.bg, cfg.text, "border-transparent ring-1", cfg.ring)
            : "border-emerald-300 bg-emerald-600 text-white"
          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
      )}
    >
      {children}
    </button>
  );
}

function PenjaminRow({
  penjamin, active, onClick, index,
}: {
  penjamin: PenjaminRecord;
  active: boolean;
  onClick: () => void;
  index: number;
}) {
  const tipeCfg = TIPE_CFG[penjamin.tipe];
  const statCfg = STATUS_CFG[penjamin.status];

  return (
    <motion.button
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, delay: Math.min(index * 0.02, 0.2) }}
      onClick={onClick}
      className={cn(
        "mb-1 flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left transition",
        active ? "bg-emerald-50 ring-1 ring-emerald-200" : "hover:bg-slate-50",
      )}
    >
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ring-1",
        tipeCfg.bg, tipeCfg.text, tipeCfg.ring,
      )}>
        {penjaminInitials(penjamin.nama)}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn(
          "truncate text-xs font-semibold",
          active ? "text-emerald-800" : "text-slate-800",
        )}>
          {penjamin.nama || "(Baru)"}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1">
          <span className="font-mono text-[10px] text-slate-400">{penjamin.kode || "—"}</span>
          <span className={cn(
            "rounded px-1 py-0.5 text-[9px] font-bold uppercase",
            tipeCfg.bg, tipeCfg.text,
          )}>
            {tipeCfg.short}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <span className={cn("h-1.5 w-1.5 rounded-full", statCfg.dot)} />
          <span className="text-[10px] text-slate-500">{statCfg.label}</span>
          {penjamin.kelas.length > 0 && (
            <>
              <span className="text-[10px] text-slate-300">·</span>
              <span className="text-[10px] text-slate-500">{penjamin.kelas.length} kelas</span>
            </>
          )}
        </div>
      </div>
    </motion.button>
  );
}
