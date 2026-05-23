"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";
import { MasterListPanel } from "@/components/master/shared";
import type { RadCatalogRecord, RadModalitas } from "@/lib/master/radCatalogMock";
import {
  MODALITAS_CFG, MODALITAS_ORDER,
  getRadStatusCfg, hasDRLConfig, usesKontras,
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

  const filtered = items.filter((item) => {
    const q = query.toLowerCase();
    const matchQ = !q || item.nama.toLowerCase().includes(q) || item.kode.toLowerCase().includes(q);
    const matchS = filterStatus === "Semua" || item.status === filterStatus;
    const matchM = filterMod    === "Semua" || item.modalitas === filterMod;
    return matchQ && matchS && matchM;
  });

  const hasActiveFilter = filterStatus !== "Semua" || filterMod !== "Semua";
  const aktifCount = items.filter((i) => i.status === "Aktif").length;

  return (
    <MasterListPanel
      accent="rose"
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder="Cari nama atau kode..."
      visibleCount={filtered.length}
      totalCount={items.length}
      hasActiveFilter={hasActiveFilter}
      onAddNew={onAddNew}
      addLabel="Tambah Pemeriksaan"
      isEmpty={filtered.length === 0}
      filterSlot={
        <>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</p>
            <div className="flex gap-1">
              {(["Semua", "Aktif", "Non_Aktif"] as FilterStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
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
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Modalitas</p>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
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
                    type="button"
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
        </>
      }
      footer={
        <>
          <strong className="text-slate-700">{aktifCount}</strong> aktif ·{" "}
          <strong className="text-slate-700">{MODALITAS_ORDER.length}</strong> modalitas terdukung
        </>
      }
    >
      <ul>
        {filtered.map((item, i) => (
          <RadiologiRow
            key={item.id}
            item={item}
            active={item.id === selectedId}
            onSelect={() => onSelect(item.id)}
            index={i}
          />
        ))}
      </ul>
    </MasterListPanel>
  );
}

// ── Row sub-component ────────────────────────────────────

interface RowProps {
  item: RadCatalogRecord;
  active: boolean;
  index: number;
  onSelect: () => void;
}

function RadiologiRow({ item, active, index, onSelect }: RowProps) {
  const modCfg = MODALITAS_CFG[item.modalitas];
  const stsCfg = getRadStatusCfg(item.status);
  const Icon = modCfg.icon;

  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, delay: index * 0.015 }}
    >
      <button
        type="button"
        onClick={onSelect}
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
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
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
}
