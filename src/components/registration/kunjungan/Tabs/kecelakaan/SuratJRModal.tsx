"use client";

import { X, Printer } from "lucide-react";
import { motion } from "framer-motion";
import type { KecelakaanDraft } from "./kecelakaanTypes";

// ─── Helpers ──────────────────────────────────────────────────

function fmtTanggal(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function nomorSurat() {
  const n   = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
  const bln = new Date().toLocaleDateString("id-ID", { month: "2-digit", year: "numeric" }).replace("/", "/");
  return `${n}/SKK-KLL/RS/${bln}`;
}

const today = new Date().toLocaleDateString("id-ID", {
  day: "2-digit", month: "long", year: "numeric",
});

// ─── Sub-components ───────────────────────────────────────────

function DocField({ label, value, placeholder = "—" }: {
  label:        string;
  value?:       string;
  placeholder?: string;
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
      <div className="rounded bg-slate-800 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-white">
        {title}
      </div>
      <div className="mt-2 px-1">{children}</div>
    </div>
  );
}

// ─── SuratJRModal ─────────────────────────────────────────────

export function SuratJRModal({
  draft,
  onClose,
}: {
  draft:   KecelakaanDraft;
  onClose: () => void;
}) {
  const noSurat = nomorSurat();

  const penjaminLanjutanLabel =
    draft.penjaminLanjutan === "bpjs"     ? "BPJS Kesehatan" :
    draft.penjaminLanjutan === "umum"     ? "Umum / Mandiri" :
    draft.penjaminLanjutan === "asuransi" ? "Asuransi Swasta" :
    "";

  const statusLPLabel =
    draft.statusLP === "ada"   ? "Sudah Ada" :
    draft.statusLP === "proses"? "Sedang Diproses" :
    "Belum Ada";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 print:static print:bg-white">

      {/* Action bar — hidden on print */}
      <div className="flex shrink-0 items-center justify-between bg-white px-4 py-3 shadow-sm print:hidden">
        <div>
          <p className="text-[12px] font-bold text-slate-700">
            Preview — Surat Keterangan Kecelakaan Lalu Lintas
          </p>
          <p className="text-[10px] text-slate-400">Untuk keperluan pengajuan santunan PT Jasa Raharja</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-amber-600 active:scale-95"
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
          <div className="border-b-2 border-slate-800 pb-4 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
              Rumah Sakit
            </p>
            <p className="mt-0.5 text-[20px] font-black uppercase tracking-wide text-slate-800">
              [Nama Rumah Sakit]
            </p>
            <p className="text-[10px] text-slate-500">
              Jl. [Alamat RS] · Telp. [No. Telp] · Fax. [No. Fax]
            </p>
          </div>

          {/* Document title */}
          <div className="mt-5 text-center">
            <p className="text-[14px] font-black uppercase tracking-wide text-slate-800">
              Surat Keterangan Kecelakaan Lalu Lintas
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">
              Untuk Keperluan Pengajuan Santunan PT Jasa Raharja (Persero)
            </p>
            <p className="mt-1.5 text-[10.5px] font-semibold text-slate-700">
              No: {noSurat}
            </p>
          </div>

          {/* Opening */}
          <p className="mt-5 text-[10.5px] leading-relaxed text-slate-700">
            Yang bertanda tangan di bawah ini, petugas administrasi / dokter yang merawat pada{" "}
            <span className="font-semibold">[Nama Rumah Sakit]</span>, menerangkan bahwa pasien dengan
            identitas di bawah ini telah / sedang mendapatkan perawatan medis akibat kecelakaan lalu
            lintas dan berhak mengajukan santunan sesuai UU No. 34/1964 dan PP No. 18/1965.
          </p>

          {/* I. Identitas Korban */}
          <DocSection title="I. Identitas Korban">
            <DocField label="Nama Lengkap"    placeholder="Diisi petugas / sesuai KTP" />
            <DocField label="No. KTP"         placeholder="Diisi petugas" />
            <DocField label="No. Rekam Medis" placeholder="Diisi petugas" />
            <DocField label="Tanggal Lahir"   placeholder="Diisi petugas" />
            <DocField label="Jenis Kelamin"   placeholder="Diisi petugas" />
            <DocField label="Alamat"          placeholder="Diisi petugas / sesuai KTP" />
            <DocField label="No. Telepon"     placeholder="Diisi petugas" />
          </DocSection>

          {/* II. Data Kecelakaan */}
          <DocSection title="II. Data Kecelakaan">
            <DocField label="Tanggal Kejadian"  value={fmtTanggal(draft.tanggal)} placeholder="Belum diisi" />
            <DocField label="Waktu Kejadian"    value={draft.waktu}               placeholder="Belum diisi" />
            <DocField label="Provinsi"          value={draft.provinsi}            placeholder="Belum diisi" />
            <DocField label="Lokasi Kejadian"   value={draft.lokasi}              placeholder="Belum diisi" />
            <DocField label="Mekanisme Trauma"  value={draft.mekanismeTrauma}     placeholder="Belum diisi" />
          </DocSection>

          {/* Kronologi */}
          {draft.kronologi && (
            <div className="mt-3 px-1">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                Kronologi Kejadian
              </p>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-[10.5px] leading-relaxed text-slate-700 whitespace-pre-wrap">
                {draft.kronologi}
              </div>
            </div>
          )}

          {/* III. Laporan Kepolisian */}
          <DocSection title="III. Laporan Kepolisian">
            <DocField label="Status Laporan Polisi" value={statusLPLabel} />
            {draft.statusLP === "ada" && (
              <>
                <DocField label="Nomor LP"          value={draft.noLapPol}     placeholder="—" />
                <DocField label="Satuan Kepolisian" value={draft.satuanPolisi} placeholder="—" />
              </>
            )}
            {draft.statusLP !== "ada" && (
              <div className="mt-1.5 rounded border border-sky-100 bg-sky-50 px-3 py-2 text-[9.5px] text-sky-700">
                LP belum tersedia — kronologi kejadian di atas digunakan sebagai dokumen pengganti sementara.
              </div>
            )}
          </DocSection>

          {/* IV. Kendaraan Terlibat */}
          <DocSection title="IV. Kendaraan Terlibat">
            {draft.kendaraan.length === 0 ? (
              <p className="py-2 text-[10.5px] italic text-slate-400">Belum ada data kendaraan</p>
            ) : (
              <table className="mt-1 w-full text-[10.5px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="pb-1.5 text-left font-semibold text-slate-500 w-8">No.</th>
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
            )}
          </DocSection>

          {/* V. Diagnosis & Perawatan */}
          <DocSection title="V. Diagnosis &amp; Perawatan">
            <DocField label="Diagnosis Utama"   placeholder="Diisi dokter yang merawat" />
            <DocField label="Tindakan Medis"    placeholder="Diisi petugas" />
            <DocField label="Tanggal Masuk RS"  placeholder="Diisi petugas" />
            <DocField label="Estimasi Biaya"    placeholder="Rp —" />
          </DocSection>

          {/* VI. Penjamin */}
          <DocSection title="VI. Penjamin">
            <DocField label="Penjamin Utama"    value="Jasa Raharja (UU No. 34/1964 · PP 18/1965)" />
            <DocField
              label="Penjamin Lanjutan"
              value={penjaminLanjutanLabel}
              placeholder="Tidak Ada / Belum Diketahui"
            />
          </DocSection>

          {/* Closing paragraph */}
          <p className="mt-6 text-[10.5px] leading-relaxed text-slate-700">
            Demikian surat keterangan ini dibuat dengan sebenarnya untuk keperluan pengajuan santunan
            Jasa Raharja dan dapat dipergunakan sebagaimana mestinya.
          </p>

          {/* Signature area */}
          <div className="mt-8 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-600">
            <div>
              <p>Korban / Keluarga Korban</p>
              <div className="mt-14 border-t border-slate-400 pt-1">
                <p className="text-[10px] text-slate-600">( ................................................ )</p>
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
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[9.5px] leading-relaxed text-amber-700">
            <span className="font-bold">Catatan:</span>{" "}
            Lampirkan bersama fotokopi KTP, KK, dan Laporan Polisi (jika tersedia) ke kantor
            PT Jasa Raharja setempat. Surat ini dicetak dari sistem EHIS —{" "}
            <span className="font-semibold">No. {noSurat}</span>.
          </div>

        </motion.div>
      </div>
    </div>
  );
}
