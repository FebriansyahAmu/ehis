"use client";

// Form histori pelayanan peserta: No. kartu (13 digit — karakter selain angka dibuang, jadi tempel
// "0001 2345 67891" tetap jalan) + periode paling lama 90 hari (pintasan 30/60/90 hari terakhir
// atau dua DatePicker). Form = landmark pencarian. Galat tampil setelah interaksi (blur / memilih
// tanggal) dan diumumkan lewat satu live region; submit gagal → fokus ke field pertama yang salah.
// Komponen shadcn: Label · Input · Button · Spinner · Collapsible · Item.

import { useId, useState, type FormEvent, type RefObject } from "react";
import { ChevronDown, CreditCard, FlaskConical, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Item } from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { DatePicker } from "@/components/shared/inputs";
import { INPUT_ISI, PesanGalat } from "@/components/bpjs/shared/formUi";
import { hariIniISO, selisihHari } from "@/components/bpjs/shared/tanggal";
import { useUmumkanGalat } from "@/components/bpjs/shared/useUmumkanGalat";
import { SegmenFilter } from "@/components/bpjs/shared/vclaimUi";
import { cn } from "@/lib/ui/utils";
import {
  MAKS_HARI,
  PANJANG_KARTU,
  PERIODE_UJI_HISTORI,
  PRESET_HARI,
  UJI_HISTORI,
  periodeMundur,
  validasiKartu,
  validasiPeriode,
} from "./monitoringShared";

export interface PeriodeHistori {
  mulai: string;
  akhir: string;
}

type Preset = "30" | "60" | "90" | "kustom";

