"use client";

// Pilihan jenis penjamin = radio NATIVE di dalam <fieldset> (4 pilihan eksklusif): panah keyboard
// berpindah antarpilihan, nama grup dari <legend>. Input disembunyikan visual (sr-only), kartu <label>
// yang digambar; cincin fokus muncul di kartu lewat :has(:focus-visible). Jenis yang sedang berlaku
// ditandai badge "Saat ini" (teks, bukan warna saja).

import { useId } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/ui/utils";
import { PENJAMIN_OPTS, type PenjaminType } from "./penjaminConfig";
import { StepTitle } from "./penjaminUi";

export function PenjaminTypePicker({
  value, current, onChange, disabled,
}: {
  value: PenjaminType;
  current: PenjaminType;
  onChange: (t: PenjaminType) => void;
  disabled?: boolean;
}) {
  const name = useId();
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="mb-3">
        <StepTitle n={1} title="Pilih jenis penjamin" desc="Jenis yang dipilih menentukan data yang perlu dilengkapi." />
      </legend>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {PENJAMIN_OPTS.map((o) => {
          const Icon = o.icon;
          const active = value === o.id;
          const isCurrent = current === o.id;
          return (
            <label
              key={o.id}
              className={cn(
                "group relative flex min-h-28 cursor-pointer flex-col justify-between gap-3 rounded-xl border-2 bg-white p-3 transition-[border-color,background-color,box-shadow,transform] duration-150",
                "has-focus-visible:ring-2 has-focus-visible:ring-sky-600 has-focus-visible:ring-offset-2",
                "has-disabled:cursor-not-allowed has-disabled:opacity-60",
                "motion-safe:active:scale-[0.98]",
                active ? cn(o.accent.selected, "shadow-sm") : "border-slate-200 hover:border-slate-300 hover:shadow-sm",
              )}
            >
              <input
                type="radio"
                name={name}
                value={o.id}
                checked={active}
                onChange={() => onChange(o.id)}
                className="sr-only"
              />
              <span className="flex items-start justify-between gap-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg transition-colors",
                    active ? o.accent.tile : "bg-slate-100 text-slate-500 group-hover:text-slate-700",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="flex items-center gap-1.5">
                  {isCurrent && (
                    <span className="rounded-full bg-slate-900/5 px-1.5 py-0.5 m-mini font-semibold text-slate-600 ring-1 ring-inset ring-slate-900/10">
                      Saat ini
                    </span>
                  )}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full transition-colors",
                      active ? cn(o.accent.check, "text-white") : "border-2 border-slate-300 group-hover:border-slate-400",
                    )}
                  >
                    {active && <Check className="size-3" strokeWidth={3.5} />}
                  </span>
                </span>
              </span>
              <span>
                <span className={cn("block m-sm font-semibold leading-tight", active ? o.accent.text : "text-slate-800")}>
                  {o.label}
                </span>
                <span className="mt-1 block m-tiny leading-snug text-slate-500">{o.sub}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
