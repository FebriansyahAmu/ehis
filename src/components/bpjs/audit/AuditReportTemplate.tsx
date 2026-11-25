"use client";

/**
 * Laporan Audit Trail BPJS — A4 dengan KOP RS (BP8.4), dicetak dari halaman Audit Trail lewat
 * konvensi `.print-area` global (globals.css: selain area cetak disembunyikan saat print).
 *
 * Props:
 *   entries    — entri yang sedang tampil (sudah tersaring)
 *   periode    — { from, to } "yyyy-mm-dd" lokal (rentang tanggal entri)
 *   keterangan — ringkasan saringan aktif, mis. "Gagal · V-Claim"
 *
 * Ringkasan 4 angka + endpoint paling sering gagal + tabel ringkas. Angka Geist Sans tabular.
 */

import KopSuratEklaim from "@/components/eklaim/berkas/KopSuratEklaim";
import { todayLong, fmtDateShortDoc } from "@/components/eklaim/berkas/berkasGeneratorShared";
import { fmtTgl } from "@/components/bpjs/shared/tanggal";
import { useRsProfil } from "@/lib/master/rsProfilClient";
import { cn } from "@/lib/ui/utils";
import type { BPJSAuditEntry } from "@/lib/bpjs/bpjsShared";
import { fmtDurasi, jamLokal } from "./auditShared";

