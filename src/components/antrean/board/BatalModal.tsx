"use client";

// ANT2.3 — Dialog pembatalan antrean → task 99 ke Antrol BPJS + alasan (tercatat di riwayat shift).
// Jenis: Batal / Tidak hadir (bawaan Tidak hadir bila pasien sudah dipanggil ulang tanpa datang).
// Alasan = pilihan baku (radio, selalu ada yang terpilih) + catatan opsional. Isian bersih tiap kali
// dibuka: induk memasang ulang dialog lewat `key`.
// Komponen shadcn: Dialog · RadioGroup · Label · Textarea · Button.

import { useId, useState, type FormEvent } from "react";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/ui/utils";
import type { AntreanRecord } from "@/lib/antrean/types";

export type BatalMode = "Batal" | "TidakHadir";

const MODE: { value: BatalMode; label: string; ket: string }[] = [
  { value: "Batal", label: "Batal", ket: "Dibatalkan pasien atau petugas" },
  { value: "TidakHadir", label: "Tidak hadir", ket: "Tidak datang saat dipanggil" },
];

const ALASAN_PRESET: Record<BatalMode, string[]> = {
  Batal: ["Pasien membatalkan", "Salah pilih poli/dokter", "Antrean ganda", "Permintaan petugas"],
  TidakHadir: ["Tidak hadir saat dipanggil", "Melebihi batas waktu tunggu", "Pasien pulang"],
};

const MAKS_CATATAN = 200;
const RADIO = "text-rose-600 data-[state=checked]:border-rose-600 [&_svg]:fill-rose-600";

export function BatalModal({
  record,
  open,
  onOpenChange,
  saranTidakHadir = false,
  onConfirm,
}: {
  record: AntreanRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pasien sudah dipanggil ulang tanpa datang → jenis bawaan "Tidak hadir". */
  saranTidakHadir?: boolean;
  onConfirm: (mode: BatalMode, alasan: string) => void;
}) {
  const id = useId();
  const [mode, setMode] = useState<BatalMode>(saranTidakHadir ? "TidakHadir" : "Batal");
  const [alasan, setAlasan] = useState(ALASAN_PRESET[saranTidakHadir ? "TidakHadir" : "Batal"][0]);
  const [catatan, setCatatan] = useState("");

  function gantiMode(m: BatalMode) {
    setMode(m);
    setAlasan(ALASAN_PRESET[m][0]);
  }

  function kirim(e: FormEvent) {
    e.preventDefault();
    const c = catatan.trim();
    onConfirm(mode, c ? `${alasan} — ${c}` : alasan);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-accent="rose" className="gap-0 border-0 p-0 text-foreground sm:max-w-md">
        <form onSubmit={kirim}>
          <DialogHeader className="px-5 pt-5 text-left">
            <div className="flex items-center gap-3 pr-6">
              <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
                <XCircle className="size-4" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-semibold">Batalkan antrean</DialogTitle>
                <DialogDescription className="truncate text-xs tabular-nums">
                  {record.nomorAntrean} · {record.pasien.nama}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-4 px-5 py-4">
            <p className="rounded-xl bg-slate-50 p-3 text-xs/relaxed text-muted-foreground">
              Antrean dikirim sebagai <span className="font-semibold text-foreground">task 99</span> ke Antrol BPJS dan tidak bisa dipanggil lagi.
            </p>

            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1.5 text-[11px] font-medium text-muted-foreground">Jenis pembatalan</legend>
              <RadioGroup value={mode} onValueChange={(v) => gantiMode(v as BatalMode)} className="grid grid-cols-2 gap-2">
                {MODE.map((m) => (
                  <Label
                    key={m.value}
                    htmlFor={`${id}-mode-${m.value}`}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 rounded-xl bg-slate-50 p-3 font-normal transition-colors hover:bg-slate-100",
                      "has-data-[state=checked]:bg-rose-50 has-data-[state=checked]:ring-1 has-data-[state=checked]:ring-rose-200",
                    )}
                  >
                    <RadioGroupItem id={`${id}-mode-${m.value}`} value={m.value} className={cn("mt-0.5 bg-white", RADIO)} />
                    <span className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold">{m.label}</span>
                      <span className="text-[11px] text-muted-foreground">{m.ket}</span>
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            </fieldset>

            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1.5 text-[11px] font-medium text-muted-foreground">Alasan</legend>
              <RadioGroup value={alasan} onValueChange={setAlasan} className="gap-1">
                {ALASAN_PRESET[mode].map((p, i) => (
                  <Label
                    key={p}
                    htmlFor={`${id}-alasan-${i}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-normal hover:bg-slate-50"
                  >
                    <RadioGroupItem id={`${id}-alasan-${i}`} value={p} className={RADIO} />
                    {p}
                  </Label>
                ))}
              </RadioGroup>
            </fieldset>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${id}-catatan`} className="text-[11px] font-medium text-muted-foreground">
                Catatan <span className="font-normal">(opsional)</span>
              </Label>
              <Textarea
                id={`${id}-catatan`}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={2}
                maxLength={MAKS_CATATAN}
                placeholder="Mis. pasien pindah ke jadwal sore"
                aria-describedby={`${id}-bantu`}
                className="min-h-16 resize-none rounded-xl border-0 bg-slate-100 text-xs shadow-none focus-visible:bg-white focus-visible:ring-ring/40 md:text-xs"
              />
              <p id={`${id}-bantu`} className="text-[11px] text-muted-foreground tabular-nums">
                Tercatat di riwayat shift · {catatan.length}/{MAKS_CATATAN}
              </p>
            </div>
          </div>

          <DialogFooter className="px-5 pb-5">
            <Button type="button" size="sm" variant="secondary" className="h-8 text-xs" onClick={() => onOpenChange(false)}>
              Kembali
            </Button>
            <Button type="submit" size="sm" className="h-8 bg-rose-600 text-xs text-white hover:bg-rose-700">
              <XCircle className="size-3.5" aria-hidden="true" />
              Batalkan antrean
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
