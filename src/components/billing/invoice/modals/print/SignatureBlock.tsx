"use client";

import { fmtTanggalShort } from "./printShared";

interface SignerSlot {
  label: string;          // "Kasir" / "Pasien / Penanggung Jawab"
  name?: string;          // optional pre-filled name
  hint?: string;          // micro-label di bawah nama
}

interface Props {
  leftSlot: SignerSlot;
  rightSlot: SignerSlot;
  /** Lokasi (default Kota RS) */
  lokasi?: string;
  /** Tanggal tanda tangan (ISO). Default: hari ini. */
  tanggalISO?: string;
}

/**
 * Blok tanda tangan 2-kolom — kanan kasir, kiri pasien/penyetor (klasik).
 * Lokasi & tanggal di kanan atas slot kanan, mengikuti konvensi RS pemerintah.
 */
export default function SignatureBlock({
  leftSlot, rightSlot, lokasi = "Jakarta",
  tanggalISO = new Date().toISOString(),
}: Props) {
  const tanggal = fmtTanggalShort(tanggalISO);

  return (
    <div className="page-break-avoid mt-8 grid grid-cols-2 gap-8 text-[11px]">
      {/* Left signer */}
      <SignerCell slot={leftSlot} />

      {/* Right signer (dengan lokasi+tanggal di atas) */}
      <SignerCell slot={rightSlot} location={`${lokasi}, ${tanggal}`} />
    </div>
  );
}

// ── Cell ───────────────────────────────────────────────

function SignerCell({
  slot, location,
}: {
  slot: SignerSlot;
  location?: string;
}) {
  return (
    <div className="text-center">
      {location && (
        <p className="mb-1 text-[10.5px] text-slate-700">{location}</p>
      )}
      <p className="text-[11px] font-medium text-slate-800">{slot.label}</p>

      {/* Signature space */}
      <div className="my-10 flex items-end justify-center">
        <span className="border-b border-dotted border-slate-400 px-12 text-[10px] italic text-slate-400">
          {slot.name ? " " : "(tanda tangan)"}
        </span>
      </div>

      <p className="border-t border-slate-800 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-900">
        {slot.name ?? "(........................)"}
      </p>
      {slot.hint && (
        <p className="mt-0.5 text-[9.5px] italic text-slate-500">{slot.hint}</p>
      )}
    </div>
  );
}
