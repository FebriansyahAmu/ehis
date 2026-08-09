"use client";

// Gelang Identitas Pasien — template cetak (SKP 1 / SNARS "Identifikasi Pasien").
// Minimal 2 penanda: Nama · Tgl Lahir · No. RM (BUKAN kamar/bed — bisa berubah) + barcode RM.
// Warna gelang: biru = laki-laki · pink = perempuan. Penanda risiko: merah = ALERGI (dari
// data `patient.alergi`). Data 100% dari PatientMaster (tanpa fetch) → berlaku nyata & demo.
// Dirender di dalam `.print-area` oleh GelangIdentitasModal (media "band" strip / A4 grid).

import { cn } from "@/lib/utils";
import TteBarcode from "@/components/shared/resep/TteBarcode";
import { useRsProfil } from "@/lib/master/rsProfilClient";
import type { PatientMaster } from "@/lib/data";

// ── Helpers ──────────────────────────────────────────────────────────────────

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** "12-03-1970" (dari "YYYY-MM-DD"). Wristband pakai format pendek numerik. */
function fmtTglLahir(ymd?: string): string {
  if (!ymd) return "—";
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
}

interface GenderCfg { label: string; short: "L" | "P"; sym: string; cap: string; ring: string }

function genderCfg(g: "L" | "P"): GenderCfg {
  return g === "L"
    ? { label: "Laki-laki", short: "L", sym: "♂", cap: "bg-sky-600", ring: "border-sky-300" }
    : { label: "Perempuan", short: "P", sym: "♀", cap: "bg-pink-500", ring: "border-pink-300" };
}

// ── Strip gelang (1 unit) ─────────────────────────────────────────────────────

export function GelangStrip({ patient, rsNama }: { patient: PatientMaster; rsNama: string }) {
  const g = genderCfg(patient.gender);
  const alergi = (patient.alergi ?? []).filter(Boolean);
  const hasAlergi = alergi.length > 0;
  const alergiText = alergi.join(", ");
  // Watermark redundan sepanjang badan gelang (ID tetap terbaca meski terlipat).
  const watermark = `${patient.name.toUpperCase()} · ${patient.noRM} · `.repeat(10);

  return (
    <div
      className={cn(
        "flex h-[24mm] w-full items-stretch overflow-hidden rounded-lg border-2 bg-white",
        hasAlergi ? "border-rose-400" : g.ring,
      )}
    >
      {/* Tutup jenis kelamin */}
      <div className={cn("flex w-[15mm] shrink-0 flex-col items-center justify-center text-white", g.cap)}>
        <span className="text-[16px] leading-none">{g.sym}</span>
        <span className="mt-0.5 text-[8px] font-bold uppercase tracking-widest">{g.short}</span>
      </div>

      {/* Blok identitas + barcode */}
      <div className="flex shrink-0 items-center gap-3 border-r border-dashed border-slate-200 px-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[7px] font-bold uppercase tracking-[0.14em] text-slate-400">
              {rsNama}
            </p>
            {hasAlergi && (
              <span className="shrink-0 rounded bg-rose-600 px-1 py-px text-[6.5px] font-black uppercase tracking-wide text-white">
                Alergi
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[13px] font-black leading-tight text-slate-900">
            {patient.name}
          </p>
          <p className="mt-0.5 text-[8.5px] font-medium text-slate-600">
            <span className="font-mono font-semibold text-slate-800">{patient.noRM}</span>
            <span className="mx-1 text-slate-300">|</span>
            {fmtTglLahir(patient.tanggalLahir)}
            <span className="mx-1 text-slate-300">|</span>
            {g.label} · {patient.age} th
          </p>
          {hasAlergi && (
            <p className="mt-px truncate text-[7.5px] font-semibold text-rose-600">Alergi: {alergiText}</p>
          )}
        </div>
        <div className="shrink-0 text-center">
          <TteBarcode value={patient.noRM} height={30} unit={1.5} showValue={false} className="w-[74px]" />
          <p className="mt-px font-mono text-[6.5px] font-semibold tracking-[0.12em] text-slate-500">
            {patient.noRM}
          </p>
        </div>
      </div>

      {/* Badan gelang — watermark identitas redundan */}
      <div className="flex flex-1 items-center overflow-hidden pl-2">
        <p className="select-none truncate whitespace-nowrap text-[9px] font-bold tracking-[0.25em] text-slate-200">
          {watermark}
        </p>
      </div>
    </div>
  );
}

// ── Sheet (band / A4) ─────────────────────────────────────────────────────────

/** Jumlah salinan pada mode A4 (1 dipakai + cadangan). */
const A4_COPIES = 3;

export default function GelangIdentitasSheet({
  patient,
  paper = "band",
}: {
  patient: PatientMaster;
  paper?: "band" | "A4";
}) {
  const rs = useRsProfil();

  if (paper === "band") {
    return <GelangStrip patient={patient} rsNama={rs.nama} />;
  }

  // A4 — beberapa salinan siap gunting untuk dimasukkan ke holder gelang.
  return (
    <div className="text-slate-900">
      <div className="mb-3 flex items-end justify-between border-b-2 border-sky-600 pb-2">
        <div>
          <p className="text-[13px] font-black leading-tight text-slate-900">{rs.nama}</p>
          <p className="text-[9px] text-slate-500">Gelang Identitas Pasien · Sasaran Keselamatan Pasien 1 (Identifikasi)</p>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600">Gelang Identitas</p>
      </div>

      <div className="flex flex-col gap-4">
        {Array.from({ length: A4_COPIES }).map((_, i) => (
          <div key={i} className="break-inside-avoid">
            <GelangStrip patient={patient} rsNama={rs.nama} />
            <div className="mt-1 flex items-center gap-1 text-slate-300" aria-hidden>
              <span className="text-[8px]">✂</span>
              <span className="flex-1 border-t border-dashed border-slate-300" />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-[9px] text-slate-400">
        Gunting per strip lalu masukkan ke holder gelang. Warna: biru = laki-laki · pink = perempuan · merah = alergi.
        Verifikasi minimal 2 penanda (nama, tanggal lahir, No. RM) sebelum tindakan.
      </p>
    </div>
  );
}
