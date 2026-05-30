"use client";

/**
 * DashboardPrintTemplate — A4 print-only layout untuk Dashboard Analytics (EK8.5).
 *
 * Triggered via window.print() dari DashboardPage sidebar button.
 * @media print isolation: hanya area ini yang tampil saat print.
 * Empat section: Approval Rate · Aging Klaim · Margin iDRG · Coder Produktivitas.
 */

import { useMemo } from "react";
import KopSuratEklaim from "@/components/eklaim/berkas/KopSuratEklaim";
import { formatRupiah, formatRupiahShort } from "@/lib/eklaim/money";
import {
  buildApprovalRateData,
  buildRejectedReasons,
  buildAgingData,
  buildStuckClaims,
  buildMarginGroups,
  buildCoderProfiles,
  buildCoderDailyOutputs,
  buildDashboardKPIs,
} from "@/lib/eklaim/dashboardShared";

const PRINT_ID = "dashboard-print-area";

// ── Helpers ────────────────────────────────────────────────────

function PrintSection({
  title,
  subtitle,
  pageBreak = false,
  children,
}: {
  title: string;
  subtitle?: string;
  pageBreak?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={pageBreak ? { pageBreakBefore: "always" } : {}}>
      <div className="mb-3 border-b border-slate-300 pb-2">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-800">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-[10px] text-slate-500">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function PrintTable({
  headers,
  rows,
  alignRight,
}: {
  headers: string[];
  rows: (string | number)[][];
  alignRight?: number[];
}) {
  return (
    <table className="w-full border-collapse text-[10px]">
      <thead>
        <tr className="bg-slate-100">
          {headers.map((h, i) => (
            <th
              key={h}
              className="border border-slate-300 px-2 py-1 text-left font-semibold"
              style={alignRight?.includes(i) ? { textAlign: "right" } : {}}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
            {row.map((cell, ci) => (
              <td
                key={ci}
                className="border border-slate-200 px-2 py-1"
                style={alignRight?.includes(ci) ? { textAlign: "right" } : {}}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Main template ──────────────────────────────────────────────

export default function DashboardPrintTemplate() {
  const approvalData = useMemo(() => buildApprovalRateData(), []);
  const reasons      = useMemo(() => buildRejectedReasons(), []);
  const agingRows    = useMemo(() => buildAgingData(), []);
  const stuckClaims  = useMemo(() => buildStuckClaims(), []);
  const marginGroups = useMemo(() => buildMarginGroups(), []);
  const coders       = useMemo(() => buildCoderProfiles(), []);
  const daily        = useMemo(() => buildCoderDailyOutputs(), []);
  const kpis         = useMemo(() => buildDashboardKPIs(), []);

  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <style>{`
        @media print {
          body > * { visibility: hidden; }
          #${PRINT_ID}, #${PRINT_ID} * { visibility: visible; }
          #${PRINT_ID} { position: fixed; inset: 0; overflow: visible; }
          @page { size: A4 portrait; margin: 1cm; }
        }
      `}</style>

      <div id={PRINT_ID} className="hidden print:block">
        <div className="w-[794px] bg-white font-sans text-slate-900">
          {/* Cover header */}
          <KopSuratEklaim variant="full" />
          <div className="mt-4 border-b-2 border-slate-400 pb-3 text-center">
            <h1 className="text-[15px] font-bold uppercase tracking-wide">
              LAPORAN ANALITIK KLAIM
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Dicetak: {today} &nbsp;·&nbsp; Data: Demo 30 hari terakhir
            </p>
          </div>

          {/* KPI summary row */}
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            {[
              { label: "Approval Rate",     value: `${kpis.approvalRatePct}%` },
              { label: "Klaim Bulan Ini",   value: kpis.klaimBulanIni.toString() },
              { label: "Avg. Hari Pending", value: `${kpis.avgDaysPending} hr` },
              { label: "Stuck > 30 Hari",  value: kpis.stuckCount.toString() },
            ].map((k) => (
              <div
                key={k.label}
                className="rounded border border-slate-200 bg-slate-50 px-2 py-2"
              >
                <p className="text-[14px] font-bold text-slate-800">{k.value}</p>
                <p className="text-[10px] text-slate-500">{k.label}</p>
              </div>
            ))}
          </div>

          {/* ── Section 1: Approval Rate ── */}
          <div className="mt-6">
            <PrintSection
              title="1. Tren Approval Rate (12 Bulan)"
              subtitle="Persetujuan klaim per penjamin — BPJS · Asuransi · Jamkesda"
            >
              <PrintTable
                headers={["Bulan", "BPJS (%)", "Asuransi (%)", "Jamkesda (%)", "Overall (%)"]}
                rows={approvalData.map((p) => [
                  p.label,
                  (p.bpjs * 100).toFixed(1),
                  (p.asuransi * 100).toFixed(1),
                  (p.jamkesda * 100).toFixed(1),
                  (p.overall * 100).toFixed(1),
                ])}
                alignRight={[1, 2, 3, 4]}
              />

              <div className="mt-3">
                <p className="mb-1 text-[10px] font-semibold text-slate-600">
                  Top 5 Alasan Ditolak
                </p>
                <PrintTable
                  headers={["Alasan Penolakan", "Jumlah", "%"]}
                  rows={reasons.map((r) => [r.reason, r.count, `${r.percent}%`])}
                  alignRight={[1, 2]}
                />
              </div>
            </PrintSection>
          </div>

          {/* ── Section 2: Aging Klaim ── */}
          <div className="mt-6">
            <PrintSection
              title="2. Aging Klaim"
              subtitle="Distribusi klaim berdasarkan durasi sejak submit · per penjamin"
            >
              <PrintTable
                headers={["Bucket", "BPJS", "Asuransi", "Jamkesda", "Total"]}
                rows={agingRows.map((r) => [
                  r.label,
                  r.bpjs,
                  r.asuransi,
                  r.jamkesda,
                  r.total,
                ])}
                alignRight={[1, 2, 3, 4]}
              />

              {stuckClaims.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-[10px] font-semibold text-slate-600">
                    Stuck Claims — Pending Verifikasi &gt; 30 Hari
                  </p>
                  <PrintTable
                    headers={["No. Klaim", "Pasien ID", "Penjamin", "Hari Pending", "Tarif RS"]}
                    rows={stuckClaims.map((c) => [
                      c.noKlaim,
                      c.pasienId,
                      c.penjaminNama,
                      c.daysPending,
                      formatRupiah(c.tarifRS),
                    ])}
                    alignRight={[3, 4]}
                  />
                </div>
              )}
            </PrintSection>
          </div>

          {/* ── Section 3: Margin iDRG ── */}
          <div className="mt-6" style={{ pageBreakBefore: "always" }}>
            <PrintSection
              title="3. Margin iDRG per MDC Group"
              subtitle="Selisih tarif grouper vs tarif RS · data iDRG simulasi (real saat INA-Grouper aktif)"
            >
              <PrintTable
                headers={[
                  "MDC Group",
                  "Kode iDRG",
                  "Jml Klaim",
                  "Avg Margin (%)",
                  "Total Nominal",
                ]}
                rows={marginGroups.map((g) => [
                  g.label,
                  g.code,
                  g.count,
                  `${g.avgMarginPct > 0 ? "+" : ""}${g.avgMarginPct.toFixed(1)}%`,
                  formatRupiahShort(g.totalNominal < 0n ? -g.totalNominal : g.totalNominal) +
                    (g.totalNominal < 0n ? " (defisit)" : " (surplus)"),
                ])}
                alignRight={[2, 3, 4]}
              />
              <p className="mt-2 text-[9px] italic text-amber-700">
                ⚠ Data simulasi iDRG — reference only. Aktifkan INA-Grouper bridging untuk data real.
              </p>
            </PrintSection>
          </div>

          {/* ── Section 4: Coder Productivity ── */}
          <div className="mt-6">
            <PrintSection
              title="4. Produktivitas Coder"
              subtitle="Output koding 8 hari terakhir + rata-rata turnaround kunjungan → submit"
            >
              <PrintTable
                headers={["Coder", "Total Koding", "Avg Hari → Submit", "Akurasi (%)"]}
                rows={coders.map((c) => [
                  c.name,
                  c.totalKoded,
                  `${c.avgDaysToSubmit} hari`,
                  `${(c.accuracy * 100).toFixed(0)}%`,
                ])}
                alignRight={[1, 2, 3]}
              />

              <div className="mt-3">
                <p className="mb-1 text-[10px] font-semibold text-slate-600">
                  Output Harian (klaim dikoding per hari)
                </p>
                <PrintTable
                  headers={[
                    "Tanggal",
                    ...coders.map((c) => c.name),
                    "Total",
                  ]}
                  rows={daily.map((d) => [
                    d.label,
                    ...coders.map(
                      (c) =>
                        d.totals.find((t) => t.coderId === c.id)?.count ?? 0,
                    ),
                    d.total,
                  ])}
                  alignRight={coders.map((_, i) => i + 1).concat(coders.length + 1)}
                />
              </div>
            </PrintSection>
          </div>

          {/* Footer */}
          <div className="mt-8 border-t border-slate-200 pt-2 text-center text-[9px] text-slate-400">
            Dicetak: {today} &nbsp;·&nbsp; EHIS SIMRS &nbsp;·&nbsp; E-Klaim Analytics &nbsp;·&nbsp;
            Dokumen ini bersifat internal — tidak untuk disebarluaskan
          </div>
        </div>
      </div>
    </>
  );
}
