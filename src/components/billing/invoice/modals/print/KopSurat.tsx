"use client";

import { RS_PROFIL_INITIAL } from "@/lib/master/rsProfilStore";
import { Building2 } from "lucide-react";

/**
 * KOP Surat RS — header untuk semua dokumen cetak (InvoiceSheet / KwitansiSheet).
 *
 * Layout: logo placeholder + nama RS + subtitle + alamat kop + meta-info (telp/email/web).
 * Border bawah double-line (klasik dokumen resmi RS pemerintah).
 *
 * Consume `RS_PROFIL_INITIAL` dari [rsProfilStore](src/lib/master/rsProfilStore.ts).
 */
export default function KopSurat() {
  const rs = RS_PROFIL_INITIAL;
  const kop = rs.kop;
  const initials = rs.kode.slice(0, 4).toUpperCase();

  return (
    <header className="page-break-avoid">
      <div className="flex items-start gap-4 pb-3">
        {/* Logo placeholder */}
        <div className="flex h-20 w-20 flex-none items-center justify-center rounded border-2 border-slate-700 bg-white">
          <div className="text-center leading-tight">
            <Building2 size={20} className="mx-auto text-slate-700" strokeWidth={2.2} />
            <p className="mt-0.5 text-[8.5px] font-bold tracking-widest text-slate-700">
              {initials}
            </p>
          </div>
        </div>

        {/* Identity */}
        <div className="flex-1 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-600">
            Pemerintah {rs.kepemilikan === "Pemerintah Pusat" ? "Republik Indonesia" : "Provinsi DKI Jakarta"}
          </p>
          <h1 className="mt-0.5 text-[20px] font-bold uppercase leading-tight tracking-wide text-slate-900">
            {rs.nama}
          </h1>
          {rs.namaInggris && (
            <p className="text-[10.5px] italic text-slate-600">{rs.namaInggris}</p>
          )}
          {kop.subtitle && (
            <p className="mt-0.5 text-[10.5px] font-semibold tracking-wider text-slate-700">
              {kop.subtitle} · Kelas {rs.kelas}
            </p>
          )}
          <p className="mt-1 text-[10px] leading-snug text-slate-700">
            {kop.alamatKop ?? `${rs.alamat.jalan}, ${rs.alamat.kelurahan}, ${rs.alamat.kecamatan}, ${rs.alamat.kota} ${rs.alamat.kodePos}`}
          </p>
          <p className="text-[10px] text-slate-600">
            Telp. <span className="font-mono">{rs.telp}</span>
            {rs.fax && <> · Fax. <span className="font-mono">{rs.fax}</span></>}
            {" · "}Email <span className="font-mono">{rs.email}</span>
            {rs.website && <> · Web <span className="font-mono">{rs.website}</span></>}
          </p>
        </div>
      </div>

      {/* Double border bawah klasik */}
      <div className="border-b-[3px] border-double border-slate-800" />
    </header>
  );
}
