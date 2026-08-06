"use client";

import { X, Printer } from "lucide-react";
import { motion } from "framer-motion";
import type { KecelakaanDraft } from "./kecelakaanTypes";

// Laporan Kecelakaan Kerja Tahap I (Formulir 3 / KK1) — BPJS Ketenagakerjaan (JKK).
// Dasar: Permenaker 5/2021 jo 1/2025. Cetakan sisi-RS untuk melengkapi laporan pemberi kerja
// (maks 2×24 jam). Lihat docs/KECELAKAAN-KERJA-JKK.md.

function fmtTanggal(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

function nomorForm() {
  const n   = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
  const bln = new Date().toLocaleDateString("id-ID", { month: "2-digit", year: "numeric" });
  return `${n}/KK1-JKK/RS/${bln}`;
}

const today = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

function DocField({ label, value, placeholder = "—" }: {
  label: string; value?: string; placeholder?: string;
}) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-2 border-b border-slate-100 py-1.5 last:border-0">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {value
        ? <span className="text-[11px] text-slate-800">{value}</span>
        : <span className="text-[11px] italic text-slate-400">{placeholder}</span>}
    </div>
  );
}

function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="rounded bg-emerald-700 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-white">
        {title}
      </div>
      <div className="mt-2 px-1">{children}</div>
    </div>
  );
}

