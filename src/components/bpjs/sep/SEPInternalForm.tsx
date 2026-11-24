"use client";

// Form cari SEP internal (nilai dipegang tab agar daftar SEP bisa mengisinya). Landmark pencarian
// (role="search") bernama dari judul kartu. Galat tampil setelah interaksi; submit gagal → fokus
// ke kolom. Komponen shadcn: Label · Input · Button · Spinner.

import { useId, useState, type FormEvent, type RefObject } from "react";
import { Info, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useUmumkanGalat } from "@/components/bpjs/shared/useUmumkanGalat";
import { cn } from "@/lib/ui/utils";
import { validateNoSEP } from "./sepShared";
import { INPUT_ISI, PesanGalat } from "./tglPulangUi";

export default function SEPInternalForm({
  judulId,
  value,
  onChange,
  onSubmit,
  busy,
  inputRef,
}: {
  judulId: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: (noSEP: string) => void;
  busy: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const id = useId();
  const pengumum = useUmumkanGalat();
  const [touched, setTouched] = useState(false);
  const err = touched ? validateNoSEP(value) : null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (validateNoSEP(value)) {
      pengumum.tandaiDibacakan();
      inputRef.current?.focus();
      return;
    }
    if (!busy) onSubmit(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} noValidate role="search" aria-labelledby={judulId} className="flex flex-col gap-4">
      <p className="flex items-start gap-2 rounded-xl bg-teal-50/80 p-3 text-xs/relaxed text-teal-950">
        <Info className="mt-0.5 size-3.5 shrink-0 text-teal-700" aria-hidden="true" />
        <span>
          SEP internal mencatat <strong className="font-semibold">rujukan ke poli lain di RS ini</strong> atas satu SEP.
          Hapus hanya bila rujukannya dibatalkan.
        </span>
      </p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-no`} className="text-xs">
          Nomor SEP
        </Label>
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            id={`${id}-no`}
            name="noSep"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            value={value}
            placeholder="Mis. SEP-2026-0501-00012"
            aria-invalid={Boolean(err)}
            aria-describedby={err ? `${id}-err` : undefined}
            onChange={(e) => {
              onChange(e.target.value);
              if (!validateNoSEP(e.target.value)) pengumum.bersihkan();
            }}
            onBlur={() => {
              if (!value) return;
              setTouched(true);
              const g = validateNoSEP(value);
              if (g) pengumum.umumkan(g);
            }}
            className={cn(INPUT_ISI, "flex-1 tracking-wide tabular-nums placeholder:tracking-normal")}
          />
          <Button type="submit" disabled={busy} className="h-10 rounded-xl px-3 text-xs font-semibold">
            {busy ? <Spinner className="size-3.5" aria-hidden="true" /> : <Search className="size-3.5" aria-hidden="true" />}
            Periksa
          </Button>
        </div>
        {err && <PesanGalat id={`${id}-err`}>{err}</PesanGalat>}
        <p aria-live="polite" className="sr-only">
          {pengumum.teks}
        </p>
      </div>
    </form>
  );
}
