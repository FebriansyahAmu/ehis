"use client";

// Form Cari SEP (nilai dipegang halaman agar riwayat & data uji bisa mengisi ulang).
// Komponen shadcn: Label · Input · Button · Spinner · Collapsible · Item.
// Galat tampil setelah field diisi lalu ditinggal, atau saat submit (lalu fokus ke field).
// aria-invalid selalu "true"/"false" (bukan absen); pesan galat ditautkan lewat
// aria-describedby hanya selama tampil; galat yang muncul saat blur diumumkan lewat satu
// live region sopan.

import { useId, useState, type FormEvent, type RefObject } from "react";
import { AlertCircle, ChevronDown, FlaskConical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Item } from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useUmumkanGalat } from "@/components/bpjs/shared/useUmumkanGalat";
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
  const pengumum = useUmumkanGalat();
  const err = touched ? validateNoSEP(value) : null;

  function kirim(no: string) {
    if (busy) return;
    onSubmit(no.trim());
  }

  function ubah(v: string) {
    onChange(v);
    if (!validateNoSEP(v)) pengumum.bersihkan();
  }

  function handleBlur() {
    if (!value) return;
    setTouched(true);
    const galat = validateNoSEP(value);
    if (galat) pengumum.umumkan(galat);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (validateNoSEP(value)) {
      pengumum.tandaiDibacakan();
      inputRef.current?.focus();
      return;
    }
    kirim(value);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-no`} className="text-xs">
          Nomor SEP
        </Label>
        <Input
          ref={inputRef}
          id={`${id}-no`}
          autoComplete="off"
          spellCheck={false}
          value={value}
          placeholder="Mis. 0301R0011117V000008"
          aria-invalid={Boolean(err)}
          aria-describedby={err ? `${id}-err` : undefined}
          onChange={(e) => ubah(e.target.value)}
          onBlur={handleBlur}
          className="h-10 rounded-xl border-0 bg-slate-100 tracking-wide tabular-nums shadow-none placeholder:tracking-normal placeholder:text-muted-foreground/70 hover:bg-slate-200/70 focus-visible:bg-white focus-visible:ring-ring/40 aria-invalid:bg-rose-50 aria-invalid:hover:bg-rose-50"
        />
        {err && (
          <p id={`${id}-err`} className="flex items-center gap-1 text-xs text-rose-700">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
            {err}
          </p>
        )}
        <p aria-live="polite" className="sr-only">
          {pengumum.teks}
        </p>
      </div>

      <Button type="submit" disabled={busy} className="h-9 w-full rounded-xl text-xs font-semibold">
        {busy ? (
          <>
            <Spinner className="size-3.5" aria-hidden="true" />
            Mencari SEP…
          </>
        ) : (
          <>
            <Search className="size-3.5" aria-hidden="true" />
            Cari SEP
          </>
        )}
      </Button>

      <Collapsible className="rounded-xl bg-slate-100/70">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="group h-auto w-full justify-start gap-1.5 rounded-xl px-3 py-2 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-foreground"
          >
            <FlaskConical className="size-3.5" aria-hidden="true" />
            <span className="flex-1 text-left">Data uji (mock)</span>
            <ChevronDown
              className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180"
              aria-hidden="true"
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="flex flex-col gap-1 px-2 pb-2">
            {SAMPLE_SEP.map((s) => (
              <li key={s.value}>
                <Item
                  asChild
                  size="sm"
                  className="w-full flex-nowrap justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5 text-left shadow-xs hover:bg-emerald-50"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onChange(s.value);
                      setTouched(false);
                      pengumum.bersihkan();
                      kirim(s.value);
                    }}
                  >
                    <span className="text-xs text-foreground">{s.label}</span>
                    <span className="truncate text-[11px] tabular-nums text-muted-foreground">{s.value}</span>
                  </button>
                </Item>
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </form>
  );
}
