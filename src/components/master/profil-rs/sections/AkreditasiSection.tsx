"use client";

import { ShieldCheck, ShieldAlert, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RSAkreditasi, LembagaAkred } from "@/lib/master/rsProfilStore";
import type { SectionProps } from "./IdentitasSection";

const base =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 " +
  "placeholder:text-slate-400 outline-none transition hover:border-slate-300 " +
  "focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

const LEMBAGA_OPTIONS: { value: LembagaAkred; label: string }[] = [
  { value: "KARS",   label: "KARS (Komisi Akreditasi RS)" },
  { value: "JCI",    label: "JCI (Joint Commission International)" },
  { value: "Proses", label: "Sedang Proses Akreditasi" },
  { value: "Belum",  label: "Belum Terakreditasi" },
];

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

function Toggle({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
          checked ? "bg-emerald-500" : "bg-slate-200",
        )}
      >
        <span className={cn(
          "h-4 w-4 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0",
        )} />
      </button>
      <span className="text-xs font-medium text-slate-700">{label}</span>
    </div>
  );
}

export default function AkreditasiSection({ draft, onPatch }: SectionProps) {
  const patch = (p: Partial<RSAkreditasi>) =>
    onPatch({ akreditasi: { ...draft.akreditasi, ...p } });

  const isAkred = draft.akreditasi.lembaga === "KARS" || draft.akreditasi.lembaga === "JCI";

  const now     = new Date();
  const expires = draft.akreditasi.tanggalBerakhir
    ? new Date(draft.akreditasi.tanggalBerakhir) : null;
  const daysLeft     = expires ? Math.ceil((expires.getTime() - now.getTime()) / 86400000) : null;
  const isExpired    = daysLeft !== null && daysLeft < 0;
  const isSoon       = daysLeft !== null && daysLeft >= 0 && daysLeft <= 90;

  return (
    <div className="space-y-6 p-5">

      {/* Izin Operasional */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Izin Operasional
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Nomor Izin RS" required>
              <input
                type="text"
                value={draft.akreditasi.nomorIzin}
                onChange={(e) => patch({ nomorIzin: e.target.value })}
                className={cn(base, "max-w-[320px] font-mono")}
                placeholder="HK.02.03/I/xxxx/yyyy"
              />
            </Field>
          </div>
          <Field label="Tanggal Izin">
            <input
              type="date"
              value={draft.akreditasi.tanggalIzin ?? ""}
              onChange={(e) => patch({ tanggalIzin: e.target.value || undefined })}
              className={cn(base, "max-w-[180px]")}
            />
          </Field>
        </div>
      </div>

      {/* Akreditasi */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Akreditasi
        </p>
        <Field label="Lembaga Akreditasi" required>
          <select
            value={draft.akreditasi.lembaga}
            onChange={(e) => patch({ lembaga: e.target.value as LembagaAkred })}
            className={cn(base, "max-w-[300px]")}
          >
            {LEMBAGA_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>

        {isAkred && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Nomor Sertifikat">
                <input
                  type="text"
                  value={draft.akreditasi.sertifikatNo ?? ""}
                  onChange={(e) => patch({ sertifikatNo: e.target.value || undefined })}
                  className={cn(base, "max-w-[320px] font-mono")}
                  placeholder="KARS-SERT/xxx/xx/xxxx"
                />
              </Field>
            </div>
            <Field label="Tanggal Mulai">
              <input
                type="date"
                value={draft.akreditasi.tanggalMulai ?? ""}
                onChange={(e) => patch({ tanggalMulai: e.target.value || undefined })}
                className={cn(base, "max-w-[180px]")}
              />
            </Field>
            <Field label="Tanggal Berakhir">
              <input
                type="date"
                value={draft.akreditasi.tanggalBerakhir ?? ""}
                onChange={(e) => patch({ tanggalBerakhir: e.target.value || undefined })}
                className={cn(base, "max-w-[180px]")}
              />
            </Field>

            {/* Expiry status chip */}
            {daysLeft !== null && (
              <div className={cn(
                "col-span-2 flex items-center gap-2 rounded-lg border px-3 py-2.5",
                isExpired ? "border-rose-200 bg-rose-50"
                  : isSoon ? "border-amber-200 bg-amber-50"
                  : "border-emerald-200 bg-emerald-50",
              )}>
                {isExpired
                  ? <ShieldAlert size={13} className="shrink-0 text-rose-600" />
                  : isSoon
                  ? <Clock size={13} className="shrink-0 text-amber-600" />
                  : <ShieldCheck size={13} className="shrink-0 text-emerald-600" />}
                <p className={cn(
                  "text-xs font-medium",
                  isExpired ? "text-rose-700" : isSoon ? "text-amber-700" : "text-emerald-700",
                )}>
                  {isExpired
                    ? `Sertifikat kadaluarsa ${Math.abs(daysLeft)} hari lalu`
                    : isSoon
                    ? `Berakhir dalam ${daysLeft} hari — segera perpanjang`
                    : `Masih berlaku ${daysLeft} hari lagi`}
                </p>
              </div>
            )}

            <div className="col-span-2">
              <Toggle
                checked={draft.akreditasi.paripurna}
                onChange={(v) => patch({ paripurna: v })}
                label="Akreditasi Paripurna"
              />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
