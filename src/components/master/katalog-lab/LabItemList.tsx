"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, ChevronDown, AlertOctagon, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LabKatalogItem } from "@/lib/master/labCatalogMock";
import {
  KATEGORI_CFG, KATEGORI_LAB_ORDER, labItemInitials, getLabStatusCfg,
  hasCriticalConfig, hasDeltaConfig,
} from "./katalogLabShared";
import type { KategoriLab } from "@/components/lab/labShared";

interface Props {
  items: LabKatalogItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

type FilterStatus = "Semua" | "Aktif" | "NonAktif";

export default function LabItemList({ items, selectedId, onSelect, onAddNew }: Props) {
  const [query,        setQuery]        = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("Semua");
  const [filterKat,    setFilterKat]    = useState<KategoriLab | "Semua">("Semua");
  const [showFilter,   setShowFilter]   = useState(false);

  const filtered = items.filter((item) => {
    const q = query.toLowerCase();
    const matchQ = !q || item.nama.toLowerCase().includes(q) || item.kode.toLowerCase().includes(q) || item.satuan.toLowerCase().includes(q);
    const matchS = filterStatus === "Semua" || item.status === filterStatus;
    const matchK = filterKat    === "Semua" || item.kategori === filterKat;
    return matchQ && matchS && matchK;
  });

  const hasFilter = filterStatus !== "Semua" || filterKat !== "Semua";

  return (
    <div className="flex h-full w-[340px] shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-3 pt-3 pb-2">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 focus-within:border-sky-300 focus-within:bg-white focus-within:ring-1 focus-within:ring-sky-100 transition">
          <Search size={13} className="shrink-0 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama, kode, satuan..."
            className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-300 hover:text-slate-500">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <div className="mt-1.5 flex items-center justify-between">
          <button
            onClick={() => setShowFilter((v) => !v)}
            className={cn(
              "flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium transition",
              showFilter || hasFilter
                ? "bg-sky-50 text-sky-600"
                : "text-slate-400 hover:text-slate-600",
            )}
          >
            <ChevronDown size={11} className={cn("transition-transform", showFilter && "rotate-180")} />
            Filter
            {hasFilter && <span className="ml-0.5 rounded-full bg-sky-600 px-1 text-[9px] text-white">•</span>}
          </button>
          <span className="text-[11px] text-slate-400">
            {filtered.length}/{items.length}
          </span>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilter && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="mt-2 space-y-2.5 pb-1">
                {/* Status filter */}
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</p>
                  <div className="flex gap-1">
                    {(["Semua", "Aktif", "NonAktif"] as FilterStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={cn(
                          "rounded px-2.5 py-1 text-[10px] font-medium transition",
                          filterStatus === s
                            ? "bg-sky-600 text-white"
                            : "border border-slate-200 text-slate-500 hover:border-sky-300 hover:text-sky-600",
                        )}
                      >
                        {s === "NonAktif" ? "Non-Aktif" : s}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Kategori filter chips */}
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Kategori</p>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setFilterKat("Semua")}
                      className={cn(
                        "rounded px-2 py-0.5 text-[10px] font-medium transition",
                        filterKat === "Semua"
                          ? "bg-sky-600 text-white"
                          : "border border-slate-200 text-slate-500 hover:border-sky-300",
                      )}
                    >
                      Semua
                    </button>
                    {KATEGORI_LAB_ORDER.map((k) => {
                      const cfg = KATEGORI_CFG[k];
                      return (
                        <button
                          key={k}
                          onClick={() => setFilterKat(k)}
                          className={cn(
                            "rounded px-2 py-0.5 text-[10px] font-medium transition",
                            filterKat === k ? cn(cfg.bg, cfg.text, "ring-1 ring-current") : "border border-slate-200 text-slate-500 hover:border-slate-300",
                          )}
                        >
                          {cfg.short}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add button */}
      <div className="shrink-0 border-b border-slate-100 px-3 py-2">
        <button
          onClick={onAddNew}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-sky-300 py-1.5 text-xs font-medium text-sky-600 transition hover:border-sky-400 hover:bg-sky-50"
        >
          <Plus size={13} />
          Tambah Pemeriksaan
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <p className="text-xs font-medium text-slate-400">Tidak ada hasil</p>
            <p className="text-[11px] text-slate-300">Coba ubah filter atau kata kunci</p>
          </div>
        ) : (
          <ul>
            {filtered.map((item, i) => {
              const active   = item.id === selectedId;
              const catCfg   = KATEGORI_CFG[item.kategori];
              const stsCfg   = getLabStatusCfg(item.status);
              const initials = labItemInitials(item);
              return (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: i * 0.015 }}
                >
                  <button
                    onClick={() => onSelect(item.id)}
                    className={cn(
                      "w-full border-b border-slate-50 px-3 py-2.5 text-left transition",
                      active
                        ? "bg-sky-50 border-l-2 border-l-sky-500"
                        : "hover:bg-slate-50/80 border-l-2 border-l-transparent",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Avatar */}
                      <div className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-black",
                        catCfg.bg, catCfg.text,
                      )}>
                        {initials}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className={cn(
                            "truncate text-xs font-semibold",
                            active ? "text-sky-800" : "text-slate-700",
                          )}>
                            {item.nama}
                          </p>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-slate-400">{item.kode}</span>
                          {item.satuan && (
                            <span className="text-[10px] text-slate-400">· {item.satuan}</span>
                          )}
                        </div>
                      </div>

                      {/* Right badges */}
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className={cn("rounded px-1.5 py-0 text-[9px] font-semibold", catCfg.bg, catCfg.text)}>
                          {catCfg.short}
                        </span>
                        <div className="flex items-center gap-1">
                          {hasCriticalConfig(item) && (
                            <AlertOctagon size={9} className="text-rose-400" />
                          )}
                          {hasDeltaConfig(item) && (
                            <TrendingUp size={9} className="text-amber-400" />
                          )}
                          {item.status === "NonAktif" && (
                            <span className="rounded-full bg-slate-100 px-1 text-[8px] text-slate-400">off</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
