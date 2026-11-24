"use client";

// Potongan UI tab Update Tanggal Pulang: gaya isian filled, pesan galat (ikon berteks "Galat"),
// label wajib (bintang visual + "(wajib)" untuk kontrol non-native), Alert galat periksa/kirim.

import { AlertCircle, AlertTriangle, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/utils";
import type { BPJSError } from "@/lib/bpjs/bpjsShared";
import { errorLabel } from "./sepShared";

// Gaya isian & pesan galat kini bersama modul BPJS — diekspor ulang agar import lama tetap jalan.
export { INPUT_ISI, LabelWajib, PesanGalat } from "@/components/bpjs/shared/formUi";

export const NADA_ALERT = {
  slate: "bg-slate-50 text-slate-900",
  amber: "bg-amber-50 text-amber-900",
  rose: "bg-rose-50 text-rose-900",
} as const;

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
