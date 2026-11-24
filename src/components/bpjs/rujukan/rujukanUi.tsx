"use client";

// Potongan UI bersama modul Rujukan: badge bernada (titik + teks), alert galat (+ coba lagi),
// penggeser periode bulanan, bilah <progress> native bergaya, dan kolom saring.
// Komponen shadcn: Badge · Alert · Button · Input.

import type { ReactNode } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, RotateCcw, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/ui/utils";
import type { BPJSError } from "@/lib/bpjs/bpjsShared";
import { BADGE, DOT, type BadgeTone } from "@/components/bpjs/shared/badge";
import { labelPeriode, samaPeriode, periodeIni, geserPeriode, type Periode } from "@/components/bpjs/shared/tanggal";
import { labelGalat } from "./rujukanShared";

/** Card shadcn tanpa garis & tanpa jarak bawaan (padding diatur per kartu). */
export const KARTU = "gap-0 border-0 py-0";

export function BadgeNada({ tone, children, titik = false, className }: { tone: BadgeTone; children: ReactNode; titik?: boolean; className?: string }) {
  return (
    <Badge className={cn("gap-1 px-1.5 text-[11px]", BADGE[tone], className)}>
      {titik && <span aria-hidden="true" className={cn("size-1.5 rounded-full", DOT[tone])} />}
      {children}
    </Badge>
  );
}

export function GalatRujukan({
  error,
  objek,
  onUlang,
  className,
}: {
  error: BPJSError;
  /** Kata benda untuk kode 201, mis. "Rujukan" → "Rujukan tidak ditemukan". */
  objek?: string;
  onUlang?: () => void;
  className?: string;
}) {
  const { title, desc, kode, retryable } = labelGalat(error, objek);
  const nada = kode === "201" ? "bg-slate-50 text-slate-900" : kode === "204" ? "bg-amber-50 text-amber-900" : "bg-rose-50 text-rose-900";
  return (
    <Alert role="note" className={cn("rounded-xl border-0 p-3 [&>svg]:size-4", nada, className)}>
      <AlertTriangle aria-hidden="true" />
      <AlertTitle className="text-xs font-semibold">
        {title}
        {kode && <span className="ml-1.5 font-normal opacity-70 tabular-nums">Kode {kode}</span>}
      </AlertTitle>
      <AlertDescription className="text-xs/relaxed text-current">
        <p>{desc}</p>
        {retryable && onUlang && (
          <Button type="button" size="xs" variant="secondary" onClick={onUlang} className="mt-1 bg-white">
            <RotateCcw aria-hidden="true" />
            Coba lagi
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/** Penggeser periode bulanan (tidak bisa ke masa depan) + tombol "Bulan ini". */
export function PeriodeStepper({ periode, onChange }: { periode: Periode; onChange: (p: Periode) => void }) {
  const sekarang = periodeIni();
  const bulanIni = samaPeriode(periode, sekarang);
  return (
    <div className="flex items-center gap-1">
      <div role="group" aria-label="Periode" className="flex items-center gap-0.5 rounded-xl bg-slate-100 p-1">
        <Button variant="ghost" size="icon-xs" aria-label="Bulan sebelumnya" onClick={() => onChange(geserPeriode(periode, -1))} className="hover:bg-white">
          <ChevronLeft className="size-3.5" aria-hidden="true" />
        </Button>
        <span aria-live="polite" className="min-w-28 px-1 text-center text-xs font-medium tabular-nums">
          {labelPeriode(periode)}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Bulan berikutnya"
          aria-disabled={bulanIni}
          onClick={() => {
            if (!bulanIni) onChange(geserPeriode(periode, 1));
          }}
          className="hover:bg-white aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent"
        >
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
      {!bulanIni && (
        <Button variant="ghost" size="xs" onClick={() => onChange(sekarang)} className="text-emerald-700">
          Bulan ini
        </Button>
      )}
    </div>
  );
}

const ISI_METER: Record<BadgeTone, string> = {
  emerald: "[&::-webkit-progress-value]:bg-emerald-500 [&::-moz-progress-bar]:bg-emerald-500",
  amber: "[&::-webkit-progress-value]:bg-amber-500 [&::-moz-progress-bar]:bg-amber-500",
  rose: "[&::-webkit-progress-value]:bg-rose-400 [&::-moz-progress-bar]:bg-rose-400",
  teal: "[&::-webkit-progress-value]:bg-teal-500 [&::-moz-progress-bar]:bg-teal-500",
  sky: "[&::-webkit-progress-value]:bg-sky-500 [&::-moz-progress-bar]:bg-sky-500",
  slate: "[&::-webkit-progress-value]:bg-slate-400 [&::-moz-progress-bar]:bg-slate-400",
  blue: "[&::-webkit-progress-value]:bg-blue-500 [&::-moz-progress-bar]:bg-blue-500",
  cyan: "[&::-webkit-progress-value]:bg-cyan-500 [&::-moz-progress-bar]:bg-cyan-500",
  indigo: "[&::-webkit-progress-value]:bg-indigo-500 [&::-moz-progress-bar]:bg-indigo-500",
};

/**
 * Bilah <progress> native bergaya penuh: appearance-none + border-0 + overflow-clip, jalur di
 * elemennya, isi lewat ::-webkit-progress-value dan ::-moz-progress-bar (aturan terpisah).
 */
export function Meter({ value, max, tone, label, className }: { value: number; max: number; tone: BadgeTone; label: string; className?: string }) {
  return (
    <progress
      value={value}
      max={max}
      aria-label={label}
      className={cn(
        "h-1.5 w-full appearance-none overflow-clip rounded-full border-0 bg-slate-200/80",
        "[&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-[inline-size] [&::-webkit-progress-value]:duration-300 [&::-moz-progress-bar]:rounded-full",
        ISI_METER[tone],
        className,
      )}
    />
  );
}

/** Kolom saring klien (type=search) dengan ikon. */
export function KolomSaring({ id, value, onChange, label, placeholder }: { id: string; value: string; onChange: (v: string) => void; label: string; placeholder: string }) {
  return (
    <div className="relative min-w-48 flex-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-8 rounded-lg border-0 bg-slate-100 pl-8 text-xs shadow-none placeholder:text-muted-foreground/70 focus-visible:bg-white focus-visible:ring-ring/40 md:text-xs"
      />
    </div>
  );
}
