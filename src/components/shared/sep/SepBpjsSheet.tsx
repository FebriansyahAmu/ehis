"use client";

// SepBpjsSheet — cetakan Surat Eligibilitas Peserta (SEP) 1:1 format resmi BPJS Kesehatan.
// Kanonik: dipakai SEMUA gate cetak SEP (pendaftaran · ubah penjamin · Cetak Dokumen · BPJS).
// Logo BPJS = /public/logo/bpjskesehatan.svg (sudah termasuk wordmark). Identitas RS = teks.
// Monokrom hitam (printer-friendly) meniru form asli; satu-satunya warna = logo.

import type { SepPrintData } from "./sepPrintShared";

// Baris label : value (kolom colon lurus, meniru form SEP).
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="w-[104px] whitespace-nowrap py-[1.5px] align-top text-[10.5px] text-black">{label}</td>
      <td className="w-2 py-[1.5px] align-top text-[10.5px] text-black">:</td>
      <td className="py-[1.5px] align-top text-[10.5px] text-black">{children}</td>
    </tr>
  );
}

export function SepBpjsSheet({ data }: { data: SepPrintData }) {
  return (
    <div className="w-full bg-white px-8 pt-4 pb-4 font-sans text-black">
      {/* ── Header: logo BPJS + judul + nama RS ── */}
      <header className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/bpjskesehatan.svg" alt="BPJS Kesehatan" className="h-[32px] w-auto shrink-0" />
        <div className="leading-tight">
          <p className="text-[14px] font-normal tracking-tight text-black">SURAT ELEGIBILITAS PESERTA</p>
          <p className="text-[14px] font-normal tracking-tight text-black">{data.rsNama}</p>
        </div>
      </header>

      {/* ── Dua kolom data ── */}
      <div className="mt-3 grid grid-cols-2 gap-x-8">
        {/* Kolom kiri */}
        <table style={{ borderCollapse: "collapse" }} className="w-full">
          <tbody>
            <Row label="No. SEP"><span className="font-medium">{data.noSep}</span></Row>
            <Row label="Tgl. SEP">{data.tglSep}</Row>
            <Row label="No. Kartu">
              {data.noKartu}
              {data.noRm !== "-" && <span> ( MR. {data.noRm} )</span>}
            </Row>
            <Row label="Nama Peserta"><span className="font-medium">{data.namaPeserta}</span></Row>
            <Row label="Tgl. Lahir">
              {data.tglLahir}
              <span className="ml-4">Kelamin : {data.kelamin}</span>
            </Row>
            <Row label="No. Telepon">{data.noTelepon}</Row>
            <Row label="Sub/Spesialis">{data.subSpesialis}</Row>
            <Row label="Dokter">{data.dokter}</Row>
            <Row label="Faskes Perujuk">{data.faskesPerujuk}</Row>
            <Row label="Diagnosa Awal">
              {data.diagAwalKode}
              {data.diagAwalNama && <span> ({data.diagAwalNama})</span>}
            </Row>
          </tbody>
        </table>

        {/* Kolom kanan */}
        <table style={{ borderCollapse: "collapse" }} className="w-full">
          <tbody>
            <Row label="Peserta">{data.peserta}</Row>
            <Row label="Jns. Rawat">{data.jnsRawat}</Row>
            <Row label="Jns. Kunjungan">{data.jnsKunjungan}</Row>
            <Row label="Prosedur">{data.prosedur}</Row>
            <Row label="Assesment plyn">{data.assesmentPlyn}</Row>
            <Row label="Poli Perujuk">{data.poliPerujuk}</Row>
            <Row label="Kelas Hak">{data.kelasHak}</Row>
            <Row label="Kelas Rawat">{data.kelasRawat}</Row>
            <Row label="Penjamin">{data.penjamin || " "}</Row>
          </tbody>
        </table>
      </div>

      {/* ── Catatan ── */}
      <table style={{ borderCollapse: "collapse" }} className="mt-1 w-full">
        <tbody>
          <Row label="Catatan">{data.catatan || " "}</Row>
        </tbody>
      </table>

      {/* ── Catatan kaki + tanda tangan peserta ── */}
      <div className="mt-1.5 flex items-start justify-between gap-8">
        <div className="max-w-[70%] space-y-0.5 text-[9px] leading-snug text-black">
          <p>* Saya Menyetujui BPJS Kesehatan menggunakan Informasi Media pasien jika diperlukan.</p>
          <p>* SEP bukan sebagai bukti penjamin peserta.</p>
          <p>
            ** Dengan diterbitkannya SEP ini, Peserta rawat inap telah mendapatkan informasi dan menempati
            kelas rawat sesuai hak kelasnya (terkecuali kelas penuh atau naik kelas sesuai aturan yang berlaku)
          </p>
        </div>
        <p className="shrink-0 text-[11px] text-black">Pasien/Keluarga Pasien</p>
      </div>

      {/* ── Cetakan Ke + garis tanda tangan ── */}
      <div className="mt-6 flex items-end justify-between gap-8">
        <p className="text-[9px] italic text-black">
          *Cetakan Ke {data.cetakanKe} {data.cetakAt}
        </p>
        <div className="w-[200px] border-t border-black" />
      </div>
    </div>
  );
}
