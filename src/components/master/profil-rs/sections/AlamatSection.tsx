"use client";

import { cn } from "@/lib/utils";
import type { RSProfil, RSAlamat } from "@/lib/master/rsProfilStore";
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

  const preview = [
    draft.alamat.jalan,
    draft.alamat.kelurahan,
    draft.alamat.kecamatan,
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
          placeholder="Jl. Nama Jalan No. X"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Kelurahan" required>
          <input
            type="text"
            value={draft.alamat.kelurahan}
            onChange={(e) => patch({ kelurahan: e.target.value })}
            className={cn(base, "max-w-[240px]")}
          />
        </Field>
        <Field label="Kecamatan" required>
          <input
            type="text"
            value={draft.alamat.kecamatan}
            onChange={(e) => patch({ kecamatan: e.target.value })}
            className={cn(base, "max-w-[240px]")}
          />
        </Field>
        <Field label="Kota / Kabupaten" required>
          <input
            type="text"
            value={draft.alamat.kota}
            onChange={(e) => patch({ kota: e.target.value })}
            className={cn(base, "max-w-[240px]")}
          />
        </Field>
        <Field label="Provinsi" required>
          <input
            type="text"
            value={draft.alamat.provinsi}
            onChange={(e) => patch({ provinsi: e.target.value })}
            className={cn(base, "max-w-[240px]")}
          />
        </Field>
        <Field label="Kode Pos">
          <input
            type="text"
            value={draft.alamat.kodePos}
            onChange={(e) => patch({ kodePos: e.target.value })}
            className={cn(base, "max-w-[120px] font-mono")}
            placeholder="12345"
            maxLength={6}
          />
        </Field>
        <Field label="Kode Wilayah Kemendagri">
          <input
            type="text"
            value={draft.alamat.kodeWilayah}
            onChange={(e) => patch({ kodeWilayah: e.target.value })}
            className={cn(base, "max-w-[180px] font-mono")}
            placeholder="3171010001"
            maxLength={10}
          />
        </Field>
      </div>

      {/* Preview */}
      <div className="rounded-lg border border-sky-100 bg-sky-50/50 px-4 py-3">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Preview Alamat
        </p>
        <p className="text-xs text-slate-700">{preview}</p>
        {draft.alamat.kodeWilayah && (
          <p className="mt-1 font-mono text-[10px] text-slate-400">
            Kode Wilayah: {draft.alamat.kodeWilayah}
          </p>
        )}
      </div>

    </div>
  );
}
