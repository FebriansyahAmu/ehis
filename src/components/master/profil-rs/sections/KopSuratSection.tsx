"use client";

import { cn } from "@/lib/utils";
import type { RSKop } from "@/lib/master/rsProfilStore";
import type { SectionProps } from "./IdentitasSection";

const base =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 " +
  "placeholder:text-slate-400 outline-none transition hover:border-slate-300 " +
  "focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function KopSuratSection({ draft, onPatch }: SectionProps) {
  const patch = (p: Partial<RSKop>) =>
    onPatch({ kop: { ...draft.kop, ...p } });

  const displayAlamat =
    draft.kop.alamatKop ??
    `${draft.alamat.jalan}, ${draft.alamat.kecamatan}, ${draft.alamat.kota}`;

  return (
    <div className="space-y-5 p-5">

      {/* Form fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field label="Subtitle / Tagline">
            <input
              type="text"
              value={draft.kop.subtitle ?? ""}
              onChange={(e) => patch({ subtitle: e.target.value || undefined })}
              className={cn(base, "max-w-[400px]")}
              placeholder="Contoh: TERAKREDITASI PARIPURNA"
            />
          </Field>
        </div>
        <div className="col-span-2">
          <Field label="Alamat KOP (ringkas)">
            <input
              type="text"
              value={draft.kop.alamatKop ?? ""}
              onChange={(e) => patch({ alamatKop: e.target.value || undefined })}
              className={base}
              placeholder="Alamat singkat untuk header dokumen"
            />
          </Field>
        </div>
        <Field label="Nama Kepala / Direktur RS">
          <input
            type="text"
            value={draft.kop.namaKepala ?? ""}
            onChange={(e) => patch({ namaKepala: e.target.value || undefined })}
            className={cn(base, "max-w-[280px]")}
            placeholder="dr. Nama Lengkap, Sp.X"
          />
        </Field>
        <Field label="NIP / NIK Kepala">
          <input
            type="text"
            value={draft.kop.nipKepala ?? ""}
            onChange={(e) => patch({ nipKepala: e.target.value || undefined })}
            className={cn(base, "max-w-[200px] font-mono")}
            placeholder="xxxxxxxxxxxxxxxx"
          />
        </Field>
      </div>

      {/* Live KOP Preview */}
      <div className="rounded-xl border border-violet-100 bg-slate-50 p-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Preview KOP Surat
        </p>
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">

          {/* KOP header */}
          <div className="flex items-start gap-4 border-b-2 border-slate-800 px-5 py-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-base font-black text-white">
              {draft.kode.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black uppercase tracking-tight text-slate-900">
                {draft.nama}
              </p>
              {draft.kop.subtitle && (
                <p className="text-[9px] font-bold uppercase tracking-widest text-teal-600">
                  {draft.kop.subtitle}
                </p>
              )}
              <p className="mt-0.5 text-[10px] text-slate-500">{displayAlamat}</p>
              <p className="text-[10px] text-slate-500">
                Telp: {draft.telp}
                {draft.fax ? ` · Fax: ${draft.fax}` : ""}
                {draft.email ? ` · ${draft.email}` : ""}
              </p>
            </div>
          </div>

          {/* Placeholder content */}
          <div className="space-y-1.5 px-5 py-3 opacity-25">
            <div className="h-2 w-20 rounded bg-slate-300" />
            <div className="h-1.5 w-full rounded bg-slate-200" />
            <div className="h-1.5 w-4/5 rounded bg-slate-200" />
            <div className="h-1.5 w-3/5 rounded bg-slate-200" />
          </div>

          {/* TTD kepala */}
          {draft.kop.namaKepala && (
            <div className="border-t border-slate-100 px-5 py-3">
              <div className="flex justify-end">
                <div className="text-center">
                  <p className="text-[10px] text-slate-400">Jakarta, ______________</p>
                  <p className="text-[10px] text-slate-400">Direktur,</p>
                  <div className="my-5 h-4 w-28 border-b border-dashed border-slate-300" />
                  <p className="text-[11px] font-semibold text-slate-700">
                    {draft.kop.namaKepala}
                  </p>
                  {draft.kop.nipKepala && (
                    <p className="font-mono text-[9px] text-slate-400">
                      NIP. {draft.kop.nipKepala}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
