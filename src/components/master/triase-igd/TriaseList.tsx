"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MasterListPanel } from "@/components/master/shared";
import {
  type TriaseRecord, TRIASE_TONE_CFG, getTriaseStatusCfg, triaseInitials,
} from "@/lib/master/triaseMock";

interface Props {
  items: TriaseRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
}

type FilterStatus = "Semua" | "Aktif" | "Non_Aktif";

export default function TriaseList({
  items, selectedId, onSelect, onAddNew,
}: Props) {
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("Semua");

  const filtered = items.filter((item) => {
    const q = query.toLowerCase();
    const matchQ = !q
      || item.nama.toLowerCase().includes(q)
      || item.kode.toLowerCase().includes(q);
    const matchS = filterStatus === "Semua" || item.status === filterStatus;
    return matchQ && matchS;
  });

  const hasActiveFilter = filterStatus !== "Semua";
  const aktifCount = items.filter((i) => i.status === "Aktif").length;

  return (
    <MasterListPanel
      accent="amber"
      query={query}
      onQueryChange={setQuery}
      searchPlaceholder="Cari protokol atau kode..."
      visibleCount={filtered.length}
      totalCount={items.length}
      hasActiveFilter={hasActiveFilter}
      onAddNew={onAddNew}
      addLabel="Tambah Protokol"
      isEmpty={filtered.length === 0}
      filterSlot={
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
                    ? "bg-amber-600 text-white"
                    : "border border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600",
                )}
              >
                {s === "Non_Aktif" ? "Non-Aktif" : s}
              </button>
            ))}
          </div>
        </div>
      }
      footer={
        <>
          <strong className="text-slate-700">{aktifCount}</strong> protokol aktif
        </>
      }
    >
      <ul>
        {filtered.map((item, i) => (
          <TriaseRow
            key={item.id}
            item={item}
            active={item.id === selectedId}
            index={i}
            onSelect={() => onSelect(item.id)}
          />
        ))}
      </ul>
    </MasterListPanel>
  );
}

// ── Row ──────────────────────────────────────────────────

function TriaseRow({
  item, active, index, onSelect,
}: {
  item: TriaseRecord;
  active: boolean;
  index: number;
  onSelect: () => void;
}) {
  const stsCfg = getTriaseStatusCfg(item.status);
  const initials = triaseInitials(item);

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
            ? "bg-amber-50 border-l-2 border-l-amber-500"
            : "hover:bg-slate-50/80 border-l-2 border-l-transparent",
        )}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-black tracking-tight",
              active ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600",
            )}
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p className={cn(
              "truncate text-xs font-semibold",
              active ? "text-amber-800" : "text-slate-700",
            )}>
              {item.nama}
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-slate-400">{item.kode}</p>

            <div className="mt-1 flex flex-wrap items-center gap-0.5">
              {item.levels.slice(0, 6).map((lvl) => {
                const tone = TRIASE_TONE_CFG[lvl.tone];
                return (
                  <span
                    key={lvl.id}
                    title={lvl.label}
                    className={cn("h-1.5 w-3 rounded-sm", tone.headerBg)}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="rounded bg-slate-100 px-1.5 py-0 text-[9px] font-semibold text-slate-600">
              {item.levels.length} lvl · {item.parameters.length} param
            </span>
            {item.status === "Non_Aktif" && (
              <span className={cn("rounded-full px-1 text-[8px]", stsCfg.bg, stsCfg.text)}>off</span>
            )}
          </div>
        </div>
      </button>
    </motion.li>
  );
}
