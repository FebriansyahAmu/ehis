"use client";

/**
 * KlaimFilterPanel — sticky left 300px (EK2.1).
 *
 * Sections (top → bottom):
 *  1. Pencarian — searchbox (noKlaim/RM/SEP/nama penjamin)
 *  2. Periode kunjungan — 5 preset + custom date range
 *  3. Penjamin tipe — radio chip (BPJS / Asuransi / Jamkesda / Semua)
 *  4. Penjamin spesifik — dropdown nama (max-w 260px, derived dari mock)
 *  5. Era grouper — iDRG / INA-CBG Legacy / All (segmented)
 *  6. Kelas perawatan — 8 chip (KRIS + legacy + ICU/HCU/Isolasi)
 *  7. Status klaim — 13 chip multi-select
 *  8. Unit pelayanan — RI/RJ/SameDay multi-select
 *
 * Body internal scroll (`overflow-y-auto`) — page-level tetap no-scroll.
 * Hidden scrollbar via arbitrary variants supaya estetika tidak ada bar.
 *
 * Form fields:
 * - Font ≥ 12.5px (sesuai instruksi user — hindari `text-xs`).
 * - Text color slate-700/800 (no bright color di input).
 * - Focus ring teal/15 + border teal-500.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  CalendarDays,
  Shield,
  ShieldCheck,
  Building2,
  Layers,
  Tag,
  Sparkles,
  X,
  RotateCcw,
  Filter as FilterIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { KLAIM_BOARD_MOCK, listPenjaminNama } from "./klaimBoardLogic";
import {
  UNIT_CFG,
  KELAS_CFG,
  STATUS_CFG,
  STATUS_ORDER,
  PENJAMIN_OPTIONS,
  ERA_OPTIONS,
  PERIODE_PRESETS,
  KLAIM_TONE,
  applyPeriodePreset,
  countActiveFilters,
  type KlaimFilterState,
  type UnitFilter,
  type KelasFilter,
  type EraFilter,
  type PenjaminFilter,
  type PeriodePreset,
} from "./klaimBoardShared";
import type { ClaimStatus } from "@/lib/eklaim/eklaimShared";

interface Props {
  filters: KlaimFilterState;
  onChange: (next: KlaimFilterState) => void;
  onReset: () => void;
}

export default function KlaimFilterPanel({ filters, onChange, onReset }: Props) {
  const activeCount = countActiveFilters(filters);

  const penjaminNamaList = useMemo(
    () => listPenjaminNama(KLAIM_BOARD_MOCK, filters.penjamin),
    [filters.penjamin],
  );

  const set = <K extends keyof KlaimFilterState>(key: K, value: KlaimFilterState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleArr = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const applyPreset = (preset: PeriodePreset) => {
    const { from, to } = applyPeriodePreset(preset);
    onChange({ ...filters, periodePreset: preset, periodeFrom: from, periodeTo: to });
  };

  // Reset penjaminNama saat tipe penjamin berubah supaya tidak orphaned
  const handlePenjaminChange = (next: PenjaminFilter) => {
    onChange({ ...filters, penjamin: next, penjaminNama: "" });
  };

  return (
    <aside
      aria-label="Panel filter klaim"
      className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-white ring-1 ring-slate-200"
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-teal-50 ring-1 ring-teal-200">
            <FilterIcon size={12} className="text-teal-600" />
          </span>
          <h2 className="text-[13px] font-semibold text-slate-800">Filter &amp; Quick View</h2>
        </div>
        <ActiveBadge count={activeCount} onReset={onReset} />
      </header>

      {/* Body — internal scroll, hidden bar */}
      <div className="flex-1 overflow-y-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-5">
          {/* 1. Pencarian */}
          <Section icon={Search} label="Pencarian">
            <div className="group relative">
              <Search
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500"
              />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => set("search", e.target.value)}
                placeholder="No klaim / RM / SEP / penjamin"
                className="w-full rounded-md border border-slate-200 bg-white py-1.5 pr-7 text-[12.5px] text-slate-800 placeholder:text-slate-400 transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
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

          {/* 2. Periode */}
          <Section icon={CalendarDays} label="Periode Kunjungan">
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
                transition={{ duration: 0.2 }}
                className="mt-2 flex items-center gap-1.5"
              >
                <input
                  type="date"
                  value={filters.periodeFrom}
                  onChange={(e) => set("periodeFrom", e.target.value)}
                  className="w-full max-w-[130px] rounded-md border border-slate-200 bg-white px-2 py-1 text-[12px] text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
                />
                <span className="text-[12px] text-slate-400">→</span>
                <input
                  type="date"
                  value={filters.periodeTo}
                  onChange={(e) => set("periodeTo", e.target.value)}
                  className="w-full max-w-[130px] rounded-md border border-slate-200 bg-white px-2 py-1 text-[12px] text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
                />
              </motion.div>
            )}
          </Section>

          {/* 3. Penjamin tipe */}
          <Section icon={Shield} label="Penjamin">
            <select
              value={filters.penjamin}
              onChange={(e) => handlePenjaminChange(e.target.value as PenjaminFilter)}
              className="w-full max-w-[260px] cursor-pointer appearance-none rounded-md border border-slate-200 bg-white bg-[length:14px] bg-[right_8px_center] bg-no-repeat py-1.5 pl-2.5 pr-7 text-[12.5px] text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
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

            {/* Penjamin spesifik dropdown — appear smooth saat ada nama tersedia */}
            {penjaminNamaList.length > 1 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.2 }}
                className="mt-2"
              >
                <select
                  value={filters.penjaminNama}
                  onChange={(e) => set("penjaminNama", e.target.value)}
                  className="w-full max-w-[260px] cursor-pointer appearance-none rounded-md border border-slate-200 bg-white bg-[length:14px] bg-[right_8px_center] bg-no-repeat py-1.5 pl-2.5 pr-7 text-[12px] text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
                  }}
                >
                  <option value="">Semua nama penjamin</option>
                  {penjaminNamaList.map((nama) => (
                    <option key={nama} value={nama}>
                      {nama}
                    </option>
                  ))}
                </select>
              </motion.div>
            )}
          </Section>

          {/* 4. Era grouper */}
          <Section icon={ShieldCheck} label="Era Grouper">
            <div role="radiogroup" className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 p-0.5">
              {ERA_OPTIONS.map((era) => {
                const active = filters.era === era.value;
                return (
                  <button
                    key={era.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => set("era", era.value as EraFilter)}
                    title={era.hint}
                    className={cn(
                      "rounded px-2.5 py-1 text-[12px] font-medium transition-all duration-150",
                      active
                        ? "bg-white text-teal-700 shadow-sm ring-1 ring-teal-200"
                        : "text-slate-600 hover:text-slate-800",
                    )}
                  >
                    {era.label}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* 5. Unit pelayanan */}
          <Section icon={Building2} label="Unit Pelayanan">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(UNIT_CFG) as UnitFilter[]).map((u) => {
                const cfg = UNIT_CFG[u];
                const tone = KLAIM_TONE[cfg.tone];
                const active = filters.units.includes(u);
                const Icon = cfg.icon!;
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => set("units", toggleArr(filters.units, u))}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium ring-1 transition-all duration-150 active:scale-[0.97]",
                      active
                        ? cn(tone.chipBg, tone.chipText, tone.chipRing)
                        : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-800",
                    )}
                  >
                    <Icon size={11} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* 6. Kelas perawatan */}
          <Section icon={Layers} label="Kelas Perawatan">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(KELAS_CFG) as KelasFilter[]).map((k) => {
                const cfg = KELAS_CFG[k];
                const tone = KLAIM_TONE[cfg.tone];
                const active = filters.kelas.includes(k);
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => set("kelas", toggleArr(filters.kelas, k))}
                    title={cfg.label}
                    className={cn(
                      "inline-flex min-w-[44px] items-center justify-center rounded-md px-2 py-1 text-[12px] font-semibold ring-1 transition-all duration-150 active:scale-[0.97]",
                      active
                        ? cn(tone.chipBg, tone.chipText, tone.chipRing)
                        : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-800",
                    )}
                  >
                    {cfg.short}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* 7. Status klaim */}
          <Section icon={Tag} label="Status Klaim">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_ORDER.map((s) => {
                const cfg = STATUS_CFG[s];
                const tone = KLAIM_TONE[cfg.tone];
                const active = filters.status.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set("status", toggleArr(filters.status, s))}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium ring-1 transition-all duration-150 active:scale-[0.97]",
                      active
                        ? cn(tone.chipBg, tone.chipText, tone.chipRing)
                        : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-800",
                    )}
                  >
                    <span className={cn("inline-block h-1.5 w-1.5 rounded-full", tone.dot)} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </Section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50/60 px-4 py-2.5">
        <FooterStats activeCount={activeCount} onReset={onReset} />
      </footer>
    </aside>
  );
}

