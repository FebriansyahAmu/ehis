"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Download,
  Printer,
  Info,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  buildComparatorData,
  buildMDCComparatorRows,
  type ComparatorPenjamin,
  type ComparatorPoint,
  type MDCComparatorRow,
} from "@/lib/eklaim/dashboardShared";
import { formatRupiahShort, formatRupiah } from "@/lib/eklaim/money";
import { downloadCSV, todayISO } from "@/lib/eklaim/exportUtils";
import KopSuratEklaim from "@/components/eklaim/berkas/KopSuratEklaim";

// ── Print isolation + watermark ─────────────────────────

const PRINT_ID = "comparator-print-area";

const PRINT_STYLE = `
@media print {
  body > * { visibility: hidden; }
  #${PRINT_ID}, #${PRINT_ID} * { visibility: visible; }
  #${PRINT_ID} {
    position: fixed; inset: 0;
    background: white; padding: 1cm;
    font-family: sans-serif; font-size: 11px;
  }
  @page { size: A4 portrait; margin: 1cm; }
  #${PRINT_ID}::after {
    content: "INTERNAL USE — REFERENCE ONLY";
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    font-size: 48px; font-weight: 700;
    color: rgba(0,0,0,0.06);
    pointer-events: none; z-index: 9999;
    white-space: nowrap;
  }
}
`;

// ── SVG chart constants ─────────────────────────────────

const CW = 520;
const CH = 200;
const PL = 46;   // left padding (Y-axis labels)
const PR = 12;
const PT = 16;
const PB = 40;
const IW = CW - PL - PR;
const IH = CH - PT - PB;

function xAt(i: number, n: number): number {
  return PL + (i / Math.max(n - 1, 1)) * IW;
}

function yAt(v: number, yMin: number, yMax: number): number {
  const range = yMax - yMin || 1;
  return PT + (1 - (v - yMin) / range) * IH;
}

function toLinePath(
  data: ComparatorPoint[],
  key: "idrgMarginPct" | "inaCbgMarginPct",
  yMin: number,
  yMax: number,
): string {
  return data
    .map((p, i) =>
      `${i === 0 ? "M" : "L"}${xAt(i, data.length).toFixed(1)},${yAt(p[key], yMin, yMax).toFixed(1)}`,
    )
    .join(" ");
}

function toFillPath(data: ComparatorPoint[], yMin: number, yMax: number): string {
  const n = data.length;
  const fwd = data
    .map((p, i) =>
      `${i === 0 ? "M" : "L"}${xAt(i, n).toFixed(1)},${yAt(p.idrgMarginPct, yMin, yMax).toFixed(1)}`,
    )
    .join(" ");
  const rev = [...data]
    .reverse()
    .map((p, i) =>
      `L${xAt(n - 1 - i, n).toFixed(1)},${yAt(p.inaCbgMarginPct, yMin, yMax).toFixed(1)}`,
    )
    .join(" ");
  return `${fwd} ${rev} Z`;
}

// ── Penjamin filter options ─────────────────────────────

const PENJAMIN_OPTS: { key: ComparatorPenjamin; label: string }[] = [
  { key: "all",      label: "Semua" },
  { key: "bpjs",     label: "BPJS" },
  { key: "asuransi", label: "Asuransi" },
  { key: "jamkesda", label: "Jamkesda" },
];

// ── Main panel ──────────────────────────────────────────

