"use client";

// Form cek kecelakaan peserta untuk tab Suplesi Jasa Raharja. SATU pencarian (No. kartu +
// tanggal pelayanan) menjalankan dua cek V-Claim sekaligus — dulu dua form terpisah yang
// meminta nomor kartu diketik dua kali. Nilai dipegang halaman (data uji bisa mengisi ulang).
// Form = landmark pencarian (role="search") bernama dari judul kartu. Galat tampil setelah
// interaksi; submit gagal → fokus ke kolom pertama yang salah. Tanggal = lokal, bukan UTC.
// Komponen shadcn: Label · Input · Button · Spinner · Collapsible · Item.

import { useId, useState, type FormEvent, type RefObject } from "react";
import { Check, ChevronDown, FlaskConical, Info, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Item } from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { DatePicker } from "@/components/shared/inputs";
import { useUmumkanGalat } from "@/components/bpjs/shared/useUmumkanGalat";
import { cn } from "@/lib/ui/utils";
import { INPUT_ISI, PesanGalat } from "./tglPulangUi";
import { PANJANG_KARTU, SAMPLE_KARTU, validasiKartu, validasiTglPelayanan } from "./suplesiShared";

export default function SuplesiJasaRaharjaForm({
  judulId,
  kartu,
  tgl,
  onKartu,
  onTgl,
  onSubmit,
  busy,
  inputRef,
}: {
  /** id judul kartu pembungkus → nama aksesibel form. */
  judulId: string;
  kartu: string;
  tgl: string;
  onKartu: (v: string) => void;
  onTgl: (v: string) => void;
  onSubmit: (kartu: string, tgl: string) => void;
  busy: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const id = useId();
  const pengumum = useUmumkanGalat();
  const [touched, setTouched] = useState<{ kartu?: boolean; tgl?: boolean }>({});
  const errKartu = touched.kartu ? validasiKartu(kartu) : null;
  const errTgl = touched.tgl ? validasiTglPelayanan(tgl) : null;
  const lengkap = kartu.length === PANJANG_KARTU;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ kartu: true, tgl: true });
    if (validasiKartu(kartu)) {
      pengumum.tandaiDibacakan("kartu");
      inputRef.current?.focus();
      return;
    }
    if (validasiTglPelayanan(tgl)) {
      pengumum.tandaiDibacakan("tgl");
      document.getElementById(`${id}-tgl`)?.focus();
      return;
    }
    if (!busy) onSubmit(kartu, tgl);
  }

  return (
    <form onSubmit={handleSubmit} noValidate role="search" aria-labelledby={judulId} className="flex flex-col gap-4">
      <p className="flex items-start gap-2 rounded-xl bg-amber-50/80 p-3 text-xs/relaxed text-amber-950">
        <Info className="mt-0.5 size-3.5 shrink-0 text-amber-700" aria-hidden="true" />
        <span>
          Jasa Raharja menjamin biaya perawatan kecelakaan lalu lintas sampai <strong className="font-semibold">Rp 20 juta</strong>.
          Sisanya dijamin BPJS lewat <strong className="font-semibold">SEP suplesi</strong> yang merujuk SEP kecelakaan awal.
        </span>
      </p>

      {/* No. kartu */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor={`${id}-kartu`} className="text-xs">
            Nomor kartu BPJS
          </Label>
          <span
            id={`${id}-kartu-hint`}
            className={cn("text-[11px] tabular-nums transition-colors", lengkap ? "text-emerald-700" : "text-muted-foreground")}
          >
            {kartu.length}/{PANJANG_KARTU} digit
          </span>
        </div>
        <div className="relative">
          <Input
            ref={inputRef}
            id={`${id}-kartu`}
            name="noKartu"
            inputMode="numeric"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={PANJANG_KARTU}
            value={kartu}
            placeholder="13 digit nomor kartu"
            aria-invalid={Boolean(errKartu)}
            aria-describedby={errKartu ? `${id}-kartu-hint ${id}-kartu-err` : `${id}-kartu-hint`}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, PANJANG_KARTU);
              onKartu(v);
              if (!validasiKartu(v)) pengumum.bersihkan("kartu");
            }}
            onBlur={() => {
              if (!kartu) return;
              setTouched((t) => ({ ...t, kartu: true }));
              const g = validasiKartu(kartu);
              if (g) pengumum.umumkan(g, "kartu");
            }}
            className={cn(INPUT_ISI, "pr-9 tracking-wide tabular-nums placeholder:tracking-normal")}
          />
          {lengkap && !errKartu && (
            <Check className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-emerald-600" aria-hidden="true" />
          )}
        </div>
        {errKartu && <PesanGalat id={`${id}-kartu-err`}>{errKartu}</PesanGalat>}
      </div>

      {/* Tanggal pelayanan */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-tgl`} className="text-xs">
          Tanggal pelayanan
        </Label>
        <p id={`${id}-tgl-hint`} className="text-[11px] text-muted-foreground">
          Tanggal SEP yang akan diterbitkan
        </p>
        <DatePicker
          id={`${id}-tgl`}
          value={tgl}
          onChange={(v) => {
            onTgl(v);
            setTouched((t) => ({ ...t, tgl: true }));
            const g = validasiTglPelayanan(v);
            if (g) pengumum.umumkan(g, "tgl");
            else pengumum.bersihkan("tgl");
          }}
          variant="filled"
          clearable={false}
          invalid={Boolean(errTgl)}
          ariaDescribedBy={errTgl ? `${id}-tgl-hint ${id}-tgl-err` : `${id}-tgl-hint`}
        />
        {errTgl && <PesanGalat id={`${id}-tgl-err`}>{errTgl}</PesanGalat>}
      </div>

      <Button type="submit" disabled={busy} className="h-9 w-full rounded-xl text-xs font-semibold">
        {busy ? (
          <>
            <Spinner className="size-3.5" aria-hidden="true" />
            Memeriksa…
          </>
        ) : (
          <>
            <Search className="size-3.5" aria-hidden="true" />
            Periksa kecelakaan
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
            {SAMPLE_KARTU.map((s) => (
              <li key={s.value}>
                <Item
                  asChild
                  size="sm"
                  className="w-full flex-nowrap justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5 text-left shadow-xs hover:bg-emerald-50"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onKartu(s.value);
                      setTouched({});
                      pengumum.bersihkan("kartu");
                      if (!busy && !validasiTglPelayanan(tgl)) onSubmit(s.value, tgl);
                    }}
                  >
                    <span className="text-xs text-foreground">{s.label}</span>
                    <span className="truncate text-[11px] text-muted-foreground tabular-nums">{s.value}</span>
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
