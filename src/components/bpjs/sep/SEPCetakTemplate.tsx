"use client";

/**
 * SEP Cetak Template — A4 KOP RS (BP8.4).
 *
 * Dokumen resmi Surat Eligibilitas Peserta siap cetak.
 * Props: sep: SEPRecordExt — dari CariSEPPanel hasil cari noSEP.
 * Lebar 794px = A4 96dpi; render di modal PrintPreview atau window.print().
 */

import KopSuratEklaim from "@/components/eklaim/berkas/KopSuratEklaim";
import { RS_PROFIL_INITIAL } from "@/lib/master/rsProfilStore";
import type { SEPRecordExt } from "@/lib/bpjs/bpjsShared";
import { fmtTgl, jnsLabel, asalLabel } from "./sepShared";
import { fmtDateShortDoc, todayLong } from "@/components/eklaim/berkas/berkasGeneratorShared";

// ── Helpers ───────────────────────────────────────────────

const LAKA_LABEL: Record<string, string> = {
  "0": "BKLL (Bukan Kecelakaan Lalu Lintas)",
  "1": "KLL — Bukan Kecelakaan Kerja",
  "2": "KLL dan Kecelakaan Kerja",
  "3": "Kecelakaan Kerja saja",
};

const KLS_HAK_LABEL: Record<string, string> = {
  "1": "Kelas I",
  "2": "Kelas II",
  "3": "Kelas III",
};

const KLS_NAIK_LABEL: Record<string, string> = {
  "1": "VVIP", "2": "VIP", "3": "Kelas I", "4": "Kelas II",
  "5": "Kelas III", "6": "ICCU", "7": "ICU", "8": "Di Atas Kelas I",
};

const PEMBIAYAAN_LABEL: Record<string, string> = {
  "1": "Pribadi", "2": "Pemberi Kerja", "3": "Asuransi Kesehatan Tambahan",
};

// ── Sub-components ────────────────────────────────────────

function FR({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="w-44 py-[2px] align-top text-[9pt] text-slate-500">{label}</td>
      <td className="w-3 py-[2px] align-top text-[8.5pt] text-slate-400">:</td>
      <td className="py-[2px] text-[9pt] font-medium text-slate-800">{children}</td>
    </tr>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 mt-3.5 text-[7.5pt] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </p>
  );
}

// ── Main ──────────────────────────────────────────────────

interface Props {
  sep: SEPRecordExt;
}