export default function HistoriForm({
  judulId,
  kartu,
  onKartu,
  periode,
  onPeriode,
  onSubmit,
  busy,
  inputRef,
}: {
  /** id judul kartu pembungkus → nama aksesibel form. */
  judulId: string;
  kartu: string;
  onKartu: (v: string) => void;
  periode: PeriodeHistori;
  onPeriode: (p: PeriodeHistori) => void;
  onSubmit: (kartu: string, periode: PeriodeHistori) => void;
  busy: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const id = useId();
  const hariIni = hariIniISO();
  const pengumum = useUmumkanGalat();
  const [sentuhKartu, setSentuhKartu] = useState(false);
  const [sentuhPeriode, setSentuhPeriode] = useState(false);

  const galatKartu = sentuhKartu ? validasiKartu(kartu) : null;
  const galatPeriode = sentuhPeriode ? validasiPeriode(periode.mulai, periode.akhir, hariIni) : null;
  const rentang = selisihHari(periode.mulai, periode.akhir);
  const cocokPreset = PRESET_HARI.find((n) => {
    const p = periodeMundur(hariIni, n);
    return p.mulai === periode.mulai && p.akhir === periode.akhir;
  });
  const preset: Preset = cocokPreset ? (String(cocokPreset) as Preset) : "kustom";

  function gantiPeriode(p: PeriodeHistori) {
    onPeriode(p);
    setSentuhPeriode(true);
    const g = validasiPeriode(p.mulai, p.akhir, hariIni);
    if (g) pengumum.umumkan(g, "periode");
    else pengumum.bersihkan("periode");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSentuhKartu(true);
    setSentuhPeriode(true);
    const gK = validasiKartu(kartu);
    const gP = validasiPeriode(periode.mulai, periode.akhir, hariIni);
    if (gK) {
      pengumum.tandaiDibacakan("kartu");
      inputRef.current?.focus();
      return;
    }
    if (gP) {
      pengumum.tandaiDibacakan("periode");
      document.getElementById(`${id}-mulai`)?.focus();
      return;
    }
    if (!busy) onSubmit(kartu, periode);
  }

  return (
    <form onSubmit={handleSubmit} noValidate role="search" aria-labelledby={judulId} className="flex flex-col gap-4">
      {/* No. kartu */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-kartu`} className="text-xs">
          No. kartu BPJS
        </Label>
        <div className="relative">
          <Input
            ref={inputRef}
            id={`${id}-kartu`}
            name="kartu"
            inputMode="numeric"
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            maxLength={PANJANG_KARTU}
            value={kartu}
            placeholder="13 digit, mis. 0001234567891"
            aria-invalid={Boolean(galatKartu)}
            aria-describedby={galatKartu ? `${id}-kartu-hint ${id}-kartu-err` : `${id}-kartu-hint`}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, PANJANG_KARTU);
              onKartu(v);
              if (!validasiKartu(v)) pengumum.bersihkan("kartu");
            }}
            onBlur={() => {
              if (!kartu) return;
              setSentuhKartu(true);
              const g = validasiKartu(kartu);
              if (g) pengumum.umumkan(g, "kartu");
            }}
            className={cn(INPUT_ISI, "pl-9 tracking-wide tabular-nums placeholder:tracking-normal")}
          />
          <CreditCard className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        </div>
        <p id={`${id}-kartu-hint`} className="text-[11px] text-muted-foreground tabular-nums">
          {kartu.length}/{PANJANG_KARTU} digit
        </p>
        {galatKartu && <PesanGalat id={`${id}-kartu-err`}>{galatKartu}</PesanGalat>}
      </div>

      {/* Periode */}
      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className="mb-1.5 text-xs font-medium">Periode pelayanan</legend>
        <SegmenFilter
          label="Pintasan periode, sampai hari ini"
          opsi={PRESET_HARI.map((n) => ({ value: String(n) as Preset, label: `${n} hari` }))}
          value={preset}
          onChange={(v) => gantiPeriode(periodeMundur(hariIni, Number(v)))}
          className="w-full [&>button]:flex-1"
        />
        {/* Bertumpuk di kolom form sempit (lg) agar teks tanggal tidak terpotong. */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          <div className="flex min-w-0 flex-col gap-1">
            <Label htmlFor={`${id}-mulai`} className="text-[11px] font-normal text-muted-foreground">
              Dari
            </Label>
            <DatePicker
              id={`${id}-mulai`}
              value={periode.mulai}
              onChange={(v) => gantiPeriode({ ...periode, mulai: v })}
              variant="filled"
              clearable={false}
              invalid={Boolean(galatPeriode)}
              ariaDescribedBy={galatPeriode ? `${id}-periode-hint ${id}-periode-err` : `${id}-periode-hint`}
              className="text-xs! tabular-nums"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <Label htmlFor={`${id}-akhir`} className="text-[11px] font-normal text-muted-foreground">
              Sampai
            </Label>
            <DatePicker
              id={`${id}-akhir`}
              value={periode.akhir}
              onChange={(v) => gantiPeriode({ ...periode, akhir: v })}
              variant="filled"
              clearable={false}
              invalid={Boolean(galatPeriode)}
              ariaDescribedBy={galatPeriode ? `${id}-periode-hint ${id}-periode-err` : `${id}-periode-hint`}
              className="text-xs! tabular-nums"
            />
          </div>
        </div>
        <p id={`${id}-periode-hint`} className="text-[11px] text-muted-foreground tabular-nums">
          Paling lama {MAKS_HARI} hari{rentang !== null && rentang >= 0 ? ` · ${rentang} hari dipilih` : ""}
        </p>
        {galatPeriode && <PesanGalat id={`${id}-periode-err`}>{galatPeriode}</PesanGalat>}
      </fieldset>

      <Button type="submit" size="sm" disabled={busy} className="w-full rounded-xl text-xs font-semibold">
        {busy ? (
          <>
            <Spinner className="size-3.5" aria-hidden="true" />
            Memuat histori…
          </>
        ) : (
          <>
            <History className="size-3.5" aria-hidden="true" />
            Tampilkan histori
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
            <span className="flex-1 text-left">Data uji (mock) · Apr–Mei 2026</span>
            <ChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden="true" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="flex flex-col gap-1 px-2 pb-2">
            {UJI_HISTORI.map((u) => (
              <li key={u.kartu}>
                <Item
                  asChild
                  size="sm"
                  className="w-full flex-col flex-nowrap items-start gap-0 rounded-lg bg-white px-2.5 py-1.5 text-left shadow-xs hover:bg-emerald-50"
                >
                  <button
                    type="button"
                    onClick={() => {
                      const p = { ...PERIODE_UJI_HISTORI };
                      onKartu(u.kartu);
                      onPeriode(p);
                      setSentuhKartu(false);
                      setSentuhPeriode(false);
                      pengumum.bersihkan("kartu");
                      pengumum.bersihkan("periode");
                      if (!busy) onSubmit(u.kartu, p);
                    }}
                  >
                    <span className="flex w-full items-baseline justify-between gap-2">
                      <span className="text-xs text-foreground">{u.nama}</span>
                      <span className="text-[11px] text-muted-foreground">{u.ket}</span>
                    </span>
                    <span className="w-full truncate text-[11px] text-muted-foreground tabular-nums">{u.kartu}</span>
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