// ── Sub-components ──────────────────────────────────────

function Section({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-1.5">
        <Icon size={12} className="text-slate-400" />
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {label}
        </h3>
      </div>
      {children}
    </section>
  );
}

function PresetChip({
  active,
  children,
  onClick,
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
        "rounded-md px-2 py-1 text-[12px] font-medium ring-1 transition-all duration-150 active:scale-[0.97]",
        active
          ? "bg-teal-50 text-teal-700 ring-teal-200"
          : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-800",
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
      className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700 ring-1 ring-teal-200 transition-colors hover:bg-teal-100"
      title="Reset semua filter"
    >
      <Sparkles size={10} />
      <span>{count}</span>
      <X size={10} />
    </button>
  );
}

function FooterStats({ activeCount, onReset }: { activeCount: number; onReset: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-[12px] text-slate-500">
        {activeCount === 0 ? (
          <>Tidak ada filter aktif</>
        ) : (
          <>
            <span className="font-semibold text-slate-700">{activeCount}</span> filter aktif
          </>
        )}
      </p>
      <button
        type="button"
        onClick={onReset}
        disabled={activeCount === 0}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-slate-600 transition-colors hover:bg-white hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <RotateCcw size={11} />
        Reset
      </button>
    </div>
  );
}

// Type re-export untuk konsumer eksternal (KlaimBoardPage)
export type { ClaimStatus };
