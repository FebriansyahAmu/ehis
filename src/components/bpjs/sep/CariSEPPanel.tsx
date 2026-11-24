"use client";

// Form Cari SEP (nilai dipegang halaman agar riwayat & data uji bisa mengisi ulang).
// Galat tampil setelah field diisi lalu ditinggal, atau saat submit (lalu fokus ke field).
// Pesan galat ditautkan lewat aria-describedby hanya selama tampil.

import { useId, useState, type FormEvent, type RefObject } from "react";
import { AlertCircle, ChevronDown, FlaskConical, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/utils";
import { SAMPLE_SEP, validateNoSEP } from "./sepShared";

export default function CariSEPPanel({
  value,
  onChange,
  onSubmit,
  busy,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (noSEP: string) => void;
  busy: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const id = useId();
  const [touched, setTouched] = useState(false);
  const err = touched ? validateNoSEP(value) : null;

  function kirim(no: string) {
    if (busy) return;
    onSubmit(no.trim());
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (validateNoSEP(value)) {
      inputRef.current?.focus();
      return;
    }
    kirim(value);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor={`${id}-no`} className="mb-1.5 block text-xs font-medium text-foreground">
          Nomor SEP
        </label>
        <input
          ref={inputRef}
          id={`${id}-no`}
          autoComplete="off"
          spellCheck={false}
          value={value}
          placeholder="Mis. 0301R0011117V000008"
          aria-invalid={Boolean(err)}
          aria-describedby={err ? `${id}-err` : undefined}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => value && setTouched(true)}
          className={cn(
            "h-10 w-full rounded-xl px-3 font-mono text-sm tracking-wide text-foreground transition-[background-color,box-shadow] outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground/70 focus-visible:ring-[3px]",
            err
              ? "bg-rose-50 focus-visible:ring-rose-200"
              : "bg-slate-100 hover:bg-slate-200/70 focus-visible:bg-white focus-visible:ring-ring/40",
          )}
        />
        {err && (
          <p id={`${id}-err`} className="mt-1.5 flex items-center gap-1 text-xs text-rose-700">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
            {err}
          </p>
        )}
      </div>

      <Button type="submit" disabled={busy} className="h-9 w-full rounded-xl text-xs font-semibold">
        {busy ? (
          <>
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            Mencari SEP…
          </>
        ) : (
          <>
            <Search className="size-3.5" aria-hidden="true" />
            Cari SEP
          </>
        )}
      </Button>

      <details className="group rounded-xl bg-slate-100/70">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-muted-foreground transition-colors select-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
          <FlaskConical className="size-3.5" aria-hidden="true" />
          <span className="flex-1">Data uji (mock)</span>
          <ChevronDown className="size-3.5 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
        </summary>
        <ul className="flex flex-col gap-1 px-2 pb-2">
          {SAMPLE_SEP.map((s) => (
            <li key={s.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(s.value);
                  setTouched(false);
                  kirim(s.value);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5 text-left shadow-xs transition-colors hover:bg-emerald-50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <span className="text-xs text-foreground">{s.label}</span>
                <span className="truncate font-mono text-[11px] text-muted-foreground">{s.value}</span>
              </button>
            </li>
          ))}
        </ul>
      </details>
    </form>
  );
}
