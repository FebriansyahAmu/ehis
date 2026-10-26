"use client";

// Field kode LOINC (FHIR SatuSehat) — kode + nama display, validasi LOKAL live (format + check digit
// Mod-10, R12: SatuSehat tak punya terminology server). Dipakai Katalog Lab (tes & parameter) dan
// Katalog Radiologi. Kosong = sah (item belum dipetakan → tidak dikirim ke SatuSehat).

import { CheckCircle2, AlertTriangle, CircleDashed, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { checkLoinc, type LoincCheck } from "@/lib/fhir/terminology";

export interface LoincValue {
  loincCode?: string;
  loincDisplay?: string;
}

interface Props {
  value: LoincValue;
  onChange: (v: LoincValue) => void;
  /** Ringkas (baris parameter): kode + display sebaris, badge kecil. */
  compact?: boolean;
  /** Warna fokus mengikuti aksen halaman. */
  accent?: "sky" | "rose";
  displayPlaceholder?: string;
}

const STATE: Record<LoincCheck, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  valid: { label: "LOINC valid", cls: "border-emerald-200 bg-emerald-50 text-emerald-700", Icon: CheckCircle2 },
  checkdigit: { label: "Check digit salah", cls: "border-rose-200 bg-rose-50 text-rose-700", Icon: AlertTriangle },
  format: { label: "Format: angka-digit (mis. 718-7)", cls: "border-amber-200 bg-amber-50 text-amber-700", Icon: AlertTriangle },
  empty: { label: "Belum dipetakan · tak dikirim ke SatuSehat", cls: "border-slate-200 bg-slate-50 text-slate-500", Icon: CircleDashed },
};

const FOCUS = {
  sky: "focus:border-sky-400 focus:ring-sky-100",
  rose: "focus:border-rose-400 focus:ring-rose-100",
} as const;

export function isLoincInputOk(v: LoincValue): boolean {
  const s = checkLoinc(v.loincCode);
  return s === "empty" || s === "valid";
}

export default function LoincField({ value, onChange, compact, accent = "sky", displayPlaceholder }: Props) {
  const state = checkLoinc(value.loincCode);
  const st = STATE[state];
  const code = value.loincCode ?? "";
  const input = cn(
    "rounded-lg border border-slate-200 bg-white text-slate-800 outline-none transition placeholder:text-slate-400",
    "hover:border-slate-300 focus:ring-2",
    FOCUS[accent],
    compact ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm",
    state === "checkdigit" && "border-rose-300",
    state === "format" && "border-amber-300",
  );

  return (
    <div className={cn("flex flex-col", compact ? "gap-1" : "gap-1.5")}>
      <div className={cn("flex flex-wrap items-center", compact ? "gap-1.5" : "gap-2")}>
        <input
          type="text"
          inputMode="numeric"
          value={code}
          onChange={(e) => onChange({ ...value, loincCode: e.target.value.replace(/[^\d-]/g, "") })}
          placeholder="mis. 718-7"
          aria-label="Kode LOINC"
          aria-invalid={state === "checkdigit" || state === "format"}
          className={cn(input, "w-28 font-mono")}
        />
        <input
          type="text"
          value={value.loincDisplay ?? ""}
          onChange={(e) => onChange({ ...value, loincDisplay: e.target.value })}
          disabled={!code.trim()}
          placeholder={displayPlaceholder ?? "Nama LOINC (mis. Hemoglobin [Mass/volume] in Blood)"}
          aria-label="Nama display LOINC"
          className={cn(input, "min-w-0 flex-1 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400")}
        />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          role="status"
          className={cn(
            "inline-flex items-center gap-1 rounded-md border font-medium",
            compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
            st.cls,
          )}
        >
          <st.Icon size={compact ? 10 : 11} aria-hidden />
          {st.label}
        </span>
        {state === "valid" && (
          <a
            href={`https://loinc.org/${code.trim()}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-0.5 rounded font-medium text-slate-500 underline-offset-2 transition hover:text-slate-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
              compact ? "text-[10px]" : "text-[11px]",
            )}
          >
            Cek di loinc.org <ExternalLink size={compact ? 9 : 10} aria-hidden />
          </a>
        )}
      </div>
    </div>
  );
}
