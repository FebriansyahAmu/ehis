"use client";

// Bukti Pendaftaran — template cetak A4 tanda bukti pendaftaran pasien (dari Tab Cetak
// Dokumen / grup Manajemen di detail kunjungan). Data 100% dari record yang sudah ada:
//   KunjunganRecord (no. daftar/kunjungan · tanggal · unit · dokter · poli/ruangan · penjamin · SEP)
//   PatientMaster   (identitas: RM · NIK · TTL · kelamin · alamat)
// → tanpa fetch tambahan; berlaku sama untuk pasien nyata maupun demo.
// KOP + logo mengikuti master (useRsProfil → KopSuratEklaim). Light tones (printer-friendly);
// dirender di dalam `.print-area` (data-paper="A4") oleh BuktiPendaftaranModal.

import KopSuratEklaim from "@/components/eklaim/berkas/KopSuratEklaim";
import { useRsProfil } from "@/lib/master/rsProfilClient";
import type { KunjunganRecord, PatientMaster } from "@/lib/data";

// ── Helpers ──────────────────────────────────────────────────────────────────

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** "Senin, 8 Agustus 2026" (dari ISO date / datetime). */
function fmtTglLong(raw: string): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw || "—";
  return d.toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

/** "14:30 WIB" bila `raw` memuat komponen jam, else "". */
function fmtJam(raw: string): string {
  if (!/\d{2}:\d{2}/.test(raw)) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())} WIB`;
}

/** "12 Maret 1970" (dari "YYYY-MM-DD"). */
function fmtTglPendek(ymd?: string): string {
  if (!ymd) return "—";
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function alamatLengkap(p: PatientMaster): string {
  return [
    p.alamat,
    p.kelurahan && `Kel. ${p.kelurahan}`,
    p.kecamatan && `Kec. ${p.kecamatan}`,
    p.kota,
    p.provinsi,
    p.kodePos,
  ].filter(Boolean).join(", ");
}

const PERHATIAN = [
  "Simpan bukti pendaftaran ini dan tunjukkan kepada petugas saat pemanggilan.",
  "Harap hadir minimal 30 menit sebelum jadwal pelayanan.",
  "Membawa kartu identitas (KTP) serta kartu BPJS / asuransi (bila ada).",
  "Peserta BPJS: pastikan SEP telah diterbitkan sebelum menerima pelayanan.",
];

// ── Baris data (label : value) ───────────────────────────────────────────────

function FR({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="w-32 py-[2px] align-top text-[9pt] text-slate-500">{label}</td>
      <td className="w-3 py-[2px] align-top text-[8.5pt] text-slate-400">:</td>
      <td className="py-[2px] align-top text-[9pt] font-medium text-slate-800">{children}</td>
    </tr>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 border-b border-slate-200 pb-1 text-[8pt] font-bold uppercase tracking-[0.18em] text-slate-400">
      {children}
    </p>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export interface BuktiPendaftaranData {
  kunjungan: KunjunganRecord;
  patient: PatientMaster;
}

export default function BuktiPendaftaranSheet({ kunjungan, patient }: BuktiPendaftaranData) {
  const rs = useRsProfil();

  const noDaftar = kunjungan.noPendaftaran || kunjungan.noKunjungan || "—";
  const tglLong = fmtTglLong(kunjungan.tanggal);
  const jam = fmtJam(kunjungan.tanggal);
  const kelamin = patient.gender === "L" ? "Laki-laki" : "Perempuan";
  const penjamin = kunjungan.penjamin || "Umum";
  const tempatTglLahir = `${patient.tempatLahir || "—"}, ${fmtTglPendek(patient.tanggalLahir)}`;
  // Unit RI menampilkan ruangan; RJ menampilkan poliklinik.
  const layananUtama = kunjungan.ruangan || kunjungan.poli || "—";
  const layananLabel = kunjungan.ruangan ? "Ruangan" : "Poliklinik";

  const tglCetak = new Date().toLocaleString("id-ID", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="flex min-h-full w-full flex-col bg-white px-12 py-9 font-sans text-slate-900">
      <KopSuratEklaim variant="full" />

      {/* ── Judul + nomor ── */}
      <div className="mt-4 text-center">
        <h2 className="text-[13pt] font-bold uppercase tracking-[0.28em] text-slate-900">
          Bukti Pendaftaran Pasien
        </h2>
        <p className="mt-1 text-[9pt] text-slate-600">
          Nomor Pendaftaran:{" "}
          <span className="font-mono font-bold tracking-wider text-slate-800">{noDaftar}</span>
        </p>
      </div>

      {/* ── Strip ringkas pendaftaran ── */}
      <div className="page-break-avoid mt-4 overflow-hidden rounded-xl border-2 border-sky-600">
        <div className="bg-sky-600 px-5 py-1.5 text-center text-[8pt] font-bold uppercase tracking-[0.25em] text-white">
          Rincian Pendaftaran
        </div>
        <div className="grid grid-cols-3 divide-x divide-sky-100 bg-sky-50/60">
          <div className="px-4 py-3 text-center">
            <p className="text-[7.5pt] font-semibold uppercase tracking-wider text-sky-700/70">Tanggal / Jam Daftar</p>
            <p className="mt-1 text-[10.5pt] font-bold leading-snug text-slate-900">{tglLong}</p>
            {jam && <p className="font-mono text-[8.5pt] text-slate-500">{jam}</p>}
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[7.5pt] font-semibold uppercase tracking-wider text-sky-700/70">Unit Pelayanan</p>
            <p className="mt-1 text-[10.5pt] font-bold leading-snug text-slate-900">{kunjungan.unit}</p>
            {kunjungan.poli && kunjungan.ruangan && (
              <p className="text-[8.5pt] text-slate-500">{kunjungan.poli}</p>
            )}
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[7.5pt] font-semibold uppercase tracking-wider text-sky-700/70">Dokter (DPJP)</p>
            <p className="mt-1 text-[10.5pt] font-bold leading-snug text-slate-900">{kunjungan.dokter || "—"}</p>
          </div>
        </div>
      </div>

      {/* ── Dua kolom: identitas pasien + data pelayanan ── */}
      <div className="mt-4 grid grid-cols-2 gap-x-8">
        <div>
          <SectionLabel>Data Pasien</SectionLabel>
          <table style={{ borderCollapse: "collapse" }} className="w-full">
            <tbody>
              <FR label="No. Rekam Medis"><span className="font-mono font-semibold">{patient.noRM}</span></FR>
              <FR label="Nama Pasien"><span className="font-bold">{patient.name}</span></FR>
              <FR label="NIK"><span className="font-mono">{patient.nik || "—"}</span></FR>
              <FR label="Tempat/Tgl Lahir">{tempatTglLahir}</FR>
              <FR label="Umur">{patient.age} tahun</FR>
              <FR label="Jenis Kelamin">{kelamin}</FR>
              <FR label="Alamat">{alamatLengkap(patient)}</FR>
            </tbody>
          </table>
        </div>

        <div>
          <SectionLabel>Data Pelayanan</SectionLabel>
          <table style={{ borderCollapse: "collapse" }} className="w-full">
            <tbody>
              <FR label="Unit Tujuan">{kunjungan.unit}</FR>
              <FR label={layananLabel}>{layananUtama}</FR>
              <FR label="Dokter (DPJP)">{kunjungan.dokter || "—"}</FR>
              <FR label="Penjamin">{penjamin}</FR>
              {kunjungan.noPenjamin && (
                <FR label="No. Kartu"><span className="font-mono">{kunjungan.noPenjamin}</span></FR>
              )}
              {kunjungan.noSEP && (
                <FR label="No. SEP"><span className="font-mono font-semibold">{kunjungan.noSEP}</span></FR>
              )}
              {kunjungan.caraDatang && <FR label="Cara Datang">{kunjungan.caraDatang}</FR>}
              {kunjungan.keluhan && <FR label="Keluhan">{kunjungan.keluhan}</FR>}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Perhatian ── */}
      <div className="page-break-avoid mt-4">
        <p className="text-[7.5pt] font-bold uppercase tracking-wider text-slate-400">Perhatian untuk Pasien / Keluarga</p>
        <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-[8.5pt] leading-relaxed text-slate-600">
          {PERHATIAN.map((t) => <li key={t}>{t}</li>)}
        </ol>
      </div>

      {/* ── Tanda tangan ── */}
      <div className="page-break-avoid mt-6 grid grid-cols-2 gap-8">
        <div className="text-center">
          <p className="text-[9pt] text-slate-600">&nbsp;</p>
          <p className="mt-0.5 text-[9pt] font-bold text-slate-800">Pasien / Keluarga</p>
          <div className="mx-8 mt-12 border-b border-slate-800" />
          <p className="mt-0.5 text-[8.5pt] font-semibold text-slate-700">{patient.name}</p>
        </div>
        <div className="text-center">
          <p className="text-[9pt] text-slate-600">{rs.alamat.kota}, {tglLong}</p>
          <p className="mt-0.5 text-[9pt] font-bold text-slate-800">Petugas Pendaftaran</p>
          <div className="mx-8 mt-12 border-b border-slate-800" />
          <p className="mt-0.5 text-[8.5pt] font-semibold text-slate-700">(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
        </div>
      </div>

      {/* ── Footer meta ── */}
      <div className="mt-auto border-t border-slate-200 pt-2 text-center text-[7.5pt] text-slate-400">
        Diterbitkan melalui EHIS &nbsp;·&nbsp; {tglCetak} &nbsp;·&nbsp; {rs.nama}
      </div>
    </div>
  );
}
