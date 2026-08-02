"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Search, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEVEL_META, type Level, type WilayahDTO } from "./wilayahBrowserShared";

interface WilayahColumnProps {
  level: Level;
  /** Kolom aktif = induk sudah terpilih (atau level 1). */
  active: boolean;
  /** Label induk (untuk placeholder "Pilih {induk} dulu"). */
  parentLabel?: string;
  items: WilayahDTO[];
  loading: boolean;
  selectedKode: string | null;
  onSelect: (node: WilayahDTO) => void;
}

const TONE_BADGE: Record<string, string> = {
  sky: "bg-sky-50 text-sky-700",
  teal: "bg-teal-50 text-teal-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
};

function SkeletonRows() {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded-lg px-2.5 py-2"
          style={{ opacity: 1 - i * 0.08 }}
        >
          <div className="h-3.5 flex-1 animate-pulse rounded bg-slate-200/80" style={{ width: `${70 - (i % 4) * 12}%` }} />
          <div className="h-2.5 w-8 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function WilayahColumn({
  level,
  active,
  parentLabel,
  items,
  loading,
  selectedKode,
  onSelect,
}: WilayahColumnProps) {
  const meta = LEVEL_META[level];
  const Icon = meta.icon;
  const [filter, setFilter] = useState("");

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.nama.toLowerCase().includes(q) || i.kode.includes(q));
  }, [items, filter]);

  const showFilter = active && !loading && items.length > 8;
  const isLeaf = level === 4;

  return (
    <section className="flex h-full min-w-60 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-slate-100 px-3 py-2.5">
        <span className={cn("grid size-7 place-items-center rounded-lg ring-1 ring-inset", meta.chip)}>
          <Icon size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-slate-800">{meta.label}</p>
        </div>
        {active && !loading && (
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums", TONE_BADGE[meta.tone])}>
            {items.length}
          </span>
        )}
      </div>

      {/* Filter */}
      {showFilter && (
        <div className="shrink-0 border-b border-slate-100 p-2">
          <div className="relative">
            <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={`Saring ${meta.short.toLowerCase()}…`}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/60 py-1.5 pl-8 pr-2.5 text-[13px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
      )}

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!active ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <span className="grid size-9 place-items-center rounded-xl bg-slate-50 text-slate-300">
              <Icon size={18} />
            </span>
            <p className="text-[12px] leading-relaxed text-slate-400">
              Pilih {parentLabel ?? "induk"} dulu untuk melihat {meta.label.toLowerCase()}
            </p>
          </div>
        ) : loading ? (
          <SkeletonRows />
        ) : shown.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-slate-400">
            <Inbox size={18} />
            <p className="text-[12px]">{filter ? "Tak ada yang cocok" : "Tidak ada data"}</p>
          </div>
        ) : (
          <ul className="p-1.5">
            {shown.map((node, idx) => {
              const selected = node.kode === selectedKode;
              return (
                <motion.li
                  key={node.kode}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.16, delay: Math.min(idx * 0.006, 0.12) }}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(node)}
                    className={cn(
                      "group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
                      selected ? "bg-indigo-50 ring-1 ring-inset ring-indigo-200" : "hover:bg-slate-50",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-[13px]", selected ? "font-semibold text-indigo-900" : "font-medium text-slate-700")}>
                        {node.nama}
                      </span>
                      <span className={cn("block font-mono text-[10.5px] tabular-nums", selected ? "text-indigo-400" : "text-slate-400")}>
                        {node.kode}
                      </span>
                    </span>
                    {!isLeaf && (
                      <ChevronRight
                        size={15}
                        className={cn(
                          "shrink-0 transition-transform",
                          selected ? "text-indigo-500" : "text-slate-300 group-hover:translate-x-0.5 group-hover:text-slate-400",
                        )}
                      />
                    )}
                  </button>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
