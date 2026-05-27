"use client";

/**
 * BandingFilterPanel — sticky left 260px (EK6.1).
 *
 * Sections:
 *  1. Pencarian — no banding / no klaim / pasienId
 *  2. Periode submit — 3 preset + custom range
 *  3. Penjamin — BPJS / Asuransi / Jamkesda / Semua
 *  4. Tingkat banding — 1 / 2 / Semua
 *  5. Status banding — 4 chip (Submitted/Review/Approved/Rejected)
 *
 * Semua font ≥ text-sm (12px+). Warna field: slate-700/800. No bright colors.
 * Internal scroll — page no-scroll.
 */

import { motion } from "framer-motion";
import {
  Search,
  CalendarDays,
  Shield,
  Layers,
  Tag,
  X,
  RotateCcw,
  Filter as FilterIcon,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  BANDING_TONE,
  BANDING_STATUS_CFG,
  BANDING_STATUS_ORDER,
  applyBandingPeriodePreset,
  countBandingActiveFilters,
  type BandingFilterState,
  type BandingStatusFilter,
  type PenjaminFilter,
  type TingkatFilter,
  type PeriodePreset,
} from "./bandingShared";

// ── Preset options ─────────────────────────────────────────

const PERIODE_PRESETS: { value: PeriodePreset; label: string }[] = [
  { value: "7d",  label: "7 Hari"   },
  { value: "30d", label: "30 Hari"  },
  { value: "90d", label: "3 Bulan"  },
  { value: "custom", label: "Custom" },
];

const PENJAMIN_OPTS: { value: PenjaminFilter; label: string }[] = [
  { value: "all",       label: "Semua Penjamin" },
  { value: "bpjs",      label: "BPJS Kesehatan" },
  { value: "asuransi",  label: "Asuransi Swasta" },
  { value: "jamkesda",  label: "Jamkesda"        },
];

const TINGKAT_OPTS: { value: TingkatFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "1",   label: "Tingkat 1" },
  { value: "2",   label: "Tingkat 2" },
];

// ── Props ─────────────────────────────────────────────────

interface Props {
  filters: BandingFilterState;
  onChange: (next: BandingFilterState) => void;
  onReset: () => void;
}

// ── Sub-components ────────────────────────────────────────

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
        "rounded-md px-2.5 py-1 text-sm font-medium ring-1 transition-all duration-150 active:scale-[0.97]",
        active
          ? "bg-teal-50 text-teal-700 ring-teal-200"
          : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-800",
      )}
    >
      {children}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────

export default function BandingFilterPanel({ filters, onChange, onReset }: Props) {
  const activeCount = countBandingActiveFilters(filters);

  const set = <K extends keyof BandingFilterState>(key: K, val: BandingFilterState[K]) =>
    onChange({ ...filters, [key]: val });

  const applyPreset = (preset: PeriodePreset) => {
    const { from, to } = applyBandingPeriodePreset(preset);
    onChange({ ...filters, periodePreset: preset, periodeFrom: from, periodeTo: to });
  };

  return (
    <aside
      aria-label="Panel filter banding"
      className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-white ring-1 ring-slate-200"
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-teal-50 ring-1 ring-teal-200">
            <FilterIcon size={12} className="text-teal-600" />
          </span>
          <h2 className="text-sm font-semibold text-slate-800">Filter Banding</h2>
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700 ring-1 ring-teal-200 transition-colors hover:bg-teal-100"
            title="Reset semua filter"
          >
            <Sparkles size={10} />
            <span>{activeCount}</span>
            <X size={10} />
          </button>
        )}
      </header>

      {/* Body — internal scroll */}
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
                placeholder="No banding / no klaim / pasien"
                className="w-full rounded-md border border-slate-200 bg-white py-1.5 pr-7 text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
                style={{ paddingLeft: 28 }}
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => set("search", "")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Hapus pencarian"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </Section>

          {/* 2. Periode Submit */}
          <Section icon={CalendarDays} label="Periode Submit">
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
                  className="w-full max-w-[126px] rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
                />
                <span className="text-sm text-slate-400">→</span>
                <input
                  type="date"
                  value={filters.periodeTo}
                  onChange={(e) => set("periodeTo", e.target.value)}
                  className="w-full max-w-[126px] rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
                />
              </motion.div>
            )}
          </Section>

          {/* 3. Penjamin */}
          <Section icon={Shield} label="Penjamin">
            <select
              value={filters.penjamin}
              onChange={(e) => set("penjamin", e.target.value as PenjaminFilter)}
              className="w-full cursor-pointer appearance-none rounded-md border border-slate-200 bg-white bg-[length:14px] bg-[right_8px_center] bg-no-repeat py-1.5 pl-2.5 pr-7 text-sm text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/15"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
              }}
            >
              {PENJAMIN_OPTS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Section>

          {/* 4. Tingkat */}
          <Section icon={Layers} label="Tingkat Banding">
            <div
              role="radiogroup"
              className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 p-0.5"
            >
              {TINGKAT_OPTS.map((opt) => {
                const active = filters.tingkat === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => set("tingkat", opt.value as TingkatFilter)}
                    className={cn(
                      "rounded px-3 py-1 text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-white text-teal-700 shadow-sm ring-1 ring-teal-200"
                        : "text-slate-600 hover:text-slate-800",
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* 5. Status Banding */}
          <Section icon={Tag} label="Status Banding">
            <div className="flex flex-col gap-1.5">
              {/* "Semua" chip */}
              <button
                type="button"
                onClick={() => set("status", "all")}
                className={cn(
                  "inline-flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ring-1 transition-all duration-150",
                  filters.status === "all"
                    ? "bg-slate-800 text-white ring-slate-700"
                    : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
                )}
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
                Semua Status
              </button>

              {BANDING_STATUS_ORDER.map((s) => {
                const cfg = BANDING_STATUS_CFG[s];
                const tone = BANDING_TONE[cfg.tone];
                const active = filters.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      set("status", active ? "all" : (s as BandingStatusFilter))
                    }
                    className={cn(
                      "inline-flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ring-1 transition-all duration-150",
                      active
                        ? cn(tone.chipBg, tone.chipText, tone.chipRing)
                        : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
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
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-slate-500">
            {activeCount === 0 ? (
              "Tidak ada filter aktif"
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
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw size={11} />
            Reset
          </button>
        </div>
      </footer>
    </aside>
  );
}