export function SuratKK1Modal({
  draft,
  onClose,
}: {
  draft:   KecelakaanDraft;
  onClose: () => void;
}) {
  const noForm = nomorForm();

  const lingkupLabel =
    draft.lingkupKerja === "tempat_kerja" ? "Di Tempat Kerja" :
    draft.lingkupKerja === "dinas"        ? "Perjalanan Dinas" :
    draft.lingkupKerja === "pp"           ? "Perjalanan Berangkat–Pulang Kerja (PP)" :
    "";

  const laluLintas = (draft.lingkupKerja === "pp" || draft.lingkupKerja === "dinas") && draft.kendaraan.length > 0;
  const badanLabel = laluLintas
    ? "Jasa Raharja + BPJS Ketenagakerjaan (KLL_KK)"
    : "BPJS Ketenagakerjaan — Program JKK";

  const statusKKLabel =
    draft.statusLaporanKk === "terkirim" ? "Terkirim ke BPJS Ketenagakerjaan" :
    draft.statusLaporanKk === "proses"   ? "Sedang Disiapkan" :
    "Belum Dilaporkan";

  const plkkLabel = draft.isPlkk
    ? "PLKK — biaya ditagih langsung ke BPJS TK"
    : "Non-PLKK — mekanisme reimburse";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 print:static print:bg-white">

      {/* Action bar — hidden on print */}
      <div className="flex shrink-0 items-center justify-between bg-white px-4 py-3 shadow-sm print:hidden">
        <div>
          <p className="text-[12px] font-bold text-slate-700">
            Preview — Laporan Kecelakaan Kerja Tahap I (Formulir 3 / KK1)
          </p>
          <p className="text-[10px] text-slate-400">Untuk pelaporan JKK ke BPJS Ketenagakerjaan &amp; Disnaker (maks 2×24 jam)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-700 active:scale-95"
          >
            <Printer size={12} />
            Cetak / Simpan PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Scrollable paper area */}
      <div className="flex-1 overflow-y-auto bg-slate-100 p-6 print:overflow-visible print:p-0 print:bg-white">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mx-auto max-w-[700px] rounded-xl bg-white p-8 shadow-lg print:shadow-none print:rounded-none print:max-w-none"
        >

          {/* Letterhead */}
          <div className="border-b-2 border-emerald-700 pb-4 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Rumah Sakit</p>
            <p className="mt-0.5 text-[20px] font-black uppercase tracking-wide text-slate-800">[Nama Rumah Sakit]</p>
            <p className="text-[10px] text-slate-500">Jl. [Alamat RS] · Telp. [No. Telp] · Fax. [No. Fax]</p>
          </div>

          {/* Document title */}
          <div className="mt-5 text-center">
            <p className="text-[14px] font-black uppercase tracking-wide text-slate-800">
              Laporan Kecelakaan Kerja Tahap I
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">
              Formulir 3 (KK1) · BPJS Ketenagakerjaan — Program Jaminan Kecelakaan Kerja (JKK)
            </p>
            <p className="text-[9px] text-slate-400">Permenaker No. 5/2021 jo. No. 1/2025</p>
            <p className="mt-1.5 text-[10.5px] font-semibold text-slate-700">No: {noForm}</p>
          </div>

          {/* Opening */}
          <p className="mt-5 text-[10.5px] leading-relaxed text-slate-700">
            Bersama ini dilaporkan bahwa telah terjadi kecelakaan kerja / penyakit akibat kerja terhadap tenaga
            kerja dengan data di bawah ini, untuk diproses penjaminannya melalui program JKK BPJS Ketenagakerjaan.
            Laporan Tahap I ini wajib disampaikan paling lambat <span className="font-semibold">2×24 jam</span> sejak
            kejadian kepada BPJS Ketenagakerjaan dan Dinas Ketenagakerjaan setempat.
          </p>

          {/* I. Data Perusahaan */}
          <DocSection title="I. Data Perusahaan (Pemberi Kerja)">
            <DocField label="Nama Perusahaan" value={draft.namaPerusahaan} placeholder="Belum diisi" />
            <DocField label="NPP" value={draft.npp} placeholder="No. Pendaftaran Perusahaan" />
            <DocField label="Alamat Perusahaan" placeholder="Diisi petugas" />
            <DocField label="Jenis Usaha" placeholder="Diisi petugas" />
          </DocSection>

          {/* II. Data Tenaga Kerja (Korban) */}
          <DocSection title="II. Data Tenaga Kerja (Korban)">
            <DocField label="Nama Lengkap" placeholder="Diisi petugas / sesuai KTP" />
            <DocField label="No. KPJ" value={draft.noKpj} placeholder="No. Kartu Peserta BPJS TK" />
            <DocField label="No. KTP" placeholder="Diisi petugas" />
            <DocField label="No. Rekam Medis" placeholder="Diisi petugas" />
            <DocField label="Tanggal Lahir" placeholder="Diisi petugas" />
            <DocField label="Jenis Kelamin" placeholder="Diisi petugas" />
            <DocField label="Jabatan / Pekerjaan" value={draft.jenisPekerjaan} placeholder="Diisi petugas" />
            <DocField label="Unit / Bagian Kerja" value={draft.lokasiKerja} placeholder="Diisi petugas" />
            <DocField label="Alamat" placeholder="Diisi petugas / sesuai KTP" />
          </DocSection>

          {/* III. Data Kecelakaan */}
          <DocSection title="III. Data Kecelakaan">
            <DocField label="Tanggal Kejadian" value={fmtTanggal(draft.tanggal)} placeholder="Belum diisi" />
            <DocField label="Waktu Kejadian" value={draft.waktu} placeholder="Belum diisi" />
            <DocField label="Lingkup Kejadian" value={lingkupLabel} placeholder="Belum dipilih" />
            <DocField label="Provinsi" value={draft.provinsi} placeholder="Belum diisi" />
            <DocField label="Tempat / Lokasi" value={draft.lokasi} placeholder="Belum diisi" />
            <DocField label="Sebab / Mekanisme" value={draft.mekanismeTrauma} placeholder="Belum diisi" />
          </DocSection>

          {/* Uraian kejadian */}
          {draft.kronologi && (
            <div className="mt-3 px-1">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">Uraian Kejadian</p>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-[10.5px] leading-relaxed text-slate-700 whitespace-pre-wrap">
                {draft.kronologi}
              </div>
            </div>
          )}

          {/* Kendaraan (bila KLL_KK) */}
          {draft.kendaraan.length > 0 && (
            <DocSection title="III.a Kendaraan Terlibat (KLL saat kerja)">
              <table className="mt-1 w-full text-[10.5px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="w-8 pb-1.5 text-left font-semibold text-slate-500">No.</th>
                    <th className="pb-1.5 text-left font-semibold text-slate-500">Jenis Kendaraan</th>
                    <th className="pb-1.5 text-left font-semibold text-slate-500">No. Polisi</th>
                    <th className="pb-1.5 text-left font-semibold text-slate-500">Peran</th>
                  </tr>
                </thead>
                <tbody>
                  {draft.kendaraan.map((k, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-1.5 text-slate-600">{i + 1}</td>
                      <td className="py-1.5 text-slate-800">{k.jenis || "—"}</td>
                      <td className="py-1.5 font-mono text-slate-800">{k.noPol || "—"}</td>
                      <td className="py-1.5 text-slate-800">{k.peran}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DocSection>
          )}

          {/* IV. Akibat & Pertolongan */}
          <DocSection title="IV. Akibat &amp; Pertolongan Pertama">
            <DocField label="Bagian Tubuh Cedera" placeholder="Diisi dokter yang merawat" />
            <DocField label="Diagnosis" placeholder="Diisi dokter yang merawat" />
            <DocField label="Dibawa / Dirawat di" value="[Nama Rumah Sakit]" />
            <DocField label="Status Faskes" value={plkkLabel} />
          </DocSection>

          {/* V. Penjamin & Pelaporan */}
          <DocSection title="V. Penjamin &amp; Pelaporan">
            <DocField label="Badan Penjamin" value={badanLabel} />
            <DocField label="Status Laporan Tahap I" value={statusKKLabel} />
          </DocSection>

          {/* VI. Saksi */}
          <DocSection title="VI. Saksi">
            <DocField label="Nama Saksi 1" placeholder="Diisi petugas" />
            <DocField label="Nama Saksi 2" placeholder="Diisi petugas" />
          </DocSection>

          {/* Closing */}
          <p className="mt-6 text-[10.5px] leading-relaxed text-slate-700">
            Demikian laporan ini dibuat dengan sebenarnya untuk keperluan penjaminan JKK BPJS Ketenagakerjaan dan
            dapat dipergunakan sebagaimana mestinya.
          </p>

          {/* Signature */}
          <div className="mt-8 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-600">
            <div>
              <p>Pemberi Kerja / Perusahaan</p>
              <div className="mt-14 border-t border-slate-400 pt-1">
                <p className="text-[10px] text-slate-600">( ................................................ )</p>
                <p className="mt-0.5 text-[9px] text-slate-500">Jabatan &amp; Cap Perusahaan</p>
              </div>
            </div>
            <div>
              <p>[Kota], {today}</p>
              <p className="mt-0.5">Petugas / Dokter yang Merawat</p>
              <div className="mt-12 border-t border-slate-400 pt-1">
                <p className="text-[10px] text-slate-600">( ................................................ )</p>
                <p className="mt-0.5 text-[9px] text-slate-500">NIP / SIP: .......................................</p>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[9.5px] leading-relaxed text-emerald-700">
            <span className="font-bold">Catatan:</span>{" "}
            Lengkapi dengan fotokopi KTP, KK, Kartu Peserta BPJS TK (KPJ), absensi/SPK (untuk kasus dinas/PP), dan
            input kasus pada aplikasi <span className="font-semibold">e-PLKK</span>. Laporan Tahap II (KK2/KK3)
            menyusul setelah pasien dinyatakan sembuh. Dicetak dari sistem EHIS — <span className="font-semibold">No. {noForm}</span>.
          </div>

        </motion.div>
      </div>
    </div>
  );
}
