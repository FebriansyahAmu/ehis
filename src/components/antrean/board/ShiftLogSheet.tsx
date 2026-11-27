"use client";

// ANT2.1 — Riwayat shift loket (jejak audit aksi petugas: buka/tutup, panggil, respon, batal).
// Dulu popup absolut yang menutupi tabel; kini Sheet shadcn dengan saring jenis aksi + jumlah,
// dikelompokkan per jam, terbaru di atas. Data dari loketStore (maks 200 entri per sesi).
// Komponen shadcn: Sheet · Button · Badge · Empty.

import { useState } from "react";
import { History } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { KosongData } from "@/components/bpjs/shared/daftarUi";
import { BadgeNada, SegmenFilter, type OpsiSegmen } from "@/components/bpjs/shared/vclaimUi";
import type { BadgeTone } from "@/components/bpjs/shared/badge";
import { loketLabel } from "@/lib/antrean/posStore";
import type { ShiftAction, ShiftLogEntry } from "@/lib/antrean/loketStore";

type Saring = "semua" | "panggil" | "respon" | "batal" | "loket";

const AKSI: Record<ShiftAction, { label: string; tone: BadgeTone; grup: Exclude<Saring, "semua"> }> = {
  buka: { label: "Buka loket", tone: "emerald", grup: "loket" },
  tutup: { label: "Tutup loket", tone: "slate", grup: "loket" },
  panggil: { label: "Panggil", tone: "blue", grup: "panggil" },
  panggilUlang: { label: "Panggil ulang", tone: "amber", grup: "panggil" },
  respon: { label: "Respon", tone: "teal", grup: "respon" },
  batal: { label: "Batal", tone: "rose", grup: "batal" },
};

function jamDetik(ts: number): string {
  return new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function kunciJam(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}.00`;
}

export default function ShiftLogSheet({ open, onOpenChange, log }: { open: boolean; onOpenChange: (o: boolean) => void; log: ShiftLogEntry[] }) {
  const [saring, setSaring] = useState<Saring>("semua");

  const jumlah = (s: Saring) => (s === "semua" ? log.length : log.filter((e) => AKSI[e.action].grup === s).length);
  const opsi: OpsiSegmen<Saring>[] = (
    [
      { value: "semua", label: "Semua" },
      { value: "panggil", label: "Panggilan" },
      { value: "respon", label: "Respon" },
      { value: "batal", label: "Batal" },
      { value: "loket", label: "Buka/tutup" },
    ] as const
  )
    .map((o) => ({ ...o, jumlah: jumlah(o.value) }))
    .filter((o) => o.value === "semua" || o.jumlah > 0);
  const aktif = opsi.some((o) => o.value === saring) ? saring : "semua";
  const tampil = aktif === "semua" ? log : log.filter((e) => AKSI[e.action].grup === aktif);
  const perJam = Map.groupBy(tampil, (e) => kunciJam(e.ts));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent data-accent="emerald" className="w-full gap-0 overflow-y-auto border-0 p-0 text-foreground sm:max-w-md">
        <SheetHeader className="gap-0.5 p-4 pr-12">
          <SheetTitle className="text-sm">Riwayat shift</SheetTitle>
          <SheetDescription className="text-xs">Jejak aksi petugas di loket selama sesi browser ini, terbaru di atas.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4 pb-4">
          {log.length === 0 ? (
            <KosongData ikon={History} judul="Belum ada aktivitas" deskripsi="Buka loket dan panggil antrean — setiap aksi tercatat di sini." />
          ) : (
            <>
              <SegmenFilter label="Saring jenis aksi" opsi={opsi} value={aktif} onChange={setSaring} />
              <div className="flex flex-col gap-3">
                {[...perJam.entries()].map(([jam, entri]) => (
                  <section key={jam} aria-label={`Pukul ${jam}`} className="flex flex-col gap-1">
                    <h3 className="text-[11px] font-medium text-muted-foreground tabular-nums">Pukul {jam}</h3>
                    <ol className="flex flex-col gap-0.5 rounded-xl bg-slate-50 p-1">
                      {entri.map((e) => (
                        <li key={e.id} className="flex items-start gap-2.5 rounded-lg px-2 py-2">
                          <BadgeNada tone={AKSI[e.action].tone} className="mt-px w-24 shrink-0 justify-start">
                            {AKSI[e.action].label}
                          </BadgeNada>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs wrap-break-word">{e.detail}</p>
                            <p className="text-[11px] text-muted-foreground tabular-nums">
                              <time dateTime={new Date(e.ts).toISOString()}>{jamDetik(e.ts)}</time>
                              {e.pos && e.loket && <> · {loketLabel(e.pos, e.loket)}</>}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>
                ))}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
