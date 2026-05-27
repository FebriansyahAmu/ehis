"use client";

/**
 * KOP Surat Eklaim — header cetak standar untuk semua template E-Klaim (EK5).
 *
 * Consume RS_PROFIL_INITIAL dari rsProfilStore (single source of truth identitas RS).
 * Layout klasik dokumen resmi: logo placeholder kiri · identitas center · double-border bawah.
 *
 * variant="full"    → 2-baris: alamat lengkap + telp/email/web
 * variant="compact" → 1-baris: jalan + kota saja
 */

import { Building2 } from "lucide-react";
import { RS_PROFIL_INITIAL } from "@/lib/master/rsProfilStore";

interface Props {
  variant?: "full" | "compact";
}

export default function KopSuratEklaim({ variant = "full" }: Props) {
  const rs = RS_PROFIL_INITIAL;
  const kop = rs.kop;
  const initials = rs.kode.slice(0, 4).toUpperCase();

  return (
    <header>
      <div className="flex items-start gap-3 pb-2">
        {/* Logo placeholder */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded border-2 border-slate-700 bg-white">
          <div className="text-center">
            <Building2 size={16} className="mx-auto text-slate-700" strokeWidth={2.2} />
            <p className="mt-0.5 text-[7px] font-bold tracking-widest text-slate-700">
              {initials}
            </p>
          </div>
        </div>

        {/* RS Identity */}
        <div className="flex-1 text-center">
          {rs.kepemilikan !== "Swasta Nasional" && (
            <p className="text-[8.5px] uppercase tracking-[0.14em] text-slate-500">
              {rs.kepemilikan === "Pemerintah Pusat"
                ? "Pemerintah Republik Indonesia"
                : rs.kepemilikan === "Pemerintah Daerah"
                  ? "Pemerintah Provinsi DKI Jakarta"
                  : rs.kepemilikan}
            </p>
          )}
          <h1 className="text-[17px] font-bold uppercase leading-tight tracking-wide text-slate-900">
            {rs.nama}
          </h1>
          {rs.namaInggris && (
            <p className="text-[9px] italic text-slate-500">{rs.namaInggris}</p>
          )}
          {kop.subtitle && (
            <p className="text-[9px] font-semibold tracking-wider text-slate-600">
              {kop.subtitle} &nbsp;·&nbsp; Kelas {rs.kelas}
            </p>
          )}
          {variant === "full" ? (
            <>
              <p className="mt-0.5 text-[9px] leading-snug text-slate-600">
                {kop.alamatKop ??
                  `${rs.alamat.jalan}, ${rs.alamat.kelurahan}, ${rs.alamat.kecamatan}, ${rs.alamat.kota} ${rs.alamat.kodePos}`}
              </p>
              <p className="text-[9px] text-slate-500">
                Telp. {rs.telp}
                {rs.fax ? ` · Fax. ${rs.fax}` : ""}
                {" · Email "}
                {rs.email}
                {rs.website ? ` · ${rs.website}` : ""}
              </p>
            </>
          ) : (
            <p className="text-[9px] text-slate-500">
              {rs.alamat.jalan}, {rs.alamat.kota}
            </p>
          )}
        </div>
      </div>

      {/* Classic double-border */}
      <div className="border-b-[3px] border-double border-slate-800" />
    </header>
  );
}
