"use client";

// Potongan UI bersama halaman V-Claim (Rujukan, Monitoring, …): kartu tanpa garis, badge bernada
// (titik + teks), alert galat (+ coba lagi), penggeser periode bulanan & tanggal harian, bilah
// <progress> native bergaya, kolom saring, dan grup tombol saring (aria-pressed).
// Komponen shadcn: Badge · Alert · Button · Input.

import type { ReactNode } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, RotateCcw, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/shared/inputs";
import { cn } from "@/lib/ui/utils";
import type { BPJSError } from "@/lib/bpjs/bpjsShared";
import { BADGE, DOT, type BadgeTone } from "./badge";
import { geserHari, geserPeriode, hariIniISO, labelPeriode, periodeIni, samaPeriode, type Periode } from "./tanggal";
import { labelGalat } from "./galat";

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

export function GalatVClaim({
  error,
  objek,
  layanan,
  onUlang,
  className,
}: {
  error: BPJSError;
  /** Kata benda untuk kode 201, mis. "Rujukan" → "Rujukan tidak ditemukan". */
  objek?: string;
  /** Nama layanan untuk galat sambungan (bawaan "V-Claim"), mis. "Aplicares". */
  layanan?: string;
  onUlang?: () => void;
  className?: string;
}) {
  const { title, desc, kode, retryable } = labelGalat(error, objek, layanan);
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

const TOMBOL_GESER =
  "text-muted-foreground hover:bg-white aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent";

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
          className={TOMBOL_GESER}
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

/**
 * Penggeser tanggal harian: hari sebelumnya · DatePicker · hari berikutnya (+ "Hari ini").
 * Tidak bisa ke masa depan — tanggal yang dipilih melewati hari ini dijepit ke hari ini.
 */
export function TanggalStepper({ id, value, onChange, label }: { id: string; value: string; onChange: (iso: string) => void; label: string }) {
  const hariIni = hariIniISO();
  const diHariIni = value >= hariIni;
  return (
    <div className="flex items-center gap-1">
      <div role="group" aria-label={label} className="flex items-center gap-0.5 rounded-xl bg-slate-100 p-1">
        <Button variant="ghost" size="icon-xs" aria-label="Hari sebelumnya" onClick={() => onChange(geserHari(value, -1))} className={TOMBOL_GESER}>
          <ChevronLeft className="size-3.5" aria-hidden="true" />
        </Button>
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <div className="w-44">
          {/* cn DatePicker hanya menggabung kelas (tanpa tailwind-merge) → ringkas lewat `!`. */}
          <DatePicker
            id={id}
            value={value}
            onChange={(v) => v && onChange(v > hariIni ? hariIni : v)}
            variant="filled"
            clearable={false}
            className="h-7! rounded-lg! bg-white! px-2.5! text-xs! tabular-nums shadow-xs"
          />
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Hari berikutnya"
          aria-disabled={diHariIni}
          onClick={() => {
            if (!diHariIni) onChange(geserHari(value, 1));
          }}
          className={TOMBOL_GESER}
        >
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
      {!diHariIni && (
        <Button variant="ghost" size="xs" onClick={() => onChange(hariIni)} className="text-emerald-700">
          Hari ini
        </Button>
      )}
    </div>
  );
}

export interface OpsiSegmen<T extends string> {
  value: T;
  label: string;
  /** Jumlah data per opsi — ditampilkan di samping label. */
  jumlah?: number;
}

/**
 * Grup tombol saring yang saling eksklusif (aria-pressed, satu selalu aktif). Tampil seperti tab
 * garis: tombol aktif = teks emerald + garis bawah emerald dari BORDER pseudo-elemen (kontras
 * ≥ 3:1 terhadap latar putih, bukan warna teks saja, dan tetap tampil di forced-colors).
 */
export function SegmenFilter<T extends string>({
  label,
  opsi,
  value,
  onChange,
  className,
}: {
  label: string;
  opsi: readonly OpsiSegmen<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn("flex w-fit max-w-full flex-wrap gap-1", className)}>
      {opsi.map((o) => (
        <Button
          key={o.value}
          type="button"
          size="xs"
          variant="ghost"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "relative h-7 gap-1 rounded-md px-2 text-[11px] font-medium text-muted-foreground hover:bg-transparent hover:text-foreground",
            "after:absolute after:inset-x-2 after:bottom-0 after:border-b-2 after:border-transparent after:transition-colors",
            "aria-pressed:text-emerald-800 aria-pressed:after:border-emerald-600",
          )}
        >
          {o.label}
          {o.jumlah !== undefined && <span className="tabular-nums opacity-70">{o.jumlah}</span>}
        </Button>
      ))}
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
