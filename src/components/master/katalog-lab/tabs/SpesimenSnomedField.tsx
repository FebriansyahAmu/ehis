"use client";

// Jenis spesimen SNOMED untuk FHIR SatuSehat (Specimen.type, L16 · S6b). Native <select> ber-optgroup (15 opsi
// terkurasi `SPESIMEN_SNOMED`); yang disimpan hanya KODE — display SNOMED dibaca dari daftar saat kirim.
// Opsional: kosong = belum dipetakan → Specimen & DiagnosticReport tes ini ditahan dari SatuSehat.

import { useId } from "react";
import { AlertCircle, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPESIMEN_SNOMED } from "@/lib/fhir/conceptMap";

const GRUP = [...new Set(SPESIMEN_SNOMED.map((s) => s.grup))];

const selectCls = cn(
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm text-slate-800 outline-none transition",
  "hover:border-slate-300 focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-100 appearance-none",
  "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")]",
  "bg-size-[14px] bg-position-[right_10px_center] bg-no-repeat",
);

interface Props {
  value: string;
  onChange: (kode: string) => void;
}

export default function SpesimenSnomedField({ value, onChange }: Props) {
  const id = useId();
  const hintId = `${id}-hint`;
  const terpilih = SPESIMEN_SNOMED.find((s) => s.code === value);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Jenis Spesimen SatuSehat
      </label>
      <select
        id={id}
        name="spesimenSnomed"
        value={terpilih ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={hintId}
        className={selectCls}
      >
        <option value="">— Belum dipetakan —</option>
        {GRUP.map((g) => (
          <optgroup key={g} label={g}>
            {SPESIMEN_SNOMED.filter((s) => s.grup === g).map((s) => (
              <option key={s.code} value={s.code}>
                {s.label} — {s.display}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <p
        id={hintId}
        className={cn("flex items-start gap-1 text-[11px] leading-snug", terpilih ? "text-emerald-700" : "text-amber-700")}
      >
        {terpilih ? (
          <>
            <BadgeCheck size={12} className="mt-px shrink-0" aria-hidden />
            <span>
              SNOMED <span className="font-mono">{terpilih.code}</span> — dikirim sebagai jenis Specimen
            </span>
          </>
        ) : (
          <>
            <AlertCircle size={12} className="mt-px shrink-0" aria-hidden />
            <span>Belum dipetakan — Specimen &amp; laporan hasil tes ini ditahan dari SatuSehat</span>
          </>
        )}
      </p>
    </div>
  );
}