export default function MarginComparatorPanel() {
  const [penjamin, setPenjamin] = useState<ComparatorPenjamin>("all");

  const data    = useMemo(() => buildComparatorData(penjamin), [penjamin]);
  const mdcRows = useMemo(() => buildMDCComparatorRows(penjamin), [penjamin]);

  const allVals  = data.flatMap(p => [p.idrgMarginPct, p.inaCbgMarginPct]);
  const yMin     = Math.floor(Math.min(...allVals) - 0.5);
  const yMax     = Math.ceil( Math.max(...allVals) + 1.5);
  const oktIdx   = data.findIndex(p => p.yearMonth === "2025-10");

  const iDRGAdvantage = data
    .filter(p => p.deltaNominal > 0n)
    .reduce((s, p) => s + p.deltaNominal, 0n);
  const iNACBGAdvantage = data
    .filter(p => p.deltaNominal < 0n)
    .reduce((s, p) => s + (-p.deltaNominal), 0n);
  const netDelta = iDRGAdvantage - iNACBGAdvantage;

  const penjaminLabel = PENJAMIN_OPTS.find(o => o.key === penjamin)?.label ?? "Semua";

  function handleExportCSV() {
    downloadCSV(`klaim-margin-comparator-${todayISO()}.csv`, [
      {
        title: `iDRG vs INA-CBG Margin Comparator — ${penjaminLabel}`,
        headers: ["Bulan", "iDRG (%)", "INA-CBG (%)", "Delta Nominal", "Era"],
        rows: data.map(p => [
          p.label,
          p.idrgMarginPct.toFixed(2),
          p.inaCbgMarginPct.toFixed(2),
          formatRupiah(p.deltaNominal),
          p.isPreOkt25 ? "Pre-iDRG (estimasi)" : "Post-iDRG (aktual)",
        ]),
      },
      {
        title: "Per-MDC Breakdown",
        headers: ["MDC", "Kode", "Klaim", "iDRG (%)", "INA-CBG (%)", "Delta (%)", "Delta Nominal"],
        rows: mdcRows.map(r => [
          r.mdcLabel,
          r.mdcCode,
          r.count,
          r.idrgAvgPct.toFixed(1),
          r.inaCbgAvgPct.toFixed(1),
          `${r.deltaPct > 0 ? "+" : ""}${r.deltaPct.toFixed(1)}`,
          formatRupiah(r.deltaNominal),
        ]),
      },
    ]);
  }

  return (
    <div className="space-y-5 p-5">
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLE }} />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">iDRG vs INA-CBG — Margin Comparator</h2>
          <p className="text-xs text-slate-500">
            Dampak finansial migrasi iDRG terhadap margin RS · rolling 12 bulan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            <Download size={13} className="text-teal-600" />
            CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            <Printer size={13} className="text-teal-600" />
            PDF
          </button>
        </div>
      </div>

      {/* Penjamin filter */}
      <div className="flex flex-wrap items-center gap-2">
        {PENJAMIN_OPTS.map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setPenjamin(opt.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
              penjamin === opt.key
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-1 text-xs text-slate-400">
          <Info size={11} />
          Per-penjamin = proyeksi dari proporsi historis
        </span>
      </div>

      {/* Era transition note */}
      <EraTransitionBanner />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          label="Keunggulan iDRG"
          value={formatRupiahShort(iDRGAdvantage)}
          sub="Kumulatif bulan iDRG lebih untung"
          Icon={TrendingUp}
          tone="emerald"
        />
        <SummaryCard
          label="Keunggulan INA-CBG"
          value={formatRupiahShort(iNACBGAdvantage)}
          sub="Kumulatif bulan INA-CBG lebih untung"
          Icon={TrendingDown}
          tone="rose"
          negative
        />
        <SummaryCard
          label="Net Selama 12 Bulan"
          value={formatRupiahShort(netDelta < 0n ? -netDelta : netDelta)}
          sub={netDelta >= 0n ? "iDRG lebih menguntungkan (net)" : "INA-CBG lebih menguntungkan (net)"}
          Icon={netDelta >= 0n ? TrendingUp : TrendingDown}
          tone={netDelta >= 0n ? "teal" : "amber"}
          negative={netDelta < 0n}
        />
      </div>

      {/* Comparator line chart */}
      <ComparatorLineChart data={data} yMin={yMin} yMax={yMax} oktIdx={oktIdx} />

      {/* Delta bar chart per month */}
      <DeltaBarChart data={data} />

      {/* MDC breakdown table */}
      <MDCBreakdownTable rows={mdcRows} />

      {/* Mandatory caveat */}
      <CaveatBanner />

      {/* Print-only A4 view */}
      <ComparatorPrintView
        data={data}
        mdcRows={mdcRows}
        penjaminLabel={penjaminLabel}
        netDelta={netDelta}
        iDRGAdvantage={iDRGAdvantage}
        iNACBGAdvantage={iNACBGAdvantage}
      />
    </div>
  );
}

// ── Era Transition Banner ───────────────────────────────

function EraTransitionBanner() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5">
      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600">
        <Info size={12} />
      </span>
      <div className="text-xs">
        <span className="font-semibold text-teal-800">Okt 2025: iDRG berlaku resmi (Kemenkes). </span>
        <span className="text-teal-700">
          Garis <span className="font-medium">putus-putus vertikal</span> pada chart menandai pivot era.
          Data pre-Okt = INA-CBG aktual + iDRG estimasi forward-looking.
          Data post-Okt = iDRG aktual + INA-CBG estimasi legacy adapter.
        </span>
      </div>
    </div>
  );
}

