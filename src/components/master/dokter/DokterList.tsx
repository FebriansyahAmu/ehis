"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, UserCog, Filter, ChevronDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STATUS_CFG, namaInitials,
  type DokterListItemDTO, type StatusPraktik,
} from "./dokterShared";

interface DokterListProps {
  dokters: DokterListItemDTO[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Buka modal provisioning (cari pegawai dokter tanpa profil → lengkapi). */
  onProvision: () => void;
}

export default function DokterList({
  dokters, selectedId, onSelect, onProvision,
}: DokterListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusPraktik | "all">("all");

  const filtered = useMemo(() => {
    return dokters.filter((d) => {
      if (statusFilter !== "all" && d.statusPraktik !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        d.namaTampil.toLowerCase().includes(q) ||
        d.nip.toLowerCase().includes(q) ||
        (d.noStr?.toLowerCase().includes(q) ?? false) ||
        (d.noSip?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [dokters, search, statusFilter]);

  const stats = useMemo(() => ({
    total: dokters.length,
    active: dokters.filter((d) => d.statusPraktik === "Aktif").length,
    spesialis: dokters.filter((d) => d.spesialisKode !== "Umum").length,
  }), [dokters]);

  return (
    <aside className="flex h-full w-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm lg:w-[380px] lg:shrink-0">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-xs font-bold text-slate-800">Dokter & Nakes</p>
          <p className="text-[10px] text-slate-400">
            {stats.total} total · {stats.active} aktif · {stats.spesialis} spesialis
          </p>
        </div>
        <button
          type="button"
          onClick={onProvision}
          title="Lengkapi profil dokter dari data pegawai"
          className="flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98]"
        >
          <Plus size={11} />
          Lengkapi Profil
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex shrink-0 flex-col gap-2 px-3 pb-3 pt-3">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama / NIP / STR / SIP..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 text-[11px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
          />
        </div>
        <div className="relative">
          <Filter size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusPraktik | "all")}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-7 text-[11px] font-medium text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
          >
            <option value="all">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Cuti">Cuti</option>
            <option value="Non_Aktif">Non-Aktif</option>
          </select>
          <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <UserCog size={16} className="text-slate-400" />
            </span>
            <p className="text-[11px] text-slate-500">
              {dokters.length === 0 ? "Belum ada profil dokter" : "Tidak ada hasil"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filtered.map((d, i) => (
              <DokterRow
                key={d.id}
                dokter={d}
                index={i}
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

function DokterRow({
  dokter, index, selected, onClick,
}: {
  dokter: DokterListItemDTO;
  index: number;
  selected: boolean;
  onClick: () => void;
}) {
  const status = STATUS_CFG[dokter.statusPraktik];
  const expired = dokter.strExpired || dokter.sipExpired;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
      className={cn(
        "group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all",
        selected ? "bg-teal-50 ring-1 ring-teal-200" : "hover:bg-slate-50",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-black",
          selected ? "bg-teal-200 text-teal-800" : "bg-slate-100 text-slate-600",
        )}
      >
        {namaInitials(dokter.namaTampil)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-slate-800">{dokter.namaTampil}</p>
        <p className="mt-0.5 truncate text-[10px] text-slate-500">{dokter.spesialisLabel}</p>
        <p className="mt-0.5 truncate font-mono text-[9px] text-slate-400">NIP {dokter.nip}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold", status.bg, status.text)}>
          {status.label}
        </span>
        {expired && (
          <span
            title={cn(dokter.strExpired && "STR kedaluwarsa", dokter.sipExpired && "SIP kedaluwarsa")}
            className="flex items-center gap-0.5 rounded-full bg-rose-50 px-1.5 py-0.5 text-[8px] font-semibold text-rose-600"
          >
            <AlertTriangle size={8} />
            {dokter.strExpired && dokter.sipExpired ? "STR+SIP" : dokter.strExpired ? "STR" : "SIP"}
          </span>
        )}
      </div>
    </motion.button>
  );
}
