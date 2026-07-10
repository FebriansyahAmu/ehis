"use client";

// Template cetak SURAT RUJUKAN (A4) — Rawat Jalan Disposisi → Rujuk Eksternal (JKN).
// Data = respons V-Claim Rujukan (bentuk detail TrustMark: AsalRujukan · peserta · diagnosa ·
// tujuanRujukan · poliTujuan · tgl*) yang disintesis mock saat kirim (selalu sukses, belum ada
// cons-id prod). Layout surat resmi: KOP RS · nomor rujukan · identitas peserta · blok tujuan
// highlight · diagnosa · tanggal · No. Rujukan BPJS · TTD. Light tones (printer-friendly).
// Dirender di dalam `.print-area` oleh RujukanCetakModal.

import KopSuratEklaim from "@/components/eklaim/berkas/KopSuratEklaim";
import { RS_PROFIL_INITIAL } from "@/lib/master/rsProfilStore";
import type { RujukanDetail } from "@/lib/schemas/rujukanEksternal/rujukanEksternal";

// Kontrak CETAK = snapshot `RujukanDetail` (schema server, tersimpan di detail JSONB). Alias agar
// konsumen FE (form/modal/DisposisiResult) tetap pakai nama `RujukanCetakData` + `dto.detail`
// langsung bisa dicetak (cetak ulang) tanpa adapter.
export type RujukanCetakData = RujukanDetail;

const TIPE_LABEL: Record<string, string> = {
  "0": "Rujukan Penuh",
  "1": "Rujukan Partial",
  "2": "Rujukan Balik (PRB)",
};
const JNS_LABEL: Record<string, string> = { "1": "Rawat Inap", "2": "Rawat Jalan" };