// ── Summary Card ────────────────────────────────────────

type CardTone = "emerald" | "rose" | "teal" | "amber";

const CARD_TONE: Record<CardTone, { bg: string; iconBg: string; icon: string; value: string; label: string }> = {
  emerald: { bg: "bg-emerald-50 ring-emerald-200", iconBg: "bg-emerald-100", icon: "text-emerald-600", value: "text-emerald-700", label: "text-emerald-600" },
  rose:    { bg: "bg-rose-50 ring-rose-200",       iconBg: "bg-rose-100",    icon: "text-rose-600",    value: "text-rose-700",    label: "text-rose-600"    },
  teal:    { bg: "bg-teal-50 ring-teal-200",       iconBg: "bg-teal-100",    icon: "text-teal-600",    value: "text-teal-700",    label: "text-teal-600"    },
  amber:   { bg: "bg-amber-50 ring-amber-200",     iconBg: "bg-amber-100",   icon: "text-amber-600",   value: "text-amber-700",   label: "text-amber-600"   },
};

function SummaryCard({
  label, value, sub, Icon, tone, negative = false,
}: {
  label: string;
  value: string;
  sub: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: CardTone;
  negative?: boolean;
}) {
  const cls = CARD_TONE[tone];
  return (
    <div className={`rounded-xl p-3 ring-1 ${cls.bg}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${cls.iconBg}`}>
          <Icon size={13} className={cls.icon} />
        </span>
        <span className={`text-xs font-medium ${cls.label}`}>{label}</span>
      </div>
      <p className={`text-sm font-bold leading-tight tabular-nums ${cls.value}`}>
        {negative ? "−" : ""}{value}
      </p>
      <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
    </div>
  );
}

// ── Comparator Line Chart (SVG) ─────────────────────────

