"use client";

import { motion } from "framer-motion";
import {
  Search, CalendarDays, Building2, Shield, Layers, Tag,
  X, RotateCcw, Filter as FilterIcon,
} from "lucide-react";
import {
  UNIT_CFG, KELAS_CFG, STATUS_CFG, PENJAMIN_OPTIONS, PERIODE_PRESETS,
  applyPeriodePreset, countActiveFilters,
  type TagihanFilterState, type UnitFilter, type KelasFilter, type StatusFilter,
  type PenjaminFilter, type PeriodePreset,
} from "./tagihanShared";
import { cn } from "@/lib/utils";

interface Props {
  filters: TagihanFilterState;
  onChange: (next: TagihanFilterState) => void;
  onReset: () => void;
}

export default function TagihanFilterPanel({ filters, onChange, onReset }: Props) {
  const activeCount = countActiveFilters(filters);

  const set = <K extends keyof TagihanFilterState>(key: K, value: TagihanFilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleArr = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const applyPreset = (preset: PeriodePreset) => {
    const { from, to } = applyPeriodePreset(preset);
    onChange({ ...filters, periodePreset: preset, periodeFrom: from, periodeTo: to });
  };

  return (
    <aside
      aria-label="Panel filter tagihan"
      className="flex h-full w-full flex-col overflow-hidden bg-white ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800 lg:w-[300px] lg:rounded-xl"
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-amber-50 ring-1 ring-amber-200">
            <FilterIcon size={12} className="text-amber-600" />
          </span>
          <h2 className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
            Filter & Quick View
          </h2>
        </div>
        <ActiveBadge count={activeCount} onReset={onReset} />
      </header>

      {/* Body — internal scroll, no long-scroll page-level */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-5">
          {/* Pencarian */}
          <Section icon={Search} label="Pencarian">
            <div className="group relative">
              <Search
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500"
              />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => set("search", e.target.value)}
                placeholder="No tagihan / nama / no RM"
                className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-7.5 pr-7 text-[12.5px] text-slate-800 placeholder:text-slate-400 transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                style={{ paddingLeft: 28 }}
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => set("search", "")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </Section>

          {/* Periode */}
          <Section icon={CalendarDays} label="Periode">
            <div className="flex flex-wrap gap-1.5">
              {PERIODE_PRESETS.map((p) => (
                <PresetChip
                  key={p.value}
                  active={filters.periodePreset === p.value}
                  onClick={() => applyPreset(p.value)}
                >
                  {p.label}
                </PresetChip>
              ))}
            </div>
            {filters.periodePreset === "custom" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.18 }}
                className="mt-2 flex items-center gap-1.5"
              >
                <input
                  type="date"
                  value={filters.periodeFrom}
                  onChange={(e) => set("periodeFrom", e.target.value)}
                  className="w-full max-w-[130px] rounded-md border border-slate-200 bg-white px-2 py-1 text-[11.5px] text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
                <span className="text-[11px] text-slate-400">→</span>
                <input
                  type="date"
                  value={filters.periodeTo}
                  onChange={(e) => set("periodeTo", e.target.value)}
                  className="w-full max-w-[130px] rounded-md border border-slate-200 bg-white px-2 py-1 text-[11.5px] text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                />
              </motion.div>
            )}
          </Section>

          {/* Unit */}
          <Section icon={Building2} label="Unit Pelayanan">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(UNIT_CFG) as UnitFilter[]).map((u) => {
                const cfg = UNIT_CFG[u];
                const active = filters.units.includes(u);
                const Icon = cfg.icon!;
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => set("units", toggleArr(filters.units, u))}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-medium ring-1 transition-all duration-150 active:scale-[0.97]",
                      active
                        ? cn(cfg.bg, cfg.text, cfg.ring)
                        : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700",
                    )}
                  >
                    <Icon size={11} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Penjamin */}
          <Section icon={Shield} label="Penjamin">
            <select
              value={filters.penjamin}
              onChange={(e) => set("penjamin", e.target.value as PenjaminFilter)}
              className="w-full max-w-[260px] cursor-pointer appearance-none rounded-md border border-slate-200 bg-white bg-[length:14px] bg-[right_8px_center] bg-no-repeat py-1.5 pl-2.5 pr-7 text-[12.5px] text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
              }}
            >
              {PENJAMIN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Section>

          {/* Kelas */}
          <Section icon={Layers} label="Kelas Perawatan">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(KELAS_CFG) as KelasFilter[]).map((k) => {
                const cfg = KELAS_CFG[k];
                const active = filters.kelas.includes(k);
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => set("kelas", toggleArr(filters.kelas, k))}
                    className={cn(
                      "inline-flex min-w-[42px] items-center justify-center rounded-md px-2 py-1 text-[11.5px] font-semibold ring-1 transition-all duration-150 active:scale-[0.97]",
                      active
                        ? "bg-amber-50 text-amber-700 ring-amber-300"
                        : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700",
                    )}
                    title={cfg.label}
                  >
                    {cfg.short}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Status */}
          <Section icon={Tag} label="Status Tagihan">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(STATUS_CFG) as StatusFilter[]).map((s) => {
                const cfg = STATUS_CFG[s];
                const active = filters.status.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set("status", toggleArr(filters.status, s))}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ring-1 transition-all duration-150 active:scale-[0.97]",
                      active
                        ? cn(cfg.bg, cfg.text, cfg.ring)
                        : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700",
                    )}
                  >
                    <span className={cn("inline-block h-1.5 w-1.5 rounded-full", cfg.dot)} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </Section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50/60 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/60">
        <FooterStats activeCount={activeCount} onReset={onReset} />
      </footer>
    </aside>
  );
}

// ── Sub-components ──────────────────────────────────────

function Section({
  icon: Icon, label, children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-1.5">
        <Icon size={12} className="text-slate-400" />
        <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {label}
        </h3>
      </div>
      {children}
    </section>
  );
}

function PresetChip({
  active, children, onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2 py-1 text-[11.5px] font-medium ring-1 transition-all duration-150 active:scale-[0.97]",
        active
          ? "bg-amber-50 text-amber-700 ring-amber-300"
          : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700",
      )}
    >
      {children}
    </button>
  );
}

function ActiveBadge({ count, onReset }: { count: number; onReset: () => void }) {
  if (count === 0) return null;
  return (
    <button
      type="button"
      onClick={onReset}
      className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700 ring-1 ring-amber-200 transition-colors hover:bg-amber-100"
      title="Reset semua filter"
    >
      <span>{count}</span>
      <X size={10} />
    </button>
  );
}

function FooterStats({ activeCount, onReset }: { activeCount: number; onReset: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        {activeCount === 0 ? (
          <>Tidak ada filter aktif</>
        ) : (
          <>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{activeCount}</span> filter aktif
          </>
        )}
      </p>
      <button
        type="button"
        onClick={onReset}
        disabled={activeCount === 0}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:bg-white hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <RotateCcw size={11} />
        Reset
      </button>
    </div>
  );
}
