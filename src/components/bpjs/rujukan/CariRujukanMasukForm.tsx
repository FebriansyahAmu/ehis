"use client";

// Form cari rujukan masuk: SATU kolom untuk No. rujukan atau No. kartu — jenisnya dikenali
// otomatis (13 digit angka = No. kartu) dan ditampilkan sebagai petunjuk; FKTP & FKRTL dicari
// sekaligus, jadi petugas tidak perlu tahu asal rujukan (dulu dua sakelar mode + asal faskes).
// Form = landmark pencarian (role="search"). Galat tampil setelah interaksi; submit gagal →
// fokus ke kolom. Komponen shadcn: Label · Input · Button · Spinner · Collapsible · Item.

import { useId, useState, type FormEvent, type RefObject } from "react";
import { ChevronDown, CreditCard, FileText, FlaskConical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Item } from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useUmumkanGalat } from "@/components/bpjs/shared/useUmumkanGalat";
import { INPUT_ISI, PesanGalat } from "@/components/bpjs/shared/formUi";
import { cn } from "@/lib/ui/utils";
import { PANJANG_KARTU, SAMPLE_CARI, modeDari, validasiCari } from "./rujukanShared";

export default function CariRujukanMasukForm({
  judulId,
  value,
  onChange,
  onSubmit,
  busy,
  inputRef,
}: {
  /** id judul kartu pembungkus → nama aksesibel form. */
  judulId: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: (q: string) => void;
  busy: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const id = useId();
  const pengumum = useUmumkanGalat();
  const [touched, setTouched] = useState(false);
  const q = value.trim();
  const err = touched ? validasiCari(q) : null;
  const mode = q ? modeDari(q) : null;
  const IkonMode = mode === "kartu" ? CreditCard : FileText;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (validasiCari(q)) {
      pengumum.tandaiDibacakan();
      inputRef.current?.focus();
      return;
    }
    if (!busy) onSubmit(q);
  }

  return (
    <form onSubmit={handleSubmit} noValidate role="search" aria-labelledby={judulId} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-q`} className="text-xs">
          No. rujukan atau No. kartu BPJS
        </Label>
        <div className="relative">
          <Input
            ref={inputRef}
            id={`${id}-q`}
            name="q"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={40}
            value={value}
            placeholder="mis. 0301R0011117B000015"
            aria-invalid={Boolean(err)}
            aria-describedby={err ? `${id}-hint ${id}-err` : `${id}-hint`}
            onChange={(e) => {
              const v = e.target.value.replace(/\s+/g, "");
              onChange(v);
              if (!validasiCari(v.trim())) pengumum.bersihkan();
            }}
            onBlur={() => {
              if (!q) return;
              setTouched(true);
              const g = validasiCari(q);
              if (g) pengumum.umumkan(g);
            }}
            className={cn(INPUT_ISI, "pl-9 tracking-wide tabular-nums placeholder:tracking-normal")}
          />
          <IkonMode
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <p id={`${id}-hint`} className="text-[11px] text-muted-foreground tabular-nums">
          {mode === "kartu"
            ? `Dibaca sebagai No. kartu · ${q.length}/${PANJANG_KARTU} digit`
            : mode === "rujukan"
              ? "Dibaca sebagai No. rujukan"
              : "FKTP dan FKRTL dicari sekaligus"}
        </p>
        {err && <PesanGalat id={`${id}-err`}>{err}</PesanGalat>}
      </div>

      <Button type="submit" disabled={busy} className="h-9 w-full rounded-xl text-xs font-semibold">
        {busy ? (
          <>
            <Spinner className="size-3.5" aria-hidden="true" />
            Mencari…
          </>
        ) : (
          <>
            <Search className="size-3.5" aria-hidden="true" />
            Cari rujukan
          </>
        )}
      </Button>

      <p aria-live="polite" className="sr-only">
        {pengumum.teks}
      </p>

      <Collapsible className="rounded-xl bg-slate-100/70">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="group h-auto w-full justify-start gap-1.5 rounded-xl px-3 py-2 text-xs font-normal text-muted-foreground hover:bg-transparent hover:text-foreground"
          >
            <FlaskConical className="size-3.5" aria-hidden="true" />
            <span className="flex-1 text-left">Data uji (mock)</span>
            <ChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden="true" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="flex flex-col gap-1 px-2 pb-2">
            {SAMPLE_CARI.map((s) => (
              <li key={s.value}>
                <Item
                  asChild
                  size="sm"
                  className="w-full flex-col flex-nowrap items-start gap-0 rounded-lg bg-white px-2.5 py-1.5 text-left shadow-xs hover:bg-emerald-50"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onChange(s.value);
                      setTouched(false);
                      pengumum.bersihkan();
                      if (!busy) onSubmit(s.value);
                    }}
                  >
                    <span className="flex w-full items-baseline justify-between gap-2">
                      <span className="text-xs text-foreground">{s.label}</span>
                      <span className="text-[11px] text-muted-foreground">{s.hint}</span>
                    </span>
                    <span className="w-full truncate text-[11px] text-muted-foreground tabular-nums">{s.value}</span>
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
