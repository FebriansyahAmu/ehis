"use client";

import { cn } from "@/lib/utils";
import { MapPinned, Hash } from "lucide-react";
import type { RSAlamat } from "@/lib/master/rsProfilStore";
import { WilayahCascade, type WilayahValue } from "@/components/shared/inputs/WilayahCascade";
import type { SectionProps } from "./IdentitasSection";

const base =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 " +
  "placeholder:text-slate-400 outline-none transition hover:border-slate-300 " +
  "focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

function Field({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}{required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}

export default function AlamatSection({ draft, onPatch }: SectionProps) {
  const patch = (p: Partial<RSAlamat>) =>
    onPatch({ alamat: { ...draft.alamat, ...p } });

  // Cascade wilayah menulis 4 nama + kodeWilayah; jalan/kodePos tetap manual.
  const wilayahValue: WilayahValue = {
    provinsi:    draft.alamat.provinsi,
    kota:        draft.alamat.kota,
    kecamatan:   draft.alamat.kecamatan,
    kelurahan:   draft.alamat.kelurahan,
    kodeWilayah: draft.alamat.kodeWilayah,
  };

  const preview = [
    draft.alamat.jalan,
    draft.alamat.kelurahan && `Kel. ${draft.alamat.kelurahan}`,
    draft.alamat.kecamatan && `Kec. ${draft.alamat.kecamatan}`,
    draft.alamat.kota,
    draft.alamat.provinsi,
    draft.alamat.kodePos,
  ].filter(Boolean).join(", ");

  return (
    <div className="space-y-5 p-5">

      <Field label="Jalan / Alamat" required>
        <input
          type="text"
          value={draft.alamat.jalan}
          onChange={(e) => patch({ jalan: e.target.value })}
          className={base}
          placeholder="Jl. Nama Jalan No. X, RT/RW"
        />
      </Field>

      {/* Wilayah administratif — fetch langsung dari master.Wilayah (Kemendagri) */}
      <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-4">
        <div className="mb-3 flex items-center gap-2">
          <MapPinned size={14} className="text-sky-600" />
          <p className="text-[11px] font-bold uppercase tracking-wide text-sky-700">
            Wilayah Administratif
          </p>
          <span className="ml-auto text-[10px] text-slate-400">Sumber: Master Wilayah Kemendagri</span>
        </div>
        <WilayahCascade
          value={wilayahValue}
          onChange={(p) => patch(p)}
        />
      </div>

      {/* Kode Pos + Kode Wilayah (derived) */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Kode Pos">
          <input
            type="text"
            value={draft.alamat.kodePos}
            onChange={(e) => patch({ kodePos: e.target.value.replace(/\D/g, "") })}
            className={cn(base, "max-w-[140px] font-mono tracking-widest")}
            placeholder="12345"
            maxLength={6}
            inputMode="numeric"
          />
        </Field>
        <Field label="Kode Wilayah Kemendagri">
          <div className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-sm",
            draft.alamat.kodeWilayah
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-slate-200 bg-slate-50 text-slate-300",
          )}>
            <Hash size={13} className="shrink-0 opacity-60" />
            {draft.alamat.kodeWilayah || "otomatis dari pilihan wilayah"}
          </div>
        </Field>
      </div>

      {/* Preview */}
      <div className="rounded-lg border border-sky-100 bg-white px-4 py-3 shadow-sm">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Preview Alamat
        </p>
        <p className="text-xs leading-relaxed text-slate-700">{preview || "—"}</p>
      </div>

    </div>
  );
}