function fmtTglPendek(ymd?: string): string {
  if (!ymd) return "—";
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
function fmtWaktu(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function FR({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="w-40 py-[2px] align-top text-[9pt] text-slate-500">{label}</td>
      <td className="w-3 py-[2px] align-top text-[8.5pt] text-slate-400">:</td>
      <td className="py-[2px] text-[9pt] font-medium text-slate-800">{children}</td>
    </tr>
  );
}

const INSTRUKSI = [
  "Surat rujukan berlaku sesuai masa berlaku yang tercantum (peserta JKN: 90 hari sejak tanggal rujukan).",
  "Bawa surat rujukan ini, kartu identitas (KTP), dan kartu JKN/BPJS saat kunjungan ke faskes tujuan.",
  "Sertakan hasil pemeriksaan penunjang serta resume/obat yang sedang dikonsumsi (bila ada).",
  "Rujukan berlaku untuk pelayanan sesuai poli/tujuan yang tercantum.",
];

export default function RujukanCetakTemplate({ data }: { data: RujukanCetakData }) {
  const rs = RS_PROFIL_INITIAL;
  const isPRB = data.tipeRujukan === "2";
  const tglTerbit = data.terbitAt
    ? new Date(data.terbitAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="flex min-h-full w-full flex-col bg-white px-12 py-9 font-sans text-slate-900">
      <KopSuratEklaim variant="compact" />

      {/* ── Judul + nomor ── */}
      <div className="mt-4 text-center">
        <h2 className="text-[13pt] font-bold uppercase tracking-[0.3em] text-slate-900 underline decoration-2 underline-offset-4">
          Surat Rujukan
        </h2>
        <p className="mt-1 text-[8.5pt] font-semibold uppercase tracking-wider text-indigo-700">
          {TIPE_LABEL[data.tipeRujukan] ?? "Rujukan"} · {JNS_LABEL[data.jnsPelayanan] ?? ""}
        </p>
        <p className="mt-1 text-[9pt] text-slate-600">
          Nomor: <span className="font-mono font-bold tracking-wider text-slate-800">{data.noRujukan || "—"}</span>
        </p>
      </div>

      {/* ── Pembuka ── */}
      <p className="mt-4 text-[9.5pt] leading-relaxed text-slate-700">
        Yang bertanda tangan di bawah ini, Dokter Penanggung Jawab Pelayanan {rs.nama}, dengan ini merujuk
        pasien berikut untuk mendapatkan pelayanan lebih lanjut:
      </p>

      {/* ── Identitas peserta ── */}
      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/60 px-5 py-3">
        <table style={{ borderCollapse: "collapse" }} className="w-full">
          <tbody>
            <FR label="Nama Peserta">
              <span className="font-bold">{data.peserta.nama}</span>
              <span className="ml-2 text-slate-500">({data.peserta.kelamin})</span>
            </FR>
            <FR label="No. Rekam Medis"><span className="font-mono font-semibold">{data.peserta.noMr}</span></FR>
            {data.peserta.tglLahir && <FR label="Tanggal Lahir">{data.peserta.tglLahir}</FR>}
            <FR label="No. Kartu JKN"><span className="font-mono font-semibold">{data.peserta.noKartu}</span></FR>
            <FR label="Jenis Peserta">{data.peserta.jnsPeserta}</FR>
          </tbody>
        </table>
      </div>

      {/* ── Tujuan rujukan — highlight ── */}
      <div className="page-break-avoid mt-3 overflow-hidden rounded-xl border-2 border-indigo-600">
        <div className="bg-indigo-600 px-5 py-1.5 text-center text-[8pt] font-bold uppercase tracking-[0.25em] text-white">
          Dirujuk Ke
        </div>
        <div className="grid grid-cols-3 divide-x divide-indigo-100 bg-indigo-50/50">
          <div className="px-4 py-3 text-center">
            <p className="text-[7.5pt] font-semibold uppercase tracking-wider text-indigo-700/70">Faskes Tujuan</p>
            <p className="mt-1 text-[10.5pt] font-bold leading-snug text-slate-900">{data.tujuanRujukan.nama || "—"}</p>
            {data.tujuanRujukan.kode && <p className="font-mono text-[8pt] text-slate-500">Kode: {data.tujuanRujukan.kode}</p>}
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[7.5pt] font-semibold uppercase tracking-wider text-indigo-700/70">Jenis Pelayanan</p>
            <p className="mt-1 text-[10.5pt] font-bold leading-snug text-slate-900">{JNS_LABEL[data.jnsPelayanan] ?? "—"}</p>
            <p className="text-[8pt] text-slate-500">{TIPE_LABEL[data.tipeRujukan]}</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[7.5pt] font-semibold uppercase tracking-wider text-indigo-700/70">Poli Tujuan</p>
            <p className="mt-1 text-[10.5pt] font-bold leading-snug text-slate-900">
              {isPRB ? "—" : data.poliTujuan.nama || "—"}
            </p>
            {!isPRB && data.poliTujuan.kode && <p className="font-mono text-[8pt] text-slate-500">Kode: {data.poliTujuan.kode}</p>}
            {isPRB && <p className="text-[8pt] text-slate-500">Rujuk balik ke FKTP</p>}
          </div>
        </div>
      </div>

      {/* ── Diagnosa ── */}
      <div className="page-break-avoid mt-3 rounded-lg border border-slate-200 px-4 py-2.5">
        <p className="text-[7.5pt] font-bold uppercase tracking-wider text-slate-400">Diagnosa Rujukan</p>
        <p className="mt-0.5 text-[10pt] font-semibold text-slate-800">
          {data.diagnosa.nama || "—"}
          {data.diagnosa.kode && <span className="ml-2 font-mono text-[8.5pt] text-slate-500">({data.diagnosa.kode})</span>}
        </p>
      </div>

      {/* ── Tanggal + No. Rujukan BPJS ── */}
      <div className="page-break-avoid mt-3 flex items-stretch gap-3">
        <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[7pt] font-semibold uppercase tracking-wider text-slate-400">Tgl Rujukan</p>
              <p className="mt-0.5 text-[9pt] font-semibold text-slate-800">{fmtTglPendek(data.tglRujukan)}</p>
            </div>
            <div>
              <p className="text-[7pt] font-semibold uppercase tracking-wider text-slate-400">Rencana Kunjungan</p>
              <p className="mt-0.5 text-[9pt] font-semibold text-slate-800">{fmtTglPendek(data.tglRencanaKunjungan)}</p>
            </div>
            <div>
              <p className="text-[7pt] font-semibold uppercase tracking-wider text-slate-400">Berlaku s/d</p>
              <p className="mt-0.5 text-[9pt] font-semibold text-slate-800">{fmtTglPendek(data.tglBerlakuKunjungan)}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="page-break-avoid mt-3">
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5">
          <p className="text-[7.5pt] font-semibold uppercase tracking-wider text-indigo-700/70">No. Rujukan BPJS</p>
          <p className="mt-0.5 font-mono text-[12pt] font-bold tracking-[0.18em] text-indigo-800">{data.noRujukan}</p>
        </div>
      </div>

      {/* ── Faskes perujuk + catatan ── */}
      <div className="page-break-avoid mt-3 text-[8.5pt] text-slate-600">
        Faskes Perujuk: <span className="font-semibold text-slate-800">{data.asalRujukan.nama}</span>
        {data.asalRujukan.kode && <span className="ml-1 font-mono text-slate-500">({data.asalRujukan.kode})</span>}
      </div>
      {data.catatan && (
        <div className="page-break-avoid mt-2">
          <p className="text-[7.5pt] font-bold uppercase tracking-wider text-slate-400">Catatan Klinis</p>
          <p className="mt-1 whitespace-pre-wrap rounded-lg border border-slate-200 px-4 py-2 text-[9pt] leading-relaxed text-slate-700">
            {data.catatan}
          </p>
        </div>
      )}

      {/* ── Instruksi ── */}
      <div className="page-break-avoid mt-3">
        <p className="text-[7.5pt] font-bold uppercase tracking-wider text-slate-400">Perhatian untuk Pasien / Keluarga</p>
        <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-[8.5pt] leading-relaxed text-slate-600">
          {INSTRUKSI.map((t) => <li key={t}>{t}</li>)}
        </ol>
      </div>

      {/* ── Tanda tangan ── */}
      <div className="page-break-avoid mt-8 grid grid-cols-2 gap-8">
        <div className="text-center">
          <p className="text-[9pt] text-slate-600">&nbsp;</p>
          <p className="mt-0.5 text-[9pt] font-bold text-slate-800">Pasien / Keluarga</p>
          <div className="mx-6 mt-14 border-b border-slate-800" />
          <p className="mt-0.5 text-[8.5pt] font-semibold text-slate-700">{data.peserta.nama}</p>
        </div>
        <div className="text-center">
          <p className="text-[9pt] text-slate-600">{rs.alamat.kota}, {tglTerbit}</p>
          <p className="mt-0.5 text-[9pt] font-bold text-slate-800">Dokter Perujuk</p>
          <div className="mx-6 mt-14 border-b border-slate-800" />
          <p className="mt-0.5 text-[8.5pt] font-semibold text-slate-700">{data.dokterPerujuk || "—"}</p>
        </div>
      </div>

      {/* ── Footer meta ── */}
      <div className="mt-auto border-t border-slate-200 pt-2 text-center text-[7.5pt] text-slate-400">
        Diterbitkan melalui EHIS &nbsp;·&nbsp; {fmtWaktu(data.terbitAt)}
        {data.pencatat && <> &nbsp;·&nbsp; Pencatat: {data.pencatat}</>}
        &nbsp;·&nbsp; {rs.nama}
      </div>
    </div>
  );
}
