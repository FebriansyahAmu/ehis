"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertOctagon, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { MasterListPanel } from "@/components/master/shared";
import type { LabKatalogItem } from "@/lib/master/labCatalogMock";
import type { KategoriLab } from "@/components/lab/labShared";
import {
  KATEGORI_CFG, KATEGORI_LAB_ORDER,
  labItemInitials, hasCriticalConfig, hasDeltaConfig,
} from "./katalogLabShared";

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

  const filtered = items.filter((item) => {
    const q = query.toLowerCase();
    const matchQ =
      !q ||
      item.nama.toLowerCase().includes(q) ||
      item.kode.toLowerCase().includes(q) ||
      item.satuan.toLowerCase().includes(q);
    const matchS = filterStatus === "Semua" || item.status === filterStatus;
    const matchK = filterKat    === "Semua" || item.kategori === filterKat;
    return matchQ && matchS && matchK;
  });

  const hasActiveFilter = filterStatus !== "Semua" || filterKat !== "Semua";

  return (
    <MasterListPanel
      accent="sky"
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder="Cari nama, kode, satuan..."
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
              {(["Semua", "Aktif", "NonAktif"] as FilterStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
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
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Kategori</p>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
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
                    type="button"
                    onClick={() => setFilterKat(k)}
                    className={cn(
                      "rounded px-2 py-0.5 text-[10px] font-medium transition",
                      filterKat === k
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
    >
      <ul>
        {filtered.map((item, i) => (
          <LabItemRow
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
  item: LabKatalogItem;
  active: boolean;
  index: number;
  onSelect: () => void;
}

function LabItemRow({ item, active, index, onSelect }: RowProps) {
  const catCfg = KATEGORI_CFG[item.kategori];
  const initials = labItemInitials(item);

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
            <p className={cn(
              "truncate text-xs font-semibold",
              active ? "text-sky-800" : "text-slate-700",
            )}>
              {item.nama}
            </p>
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
                <span title="Nilai kritis terkonfigurasi">
                  <AlertOctagon size={9} className="text-rose-400" />
                </span>
              )}
              {hasDeltaConfig(item) && (
                <span title="Delta check terkonfigurasi">
                  <TrendingUp size={9} className="text-amber-400" />
                </span>
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
}
