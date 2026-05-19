"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Users, UserPlus, ArrowRightLeft, CheckSquare, Square,
  Calendar, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type SDMItem, type UnitItem, type SDMCategory, type AssignmentMap,
  CATEGORY_CFG, STATUS_CFG,
} from "./sdmShared";

interface SDMRosterPanelProps {
  unit: UnitItem;
  allSDM: SDMItem[];
  assignments: AssignmentMap;
  onToggle: (sdmId: string, unitKode: string) => void;
  onOpenBulkMove: (selectedIds: string[]) => void;
}

const CATEGORY_FILTERS: { value: SDMCategory | "all"; label: string }[] = [
  { value: "all",         label: "Semua" },
  { value: "Dokter",      label: "Dokter" },
  { value: "Perawat",     label: "Perawat" },
  { value: "Apoteker",    label: "Apoteker" },
  { value: "Radiografer", label: "Radiografer" },
  { value: "Kasir",       label: "Kasir" },
  { value: "Registrasi",  label: "Registrasi" },
];

type ViewMode = "assigned" | "available";

export default function SDMRosterPanel({
  unit, allSDM, assignments, onToggle, onOpenBulkMove,
}: SDMRosterPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("assigned");
  const [categoryFilter, setCategoryFilter] = useState<SDMCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reset selection when unit changes
  useMemo(() => setSelectedIds(new Set()), [unit.kode]);

  const filtered = useMemo(() => {
    return allSDM.filter((sdm) => {
      const isAssigned = (assignments[sdm.id] ?? []).includes(unit.kode);
      if (viewMode === "assigned" && !isAssigned) return false;
      if (viewMode === "available" && isAssigned) return false;

      if (categoryFilter !== "all" && sdm.roleCategory !== categoryFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        if (!sdm.nama.toLowerCase().includes(q) && !sdm.roleLabel.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [allSDM, assignments, unit.kode, viewMode, categoryFilter, search]);

  const assignedCount = useMemo(
    () => allSDM.filter((s) => (assignments[s.id] ?? []).includes(unit.kode)).length,
    [allSDM, assignments, unit.kode],
  );
  const availableCount = allSDM.length - assignedCount;

  const allSelected = filtered.length > 0 && filtered.every((s) => selectedIds.has(s.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((s) => s.id)));
    }
  };

  const handleBulkMove = () => {
    onOpenBulkMove(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-100 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-600">
                {unit.category}
              </p>
              <span className="font-mono text-[9px] text-slate-400">{unit.kode}</span>
            </div>
            <h2 className="mt-0.5 truncate text-sm font-bold text-slate-900">{unit.nama}</h2>
            <p className="mt-0.5 text-[10px] text-slate-500">
              <span className="font-semibold text-teal-700">{assignedCount}</span> SDM terdaftar
              · <span className="text-slate-600">{availableCount}</span> tersedia
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="shrink-0 border-b border-slate-100 px-4 py-2.5">
        {/* View mode tabs */}
        <div className="mb-2 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          <ViewModeButton
            active={viewMode === "assigned"}
            onClick={() => setViewMode("assigned")}
            label={`Bertugas (${assignedCount})`}
          />
          <ViewModeButton
            active={viewMode === "available"}
            onClick={() => setViewMode("available")}
            label={`Tersedia (${availableCount})`}
          />
        </div>

        {/* Search + category filter row */}
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / peran..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-3 text-[11px] text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {CATEGORY_FILTERS.map((f) => {
              const active = categoryFilter === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setCategoryFilter(f.value)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[10px] font-semibold transition",
                    active
                      ? "bg-teal-600 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bulk action bar — appears when selection exists in assigned view */}
      <AnimatePresence initial={false}>
        {someSelected && viewMode === "assigned" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="shrink-0 overflow-hidden border-b border-teal-200 bg-teal-50/60"
          >
            <div className="flex items-center justify-between gap-2 px-4 py-2">
              <p className="text-[11px] font-semibold text-teal-800">
                {selectedIds.size} SDM dipilih
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="rounded-md border border-teal-200 bg-white px-2 py-1 text-[10px] font-semibold text-teal-700 transition hover:bg-teal-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleBulkMove}
                  className="flex items-center gap-1 rounded-md bg-teal-600 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98]"
                >
                  <ArrowRightLeft size={10} />
                  Pindahkan
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List header — select all (only in assigned view) */}
      {filtered.length > 0 && viewMode === "assigned" && (
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 bg-slate-50/30 px-4 py-1.5">
          <button
            type="button"
            onClick={toggleSelectAll}
            aria-label={allSelected ? "Batal pilih semua" : "Pilih semua"}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 transition hover:text-slate-700"
          >
            {allSelected
              ? <CheckSquare size={12} className="text-teal-600" />
              : <Square size={12} />}
            Pilih semua ({filtered.length})
          </button>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {filtered.length === 0 ? (
          <EmptyList viewMode={viewMode} unitName={unit.nama} />
        ) : (
          <div className="flex flex-col gap-1">
            {filtered.map((sdm, i) => (
              <SDMRow
                key={sdm.id}
                sdm={sdm}
                unitKode={unit.kode}
                index={i}
                viewMode={viewMode}
                selected={selectedIds.has(sdm.id)}
                allUnitsCount={(assignments[sdm.id] ?? []).length}
                onToggleSelect={() => toggleSelect(sdm.id)}
                onToggleAssign={() => onToggle(sdm.id, unit.kode)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Sub-components ───────────────────────────────────────

function ViewModeButton({
  active, onClick, label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2.5 py-1 text-[10px] font-semibold transition",
        active
          ? "bg-white text-slate-800 shadow-sm"
          : "text-slate-500 hover:text-slate-700",
      )}
    >
      {label}
    </button>
  );
}

function SDMRow({
  sdm, unitKode, index, viewMode, selected, allUnitsCount, onToggleSelect, onToggleAssign,
}: {
  sdm: SDMItem;
  unitKode: string;
  index: number;
  viewMode: ViewMode;
  selected: boolean;
  allUnitsCount: number;
  onToggleSelect: () => void;
  onToggleAssign: () => void;
}) {
  const cat = CATEGORY_CFG[sdm.roleCategory];
  const status = STATUS_CFG[sdm.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: viewMode === "assigned" ? 20 : -20 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.015, 0.2) }}
      className={cn(
        "group flex items-center gap-2 rounded-lg border border-transparent px-2 py-2 transition-all",
        selected ? "border-teal-200 bg-teal-50/60" : "hover:bg-slate-50",
      )}
    >
      {/* Checkbox (assigned view) — di sebelah kiri */}
      {viewMode === "assigned" && (
        <button
          type="button"
          onClick={onToggleSelect}
          aria-label={selected ? "Batal pilih" : "Pilih"}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 transition hover:text-teal-600"
        >
          {selected
            ? <CheckSquare size={13} className="text-teal-600" />
            : <Square size={13} />}
        </button>
      )}

      {/* Avatar */}
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-black",
        cat.bg, cat.text,
      )}>
        {sdm.initials}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[11px] font-bold text-slate-800">{sdm.nama}</p>
          <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold", status.bg, status.text)}>
            {status.label}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium", cat.text)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", cat.dot)} />
            {sdm.roleLabel}
          </span>
          {sdm.sinceISO && viewMode === "assigned" && (
            <span className="flex items-center gap-0.5 text-[9px] text-slate-400">
              <Calendar size={8} />
              {fmtSince(sdm.sinceISO)}
            </span>
          )}
          {viewMode === "available" && allUnitsCount > 0 && (
            <span className="text-[9px] text-slate-400">
              · di {allUnitsCount} unit lain
            </span>
          )}
        </div>
      </div>

      {/* Action: toggle assignment */}
      <button
        type="button"
        onClick={onToggleAssign}
        className={cn(
          "flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-semibold transition",
          viewMode === "assigned"
            ? "border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100"
            : "bg-teal-600 text-white shadow-sm hover:bg-teal-700 active:scale-[0.98]",
        )}
        title={viewMode === "assigned" ? "Lepas dari unit" : "Assign ke unit"}
      >
        {viewMode === "assigned" ? (
          <>Lepas</>
        ) : (
          <><UserPlus size={10} />Assign</>
        )}
      </button>
    </motion.div>
  );
}

function EmptyList({ viewMode, unitName }: { viewMode: ViewMode; unitName: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 px-4 py-12 text-center">
      <span className={cn(
        "flex h-12 w-12 items-center justify-center rounded-2xl",
        viewMode === "assigned" ? "bg-slate-100" : "bg-teal-50",
      )}>
        {viewMode === "assigned"
          ? <Users size={20} className="text-slate-400" />
          : <CheckCircle2 size={20} className="text-teal-500" />}
      </span>
      <div className="max-w-xs">
        <p className="text-xs font-semibold text-slate-700">
          {viewMode === "assigned"
            ? `Belum ada SDM di ${unitName}`
            : "Semua SDM sudah ter-assign"}
        </p>
        <p className="mt-1 text-[10px] text-slate-500">
          {viewMode === "assigned"
            ? "Switch ke tab Tersedia untuk meng-assign SDM ke unit ini."
            : "Tidak ada SDM yang belum ditugaskan ke unit ini."}
        </p>
      </div>
    </div>
  );
}

function fmtSince(iso: string): string {
  return `Sejak ${new Date(iso).toLocaleDateString("id-ID", {
    month: "short", year: "numeric",
  })}`;
}