export default function SEPCetakTemplate({ sep }: Props) {
  const rs = RS_PROFIL_INITIAL;
  const today = fmtDateShortDoc(new Date().toISOString());
  const isKLL = sep.jaminan && sep.jaminan.lakaLantas !== "0";

  return (
    <div className="w-[794px] min-h-[1123px] bg-white px-14 py-10 font-sans text-slate-900">
      <KopSuratEklaim variant="compact" />

      {/* ── Title bar ── */}
      <div className="mt-4 border-b-[2.5px] border-double border-emerald-700 pb-1.5 text-center">
        <h2 className="text-[12pt] font-bold uppercase tracking-widest text-emerald-800">
          Surat Eligibilitas Peserta (SEP)
        </h2>
        <p className="text-[8pt] text-slate-500">
          {rs.nama} &nbsp;·&nbsp; Kode PPK: {sep.ppkPelayanan ?? "—"}
        </p>
      </div>

      {/* ── No. SEP prominent ── */}
      <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
        <div>
          <p className="text-[7.5pt] font-semibold uppercase tracking-wider text-emerald-600">
            Nomor SEP
          </p>
          <p className="mt-0.5 font-mono text-[12.5pt] font-bold tracking-widest text-emerald-900">
            {sep.noSEP}
          </p>
        </div>
        <div className="text-right text-[9pt]">
          <p className="text-slate-500">Status</p>
          <p className="font-bold text-emerald-700">{sep.statusInternal.toUpperCase()}</p>
        </div>
      </div>

      {/* ── 2-column grid: Pelayanan + Peserta ── */}
      <div className="mt-3 grid grid-cols-2 gap-x-10">
        {/* Kolom Kiri */}
        <div>
          <SectionHead>Data Pelayanan</SectionHead>
          <table style={{ borderCollapse: "collapse" }}>
            <tbody>
              <FR label="Tanggal Terbit">{fmtTgl(sep.tglTerbit)}</FR>
              <FR label="Masa Berlaku">
                {fmtTgl(sep.masaBerlaku.from)} s/d {fmtTgl(sep.masaBerlaku.to)}
              </FR>
              <FR label="Jenis Pelayanan">
                {jnsLabel(sep.jnsPelayanan)}
              </FR>
              <FR label="Kelas Hak">
                {KLS_HAK_LABEL[sep.klsRawat.klsRawatHak] ?? `Kelas ${sep.klsRawat.klsRawatHak}`}
              </FR>
              {sep.klsRawat.klsRawatNaik && (
                <FR label="Naik Kelas">
                  {KLS_NAIK_LABEL[sep.klsRawat.klsRawatNaik] ?? sep.klsRawat.klsRawatNaik}
                  {sep.klsRawat.pembiayaan
                    ? ` — ${PEMBIAYAAN_LABEL[sep.klsRawat.pembiayaan] ?? "—"}`
                    : ""}
                </FR>
              )}
              <FR label="Poli Tujuan">
                <span className="font-mono font-bold">{sep.poli.tujuan}</span>
                {sep.poli.eksekutif === "1" && (
                  <span className="ml-1.5 rounded bg-violet-100 px-1.5 py-0.5 text-[7pt] font-bold text-violet-700">
                    EKSEKUTIF
                  </span>
                )}
              </FR>
              {sep.dpjpLayan && (
                <FR label="DPJP Layanan">
                  <span className="font-mono">{sep.dpjpLayan}</span>
                </FR>
              )}
              {sep.tglPulang && (
                <FR label="Tanggal Pulang">{fmtTgl(sep.tglPulang)}</FR>
              )}
            </tbody>
          </table>
        </div>

        {/* Kolom Kanan */}
        <div>
          <SectionHead>Data Peserta</SectionHead>
          <table style={{ borderCollapse: "collapse" }}>
            <tbody>
              <FR label="No. Kartu BPJS">
                <span className="font-mono font-bold tracking-wider">{sep.noKartu}</span>
              </FR>
              {sep.noMR && (
                <FR label="No. Rekam Medis">
                  <span className="font-mono">{sep.noMR}</span>
                </FR>
              )}
              {sep.noTelp && <FR label="No. Telepon">{sep.noTelp}</FR>}
            </tbody>
          </table>

          <SectionHead>Data Rujukan</SectionHead>
          <table style={{ borderCollapse: "collapse" }}>
            <tbody>
              <FR label="Asal Rujukan">{asalLabel(sep.rujukan.asalRujukan)}</FR>
              {sep.rujukan.noRujukan && (
                <FR label="No. Rujukan">
                  <span className="font-mono">{sep.rujukan.noRujukan}</span>
                </FR>
              )}
              {sep.rujukan.ppkRujukan && (
                <FR label="Faskes Perujuk">
                  <span className="font-mono">{sep.rujukan.ppkRujukan}</span>
                </FR>
              )}
              {sep.rujukan.tglRujukan && (
                <FR label="Tgl. Rujukan">{fmtTgl(sep.rujukan.tglRujukan)}</FR>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Diagnosa Awal ── */}
      <SectionHead>Diagnosa Awal</SectionHead>
      <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
        <span className="shrink-0 rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10.5pt] font-bold text-emerald-800">
          {sep.diagAwal}
        </span>
        <span className="text-[9.5pt] text-slate-700">
          {sep.diagAwalNama ?? "—"}
        </span>
      </div>
      {sep.catatanDiagnosaPertama && (
        <p className="mt-1 text-[8.5pt] italic text-slate-500">{sep.catatanDiagnosaPertama}</p>
      )}

      {/* ── Jaminan KLL (conditional) ── */}
      {isKLL && sep.jaminan && (
        <>
          <SectionHead>Data Kecelakaan / Jaminan</SectionHead>
          <table style={{ borderCollapse: "collapse" }}>
            <tbody>
              <FR label="Jenis Laka">
                {LAKA_LABEL[sep.jaminan.lakaLantas] ?? "—"}
              </FR>
              {sep.jaminan.noLP && (
                <FR label="No. Laporan Polisi">
                  <span className="font-mono">{sep.jaminan.noLP}</span>
                </FR>
              )}
              {sep.jaminan.penjamin?.tglKejadian && (
                <FR label="Tgl. Kejadian">{fmtTgl(sep.jaminan.penjamin.tglKejadian)}</FR>
              )}
              {sep.jaminan.penjamin?.keterangan && (
                <FR label="Keterangan">{sep.jaminan.penjamin.keterangan}</FR>
              )}
            </tbody>
          </table>
        </>
      )}

      {/* ── Catatan ── */}
      {sep.catatan && (
        <>
          <SectionHead>Catatan</SectionHead>
          <p className="text-[9pt] italic text-slate-600">{sep.catatan}</p>
        </>
      )}

      {/* ── Tanda Tangan 2-col ── */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-[9pt] text-slate-600">{rs.alamat.kota}, {today}</p>
          <p className="mt-0.5 text-[9pt] font-bold text-slate-800">Petugas BPJS RS</p>
          <div className="mt-12 border-b border-slate-800" />
          <p className="mt-0.5 text-[8.5pt] text-slate-500">( ........................................ )</p>
          <p className="text-[8pt] text-slate-400">NIP / NIK</p>
        </div>
        <div className="text-center">
          <p className="text-[9pt] text-slate-600">{rs.alamat.kota}, {today}</p>
          <p className="mt-0.5 text-[9pt] font-bold text-slate-800">Verifikator Internal</p>
          <div className="mt-12 border-b border-slate-800" />
          <p className="mt-0.5 text-[8.5pt] text-slate-500">( ........................................ )</p>
          <p className="text-[8pt] text-slate-400">NIP / NIK</p>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="mt-6 border-t border-slate-200 pt-2 text-center text-[7.5pt] text-slate-400">
        Diterbitkan oleh EHIS BPJS &nbsp;·&nbsp; {todayLong()} &nbsp;·&nbsp; {rs.nama}
        {sep.audit.createdBy && ` · Operator: ${sep.audit.createdBy}`}
      </div>
    </div>
  );
}
