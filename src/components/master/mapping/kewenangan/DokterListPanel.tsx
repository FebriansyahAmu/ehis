"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, UserCog, ChevronDown, Filter, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPESIALIS_LABEL, type SpesialisCode } from "@/components/master/dokter/dokterShared";
import { type DokterRecord } from "@/components/master/dokter/dokterMock";
import { makeInitials } from "../mappingShared";
import type { KewenanganMap } from "./kewenanganShared";
import { countKewenangan } from "./kewenanganShared";

interface DokterListPanelProps {
  dokters: DokterRecord[];
  map: KewenanganMap;
  totalTindakan: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function DokterListPanel({
  dokters, map, totalTindakan, selectedId, onSelect,
}: DokterListPanelProps) {
  const [search, setSearch] = useState("");
  const [spesialisFilter, setSpesialisFilter] = useState<SpesialisCode | "all">("all");

  const spesialisOptions = useMemo(() => {
    const set = new Set<SpesialisCode>();
    for (const d of dokters) if (d.spesialis) set.add(d.spesialis);
    return Array.from(set);
  }, [dokters]);

  const filtered = useMemo(() => {
    return dokters.filter((d) => {
      if (spesialisFilter !== "all" && d.spesialis !== spesialisFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return d.nama.toLowerCase().includes(q) || d.nik.includes(q);
      }
      return true;
    });
  }, [dokters, search, spesialisFilter]);

  return (
    <aside className="flex h-full w-full shrink-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm lg:w-[320px]">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-3 py-2.5">
        <p className="m-sm font-bold text-slate-800">Daftar Dokter</p>
        <p className="m-tiny text-slate-400">
          {dokters.length} dokter · {totalTindakan} tindakan tersedia
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex shrink-0 flex-col gap-2 px-2.5 pb-2.5 pt-2.5">
        <div className="relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama / NIK..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 m-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
          />
        </div>
        <div className="relative">
          <Filter size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={spesialisFilter}
            onChange={(e) => setSpesialisFilter(e.target.value as SpesialisCode | "all")}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-7 m-xs font-medium text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
          >
            <option value="all">Semua Spesialis</option>
            {spesialisOptions.map((s) => (
              <option key={s} value={s}>{SPESIALIS_LABEL[s]}</option>
            ))}
          </select>
          <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <UserCog size={16} className="text-slate-400" />
            </span>
            <p className="m-xs text-slate-500">Tidak ada hasil</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filtered.map((d, i) => (
              <DokterRow
                key={d.id}
                dokter={d}
                index={i}
                granted={countKewenangan(map, d.id)}
                total={totalTindakan}
                selected={selectedId === d.id}
                onClick={() => onSelect(d.id)}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

// ── Sub-components ───────────────────────────────────────

function DokterRow({
  dokter, index, granted, total, selected, onClick,
}: {
  dokter: DokterRecord;
  index: number;
  granted: number;
  total: number;
  selected: boolean;
  onClick: () => void;
}) {
  const initials = makeInitials(dokter.nama);
  const pct = total ? Math.round((granted / total) * 100) : 0;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-all",
        selected ? "bg-teal-50 ring-1 ring-teal-200" : "hover:bg-slate-50",
      )}
    >
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl m-tiny font-black",
        selected ? "bg-teal-200 text-teal-800" : "bg-slate-100 text-slate-600",
      )}>
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn(
          "truncate m-xs font-bold",
          selected ? "text-teal-800" : "text-slate-800",
        )}>
          {dokter.nama}
        </p>
        {dokter.spesialis && (
          <p className="mt-0.5 truncate m-mini text-slate-500">
            {SPESIALIS_LABEL[dokter.spesialis]}
          </p>
        )}
        <div className="mt-1 flex items-center gap-1.5">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={cn("h-full", granted > 0 ? "bg-teal-500" : "bg-slate-200")}
            />
          </div>
          <span className="shrink-0 inline-flex items-center gap-0.5 m-mini font-bold text-teal-700">
            <ShieldCheck size={8} />
            {granted}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
