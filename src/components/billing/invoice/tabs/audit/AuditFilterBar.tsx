"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter, RotateCcw, Download, ChevronDown, Check,
  CalendarDays, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AUDIT_ACTION_CFG, AUDIT_ACTION_ORDER, AUDIT_TONE_PALETTE,
  type AuditActionKind, type AuditActor, type AuditFilterState,
  countActiveAuditFilters,
} from "@/lib/billing/auditTrail";

interface Props {
  filters: AuditFilterState;
  onChange: (next: AuditFilterState) => void;
  onReset: () => void;
  onExport: () => void;
  actors: AuditActor[];
  totalEvents: number;
  filteredEvents: number;
}

/**
 * Filter bar untuk Audit Trail. 3 control + 2 action button.
 *
 *   Action multi-chips (12 kinds) · Actor multi-select dropdown · Date range
 *   ────────────────────────────────────────────────────────────────────
 *   Reset · Export CSV (di kanan, dengan count chip "X / Y events")
 */
export default function AuditFilterBar({
  filters, onChange, onReset, onExport, actors, totalEvents, filteredEvents,
}: Props) {
  const activeCount = countActiveAuditFilters(filters);
  const isFiltered = activeCount > 0;

  const toggleAction = (kind: AuditActionKind) => {
    const next = filters.actions.includes(kind)
      ? filters.actions.filter((k) => k !== kind)
      : [...filters.actions, kind];
    onChange({ ...filters, actions: next });
  };

  return (
    <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header — title + active count + result count + actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
            <Filter size={13} />
          </span>
          <div>
            <h3 className="text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">
              Filter Audit Trail
            </h3>
            <p className="text-[10.5px] text-slate-500">
              <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                {filteredEvents}
              </span>
              {" "}/ {totalEvents} event
              {isFiltered && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  {activeCount} aktif
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onReset}
            disabled={!isFiltered}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all",
              isFiltered
                ? "text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                : "cursor-not-allowed text-slate-300 dark:text-slate-700",
            )}
            title="Reset semua filter"
          >
            <RotateCcw size={11} />
            Reset
          </button>
          <button
            type="button"
            onClick={onExport}
            disabled={filteredEvents === 0}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold ring-1 transition-all",
              filteredEvents > 0
                ? "bg-amber-600 text-white ring-amber-700/40 hover:bg-amber-700 active:scale-[0.97]"
                : "cursor-not-allowed bg-slate-100 text-slate-400 ring-slate-200 dark:bg-slate-800 dark:text-slate-600 dark:ring-slate-700",
            )}
            title="Export filtered events ke CSV (Excel)"
          >
            <Download size={11} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Action chips — 12 kinds, multi-select */}
      <ActionChipsSection
        selected={filters.actions}
        onToggle={toggleAction}
      />

      {/* Actor + Date range — 2 col responsive */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <ActorMultiSelect
          actors={actors}
          selected={filters.actors}
          onChange={(next) => onChange({ ...filters, actors: next })}
        />
        <DateRangeInputs
          from={filters.dateFrom}
          to={filters.dateTo}
          onChange={(from, to) => onChange({ ...filters, dateFrom: from, dateTo: to })}
        />
      </div>
    </div>
  );
}

// ── Action chips ───────────────────────────────────────

function ActionChipsSection({
  selected, onToggle,
}: {
  selected: AuditActionKind[];
  onToggle: (kind: AuditActionKind) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        Jenis Aksi
      </p>
      <div className="flex flex-wrap gap-1">
        {AUDIT_ACTION_ORDER.map((kind) => {
          const cfg = AUDIT_ACTION_CFG[kind];
          const palette = AUDIT_TONE_PALETTE[cfg.tone];
          const Icon = cfg.icon;
          const active = selected.includes(kind);
          return (
            <button
              key={kind}
              type="button"
              onClick={() => onToggle(kind)}
              title={cfg.description}
              aria-pressed={active}
              className={cn(
                "group inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 transition-all active:scale-[0.97]",
                active
                  ? cn(palette.bg, palette.text, palette.ring, "shadow-sm")
                  : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50 hover:text-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700 dark:hover:bg-slate-800",
              )}
            >
              <Icon size={10} />
              <span>{cfg.label}</span>
              {active && <Check size={9} className="opacity-80" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Actor multi-select ─────────────────────────────────

function ActorMultiSelect({
  actors, selected, onChange,
}: {
  actors: AuditActor[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const toggle = (name: string) => {
    onChange(selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name]);
  };

  const label = useMemo(() => {
    if (selected.length === 0) return "Semua aktor";
    if (selected.length === 1) return selected[0];
    return `${selected.length} aktor dipilih`;
  }, [selected]);

  return (
    <div className="relative" ref={wrapRef}>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        Aktor
      </p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md border bg-white px-2.5 py-1.5 text-[12px] text-slate-800 transition-all hover:bg-slate-50",
          "dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
          selected.length > 0 ? "border-amber-300 ring-1 ring-amber-200/50" : "border-slate-200",
        )}
      >
        <span className="inline-flex items-center gap-1.5 truncate">
          <Users size={12} className="flex-none text-slate-400" />
          <span className={cn(selected.length === 0 && "text-slate-400")}>{label}</span>
        </span>
        <ChevronDown size={13} className={cn("flex-none text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
          >
            {actors.length === 0 ? (
              <p className="px-2 py-1 text-[11px] italic text-slate-400">Tidak ada aktor</p>
            ) : (
              actors.map((a) => {
                const active = selected.includes(a.name);
                return (
                  <button
                    key={a.name}
                    type="button"
                    onClick={() => toggle(a.name)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left text-[12px] transition-colors",
                      active
                        ? "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                        : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{a.name}</span>
                      <span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{a.role}</span>
                    </span>
                    {active && <Check size={12} className="flex-none text-amber-600" />}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Date range ─────────────────────────────────────────

function DateRangeInputs({
  from, to, onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        Rentang Tanggal
      </p>
      <div className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <CalendarDays size={12} className="text-slate-400" />
        <input
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => onChange(e.target.value, to)}
          className="border-0 bg-transparent px-1 py-0.5 font-mono text-[11.5px] text-slate-700 outline-none focus:ring-1 focus:ring-amber-300 dark:text-slate-200"
        />
        <span className="text-[10px] text-slate-400">→</span>
        <input
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => onChange(from, e.target.value)}
          className="border-0 bg-transparent px-1 py-0.5 font-mono text-[11.5px] text-slate-700 outline-none focus:ring-1 focus:ring-amber-300 dark:text-slate-200"
        />
      </div>
    </div>
  );
}
