"use client";

/**
 * Audit Report Template — A4 KOP RS (BP8.4).
 *
 * Laporan audit trail BPJS siap cetak.
 * Props:
 *   entries — BPJSAuditEntry[] dari filterAuditEntries (sudah difilter periode)
 *   periode — { from, to } ISO date string yyyy-MM-dd
 *
 * Desain: summary strip 4-KPI + tabel compact font-[7.5pt].
 */

import KopSuratEklaim from "@/components/eklaim/berkas/KopSuratEklaim";
import { RS_PROFIL_INITIAL } from "@/lib/master/rsProfilStore";
import type { BPJSAuditEntry } from "@/lib/bpjs/bpjsShared";
import { todayLong, fmtDateShortDoc } from "@/components/eklaim/berkas/berkasGeneratorShared";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────

function fmtTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "2-digit" });
    const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    return `${date} ${time}`;
  } catch {
    return iso;
  }
}

function truncEnd(s: string, max = 42): string {
  return s.length > max ? "…" + s.slice(-(max - 1)) : s;
}

function fmtDateRange(from: string, to: string): string {
  const fmt = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
    } catch { return d; }
  };
  return `${fmt(from)} — ${fmt(to)}`;
}

// ── Sub-components ────────────────────────────────────────

const METHOD_CLS: Record<string, string> = {
  GET:    "bg-sky-100 text-sky-700",
  POST:   "bg-emerald-100 text-emerald-700",
  PUT:    "bg-amber-100 text-amber-700",
  DELETE: "bg-rose-100 text-rose-700",
};

function KpiCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[7.5pt] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={cn("mt-0.5 text-[14pt] font-bold", color ?? "text-slate-800")}>{value}</p>
      {sub && <p className="text-[7pt] text-slate-400">{sub}</p>}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

interface Props {
  entries: ReadonlyArray<BPJSAuditEntry>;
  periode: { from: string; to: string };
}

