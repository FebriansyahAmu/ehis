"use client";

// Cetak SEP — sheet A4 dari KunjunganDTO (hasil POST /kunjungan). Reuse mekanisme print
// app: `.print-area`/`.no-print` (globals.css) + triggerPrint(). KOP via KopSuratEklaim.

import { Printer, X } from "lucide-react";
import KopSuratEklaim from "@/components/eklaim/berkas/KopSuratEklaim";
import { RS_PROFIL_INITIAL } from "@/lib/master/rsProfilStore";
import { triggerPrint, fmtTanggalShort, fmtTanggalJam } from "@/components/billing/invoice/modals/print/printShared";
import type { KunjunganDTO } from "@/lib/api/kunjungan";

const JNS_LABEL: Record<string, string> = { RawatJalan: "Rawat Jalan", RawatInap: "Rawat Inap" };
const KLS_LABEL: Record<string, string> = { "1": "Kelas I", "2": "Kelas II", "3": "Kelas III" };
const ASAL_LABEL: Record<string, string> = { Faskes1: "Faskes 1 (FKTP)", Faskes2: "Faskes 2 (FKRTL)" };
const TUJUAN_LABEL: Record<string, string> = { Normal: "Normal", Prosedur: "Prosedur", KonsulDokter: "Konsul Dokter" };

function FR({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="w-40 py-[2px] align-top text-[9pt] text-slate-500">{label}</td>
      <td className="w-3 py-[2px] align-top text-[8.5pt] text-slate-400">:</td>
      <td className="py-[2px] text-[9pt] font-medium text-slate-800">{children}</td>
    </tr>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 mt-3.5 text-[7.5pt] font-bold uppercase tracking-wider text-slate-400">{children}</p>
  );
}

