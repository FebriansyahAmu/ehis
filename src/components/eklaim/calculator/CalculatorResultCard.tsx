"use client";

/**
 * CalculatorResultCard — EK4.2 Result Display.
 *
 * Renders iDRG result / INA-CBG Legacy result / Compare side-by-side.
 * Includes: severity badge · tarif per tingkat/kelas · margin vs tarif RS.
 * Print + Save as Draft (stub) buttons at bottom.
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, XCircle, Printer, Save,
  TrendingUp, TrendingDown, Cpu, Clock, Tag, BarChart3, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRupiah, formatRupiahShort } from "@/lib/eklaim/money";
import {
  SEVERITY_STYLE, TINGKAT_LABEL, TINGKAT_ORDER,
  computeMargin, mockBreakdown,
} from "../detail/tabs/grouper/grouperShared";
import type { iDRGResult, InaCbgLegacyResult, TingkatKompetensiRS } from "@/lib/eklaim/eklaimShared";
import type { CalcResult, CalcStatus, CalculatorFormState } from "./calculatorShared";

interface Props {
  status: CalcStatus;
  result: CalcResult | null;
  form: CalculatorFormState;
}

// ── Loading skeleton ────────────────────────────────────

function ResultSkeleton() {
  return (
    <div className="space-y-3 p-4 animate-pulse">
      <div className="h-5 w-28 rounded bg-slate-200" />
      <div className="rounded-xl bg-slate-100 p-4 space-y-2">
        <div className="h-8 w-32 rounded bg-slate-200" />
        <div className="h-4 w-48 rounded bg-slate-200" />
        <div className="h-4 w-36 rounded bg-slate-100" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[1,2,3,4].map((i) => <div key={i} className="h-14 rounded-xl bg-slate-100" />)}
      </div>
    </div>
  );
}

// ── Error state ─────────────────────────────────────────

function ErrorState({ msg }: { msg: string }) {
  return (
    <div className="m-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
      <XCircle size={18} strokeWidth={2.2} className="mt-0.5 shrink-0 text-rose-500" />
      <div>
        <p className="text-[13px] font-bold text-rose-800">Grouper Error</p>
        <p className="mt-0.5 text-[12px] text-rose-700">{msg}</p>
        <p className="mt-1.5 text-[11px] text-rose-500">
          ICD primer tidak dipetakan dalam IDRG_LOOKUP_MOCK. Coba kode ICD-10-IM berbeda.
        </p>
      </div>
    </div>
  );
}

// ── iDRG Result block ───────────────────────────────────

function IDRGBlock({
  result,
  tingkat,
  compact = false,
}: {
  result: iDRGResult;
  tingkat: TingkatKompetensiRS;
  compact?: boolean;
}) {
  const sev = SEVERITY_STYLE[result.severity.level];
  const hasCCMCC = result.severity.ccList.length > 0 || result.severity.mccList.length > 0;

  return (
    <div className={cn("space-y-2.5", compact && "text-[0.9em]")}>
      {/* Code + MDC + Group */}
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-sky-100 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-widest text-sky-700">
              <Cpu size={9} strokeWidth={2.5} />
              iDRG
            </span>
            <span className="text-[10.5px] text-slate-400">{result.versiGrouper}</span>
          </div>
          <p className="mt-1 font-mono text-[28px] font-black tracking-wider text-teal-800">
            {result.code}
          </p>
          <p className="text-[11.5px] font-semibold text-slate-600">{result.mdc}</p>
          <p className="text-[13px] font-bold text-slate-800 leading-snug">{result.group}</p>
        </div>

        {/* Severity badge */}
        <div className={cn("flex shrink-0 flex-col items-center gap-1 rounded-xl border px-3 py-2", sev.bg, sev.border)}>
          <span className={cn("text-[10px] font-bold uppercase tracking-widest", sev.text)}>
            Severity
          </span>
          <span className={cn("text-[22px] font-black tabular-nums", sev.text)}>
            {result.severity.level}
          </span>
          <span className={cn("text-[11px] font-bold", sev.text)}>
            {result.severity.label}
          </span>
        </div>
      </div>

      {/* CC/MCC list */}
      {hasCCMCC && (
        <div className="flex flex-wrap gap-1">
          {result.severity.mccList.map((c) => (
            <span key={c} className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10.5px] font-bold text-rose-700">
              MCC: {c}
            </span>
          ))}
          {result.severity.ccList.map((c) => (
            <span key={c} className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10.5px] font-bold text-amber-700">
              CC: {c}
            </span>
          ))}
        </div>
      )}

      {/* Tarif per tingkat */}
      <div className="grid grid-cols-4 gap-1.5">
        {TINGKAT_ORDER.map((tk) => {
          const tarif = result.tarifPerTingkat[tk];
          const isActive = tk === tingkat;
          return (
            <div
              key={tk}
              className={cn(
                "flex flex-col gap-0.5 rounded-xl border px-2 py-2 text-center transition-all",
                isActive
                  ? "border-teal-300 bg-teal-50 ring-1 ring-teal-200 shadow-sm"
                  : "border-slate-200 bg-slate-50/60",
              )}
            >
              <span className={cn("text-[10px] font-bold uppercase tracking-wide", isActive ? "text-teal-700" : "text-slate-500")}>
                {TINGKAT_LABEL[tk]}
              </span>
              <span className={cn("font-mono text-[11.5px] font-extrabold tabular-nums", isActive ? "text-teal-800" : "text-slate-600")}>
                {formatRupiahShort(tarif)}
              </span>
              {isActive && (
                <span className="text-[9.5px] font-bold text-teal-600">← Aktif</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Tarif aktual highlight */}
      <div className="flex items-center gap-2 rounded-xl bg-linear-to-r from-teal-50 to-emerald-50/60 px-3 py-2 ring-1 ring-teal-200">
        <CheckCircle2 size={14} strokeWidth={2.4} className="shrink-0 text-teal-600" />
        <span className="text-[12px] font-bold text-teal-700">Tarif Aktual</span>
        <span className="ml-auto font-mono text-[14px] font-extrabold tabular-nums text-teal-800">
          {formatRupiah(result.tarifAktual)}
        </span>
      </div>
    </div>
  );
}

// ── INA-CBG Legacy block ────────────────────────────────

function INACBGBlock({
  result,
  compact = false,
}: {
  result: InaCbgLegacyResult;
  compact?: boolean;
}) {
  const sevLabel = ["", "Ringan", "Sedang", "Berat"][result.severity];
  const KELAS_TARIF: [string, bigint][] = [
    ["VIP",     result.tarif.vip],
    ["Kelas 1", result.tarif.kelas1],
    ["Kelas 2", result.tarif.kelas2],
    ["Kelas 3", result.tarif.kelas3],
  ];
  const kelasColors = [
    "from-amber-50 to-amber-100/60 text-amber-800 ring-amber-300",
    "from-teal-50 to-teal-100/60 text-teal-800 ring-teal-300",
    "from-sky-50 to-sky-100/60 text-sky-800 ring-sky-300",
    "from-slate-50 to-slate-100/60 text-slate-700 ring-slate-300",
  ];

  return (
    <div className={cn("space-y-2.5", compact && "text-[0.9em]")}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-widest text-amber-700">
              INA-CBG
            </span>
            <span className="text-[10.5px] text-slate-400">{result.versiGrouper}</span>
          </div>
          <p className="mt-1 font-mono text-[24px] font-black tracking-wider text-amber-800">
            {result.code}
          </p>
          <p className="text-[13px] font-bold leading-snug text-slate-800">{result.group}</p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600">Severity</span>
          <span className="text-[22px] font-black text-amber-800">
            {"I".repeat(result.severity)}
          </span>
          <span className="text-[11px] font-bold text-amber-700">{sevLabel}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {KELAS_TARIF.map(([label, tarif], i) => (
          <div
            key={label}
            className={cn("flex flex-col gap-0.5 rounded-xl border bg-linear-to-b px-2 py-2 text-center ring-1", kelasColors[i])}
          >
            <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
            <span className="font-mono text-[11.5px] font-extrabold tabular-nums">
              {formatRupiahShort(tarif)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Margin bar vs Tarif RS ──────────────────────────────

function MarginBar({ tarifGrouper, tarifRS }: { tarifGrouper: bigint; tarifRS: bigint }) {
  const { selisih, persen, untung } = computeMargin(tarifRS, tarifGrouper);
  const breakdown = mockBreakdown(tarifRS);
  const Icon = untung ? TrendingUp : TrendingDown;
  const tone = untung ? "emerald" : "rose";

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-1.5">
        <BarChart3 size={13} strokeWidth={2.3} className="text-slate-500" />
        <span className="text-[11.5px] font-bold text-slate-700">Margin vs Tarif RS</span>
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[12px] font-bold",
            tone === "emerald" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800",
          )}
        >
          <Icon size={11} strokeWidth={2.5} />
          {untung ? "+" : ""}{formatRupiahShort(selisih)} ({persen}%)
        </span>
      </div>
      {/* Breakdown bars */}
      <div className="space-y-1">
        {breakdown.map((item) => {
          const pct = tarifRS === 0n ? 0 : Math.round(Number(item.tarifRS) / Number(tarifRS) * 100);
          return (
            <div key={item.kategori} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-[10.5px] text-slate-500">{item.kategori}</span>
              <div className="flex-1 overflow-hidden rounded-full bg-slate-100 h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                  className={cn("h-full rounded-full", item.colorClass)}
                />
              </div>
              <span className="w-16 text-right font-mono text-[10.5px] tabular-nums text-slate-600">
                {formatRupiahShort(item.tarifRS)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────

export default function CalculatorResultCard({ status, result, form }: Props) {
  return (
    <div className="p-4">
      {/* Status header */}
      <div className="mb-3 flex items-center gap-2">
        {status === "loading" && (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-teal-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-teal-500" />
            Menghitung grouper...
          </span>
        )}
        {status === "done" && result && !result.errorMsg && (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700">
            <CheckCircle2 size={13} strokeWidth={2.4} />
            Hasil Perhitungan
            {result.elapsedMs && (
              <span className="ml-1 inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-400">
                <Clock size={9} /> {result.elapsedMs}ms
              </span>
            )}
          </span>
        )}
        {status === "error" && (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-rose-700">
            <AlertTriangle size={13} strokeWidth={2.4} />
            Gagal
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Loading */}
        {status === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ResultSkeleton />
          </motion.div>
        )}

        {/* Error */}
        {status === "error" && result?.errorMsg && (
          <motion.div key="error" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <ErrorState msg={result.errorMsg} />
          </motion.div>
        )}

        {/* Done */}
        {status === "done" && result && !result.errorMsg && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            {/* ── Compare view (side-by-side) ── */}
            {form.mode === "compare" && (result.idrg || result.inaCbg) && (
              <>
                {/* Caveat */}
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2">
                  <Info size={12} strokeWidth={2.3} className="mt-0.5 shrink-0 text-amber-600" />
                  <p className="text-[11px] text-amber-700">
                    INA-CBG di panel kanan adalah <strong>ESTIMASI · REFERENCE ONLY</strong> — tidak untuk submission ke BPJS post-Okt 2025.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {/* iDRG card */}
                  {result.idrg && (
                    <div className="rounded-xl border border-teal-200 bg-white p-3 shadow-sm">
                      <div className="mb-2 flex items-center gap-1.5 border-b border-teal-100 pb-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                        <span className="text-[10.5px] font-extrabold uppercase tracking-widest text-teal-700">
                          PRIMER · ERA AKTIF
                        </span>
                      </div>
                      <IDRGBlock result={result.idrg} tingkat={form.tingkatKompetensiRS} compact />
                    </div>
                  )}

                  {/* INA-CBG card */}
                  {result.inaCbg && (
                    <div className="rounded-xl border border-amber-200 bg-white p-3 shadow-sm">
                      <div className="mb-2 flex items-center justify-between border-b border-amber-100 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          <span className="text-[10.5px] font-extrabold uppercase tracking-widest text-amber-700">
                            ESTIMASI · REFERENCE ONLY
                          </span>
                        </div>
                        <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-600">
                          Bukan untuk Submit
                        </span>
                      </div>
                      <INACBGBlock result={result.inaCbg} compact />
                    </div>
                  )}

                  {/* INA-CBG error */}
                  {result.inaCbgError && (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[12px] text-slate-500">
                      <AlertTriangle size={13} className="text-amber-500" />
                      {result.inaCbgError}
                    </div>
                  )}
                </div>

                {/* Delta chip */}
                {result.idrg && result.inaCbg && (
                  <DeltaChip idrg={result.idrg} inaCbg={result.inaCbg} kelasLegacy={form.kelasLegacy} />
                )}
              </>
            )}

            {/* ── iDRG single ── */}
            {form.mode === "idrg" && result.idrg && (
              <div className="rounded-xl border border-teal-200 bg-white p-4 shadow-sm">
                <IDRGBlock result={result.idrg} tingkat={form.tingkatKompetensiRS} />
              </div>
            )}

            {/* ── INA-CBG single ── */}
            {form.mode === "ina-cbg" && result.inaCbg && (
              <div className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
                <INACBGBlock result={result.inaCbg} />
              </div>
            )}

            {/* ── Margin vs Tarif RS ── */}
            {result.tarifRS && result.tarifRS > 0n && (
              <MarginBar
                tarifGrouper={
                  result.idrg?.tarifAktual ??
                  result.inaCbg?.tarif.kelas2 ??
                  0n
                }
                tarifRS={result.tarifRS}
              />
            )}

            {/* ── Action buttons ── */}
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <Printer size={12} strokeWidth={2.3} />
                Print Result
              </button>
              <button
                type="button"
                disabled={form.mode === "compare"}
                title={form.mode === "compare" ? "Tidak tersedia di mode Compare" : "Simpan sebagai draft klaim"}
                className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-[12.5px] font-semibold text-teal-700 transition-colors hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={12} strokeWidth={2.3} />
                Simpan Draft Klaim
              </button>
              <div className="ml-auto flex items-center gap-1 text-[10.5px] text-slate-400">
                <Tag size={9} />
                <span>Hasil tidak mengikat — konfirmasi dengan INA-Grouper resmi</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Delta chip (Compare mode) ───────────────────────────

function DeltaChip({
  idrg,
  inaCbg,
  kelasLegacy,
}: {
  idrg: iDRGResult;
  inaCbg: InaCbgLegacyResult;
  kelasLegacy: CalculatorFormState["kelasLegacy"];
}) {
  const cbgTarif =
    kelasLegacy === "VIP"     ? inaCbg.tarif.vip    :
    kelasLegacy === "Kelas_1" ? inaCbg.tarif.kelas1 :
    kelasLegacy === "Kelas_3" ? inaCbg.tarif.kelas3 :
                                inaCbg.tarif.kelas2;

  const delta = idrg.tarifAktual - cbgTarif;
  const pct =
    cbgTarif === 0n
      ? 0
      : Math.abs(Math.round((Number(delta) / Number(cbgTarif)) * 1000) / 10);
  const positive = delta >= 0n;
  const Icon = positive ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl border p-2.5",
        positive ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50",
      )}
    >
      <span className="text-[11.5px] font-bold text-slate-600">
        iDRG vs INA-CBG:
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-1 font-mono text-[13px] font-extrabold tabular-nums",
          positive ? "text-emerald-800" : "text-rose-800",
        )}
      >
        <Icon size={13} strokeWidth={2.5} />
        {positive ? "+" : ""}{formatRupiahShort(delta)} ({pct}%)
      </span>
      <span className="text-[10.5px] text-slate-400">
        {positive ? "iDRG lebih tinggi" : "iDRG lebih rendah"}
      </span>
    </div>
  );
}
