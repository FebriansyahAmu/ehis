"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  MasterListPanel, type MasterAccent,
} from "@/components/master/shared";
import type {
  SkalaRecord, SkalaModulKonsumen,
} from "@/lib/master/skalaCommon";
import {
  MODUL_CFG, getSkalaStatusCfg, skalaInitials,
} from "./skalaConfig";

interface Props {
  accent: MasterAccent;
  /** Tailwind classes per accent — pre-resolved (selected bg + border + text color). */
  activeBg: string;
  activeBorderL: string;
  activeText: string;
  activeAvatarBg: string;
  activeAvatarText: string;
  addLabel: string;
  searchPlaceholder?: string;

  items: SkalaRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

type FilterStatus = "Semua" | "Aktif" | "Non_Aktif";
type FilterModul = "Semua" | SkalaModulKonsumen;

const MODUL_FILTERS: FilterModul[] = ["Semua", "IGD", "RI", "RJ", "ICU"];

// Per-accent classes (Tailwind purge-safe).
const FILTER_BG: Record<MasterAccent, string> = {
  rose: "bg-rose-600", sky: "bg-sky-600", teal: "bg-teal-600",
  violet: "bg-violet-600", emerald: "bg-emerald-600", amber: "bg-amber-600",
  slate: "bg-slate-600", pink: "bg-pink-600",
};
const FILTER_HOVER_BORDER: Record<MasterAccent, string> = {
  rose: "hover:border-rose-300 hover:text-rose-600",
  sky: "hover:border-sky-300 hover:text-sky-600",
  teal: "hover:border-teal-300 hover:text-teal-600",
  violet: "hover:border-violet-300 hover:text-violet-600",
  emerald: "hover:border-emerald-300 hover:text-emerald-600",
  amber: "hover:border-amber-300 hover:text-amber-600",
  slate: "hover:border-slate-300 hover:text-slate-600",
  pink: "hover:border-pink-300 hover:text-pink-600",
};

export default function SkalaList({
  accent, activeBg, activeBorderL, activeText, activeAvatarBg, activeAvatarText,
  addLabel, searchPlaceholder = "Cari nama, kode, atau singkatan...",
  items, selectedId, onSelect, onAddNew,
}: Props) {
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("Semua");
  const [filterModul, setFilterModul] = useState<FilterModul>("Semua");

  const filtered = items.filter((item) => {
    const q = query.toLowerCase();
    const matchQ = !q
      || item.nama.toLowerCase().includes(q)
      || item.kode.toLowerCase().includes(q)
      || item.singkat.toLowerCase().includes(q);
    const matchS = filterStatus === "Semua" || item.status === filterStatus;
    const matchM = filterModul === "Semua" || item.konsumenModul.includes(filterModul);
    return matchQ && matchS && matchM;
  });

  const hasActiveFilter = filterStatus !== "Semua" || filterModul !== "Semua";
  const aktifCount = items.filter((i) => i.status === "Aktif").length;

  return (
    <MasterListPanel
      accent={accent}
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder={searchPlaceholder}
      visibleCount={filtered.length}
      totalCount={items.length}
      hasActiveFilter={hasActiveFilter}
      onAddNew={onAddNew}
      addLabel={addLabel}
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
                      ? cn(FILTER_BG[accent], "text-white")
                      : cn("border border-slate-200 text-slate-500", FILTER_HOVER_BORDER[accent]),
                  )}
                >
                  {s === "Non_Aktif" ? "Non-Aktif" : s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Konsumen Modul</p>
            <div className="flex flex-wrap gap-1">
              {MODUL_FILTERS.map((m) => {
                const isAll = m === "Semua";
                const cfg = isAll ? null : MODUL_CFG[m];
                const active = filterModul === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setFilterModul(m)}
                    className={cn(
                      "rounded px-2 py-0.5 text-[10px] font-medium transition",
                      active
                        ? cfg
                          ? cn(cfg.bg, cfg.text, "ring-1 ring-current")
                          : cn(FILTER_BG[accent], "text-white")
                        : "border border-slate-200 text-slate-500 hover:border-slate-300",
                    )}
                  >
                    {isAll ? "Semua" : cfg!.label}
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
          <strong className="text-slate-700">{items.length}</strong> skala terdaftar
        </>
      }
    >
      <ul>
        {filtered.map((item, i) => (
          <SkalaRow
            key={item.id}
            item={item}
            active={item.id === selectedId}
            index={i}
            activeBg={activeBg}
            activeBorderL={activeBorderL}
            activeText={activeText}
            activeAvatarBg={activeAvatarBg}
            activeAvatarText={activeAvatarText}
            onSelect={() => onSelect(item.id)}
          />
        ))}
      </ul>
    </MasterListPanel>
  );
}

// ── Row ──────────────────────────────────────────────────

interface RowProps {
  item: SkalaRecord;
  active: boolean;
  index: number;
  activeBg: string;
  activeBorderL: string;
  activeText: string;
  activeAvatarBg: string;
  activeAvatarText: string;
  onSelect: () => void;
}

function SkalaRow({
  item, active, index, activeBg, activeBorderL, activeText,
  activeAvatarBg, activeAvatarText, onSelect,
}: RowProps) {
  const stsCfg = getSkalaStatusCfg(item.status);
  const initials = skalaInitials(item);

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
            ? cn(activeBg, "border-l-2", activeBorderL)
            : "hover:bg-slate-50/80 border-l-2 border-l-transparent",
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-black tracking-tight",
            active ? cn(activeAvatarBg, activeAvatarText) : "bg-slate-100 text-slate-600",
          )}>
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p className={cn(
              "truncate text-xs font-semibold",
              active ? activeText : "text-slate-700",
            )}>
              {item.nama}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-slate-400">{item.kode}</span>
              {item.singkat && (
                <span className="text-[10px] text-slate-400">· {item.singkat}</span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {item.konsumenModul.map((m) => {
                const cfg = MODUL_CFG[m];
                return (
                  <span key={m} className={cn(
                    "rounded px-1 py-0 text-[9px] font-semibold",
                    cfg.bg, cfg.text,
                  )}>
                    {cfg.label}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="rounded bg-slate-100 px-1.5 py-0 text-[9px] font-semibold text-slate-600">
              {item.items.length} item · {item.interpretasi.length} lvl
            </span>
            {item.status === "Non_Aktif" && (
              <span className={cn("rounded-full px-1 text-[8px]", stsCfg.bg, stsCfg.text)}>off</span>
            )}
          </div>
        </div>

        <p className="mt-1 truncate pl-11 text-[10px] text-slate-400">
          Max skor: {item.totalMax}
        </p>
      </button>
    </motion.li>
  );
}