function fmtWaktuRingkas(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "2-digit" })} ${jamLokal(iso)}`;
}

function Angka({ label, nilai, ket, className }: { label: string; nilai: string | number; ket?: string; className?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[7.5pt] font-semibold text-slate-500">{label}</p>
      <p className={cn("mt-0.5 text-[14pt] font-bold tabular-nums", className ?? "text-slate-800")}>{nilai}</p>
      {ket && <p className="text-[7pt] text-slate-500 tabular-nums">{ket}</p>}
    </div>
  );
}

interface Props {
  entries: ReadonlyArray<BPJSAuditEntry>;
  periode: { from: string; to: string };
  keterangan?: string;
}

export default function AuditReportTemplate({ entries, periode, keterangan }: Props) {
  const rs = useRsProfil();
  const today = fmtDateShortDoc(new Date().toISOString());

  const total = entries.length;
  const berhasil = entries.filter((e) => e.success).length;
  const gagal = total - berhasil;
  const rata = total > 0 ? Math.round(entries.reduce((n, e) => n + e.durationMs, 0) / total) : 0;
  const pctGagal = total > 0 ? ((gagal / total) * 100).toLocaleString("id-ID", { maximumFractionDigits: 1 }) : "0";

  const perGagal = Object.groupBy(
    entries.filter((e) => !e.success),
    (e) => e.endpoint,
  );
  const teratas = Object.entries(perGagal)
    .map(([endpoint, list]) => [endpoint, list?.length ?? 0] as const)
    .toSorted((a, b) => b[1] - a[1])[0];

  const rentang = periode.from === periode.to ? fmtTgl(periode.from) : `${fmtTgl(periode.from)} – ${fmtTgl(periode.to)}`;

  return (
    <div className="w-full bg-white font-sans text-slate-900">
      <KopSuratEklaim variant="compact" />

      <div className="mt-4 border-b-[2.5px] border-double border-slate-700 pb-1.5 text-center">
        <h2 className="text-[11.5pt] font-bold tracking-wide text-slate-800">LAPORAN AUDIT TRAIL WEB SERVICE BPJS KESEHATAN</h2>
        <p className="text-[8.5pt] text-slate-600 tabular-nums">Periode: {rentang}</p>
        {keterangan && <p className="text-[8pt] text-slate-500">Saringan: {keterangan}</p>}
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        <Angka label="Panggilan" nilai={total} />
        <Angka label="Berhasil" nilai={berhasil} ket={total > 0 ? `${Math.round((berhasil / total) * 100)}%` : undefined} className="text-emerald-700" />
        <Angka label="Gagal" nilai={gagal} ket={`${pctGagal}% dari panggilan`} className={gagal > 0 ? "text-rose-700" : undefined} />
        <Angka label="Rata-rata durasi" nilai={fmtDurasi(rata)} />
      </div>

      {teratas && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-1.5">
          <span className="text-[7.5pt] font-semibold text-rose-700">Paling sering gagal</span>
          <span className="min-w-0 truncate text-[8pt] text-rose-800">{teratas[0]}</span>
          <span className="ml-auto text-[7.5pt] font-bold text-rose-700 tabular-nums">{teratas[1]}×</span>
        </div>
      )}

      <div className="mt-3">
        <p className="mb-1.5 text-[7.5pt] font-bold text-slate-500 tabular-nums">Rincian ({total} panggilan)</p>
        <table className="w-full border-collapse text-[7.5pt] tabular-nums">
          <thead>
            <tr className="bg-slate-100 text-slate-700">
              <th className="w-5 border border-slate-200 px-1.5 py-1 text-center font-semibold">#</th>
              <th className="w-24 border border-slate-200 px-1.5 py-1 text-left font-semibold">Waktu</th>
              <th className="border border-slate-200 px-1.5 py-1 text-left font-semibold">Endpoint</th>
              <th className="w-11 border border-slate-200 px-1.5 py-1 text-center font-semibold">Metode</th>
              <th className="w-9 border border-slate-200 px-1.5 py-1 text-center font-semibold">Kode</th>
              <th className="w-12 border border-slate-200 px-1.5 py-1 text-center font-semibold">Hasil</th>
              <th className="w-14 border border-slate-200 px-1.5 py-1 text-right font-semibold">Durasi</th>
              <th className="w-28 border border-slate-200 px-1.5 py-1 text-left font-semibold">Aktor</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.id} className={cn("break-inside-avoid", !e.success ? "bg-rose-50/70" : i % 2 === 1 ? "bg-slate-50/60" : "bg-white")}>
                <td className="border border-slate-100 px-1.5 py-0.5 text-center text-slate-500">{i + 1}</td>
                <td className="border border-slate-100 px-1.5 py-0.5 whitespace-nowrap text-slate-600">{fmtWaktuRingkas(e.timestamp)}</td>
                <td className="border border-slate-100 px-1.5 py-0.5 break-all text-slate-800">
                  {e.endpoint}
                  {e.errorType && <span className="ml-1 text-[6.5pt] font-semibold text-rose-700">{e.errorType}</span>}
                </td>
                <td className="border border-slate-100 px-1.5 py-0.5 text-center font-semibold text-slate-700">{e.method}</td>
                <td className="border border-slate-100 px-1.5 py-0.5 text-center font-semibold text-slate-700">{e.responseCode}</td>
                <td className={cn("border border-slate-100 px-1.5 py-0.5 text-center font-semibold", e.success ? "text-emerald-700" : "text-rose-700")}>
                  {e.success ? "Berhasil" : "Gagal"}
                </td>
                <td className="border border-slate-100 px-1.5 py-0.5 text-right text-slate-600">{fmtDurasi(e.durationMs)}</td>
                <td className="border border-slate-100 px-1.5 py-0.5 text-slate-700">{e.actor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end break-inside-avoid">
        <div className="w-56 text-center">
          <p className="text-[9pt] text-slate-600">
            {rs.alamat.kota}, {today}
          </p>
          <p className="text-[9pt] font-bold text-slate-800">{rs.nama}</p>
          <p className="text-[9pt] text-slate-600">Penanggung jawab BPJS</p>
          <div className="mt-12 border-b border-slate-800" />
          <p className="mt-0.5 text-[8.5pt] text-slate-500">( ........................................ )</p>
          <p className="text-[8pt] text-slate-500">NIP / NIK</p>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-200 pt-2 text-center text-[7.5pt] text-slate-500">
        Dicetak dari EHIS · {todayLong()} · {rs.nama} · {total} panggilan · isi permintaan/respons tidak disimpan (UU PDP 27/2022)
      </div>
    </div>
  );
}