export default function AuditReportTemplate({ entries, periode }: Props) {
  const rs = RS_PROFIL_INITIAL;
  const today = fmtDateShortDoc(new Date().toISOString());

  const total   = entries.length;
  const success = entries.filter((e) => e.success).length;
  const failed  = total - success;
  const avgMs   = total > 0
    ? Math.round(entries.reduce((acc, e) => acc + e.durationMs, 0) / total)
    : 0;
  const errorRate = total > 0 ? ((failed / total) * 100).toFixed(1) : "0.0";

  // Top failed endpoint
  const failMap: Record<string, number> = {};
  entries.filter((e) => !e.success).forEach((e) => {
    failMap[e.endpoint] = (failMap[e.endpoint] ?? 0) + 1;
  });
  const topFailed = Object.entries(failMap).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="w-[794px] min-h-[1123px] bg-white px-12 py-10 font-sans text-slate-900">
      <KopSuratEklaim variant="compact" />

      {/* ── Title bar ── */}
      <div className="mt-4 border-b-[2.5px] border-double border-slate-700 pb-1.5 text-center">
        <h2 className="text-[11.5pt] font-bold uppercase tracking-widest text-slate-800">
          Laporan Audit Trail BPJS Kesehatan
        </h2>
        <p className="text-[8.5pt] text-slate-500">
          Periode: {fmtDateRange(periode.from, periode.to)}
        </p>
      </div>

      {/* ── KPI strip ── */}
      <div className="mt-3 grid grid-cols-4 gap-2">
        <KpiCard label="Total Call" value={total} />
        <KpiCard
          label="Berhasil"
          value={success}
          sub={total > 0 ? `${((success / total) * 100).toFixed(0)}%` : undefined}
          color="text-emerald-700"
        />
        <KpiCard
          label="Gagal"
          value={failed}
          sub={`${errorRate}% error rate`}
          color={failed > 0 ? "text-rose-600" : "text-slate-800"}
        />
        <KpiCard
          label="Avg. Latency"
          value={`${avgMs}ms`}
          color={avgMs > 3500 ? "text-rose-600" : avgMs > 1500 ? "text-amber-600" : "text-slate-800"}
        />
      </div>

      {/* Top failed endpoint */}
      {topFailed && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5">
          <span className="text-[7.5pt] font-semibold uppercase tracking-wider text-rose-500">
            Top Gagal
          </span>
          <span className="font-mono text-[8pt] text-rose-700">{topFailed[0]}</span>
          <span className="ml-auto rounded-full bg-rose-200 px-2 py-0.5 text-[7.5pt] font-bold text-rose-700">
            {topFailed[1]}×
          </span>
        </div>
      )}

      {/* ── Table ── */}
      <div className="mt-3">
        <p className="mb-1.5 text-[7.5pt] font-bold uppercase tracking-wider text-slate-400">
          Detail Audit ({total} entri)
        </p>
        <table className="w-full border-collapse text-[7.5pt]">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-200 px-1.5 py-1 text-center font-semibold text-slate-600 w-5">
                #
              </th>
              <th className="border border-slate-200 px-1.5 py-1 text-left font-semibold text-slate-600 w-24">
                Waktu
              </th>
              <th className="border border-slate-200 px-1.5 py-1 text-left font-semibold text-slate-600">
                Endpoint
              </th>
              <th className="border border-slate-200 px-1.5 py-1 text-center font-semibold text-slate-600 w-10">
                Metode
              </th>
              <th className="border border-slate-200 px-1.5 py-1 text-center font-semibold text-slate-600 w-10">
                Kode
              </th>
              <th className="border border-slate-200 px-1.5 py-1 text-center font-semibold text-slate-600 w-8">
                Status
              </th>
              <th className="border border-slate-200 px-1.5 py-1 text-right font-semibold text-slate-600 w-12">
                Durasi
              </th>
              <th className="border border-slate-200 px-1.5 py-1 text-left font-semibold text-slate-600 w-24">
                Aktor
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr
                key={e.id}
                className={cn(
                  "border-b border-slate-100",
                  i % 2 === 1 ? "bg-slate-50/50" : "bg-white",
                  !e.success ? "bg-rose-50/60" : "",
                )}
              >
                <td className="border-r border-slate-100 px-1.5 py-0.5 text-center text-slate-400">
                  {i + 1}
                </td>
                <td className="border-r border-slate-100 px-1.5 py-0.5 font-mono text-slate-500">
                  {fmtTimestamp(e.timestamp)}
                </td>
                <td className="border-r border-slate-100 px-1.5 py-0.5 font-mono text-slate-700">
                  {truncEnd(e.endpoint)}
                  {e.errorType && (
                    <span className="ml-1 rounded bg-rose-100 px-1 text-[6.5pt] font-semibold text-rose-600">
                      {e.errorType}
                    </span>
                  )}
                </td>
                <td className="border-r border-slate-100 px-1.5 py-0.5 text-center">
                  <span className={cn("rounded px-1 font-bold", METHOD_CLS[e.method] ?? "bg-slate-100 text-slate-600")}>
                    {e.method}
                  </span>
                </td>
                <td className="border-r border-slate-100 px-1.5 py-0.5 text-center font-mono font-semibold text-slate-700">
                  {e.responseCode}
                </td>
                <td className="border-r border-slate-100 px-1.5 py-0.5 text-center">
                  {e.success
                    ? <span className="font-bold text-emerald-600">✓</span>
                    : <span className="font-bold text-rose-600">✗</span>
                  }
                </td>
                <td className="border-r border-slate-100 px-1.5 py-0.5 text-right font-mono text-slate-600">
                  {e.durationMs}ms
                </td>
                <td className="px-1.5 py-0.5 text-slate-600 truncate max-w-[96px]">
                  {e.actor}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Signature ── */}
      <div className="mt-6 flex justify-end">
        <div className="w-56 text-center">
          <p className="text-[9pt] text-slate-600">{rs.alamat.kota}, {today}</p>
          <p className="text-[9pt] font-bold text-slate-800">{rs.nama}</p>
          <p className="text-[9pt] text-slate-600">Penanggung Jawab BPJS</p>
          <div className="mt-12 border-b border-slate-800" />
          <p className="mt-0.5 text-[8.5pt] text-slate-500">( ........................................ )</p>
          <p className="text-[8pt] text-slate-400">NIP / NIK</p>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="mt-4 border-t border-slate-200 pt-2 text-center text-[7.5pt] text-slate-400">
        Digenerate oleh EHIS BPJS &nbsp;·&nbsp; {todayLong()} &nbsp;·&nbsp; {rs.nama}
        &nbsp;·&nbsp; Total {total} entri
      </div>
    </div>
  );
}
