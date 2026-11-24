"use client";

// Potongan form bersama modul BPJS (SEP, Rujukan, …): gaya isian "filled", pesan galat (ikon
// berteks "Galat" — bukan warna saja), dan label wajib (bintang visual + "(wajib)" untuk kontrol
// non-native).

import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";

export const INPUT_ISI =
  "h-10 rounded-xl border-0 bg-slate-100 shadow-none placeholder:text-muted-foreground/70 hover:bg-slate-200/70 focus-visible:bg-white focus-visible:ring-ring/40 aria-invalid:bg-rose-50 aria-invalid:hover:bg-rose-50";

export function PesanGalat({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-1 text-xs text-rose-700">
      <AlertCircle role="img" aria-label="Galat" className="mt-px size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** Label kolom wajib: bintang visual (aria-hidden); "(wajib)" dibacakan bila kontrolnya bukan input native. */
export function LabelWajib({ htmlFor, id, native = true, children }: { htmlFor?: string; id?: string; native?: boolean; children: ReactNode }) {
  return (
    <Label htmlFor={htmlFor} id={id} className="gap-0.5 text-xs">
      {children}
      <span aria-hidden="true" className="text-rose-600">
        *
      </span>
      {!native && <span className="sr-only">(wajib)</span>}
    </Label>
  );
}
