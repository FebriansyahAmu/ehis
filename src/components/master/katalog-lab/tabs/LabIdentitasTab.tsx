"use client";

import { cn } from "@/lib/utils";
import type { LabTestRecord } from "@/lib/master/labTestCatalog";
import { LAB_KATEGORI_ORDER } from "../katalogLabShared";

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 " +
  "placeholder:text-slate-400 outline-none transition hover:border-slate-300 " +
  "focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

interface Props {
  draft: LabTestRecord;
  isNew: boolean;
  onPatch: (p: Partial<LabTestRecord>) => void;
}

function Field({
  label, required, hint, children,
}: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
      {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

const STATUS_OPTS = ["Aktif", "NonAktif"] as const;

export default function LabIdentitasTab({ draft, onPatch }: Props) {
  return (
    <div className="space-y-5">
      {/* Nama — KODE sengaja TIDAK ditampilkan (auto / read-only di header) */}
      <Field label="Nama Tes / Pemeriksaan" required hint="mis. Darah Rutin, Kimia Darah Glukosa, Widal Test…">
        <input
          type="text"
          value={draft.nama}
          onChange={(e) => onPatch({ nama: e.target.value })}
          placeholder="Nama lengkap tes laboratorium…"
          className={inputCls}
        />
      </Field>

      {/* Kategori */}
      <Field label="Kategori" required>
        <div className="relative max-w-xs">
          <select
            value={draft.kategori}
            onChange={(e) => onPatch({ kategori: e.target.value as LabTestRecord["kategori"] })}
            className={cn(
              inputCls,
              "appearance-none pr-8",
              "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")]",
              "bg-size-[14px] bg-position-[right_10px_center] bg-no-repeat",
            )}
          >
            {LAB_KATEGORI_ORDER.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
      </Field>

      {/* Spesimen + Waktu Tunggu */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Spesimen" hint="mis. Darah EDTA, Serum, Urin sewaktu">
          <input
            type="text"
            value={draft.spesimen ?? ""}
            onChange={(e) => onPatch({ spesimen: e.target.value })}
            placeholder="Jenis spesimen…"
            className={inputCls}
          />
        </Field>
        <Field label="Waktu Tunggu (TAT)" hint="Estimasi TAT worklist">
          <input
            type="text"
            value={draft.waktuTunggu ?? ""}
            onChange={(e) => onPatch({ waktuTunggu: e.target.value })}
            placeholder="mis. 60 mnt"
            className={inputCls}
          />
        </Field>
      </div>

      {/* Metode */}
      <Field label="Metode Pemeriksaan" hint="Metode utama tes (boleh di-override per parameter)">
        <input
          type="text"
          value={draft.metode ?? ""}
          onChange={(e) => onPatch({ metode: e.target.value })}
          placeholder="mis. Flowcytometry, IFCC 37 °C, Immunoassay strip…"
          className={inputCls}
        />
      </Field>

      {/* Keterangan */}
      <Field label="Keterangan Klinis">
        <textarea
          value={draft.keterangan ?? ""}
          onChange={(e) => onPatch({ keterangan: e.target.value })}
          placeholder="Catatan interpretasi, indikasi klinis, referensi standar…"
          rows={3}
          className={cn(inputCls, "resize-none")}
        />
      </Field>

      {/* Status */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
        <div className="flex w-fit gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {STATUS_OPTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onPatch({ status: s })}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition",
                draft.status === s
                  ? s === "Aktif"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-500 text-white shadow-sm"
                  : "text-slate-500 hover:bg-white hover:text-slate-700",
              )}
            >
              {s === "NonAktif" ? "Non-Aktif" : s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
