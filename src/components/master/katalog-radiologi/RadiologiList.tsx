"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, ChevronDown, ShieldAlert, Droplets, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RadCatalogRecord, RadModalitas } from "@/lib/master/radCatalogMock";
import {
  MODALITAS_CFG, MODALITAS_ORDER,
  radItemInitials, getRadStatusCfg,
  hasDRLConfig, usesKontras,
} from "./katalogRadiologiShared";

interface Props {
  items: RadCatalogRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

type FilterStatus = "Semua" | "Aktif" | "Non_Aktif";

export default function RadiologiList({ items, selectedId, onSelect, onAddNew }: Props) {
  const [query,        setQuery]        = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("Semua");
  const [filterMod,    setFilterMod]    = useState<RadModalitas | "Semua">("Semua");
  const [showFilter,   setShowFilter]   = useState(false);

  const filtered = items.filter((item) => {
    const q = query.toLowerCase();
    const matchQ =
      !q ||
      item.nama.toLowerCase().includes(q) ||
      item.kode.toLowerCase().includes(q);
    const matchS = filterStatus === "Semua" || item.status === filterStatus;
    const matchM = filterMod    === "Semua" || item.modalitas === filterMod;
    return matchQ && matchS && matchM;
  });

  const hasFilter = filterStatus !== "Semua" || filterMod !== "Semua";

  return (
    <div className="flex h-full w-[340px] shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-3 pt-3 pb-2">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 transition focus-within:border-rose-300 focus-within:bg-white focus-within:ring-1 focus-within:ring-rose-100">
          <Search size={13} className="shrink-0 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama atau kode..."
            className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-300 hover:text-slate-500" aria-label="Bersihkan">
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
                ? "bg-rose-50 text-rose-600"
                : "text-slate-400 hover:text-slate-600",
            )}
          >
            <ChevronDown size={11} className={cn("transition-transform", showFilter && "rotate-180")} />
            Filter
            {hasFilter && <span className="ml-0.5 rounded-full bg-rose-600 px-1 text-[9px] text-white">•</span>}
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
                    {(["Semua", "Aktif", "Non_Aktif"] as FilterStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={cn(
                          "rounded px-2.5 py-1 text-[10px] font-medium transition",
                          filterStatus === s
                            ? "bg-rose-600 text-white"
                            : "border border-slate-200 text-slate-500 hover:border-rose-300 hover:text-rose-600",
                        )}
                      >
                        {s === "Non_Aktif" ? "Non-Aktif" : s}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Modalitas filter chips */}
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Modalitas</p>
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setFilterMod("Semua")}
                      className={cn(
                        "rounded px-2 py-0.5 text-[10px] font-medium transition",
                        filterMod === "Semua"
                          ? "bg-rose-600 text-white"
                          : "border border-slate-200 text-slate-500 hover:border-rose-300",
                      )}
                    >
                      Semua
                    </button>
                    {MODALITAS_ORDER.map((m) => {
                      const cfg = MODALITAS_CFG[m];
                      return (
                        <button
                          key={m}
                          onClick={() => setFilterMod(m)}
                          className={cn(
                            "rounded px-2 py-0.5 text-[10px] font-medium transition",
                            filterMod === m
                              ? cn(cfg.bg, cfg.text, "ring-1 ring-current")
                              : "border border-slate-200 text-slate-500 hover:border-slate-300",
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
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-rose-300 py-1.5 text-xs font-medium text-rose-600 transition hover:border-rose-400 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
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
              const modCfg   = MODALITAS_CFG[item.modalitas];
              const stsCfg   = getRadStatusCfg(item.status);
              const initials = radItemInitials(item);
              const Icon     = modCfg.icon;
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
                        ? "bg-rose-50 border-l-2 border-l-rose-500"
                        : "hover:bg-slate-50/80 border-l-2 border-l-transparent",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Avatar */}
                      <div className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-black",
                        modCfg.bg, modCfg.text,
                      )}>
                        <Icon size={14} />
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className={cn(
                          "truncate text-xs font-semibold",
                          active ? "text-rose-800" : "text-slate-700",
                        )}>
                          {item.nama}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-slate-400">{item.kode}</span>
                          <span className="text-[10px] text-slate-400">· {item.estimasiWaktuMenit} mnt</span>
                        </div>
                      </div>

                      {/* Right badges */}
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className={cn("rounded px-1.5 py-0 text-[9px] font-semibold", modCfg.bg, modCfg.text)}>
                          {modCfg.short}
                        </span>
                        <div className="flex items-center gap-1">
                          {hasDRLConfig(item) && (
                            <span title="DRL terkonfigurasi">
                              <ShieldAlert size={9} className="text-amber-500" />
                            </span>
                          )}
                          {usesKontras(item) && (
                            <span title="Memerlukan kontras">
                              <Droplets size={9} className="text-sky-500" />
                            </span>
                          )}
                          {item.status === "Non_Aktif" && (
                            <span className={cn("rounded-full px-1 text-[8px]", stsCfg.bg, stsCfg.text)}>off</span>
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

      {/* Footer count */}
      <div className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-3 py-1.5 text-center">
        <p className="text-[10px] text-slate-500">
          <strong className="text-slate-700">{items.filter((i) => i.status === "Aktif").length}</strong> aktif ·{" "}
          <strong className="text-slate-700">{MODALITAS_ORDER.length}</strong> modalitas terdukung
        </p>
      </div>
    </div>
  );
}