function ComparatorLineChart({
  data, yMin, yMax, oktIdx,
}: {
  data: ComparatorPoint[];
  yMin: number;
  yMax: number;
  oktIdx: number;
}) {
  const n = data.length;

  // Y-axis tick marks
  const range = yMax - yMin;
  const step  = range <= 5 ? 1 : range <= 10 ? 2 : 3;
  const yTicks: number[] = [];
  for (let t = Math.ceil(yMin); t <= yMax; t += step) yTicks.push(t);

  const idrgPath   = toLinePath(data, "idrgMarginPct", yMin, yMax);
  const inaCbgPath = toLinePath(data, "inaCbgMarginPct", yMin, yMax);
  const fillPath   = toFillPath(data, yMin, yMax);

  const oktX = oktIdx >= 0 ? xAt(oktIdx, n) : null;

  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 px-4 py-2.5">
        <p className="text-xs font-semibold text-slate-700">Tren Margin per Bulan</p>
        <div className="flex flex-wrap gap-4 ml-auto">
          <span className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="h-0.5 w-6 rounded-full bg-teal-500" />
            iDRG (aktual / estimasi)
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-600">
            {/* dashed line visual */}
            <svg width="24" height="8" viewBox="0 0 24 8">
              <line x1="0" y1="4" x2="24" y2="4" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 3" />
            </svg>
            INA-CBG (aktual / estimasi)
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${CW} ${CH}`}
        className="w-full"
        aria-label="Grafik margin iDRG vs INA-CBG"
      >
        {/* Grid lines */}
        {yTicks.map(v => {
          const y = yAt(v, yMin, yMax);
          return (
            <g key={v}>
              <line x1={PL} y1={y} x2={CW - PR} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 3" />
              <text x={PL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                {v}%
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.map((p, i) => {
          const step = Math.ceil(n / 6);
          if (i % step !== 0 && i !== n - 1) return null;
          return (
            <text key={p.yearMonth} x={xAt(i, n)} y={CH - 4} textAnchor="middle" fontSize="10" fill="#94a3b8">
              {p.label}
            </text>
          );
        })}

        {/* Oct '25 era divider */}
        {oktX !== null && (
          <g>
            <line
              x1={oktX} y1={PT} x2={oktX} y2={CH - PB}
              stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3"
            />
            <text x={oktX + 4} y={PT + 12} fontSize="9" fill="#64748b" fontWeight="600">
              iDRG Berlaku
            </text>
          </g>
        )}

        {/* Fill between lines */}
        <path d={fillPath} fill="#14b8a6" fillOpacity="0.08" />

        {/* INA-CBG line (dashed, sky) */}
        <motion.path
          d={inaCbgPath}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeDasharray="5 3"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        {/* iDRG line (solid, teal) */}
        <motion.path
          d={idrgPath}
          fill="none"
          stroke="#14b8a6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />

        {/* Latest point dots */}
        {(["idrgMarginPct", "inaCbgMarginPct"] as const).map(key => {
          const last = data[n - 1];
          const x = xAt(n - 1, n);
          const y = yAt(last[key], yMin, yMax);
          const stroke = key === "idrgMarginPct" ? "#14b8a6" : "#38bdf8";
          return (
            <circle key={key} cx={x} cy={y} r="4" fill="white" stroke={stroke} strokeWidth="2" />
          );
        })}
      </svg>
    </div>
  );
}

// ── Delta Nominal Bar Chart ─────────────────────────────

function DeltaBarChart({ data }: { data: ComparatorPoint[] }) {
  const maxAbs = Math.max(...data.map(p => Math.abs(Number(p.deltaNominal))), 1);
  const BAR_H  = 80;

  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200">
      <div className="border-b border-slate-100 px-4 py-2.5">
        <p className="text-xs font-semibold text-slate-700">Delta Nominal per Bulan</p>
        <p className="text-xs text-slate-400">
          Hijau = iDRG lebih untung · Merah = INA-CBG lebih untung
        </p>
      </div>

      <div className="px-4 pb-4 pt-3">
        {/* Bars */}
        <div className="flex items-end gap-1" style={{ height: BAR_H }}>
          {data.map((p, i) => {
            const isPositive = p.deltaNominal >= 0n;
            const ratio = Math.abs(Number(p.deltaNominal)) / maxAbs;
            const barH  = Math.max(ratio * BAR_H, 4);
            return (
              <motion.div
                key={p.yearMonth}
                title={`${p.label}: ${formatRupiah(p.deltaNominal)}`}
                className={`flex-1 rounded-t ${isPositive ? "bg-emerald-400" : "bg-rose-400"}`}
                initial={{ height: 0 }}
                animate={{ height: barH }}
                transition={{ delay: 0.04 * i, duration: 0.4, ease: "easeOut" }}
              />
            );
          })}
        </div>

        {/* Baseline */}
        <div className="mt-0.5 border-t-2 border-slate-300" />

        {/* X labels */}
        <div className="mt-1 flex gap-1">
          {data.map((p, i) => {
            const step = Math.ceil(data.length / 6);
            if (i % step !== 0 && i !== data.length - 1) {
              return <span key={p.yearMonth} className="flex-1" />;
            }
            return (
              <p key={p.yearMonth} className="flex-1 text-center text-xs text-slate-400">
                {p.label.split(" ")[0]}
              </p>
            );
          })}
        </div>
      </div>

      {/* Footer total */}
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2">
        <span className="text-xs text-slate-400">
          Kumulatif 12 bulan:{" "}
          <span className="font-semibold text-emerald-600 tabular-nums">
            {formatRupiahShort(data.reduce((s, p) => s + p.deltaNominal, 0n))}
          </span>{" "}
          keunggulan iDRG
        </span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <span className="h-2 w-3 rounded-full bg-emerald-300" />
            iDRG lebih untung
          </span>
          <span className="flex items-center gap-1 text-xs text-rose-500">
            <span className="h-2 w-3 rounded-full bg-rose-300" />
            INA-CBG lebih untung
          </span>
        </span>
      </div>
    </div>
  );
}

// ── MDC Breakdown Table ─────────────────────────────────

function MDCBreakdownTable({ rows }: { rows: MDCComparatorRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
      {/* Header */}
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <p className="text-xs font-semibold text-slate-700">Per-MDC Breakdown (Top 10)</p>
        <p className="text-xs text-slate-400">
          Diurutkan berdasarkan |delta margin| terbesar · + = iDRG lebih menguntungkan
        </p>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_80px_50px_72px_72px_80px_110px] gap-1.5 border-b border-slate-100 bg-slate-50/60 px-4 py-2">
        {["MDC Group", "Kode", "Klaim", "iDRG %", "INA-CBG %", "Delta %", "Delta Nominal"].map(h => (
          <span key={h} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {h}
          </span>
        ))}
      </div>

      <div className="divide-y divide-slate-50">
        {rows.map((r, idx) => {
          const isAdv = r.deltaPct > 0;
          return (
            <motion.div
              key={r.mdcLabel}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.03 * idx, duration: 0.2 }}
              className="grid grid-cols-[1fr_80px_50px_72px_72px_80px_110px] items-center gap-1.5 px-4 py-2.5 hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-700">{r.mdcLabel}</p>
              </div>
              <p className="font-mono text-xs text-slate-400">{r.mdcCode}</p>
              <p className="text-xs text-slate-600 tabular-nums">{r.count}</p>
              <p className={`text-xs font-semibold tabular-nums ${r.idrgAvgPct > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {r.idrgAvgPct > 0 ? "+" : ""}{r.idrgAvgPct.toFixed(1)}%
              </p>
              <p className={`text-xs tabular-nums ${r.inaCbgAvgPct > 0 ? "text-slate-600" : "text-rose-500"}`}>
                {r.inaCbgAvgPct > 0 ? "+" : ""}{r.inaCbgAvgPct.toFixed(1)}%
              </p>
              <span
                className={`inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ${
                  isAdv ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}
              >
                {isAdv ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {r.deltaPct > 0 ? "+" : ""}{r.deltaPct.toFixed(1)}%
              </span>
              <p className={`text-xs font-semibold tabular-nums ${isAdv ? "text-emerald-600" : "text-rose-600"}`}>
                {formatRupiahShort(r.deltaNominal)}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Caveat Banner ───────────────────────────────────────

function CaveatBanner() {
  return (
    <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
      <div className="space-y-1 text-xs">
        <p className="font-semibold text-amber-800">
          ⚠️ Nilai INA-CBG di chart ini adalah estimasi non-official untuk perbandingan analitik.
          Bukan untuk negosiasi formal dengan BPJS.
        </p>
        <p className="text-amber-700">
          Data iDRG aktual berlaku mulai Oktober 2025 (PMK Kemenkes). Nilai pra-Oktober = estimasi
          forward-looking berdasarkan proporsi historis. Selisih nominal bersifat indikatif — bukan angka
          resmi kontrak penjamin.
        </p>
        <p className="flex items-center gap-1 text-xs text-amber-600">
          <Info size={11} />
          Dokumen ini ditandai INTERNAL USE — REFERENCE ONLY pada cetakan PDF.
        </p>
      </div>
    </div>
  );
}

// ── Print Template (hidden on screen, visible on print) ─

function ComparatorPrintView({
  data,
  mdcRows,
  penjaminLabel,
  netDelta,
  iDRGAdvantage,
  iNACBGAdvantage,
}: {
  data: ComparatorPoint[];
  mdcRows: MDCComparatorRow[];
  penjaminLabel: string;
  netDelta: bigint;
  iDRGAdvantage: bigint;
  iNACBGAdvantage: bigint;
}) {
  const today = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div id={PRINT_ID} className="hidden print:block">
      <KopSuratEklaim variant="full" />

      <div style={{ marginTop: 16, marginBottom: 8, borderBottom: "2px solid #0f766e", paddingBottom: 8 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#0f766e", textTransform: "uppercase", letterSpacing: 2 }}>
          E-Klaim · Analytics
        </p>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: "4px 0 2px" }}>
          Laporan Margin Comparator: iDRG vs INA-CBG
        </h1>
        <p style={{ fontSize: 11, color: "#64748b" }}>
          Penjamin: {penjaminLabel} · Periode: Jun 2025–Mei 2026 · Dicetak: {today}
        </p>
      </div>

      {/* KPI summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, marginTop: 12 }}>
        {[
          { label: "Keunggulan iDRG", value: formatRupiahShort(iDRGAdvantage), color: "#059669" },
          { label: "Keunggulan INA-CBG", value: formatRupiahShort(iNACBGAdvantage), color: "#e11d48" },
          { label: "Net 12 Bulan", value: (netDelta < 0n ? "−" : "+") + formatRupiahShort(netDelta < 0n ? -netDelta : netDelta), color: netDelta >= 0n ? "#0f766e" : "#b45309" },
        ].map(c => (
          <div key={c.label} style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px" }}>
            <p style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>{c.label}</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly data table */}
      <p style={{ fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
        Tren Bulanan
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, marginBottom: 16 }}>
        <thead>
          <tr style={{ backgroundColor: "#f1f5f9" }}>
            {["Bulan", "Era", "iDRG (%)", "INA-CBG (%)", "Delta Nominal"].map(h => (
              <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((p, i) => (
            <tr key={p.yearMonth} style={{ backgroundColor: i % 2 ? "#f8fafc" : "white" }}>
              <td style={{ padding: "5px 8px", borderBottom: "1px solid #f1f5f9" }}>{p.label}</td>
              <td style={{ padding: "5px 8px", borderBottom: "1px solid #f1f5f9", color: p.isPreOkt25 ? "#94a3b8" : "#0f766e", fontSize: 9 }}>
                {p.isPreOkt25 ? "Pre-iDRG" : "Post-iDRG"}
              </td>
              <td style={{ padding: "5px 8px", borderBottom: "1px solid #f1f5f9", fontWeight: 600, color: "#059669" }}>{p.idrgMarginPct.toFixed(2)}%</td>
              <td style={{ padding: "5px 8px", borderBottom: "1px solid #f1f5f9", color: "#475569" }}>{p.inaCbgMarginPct.toFixed(2)}%</td>
              <td style={{ padding: "5px 8px", borderBottom: "1px solid #f1f5f9", fontWeight: 600, color: p.deltaNominal >= 0n ? "#059669" : "#e11d48" }}>
                {formatRupiah(p.deltaNominal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MDC table */}
      <p style={{ fontSize: 11, fontWeight: 700, color: "#334155", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
        Per-MDC Breakdown
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, marginBottom: 16 }}>
        <thead>
          <tr style={{ backgroundColor: "#f1f5f9" }}>
            {["MDC Group", "Kode", "Klaim", "iDRG %", "INA-CBG %", "Delta %", "Delta Nominal"].map(h => (
              <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {mdcRows.map((r, i) => (
            <tr key={r.mdcLabel} style={{ backgroundColor: i % 2 ? "#f8fafc" : "white" }}>
              <td style={{ padding: "5px 8px", borderBottom: "1px solid #f1f5f9" }}>{r.mdcLabel}</td>
              <td style={{ padding: "5px 8px", borderBottom: "1px solid #f1f5f9", fontFamily: "monospace", fontSize: 9, color: "#94a3b8" }}>{r.mdcCode}</td>
              <td style={{ padding: "5px 8px", borderBottom: "1px solid #f1f5f9" }}>{r.count}</td>
              <td style={{ padding: "5px 8px", borderBottom: "1px solid #f1f5f9", color: r.idrgAvgPct > 0 ? "#059669" : "#e11d48", fontWeight: 600 }}>{r.idrgAvgPct > 0 ? "+" : ""}{r.idrgAvgPct.toFixed(1)}%</td>
              <td style={{ padding: "5px 8px", borderBottom: "1px solid #f1f5f9", color: "#475569" }}>{r.inaCbgAvgPct > 0 ? "+" : ""}{r.inaCbgAvgPct.toFixed(1)}%</td>
              <td style={{ padding: "5px 8px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, color: r.deltaPct > 0 ? "#059669" : "#e11d48" }}>
                {r.deltaPct > 0 ? "+" : ""}{r.deltaPct.toFixed(1)}%
              </td>
              <td style={{ padding: "5px 8px", borderBottom: "1px solid #f1f5f9", fontWeight: 600, color: r.deltaNominal >= 0n ? "#059669" : "#e11d48" }}>
                {formatRupiah(r.deltaNominal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Caveat footer */}
      <div style={{ border: "1px solid #fbbf24", backgroundColor: "#fffbeb", borderRadius: 6, padding: "10px 14px", fontSize: 9, color: "#92400e" }}>
        <p style={{ fontWeight: 700, marginBottom: 4 }}>
          ⚠️ PERINGATAN: Nilai INA-CBG di dokumen ini adalah estimasi non-official untuk keperluan analitik internal.
          BUKAN untuk negosiasi formal dengan BPJS atau penjamin manapun.
        </p>
        <p>Data iDRG aktual berlaku mulai Oktober 2025 (PMK Kemenkes). Nilai pra-Oktober merupakan estimasi forward-looking.</p>
      </div>
    </div>
  );
}
