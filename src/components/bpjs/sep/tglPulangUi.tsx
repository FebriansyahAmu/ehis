"use client";

// Potongan UI tab Update Tanggal Pulang: gaya isian filled, pesan galat (ikon berteks "Galat"),
// label wajib (bintang visual + "(wajib)" untuk kontrol non-native), Alert galat periksa/kirim.

import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/ui/utils";
import type { BPJSError } from "@/lib/bpjs/bpjsShared";
import { errorLabel } from "./sepShared";

export const INPUT_ISI =
  "h-10 rounded-xl border-0 bg-slate-100 shadow-none placeholder:text-muted-foreground/70 hover:bg-slate-200/70 focus-visible:bg-white focus-visible:ring-ring/40 aria-invalid:bg-rose-50 aria-invalid:hover:bg-rose-50";

export const NADA_ALERT = {
  slate: "bg-slate-50 text-slate-900",
  amber: "bg-amber-50 text-amber-900",
  rose: "bg-rose-50 text-rose-900",
} as const;

// ── Potongan UI ───────────────────────────────────────────

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

// ── Galat ─────────────────────────────────────────────────

export function GalatPeriksa({ error, onUlang }: { error: BPJSError; onUlang: () => void }) {
  const { title, desc, color, retryable, kode } = errorLabel(error);
  return (
    <Alert role="note" className={cn("rounded-xl border-0 p-3 [&>svg]:size-4", NADA_ALERT[color])}>
      <AlertTriangle aria-hidden="true" />
      <AlertTitle className="text-xs font-semibold">
        {title}
        {kode && <span className="ml-1.5 font-normal opacity-70 tabular-nums">Kode {kode}</span>}
      </AlertTitle>
      <AlertDescription className="text-xs/relaxed text-current">
        <p>{desc}</p>
        {retryable && (
          <Button type="button" size="xs" variant="secondary" onClick={onUlang} className="mt-1 bg-white">
            <RotateCcw aria-hidden="true" />
            Coba lagi
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function GalatKirim({ error }: { error: BPJSError }) {
  const { title, desc, kode } = errorLabel(error);
  return (
    <Alert className="rounded-xl border-0 bg-rose-50 p-3 text-rose-900 [&>svg]:size-4">
      <AlertCircle aria-hidden="true" />
      <AlertTitle className="text-xs font-semibold">
        Belum tersimpan: {title}
        {kode && <span className="ml-1.5 font-normal opacity-70 tabular-nums">Kode {kode}</span>}
      </AlertTitle>
      <AlertDescription className="text-xs/relaxed text-rose-900/80">
        <p>{desc}</p>
      </AlertDescription>
    </Alert>
  );
}