/** Sheet A4 SEP — render di dalam `.print-area`. */
export function SepCetakSheet({ kunjungan }: { kunjungan: KunjunganDTO }) {
  const rs = RS_PROFIL_INITIAL;
  const { sep, rujukan, pasien } = kunjungan;
  if (!sep) return null;

  return (
    <div className="bg-white px-12 py-9 font-sans text-slate-900">
      <KopSuratEklaim variant="compact" />

      <div className="mt-4 border-b-[2.5px] border-double border-emerald-700 pb-1.5 text-center">
        <h2 className="text-[12pt] font-bold uppercase tracking-widest text-emerald-800">
          Surat Eligibilitas Peserta (SEP)
        </h2>
        <p className="text-[8pt] text-slate-500">
          {rs.nama} &nbsp;·&nbsp; Kode PPK: {sep.ppkPelayanan}
        </p>
      </div>

      {/* No. SEP prominent */}
      <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
        <div>
          <p className="text-[7.5pt] font-semibold uppercase tracking-wider text-emerald-600">Nomor SEP</p>
          <p className="mt-0.5 font-mono text-[12.5pt] font-bold tracking-widest text-emerald-900">
            {sep.noSep ?? "—"}
          </p>
        </div>
        <div className="text-right text-[9pt]">
          <p className="text-slate-500">Status</p>
          <p className="font-bold text-emerald-700">{sep.status.toUpperCase()}</p>
        </div>
      </div>

      {/* 2-col: Pelayanan + Peserta/Rujukan */}
      <div className="mt-3 grid grid-cols-2 gap-x-10">
        <div>
          <SectionHead>Data Pelayanan</SectionHead>
          <table style={{ borderCollapse: "collapse" }}>
            <tbody>
              <FR label="Tanggal SEP">{fmtTanggalShort(sep.tglSep)}</FR>
              <FR label="Jenis Pelayanan">{JNS_LABEL[sep.jnsPelayanan] ?? sep.jnsPelayanan}</FR>
              <FR label="Kelas Hak">{sep.klsRawatHak ? KLS_LABEL[sep.klsRawatHak] ?? sep.klsRawatHak : "—"}</FR>
              <FR label="Poli Tujuan">
                <span className="font-semibold">{sep.poliTujuan ?? kunjungan.poli ?? "—"}</span>
                {sep.poliEksekutif && (
                  <span className="ml-1.5 rounded bg-sky-100 px-1.5 py-0.5 text-[7pt] font-bold text-sky-700">EKSEKUTIF</span>
                )}
              </FR>
              <FR label="Tujuan Kunjungan">{TUJUAN_LABEL[sep.tujuanKunj] ?? sep.tujuanKunj}</FR>
              {sep.dpjpLayan && <FR label="DPJP Layanan"><span className="font-mono">{sep.dpjpLayan}</span></FR>}
            </tbody>
          </table>
        </div>

        <div>
          <SectionHead>Data Peserta</SectionHead>
          <table style={{ borderCollapse: "collapse" }}>
            <tbody>
              <FR label="Nama Peserta">{pasien.nama}</FR>
              <FR label="No. Kartu BPJS"><span className="font-mono font-bold tracking-wider">{sep.noKartu}</span></FR>
              <FR label="No. Rekam Medis"><span className="font-mono">{pasien.noRm}</span></FR>
            </tbody>
          </table>

          {rujukan && (
            <>
              <SectionHead>Data Rujukan</SectionHead>
              <table style={{ borderCollapse: "collapse" }}>
                <tbody>
                  <FR label="Asal Rujukan">{ASAL_LABEL[rujukan.asalRujukan] ?? rujukan.asalRujukan}</FR>
                  <FR label="No. Rujukan"><span className="font-mono">{rujukan.noRujukan}</span></FR>
                  {rujukan.ppkRujukan && <FR label="Faskes Perujuk"><span className="font-mono">{rujukan.ppkRujukan}</span></FR>}
                  {rujukan.tglRujukan && <FR label="Tgl. Rujukan">{fmtTanggalShort(rujukan.tglRujukan)}</FR>}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {/* Diagnosa awal */}
      <SectionHead>Diagnosa Awal</SectionHead>
      <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
        <span className="shrink-0 rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10.5pt] font-bold text-emerald-800">
          {sep.diagAwal ?? rujukan?.diagnosaKode ?? "—"}
        </span>
        <span className="text-[9.5pt] text-slate-700">{rujukan?.diagnosaNama ?? kunjungan.diagnosaMasuk ?? "—"}</span>
      </div>

      {sep.catatan && (
        <>
          <SectionHead>Catatan</SectionHead>
          <p className="text-[9pt] italic text-slate-600">{sep.catatan}</p>
        </>
      )}

      {/* TTD */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-[9pt] text-slate-600">{rs.alamat.kota}, {fmtTanggalShort(sep.createdAt)}</p>
          <p className="mt-0.5 text-[9pt] font-bold text-slate-800">Petugas Pendaftaran</p>
          <div className="mt-12 border-b border-slate-800" />
          <p className="mt-0.5 text-[8.5pt] text-slate-500">( {sep.userPembuat ?? "........................"} )</p>
        </div>
        <div className="text-center">
          <p className="text-[9pt] text-slate-600">{rs.alamat.kota}, {fmtTanggalShort(sep.createdAt)}</p>
          <p className="mt-0.5 text-[9pt] font-bold text-slate-800">Peserta / Keluarga</p>
          <div className="mt-12 border-b border-slate-800" />
          <p className="mt-0.5 text-[8.5pt] text-slate-500">( ........................................ )</p>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-2 text-center text-[7.5pt] text-slate-400">
        Diterbitkan oleh EHIS &nbsp;·&nbsp; {fmtTanggalJam(sep.createdAt)} &nbsp;·&nbsp; No. Kunjungan {kunjungan.noKunjungan}
      </div>
    </div>
  );
}

/** Modal preview + cetak SEP. */
export function SepPrintModal({ kunjungan, onClose }: { kunjungan: KunjunganDTO; onClose: () => void }) {
  return (
    <div className="no-print fixed inset-0 z-[60] flex flex-col bg-slate-900/60 backdrop-blur-sm">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-3 bg-white px-5 py-3 shadow">
        <div>
          <p className="text-sm font-bold text-slate-800">Cetak SEP</p>
          <p className="text-[11px] text-slate-400">{kunjungan.sep?.noSep} · {kunjungan.pasien.nama}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => triggerPrint()}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            <Printer size={14} /> Cetak / Simpan PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto w-fit rounded-lg bg-white shadow-xl">
          <div className="print-area" data-paper="A4">
            <SepCetakSheet kunjungan={kunjungan} />
          </div>
        </div>
      </div>
    </div>
  );
}
