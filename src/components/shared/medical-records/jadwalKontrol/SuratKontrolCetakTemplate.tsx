"use client";

// Template cetak SURAT KONTROL (A4) — SHARED (Rawat Inap sub Surat-surat · Rawat Jalan Surat &
// Dokumen). Sumber data = medicalrecord.JadwalKontrol (nomor JK-… + noReferensi/noSuratKontrol
// BPJS) via adapter SuratKontrolCetakData. Narasi konteks perawatan menyesuaikan `konteks`:
//   "ri" → "menjalani perawatan rawat inap di {ruangan} ({kelas}) sejak {tglMasuk}"
//   "rj" → "menjalani pemeriksaan di {ruangan} pada {tglMasuk}"
// Layout surat resmi: KOP RS · nomor · identitas pasien · jadwal kontrol highlight · blok BPJS ·
// instruksi · TTD. Light tones (printer-friendly). Dipakai di dalam `.print-area` oleh modal.

import KopSuratEklaim from "@/components/eklaim/berkas/KopSuratEklaim";
import { RS_PROFIL_INITIAL } from "@/lib/master/rsProfilStore";

// ── Data contract (adapter dari JadwalKontrolDTO / mock demo) ────────────────

export interface SuratKontrolCetakData {
  /** Konteks unit penerbit — mengubah narasi & label TTD. Default "ri". */
  konteks?: "ri" | "rj";
  jadwal: {
    nomor: string;               // JK-<YYMM><NNN> — "" bila demo/lokal
    tanggal: string;             // "YYYY-MM-DD" — tglRencanaKontrol
    poliNama: string;
    poliKontrol?: string;        // kode poli BPJS (mis. "INT")
    dokterNama: string;
    kodeDokter?: string;         // kode DPJP BPJS (HFIS)
    noSep?: string;
    noReferensi?: string | null; // noSuratKontrol dari BPJS — null/"" = non-BPJS
    catatan?: string;
    pencatat?: string;
    terbitAt?: string;           // ISO createdAt
  };
  pasien: {
    nama: string;
    noRM: string;
    gender: "L" | "P";
    umur: string;                // "67 tahun"
    tanggalLahir?: string;
    alamat?: string;
    penjamin: string;            // display: "BPJS Non PBI" / "Umum" / …
    noBpjs?: string;
  };
  perawatan: {
    ruangan: string;             // RI: bangsal · RJ: "Poliklinik …"
    kelas: string;               // RI: kelas rawat · RJ: "" (tak dipakai)
    dpjp: string;                // penanda tangan (DPJP / dokter pemeriksa)
    tglMasuk: string;            // RI: tgl masuk · RJ: tgl kunjungan (display)
    diagnosa: { kode: string; nama: string; utama: boolean }[];
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtTglLong(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymd || "—";
  return d.toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function fmtWaktu(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
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

const INSTRUKSI_HADIR = [
  "Hadir sesuai jadwal dengan membawa surat kontrol ini.",
  "Membawa kartu identitas (KTP) dan kartu BPJS / asuransi (bila ada).",
  "Membawa obat-obatan yang sedang dikonsumsi serta hasil pemeriksaan penunjang terakhir.",
  "Peserta BPJS: surat berlaku untuk 1 (satu) kali kunjungan poliklinik sesuai tanggal rencana kontrol.",
];

// ── Main ─────────────────────────────────────────────────────────────────────

export default function SuratKontrolCetakTemplate({ data }: { data: SuratKontrolCetakData }) {
  const rs = RS_PROFIL_INITIAL;
  const { jadwal, pasien, perawatan } = data;
  const isRJ = data.konteks === "rj";
  const isBpjs = !!jadwal.noReferensi || !!jadwal.noSep;
  const diagnosa = [...perawatan.diagnosa].sort((a, b) => Number(b.utama) - Number(a.utama));
  const tglTerbit = jadwal.terbitAt
    ? new Date(jadwal.terbitAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const diagnosaNode = diagnosa.length > 0 ? (
    <>
      {" "}dengan diagnosis{" "}
      {diagnosa.map((d, i) => (
        <span key={`${d.kode}-${i}`}>
          {i > 0 && "; "}
          <span className="font-semibold">{d.nama}</span>
          {d.kode && <span className="font-mono text-[8.5pt] text-slate-500"> ({d.kode})</span>}
          {d.utama && <span className="text-[8pt] text-slate-400"> [utama]</span>}
        </span>
      ))}
    </>
  ) : null;

  return (
    <div className="flex min-h-full w-full flex-col bg-white px-12 py-9 font-sans text-slate-900">
      <KopSuratEklaim variant="compact" />

      {/* ── Judul + nomor ── */}
      <div className="mt-4 text-center">
        <h2 className="text-[13pt] font-bold uppercase tracking-[0.3em] text-slate-900 underline decoration-2 underline-offset-4">
          Surat Kontrol
        </h2>
        <p className="mt-1 text-[9pt] text-slate-600">
          Nomor: <span className="font-mono font-bold tracking-wider text-slate-800">{jadwal.nomor || "—"}</span>
        </p>
      </div>

      {/* ── Pembuka ── */}
      <p className="mt-4 text-[9.5pt] leading-relaxed text-slate-700">
        Yang bertanda tangan di bawah ini, {isRJ ? "Dokter Pemeriksa" : "Dokter Penanggung Jawab Pelayanan (DPJP)"} {rs.nama},
        menerangkan bahwa pasien:
      </p>

      {/* ── Identitas pasien ── */}
      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50/60 px-5 py-3">
        <table style={{ borderCollapse: "collapse" }} className="w-full">
          <tbody>
            <FR label="Nama Pasien">
              <span className="font-bold">{pasien.nama}</span>
              <span className="ml-2 text-slate-500">({pasien.gender === "L" ? "Laki-laki" : "Perempuan"} · {pasien.umur})</span>
            </FR>
            <FR label="No. Rekam Medis"><span className="font-mono font-semibold">{pasien.noRM}</span></FR>
            {pasien.tanggalLahir && <FR label="Tanggal Lahir">{pasien.tanggalLahir}</FR>}
            {pasien.alamat && <FR label="Alamat">{pasien.alamat}</FR>}
            <FR label="Penjamin">
              {pasien.penjamin}
              {pasien.noBpjs && (
                <span className="ml-2 font-mono text-[8.5pt] text-slate-600">No. Kartu {pasien.noBpjs}</span>
              )}
            </FR>
          </tbody>
        </table>
      </div>

      {/* ── Konteks perawatan ── */}
      {isRJ ? (
        <p className="mt-3 text-[9.5pt] leading-relaxed text-slate-700">
          telah menjalani pemeriksaan di <span className="font-semibold">{perawatan.ruangan}</span>
          {perawatan.tglMasuk && <> pada <span className="font-semibold">{perawatan.tglMasuk}</span></>}
          {perawatan.dpjp && <> di bawah dokter <span className="font-semibold">{perawatan.dpjp}</span></>}
          {diagnosaNode}
          , dan dijadwalkan untuk <span className="font-bold">kontrol kembali</span> pada:
        </p>
      ) : (
        <p className="mt-3 text-[9.5pt] leading-relaxed text-slate-700">
          telah menjalani perawatan rawat inap di <span className="font-semibold">{perawatan.ruangan}</span> ({perawatan.kelas})
          sejak <span className="font-semibold">{perawatan.tglMasuk}</span> di bawah DPJP{" "}
          <span className="font-semibold">{perawatan.dpjp}</span>
          {diagnosaNode}
          , dan dijadwalkan untuk <span className="font-bold">kontrol kembali</span> pada:
        </p>
      )}

      {/* ── Jadwal kontrol — highlight ── */}
      <div className="page-break-avoid mt-3 overflow-hidden rounded-xl border-2 border-emerald-600">
        <div className="bg-emerald-600 px-5 py-1.5 text-center text-[8pt] font-bold uppercase tracking-[0.25em] text-white">
          Jadwal Kontrol Poliklinik
        </div>
        <div className="grid grid-cols-3 divide-x divide-emerald-100 bg-emerald-50/50">
          <div className="px-4 py-3 text-center">
            <p className="text-[7.5pt] font-semibold uppercase tracking-wider text-emerald-700/70">Hari / Tanggal</p>
            <p className="mt-1 text-[10.5pt] font-bold leading-snug text-slate-900">{fmtTglLong(jadwal.tanggal)}</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[7.5pt] font-semibold uppercase tracking-wider text-emerald-700/70">Poliklinik Tujuan</p>
            <p className="mt-1 text-[10.5pt] font-bold leading-snug text-slate-900">{jadwal.poliNama}</p>
            {jadwal.poliKontrol && (
              <p className="font-mono text-[8pt] text-slate-500">Kode: {jadwal.poliKontrol}</p>
            )}
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-[7.5pt] font-semibold uppercase tracking-wider text-emerald-700/70">Dokter Tujuan</p>
            <p className="mt-1 text-[10.5pt] font-bold leading-snug text-slate-900">{jadwal.dokterNama || "—"}</p>
            {jadwal.kodeDokter && (
              <p className="font-mono text-[8pt] text-slate-500">Kode DPJP: {jadwal.kodeDokter}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Blok BPJS (No. Referensi = noSuratKontrol V-Claim) ── */}
      {isBpjs && (
        <div className="page-break-avoid mt-3 flex items-stretch gap-3">
          <div className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5">
            <p className="text-[7.5pt] font-semibold uppercase tracking-wider text-emerald-700/70">
              No. Referensi BPJS (Surat Kontrol)
            </p>
            <p className="mt-0.5 font-mono text-[12pt] font-bold tracking-[0.2em] text-emerald-800">
              {jadwal.noReferensi || "Belum terbit"}
            </p>
          </div>
          {jadwal.noSep && (
            <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
              <p className="text-[7.5pt] font-semibold uppercase tracking-wider text-slate-400">
                No. SEP Asal
              </p>
              <p className="mt-0.5 font-mono text-[11pt] font-bold tracking-wider text-slate-700">
                {jadwal.noSep}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Catatan dokter ── */}
      {jadwal.catatan && (
        <div className="page-break-avoid mt-3">
          <p className="text-[7.5pt] font-bold uppercase tracking-wider text-slate-400">Catatan / Instruksi Dokter</p>
          <p className="mt-1 whitespace-pre-wrap rounded-lg border border-slate-200 px-4 py-2 text-[9pt] leading-relaxed text-slate-700">
            {jadwal.catatan}
          </p>
        </div>
      )}

      {/* ── Instruksi kehadiran ── */}
      <div className="page-break-avoid mt-3">
        <p className="text-[7.5pt] font-bold uppercase tracking-wider text-slate-400">Perhatian untuk Pasien / Keluarga</p>
        <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-[8.5pt] leading-relaxed text-slate-600">
          {INSTRUKSI_HADIR.map((t) => <li key={t}>{t}</li>)}
        </ol>
      </div>

      {/* ── Tanda tangan ── */}
      <div className="page-break-avoid mt-8 grid grid-cols-2 gap-8">
        <div className="text-center">
          <p className="text-[9pt] text-slate-600">&nbsp;</p>
          <p className="mt-0.5 text-[9pt] font-bold text-slate-800">Pasien / Keluarga</p>
          <div className="mx-6 mt-14 border-b border-slate-800" />
          <p className="mt-0.5 text-[8.5pt] font-semibold text-slate-700">{pasien.nama}</p>
        </div>
        <div className="text-center">
          <p className="text-[9pt] text-slate-600">{rs.alamat.kota}, {tglTerbit}</p>
          <p className="mt-0.5 text-[9pt] font-bold text-slate-800">
            {isRJ ? "Dokter Pemeriksa" : "Dokter Penanggung Jawab (DPJP)"}
          </p>
          <div className="mx-6 mt-14 border-b border-slate-800" />
          <p className="mt-0.5 text-[8.5pt] font-semibold text-slate-700">{perawatan.dpjp}</p>
          {jadwal.kodeDokter && <p className="text-[8pt] text-slate-400">Kode DPJP: {jadwal.kodeDokter}</p>}
        </div>
      </div>

      {/* ── Footer meta ── */}
      <div className="mt-auto border-t border-slate-200 pt-2 text-center text-[7.5pt] text-slate-400">
        Diterbitkan melalui EHIS &nbsp;·&nbsp; {fmtWaktu(jadwal.terbitAt)}
        {jadwal.pencatat && <> &nbsp;·&nbsp; Pencatat: {jadwal.pencatat}</>}
        &nbsp;·&nbsp; {rs.nama}
      </div>
    </div>
  );
}
