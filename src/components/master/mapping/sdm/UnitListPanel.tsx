"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UnitItem, AssignmentMap } from "./sdmShared";
import { countSDMPerUnit } from "./sdmShared";

interface UnitListPanelProps {
  units: UnitItem[];
  assignments: AssignmentMap;
  selectedKode: string | null;
  onSelect: (kode: string) => void;
}

const CATEGORY_ORDER: UnitItem["category"][] = [
  "Unit Klinis",
  "Poli",
  "Unit Penunjang",
  "Unit Operasional",
];

const CATEGORY_CFG: Record<
  UnitItem["category"],
  { label: string; iconBg: string; iconText: string }
> = {
  "Unit Klinis":      { label: "Unit Klinis",      iconBg: "bg-rose-50",    iconText: "text-rose-600" },
  "Poli":             { label: "Poliklinik",       iconBg: "bg-sky-50",     iconText: "text-sky-600" },
  "Unit Penunjang":   { label: "Penunjang",        iconBg: "bg-violet-50",  iconText: "text-violet-600" },
  "Unit Operasional": { label: "Operasional",      iconBg: "bg-amber-50",   iconText: "text-amber-600" },
};

export default function UnitListPanel({
  units, assignments, selectedKode, onSelect,
}: UnitListPanelProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return units;
    const q = search.toLowerCase();
    return units.filter((u) =>
      u.nama.toLowerCase().includes(q) || u.kode.toLowerCase().includes(q),
    );
  }, [units, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, UnitItem[]> = {};
    for (const cat of CATEGORY_ORDER) groups[cat] = [];
    for (const u of filtered) {
      (groups[u.category] ??= []).push(u);
    }
    return groups;
  }, [filtered]);

  const maxCount = useMemo(() => {
    let max = 0;
    for (const u of units) {
      const c = countSDMPerUnit(assignments, u.kode);
      if (c > max) max = c;
    }
    return Math.max(max, 1);
  }, [units, assignments]);

  return (
    <aside className="flex h-full w-full shrink-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm lg:w-[300px]">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-3 py-2.5">
        <p className="m-xs font-bold text-slate-800">Unit / Poli</p>
        <p className="m-tiny text-slate-400">{units.length} unit total</p>
      </div>

      {/* Search */}
      <div className="shrink-0 px-2.5 pb-2 pt-2.5">
        <div className="relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari unit..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 m-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
          />
        </div>
      </div>

      {/* List grouped by category */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {filtered.length === 0 ? (
          <p className="px-3 py-8 text-center m-xs text-slate-400">
            Tidak ada unit cocok
          </p>
        ) : (
          CATEGORY_ORDER.map((cat) => {
            const items = grouped[cat];
            if (!items?.length) return null;
            const catCfg = CATEGORY_CFG[cat];
            return (
              <div key={cat} className="mt-2">
                <p className="mb-1 flex items-center gap-1 px-2 m-mini font-semibold uppercase tracking-widest text-slate-400">
                  {catCfg.label}
                  <span className="text-slate-300">({items.length})</span>
                </p>
                <div className="flex flex-col gap-0.5">
                  {items.map((u) => (
                    <UnitRow
                      key={u.kode}
                      unit={u}
                      catCfg={catCfg}
                      count={countSDMPerUnit(assignments, u.kode)}
                      maxCount={maxCount}
                      selected={selectedKode === u.kode}
                      onClick={() => onSelect(u.kode)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

// ── Sub-components ───────────────────────────────────────

function UnitRow({
  unit, catCfg, count, maxCount, selected, onClick,
}: {
  unit: UnitItem;
  catCfg: { iconBg: string; iconText: string };
  count: number;
  maxCount: number;
  selected: boolean;
  onClick: () => void;
}) {
  const pct = Math.round((count / maxCount) * 100);
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors",
        selected ? "bg-teal-50 ring-1 ring-teal-200" : "hover:bg-slate-50",
      )}
    >
      <span className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
        selected ? "bg-teal-200 text-teal-700" : cn(catCfg.iconBg, catCfg.iconText),
      )}>
        <Building2 size={12} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn(
          "truncate m-xs font-semibold",
          selected ? "text-teal-800" : "text-slate-800",
        )}>
          {unit.nama}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={cn("h-full", count > 0 ? "bg-teal-500" : "bg-slate-200")}
            />
          </div>
          <span className={cn(
            "shrink-0 font-mono m-mini font-semibold",
            count > 0 ? "text-teal-700" : "text-slate-400",
          )}>
            {count}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
