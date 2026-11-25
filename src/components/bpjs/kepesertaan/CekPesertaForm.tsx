"use client";

// Form cek kepesertaan (state query dipegang halaman). Mode = segmented control radio native.
// Validasi tampil setelah interaksi (field diisi lalu ditinggal) atau saat submit; submit gagal
// → fokus ke field pertama yang salah. Pesan galat ditautkan lewat aria-describedby HANYA
// selama tampil. Data uji (mock) = isi & langsung cek.

import { useId, useState, type FormEvent, type RefObject } from "react";
import { AlertCircle, Check, ChevronDown, CreditCard, Fingerprint, FlaskConical, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/inputs";
import { cn } from "@/lib/ui/utils";
import {
  PANJANG,
  RENTANG_TGL,
  SAMPLE,
  validasiNomor,
  validasiTgl,
  type Query,
  type SearchMode,
} from "./kepesertaanShared";

const MODE: { key: SearchMode; label: string; icon: typeof CreditCard }[] = [
  { key: "kartu", label: "No. kartu", icon: CreditCard },
  { key: "nik", label: "NIK KTP", icon: Fingerprint },
];

export default function CekPesertaForm({
  query,
  onChange,
  onSubmit,
  busy,
  inputRef,
}: {
  query: Query;
  onChange: (q: Query) => void;
  onSubmit: (q: Query) => void;
  busy: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const id = useId();
  const [touched, setTouched] = useState({ value: false, tgl: false });

  const max = PANJANG[query.mode];
  const lengkap = query.value.length === max;
  const errValue = touched.value ? validasiNomor(query.mode, query.value) : null;
  const errTgl = touched.tgl ? validasiTgl(query.tgl) : null;

  function gantiMode(m: SearchMode) {
    if (m === query.mode) return;
    onChange({ ...query, mode: m, value: "" });
    setTouched((t) => ({ ...t, value: false }));
  }

  function kirim(q: Query) {
    if (busy) return;
    onSubmit(q);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ value: true, tgl: true });
    if (validasiNomor(query.mode, query.value)) {
      inputRef.current?.focus();
      return;
    }
    if (validasiTgl(query.tgl)) {
      document.getElementById(`${id}-tgl`)?.focus();
      return;
    }
    kirim(query);
  }

  function pakaiContoh(value: string) {
    const q = { ...query, value };
    onChange(q);
    setTouched((t) => ({ ...t, value: false }));
    if (!validasiTgl(q.tgl)) kirim(q);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* Mode */}
      <fieldset>
        <legend className="mb-1.5 text-xs font-medium text-muted-foreground">Cari berdasarkan</legend>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-0.75">
          {MODE.map(({ key, label, icon: Icon }) => {
            const on = query.mode === key;
            return (
              <label
                key={key}
                className={cn(
                  "relative flex h-7 cursor-pointer items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-[color,background-color,box-shadow] duration-150 has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50",
                  on ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <input
                  type="radio"
                  name={`${id}-mode`}
                  value={key}
                  checked={on}
                  onChange={() => gantiMode(key)}
                  className="sr-only"
                />
                <Icon className="size-3.5" aria-hidden="true" />
                {label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Nomor */}
      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <label htmlFor={`${id}-no`} className="text-xs font-medium text-foreground">
            {query.mode === "kartu" ? "Nomor kartu BPJS" : "NIK KTP"}
          </label>
          <span
            id={`${id}-hint`}
            className={cn("text-[11px] tabular-nums transition-colors", lengkap ? "text-emerald-700" : "text-muted-foreground")}
          >
            {query.value.length}/{max} digit
          </span>
        </div>
        <div className="relative">
          <input
            ref={inputRef}
            id={`${id}-no`}
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            maxLength={max}
            value={query.value}
            placeholder={query.mode === "kartu" ? "13 digit nomor kartu" : "16 digit NIK"}
            aria-invalid={Boolean(errValue)}
            aria-describedby={errValue ? `${id}-hint ${id}-err-no` : `${id}-hint`}
            onChange={(e) => onChange({ ...query, value: e.target.value.replace(/\D/g, "").slice(0, max) })}
            onBlur={() => query.value && setTouched((t) => ({ ...t, value: true }))}
            className={cn(
              "h-10 w-full rounded-xl pr-9 pl-3 text-sm tracking-wide text-foreground tabular-nums transition-[background-color,box-shadow] outline-none placeholder:tracking-normal placeholder:text-muted-foreground/70 focus-visible:ring-[3px]",
              errValue
                ? "bg-rose-50 focus-visible:ring-rose-200"
                : "bg-slate-100 hover:bg-slate-200/70 focus-visible:bg-white focus-visible:ring-ring/40",
            )}
          />
          {lengkap && !errValue && (
            <Check className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-emerald-600" aria-hidden="true" />
          )}
        </div>
        {errValue && (
          <p id={`${id}-err-no`} className="mt-1.5 flex items-center gap-1 text-xs text-rose-700">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
            {errValue}
          </p>
        )}
      </div>

      {/* Tanggal SEP */}
      <div>
        <label htmlFor={`${id}-tgl`} className="mb-1.5 block text-xs font-medium text-foreground">
          Tanggal SEP
        </label>
        <DatePicker
          id={`${id}-tgl`}
          value={query.tgl}
          clearable={false}
          variant="filled"
          onChange={(v) => {
            onChange({ ...query, tgl: v });
            setTouched((t) => ({ ...t, tgl: true }));
          }}
        />
        {errTgl ? (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-700">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
            {errTgl}
          </p>
        ) : (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {RENTANG_TGL.mundur} hari lalu sampai {RENTANG_TGL.maju} hari ke depan
          </p>
        )}
      </div>

      <Button type="submit" disabled={busy} className="h-10 w-full rounded-xl">
        {busy ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            Memeriksa…
          </>
        ) : (
          <>
            <Search aria-hidden="true" />
            Cek kepesertaan
          </>
        )}
      </Button>

      {/* Data uji (mock) */}
      <details className="group rounded-xl bg-slate-100/70">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-muted-foreground transition-colors select-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
          <FlaskConical className="size-3.5" aria-hidden="true" />
          <span className="flex-1">Data uji (mock)</span>
          <ChevronDown className="size-3.5 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="flex flex-wrap gap-1.5 px-3 pb-3">
          {SAMPLE[query.mode].map((s) => (
            <Button
              key={s.value}
              type="button"
              variant="secondary"
              size="xs"
              className="bg-white shadow-xs hover:bg-slate-50"
              onClick={() => pakaiContoh(s.value)}
              title={`Isi ${s.value} lalu cek`}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </details>
    </form>
  );
}
