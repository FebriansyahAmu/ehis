"use client";

import { cn } from "@/lib/utils";
import type { RSProfil, KelasRS, TipeRS, KepemilikanRS } from "@/lib/master/rsProfilStore";

const KELAS_OPTIONS: KelasRS[]       = ["A", "B", "C", "D", "D Pratama"];
const TIPE_OPTIONS: TipeRS[]         = ["RSUD", "RSU", "RS Khusus", "RSIA", "Klinik"];
const KEPEMILIKAN_OPTIONS: KepemilikanRS[] = [
  "Pemerintah Pusat", "Pemerintah Daerah", "TNI/Polri", "Swasta Nasional", "BUMN",
];

const base =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 " +
  "placeholder:text-slate-400 outline-none transition hover:border-slate-300 " +
  "focus:border-teal-400 focus:ring-2 focus:ring-teal-100";

export interface SectionProps {
  draft:     RSProfil;
  isDirty:   boolean;
  onPatch:   (p: Partial<RSProfil>) => void;
  onSave:    () => void;
  onCancel:  () => void;
}

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

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{children}</p>
  );
}

export default function IdentitasSection({ draft, onPatch }: SectionProps) {
  return (
    <div className="space-y-6 p-5">

      {/* Nama & Identitas */}
      <div className="space-y-3">
        <SectionHeading>Nama &amp; Identitas</SectionHeading>
        <Field label="Nama RS" required>
          <input
            type="text"
            value={draft.nama}
            onChange={(e) => onPatch({ nama: e.target.value })}
            className={base}
            placeholder="Nama lengkap rumah sakit"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nama Inggris">
            <input
              type="text"
              value={draft.namaInggris ?? ""}
              onChange={(e) => onPatch({ namaInggris: e.target.value || undefined })}
              className={base}
              placeholder="English name (opsional)"
            />
          </Field>
          <Field label="Kode RS" required>
            <input
              type="text"
              value={draft.kode}
              onChange={(e) => onPatch({ kode: e.target.value.toUpperCase() })}
              className={cn(base, "max-w-[120px] font-mono uppercase tracking-widest")}
              placeholder="RSHS"
              maxLength={8}
            />
          </Field>
        </div>
      </div>

      {/* Klasifikasi */}
      <div className="space-y-3">
        <SectionHeading>Klasifikasi</SectionHeading>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Kelas RS" required>
            <div className="flex flex-wrap gap-1.5">
              {KELAS_OPTIONS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => onPatch({ kelas: k })}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                    draft.kelas === k
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700",
                  )}
                >
                  {k}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Tipe RS" required>
            <select
              value={draft.tipe}
              onChange={(e) => onPatch({ tipe: e.target.value as TipeRS })}
              className={cn(base, "max-w-[200px]")}
            >
              {TIPE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Kepemilikan" required>
            <select
              value={draft.kepemilikan}
              onChange={(e) => onPatch({ kepemilikan: e.target.value as KepemilikanRS })}
              className={cn(base, "max-w-[220px]")}
            >
              {KEPEMILIKAN_OPTIONS.map((k) => <option key={k}>{k}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* Kontak */}
      <div className="space-y-3">
        <SectionHeading>Kontak</SectionHeading>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Telepon" required>
            <input
              type="tel"
              value={draft.telp}
              onChange={(e) => onPatch({ telp: e.target.value })}
              className={cn(base, "max-w-[200px]")}
              placeholder="021-xxx-xxxx"
            />
          </Field>
          <Field label="Fax">
            <input
              type="tel"
              value={draft.fax ?? ""}
              onChange={(e) => onPatch({ fax: e.target.value || undefined })}
              className={cn(base, "max-w-[200px]")}
              placeholder="021-xxx-xxxx"
            />
          </Field>
          <Field label="Email" required>
            <input
              type="email"
              value={draft.email}
              onChange={(e) => onPatch({ email: e.target.value })}
              className={cn(base, "max-w-[280px]")}
              placeholder="info@rs.id"
            />
          </Field>
          <Field label="Website">
            <input
              type="text"
              value={draft.website ?? ""}
              onChange={(e) => onPatch({ website: e.target.value || undefined })}
              className={cn(base, "max-w-[280px]")}
              placeholder="www.rs.id"
            />
          </Field>
        </div>
      </div>

    </div>
  );
}
