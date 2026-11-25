"use client";

// Detail satu kode kelas kamar BPJS (data sudah dimuat halaman Referensi Kamar, tanpa panggilan
// baru) di Sheet shadcn dari kanan: golongan + artinya, kode (bisa disalin), kelas RS yang
// dipetakan ke kode ini (dengan pengali tarif), dan ruangan RS yang dilaporkan ke Aplicares
// dengan keterisian tempat tidur per ruangan. Aksi lanjut: buka Map kelas / Ketersediaan.
// Komponen shadcn: Sheet · Badge · Button.

import { useId, useState } from "react";
import Link from "next/link";
import { BedDouble, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { BadgeTone } from "@/components/bpjs/shared/badge";
import { CopyButton } from "@/components/bpjs/shared/CopyButton";
import { BadgeNada, Meter } from "@/components/bpjs/shared/vclaimUi";
import { cn } from "@/lib/ui/utils";
import type { RefKelasAplicaresItem } from "@/lib/bpjs/bpjsContracts";
import {
  GOLONGAN_KELAS,
  fmtPengali,
  golonganKelas,
  kelasLokalLabel,
  nadaKeterisian,
  namaKelasTampil,
  type PemakaianKelas,
} from "./aplicaresShared";

/** Satu kode kelas referensi + pemakaiannya di RS (null = data RS gagal dimuat). */
export type BarisKelas = RefKelasAplicaresItem & { pakai: PemakaianKelas | null };

const KOTAK_GOLONGAN: Partial<Record<BadgeTone, string>> = {
  emerald: "bg-emerald-50 text-emerald-950",
  indigo: "bg-indigo-50 text-indigo-950",
};

const KOTAK_KOSONG = "rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] text-muted-foreground";

function JudulBagian({ id, judul, jumlah }: { id: string; judul: string; jumlah: number }) {
  return (
    <h3 id={id} className="flex items-baseline justify-between gap-2 text-xs font-semibold">
      {judul}
      <span className="text-[11px] font-normal text-muted-foreground tabular-nums">{jumlah}</span>
    </h3>
  );
}

function Isi({ k }: { k: BarisKelas }) {
  const id = useId();
  const g = GOLONGAN_KELAS[golonganKelas(k.kodekelas)];
  const p = k.pakai;
  return (
    <div className="flex flex-col gap-5 px-4 pb-4">
      <p className={cn("rounded-xl px-3 py-2.5 text-xs/relaxed", KOTAK_GOLONGAN[g.tone] ?? "bg-slate-50 text-slate-900")}>
        <span className="font-semibold">{g.label}.</span> {g.ket}
      </p>

      {p === null ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs/relaxed text-amber-900">
          Data ruangan dan pemetaan kelas RS gagal dimuat, jadi pemakaian kode ini belum bisa ditampilkan.
        </p>
      ) : (
        <>
          <section aria-labelledby={`${id}-lokal`} className="flex flex-col gap-2">
            <JudulBagian id={`${id}-lokal`} judul="Kelas RS yang dipetakan" jumlah={p.lokal.length} />
            {p.lokal.length === 0 ? (
              <p className={KOTAK_KOSONG}>Belum ada kelas RS yang dipetakan ke kode ini.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {p.lokal.map((m) => (
                  <li key={m.kdKelasLokal} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-xs">
                    <span className="font-medium">{kelasLokalLabel(m.kdKelasLokal)}</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      pengali tarif <span className="font-medium text-foreground">{fmtPengali(m.multiplier)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby={`${id}-ruang`} className="flex flex-col gap-2">
            <JudulBagian id={`${id}-ruang`} judul="Ruangan di Aplicares" jumlah={p.ruang.length} />
            {p.ruang.length === 0 ? (
              <p className={KOTAK_KOSONG}>Belum ada ruangan RS yang dilaporkan ke Aplicares dengan kode kelas ini.</p>
            ) : (
              <>
                <div className="flex flex-col gap-1.5 rounded-xl bg-emerald-50/60 px-3 py-2.5">
                  <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs tabular-nums">
                    <span className="font-medium text-emerald-950">{p.tersedia} tempat tidur tersedia</span>
                    <span className="text-[11px] text-emerald-900/80">
                      {p.terisi} dari {p.kapasitas} terisi
                    </span>
                  </p>
                  <Meter
                    value={Math.min(p.terisi, p.kapasitas)}
                    max={Math.max(p.kapasitas, 1)}
                    tone={nadaKeterisian(p.terisi, p.kapasitas)}
                    label={`Keterisian tempat tidur kelas ${k.kodekelas}`}
                  />
                </div>
                <ul className="flex flex-col gap-1">
                  {p.ruang.map((r) => (
                    <li key={r.kodeRuang} className="flex flex-col gap-1.5 rounded-xl bg-slate-50 px-3 py-2.5 text-xs">
                      <span className="flex min-w-0 items-baseline justify-between gap-2">
                        <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                          <span className="truncate font-medium" title={r.namaRuang}>
                            {r.namaRuang}
                          </span>
                          {r.flagMaintenance && (
                            <BadgeNada tone="amber" titik>
                              Ada bed dalam perawatan
                            </BadgeNada>
                          )}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">{r.kodeRuang}</span>
                      </span>
                      <Meter
                        value={Math.min(r.terisi, r.kapasitas)}
                        max={Math.max(r.kapasitas, 1)}
                        tone={nadaKeterisian(r.terisi, r.kapasitas)}
                        label={`Keterisian ${r.namaRuang}`}
                      />
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {r.terisi}/{r.kapasitas} terisi · <span className="font-medium text-emerald-800">{r.tersedia} tersedia</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default function KelasSheet({ kelas, onClose }: { kelas: BarisKelas | null; onClose: () => void }) {
  // Kelas terakhir tetap tampil selama animasi tutup (props sudah null) — pola adjust-on-render.
  const [tampil, setTampil] = useState(kelas);
  if (kelas !== null && kelas !== tampil) setTampil(kelas);
  const g = tampil ? GOLONGAN_KELAS[golonganKelas(tampil.kodekelas)] : null;

  return (
    <Sheet open={kelas !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent data-accent="emerald" className="w-full gap-0 overflow-y-auto border-0 p-0 text-foreground sm:max-w-md">
        <SheetHeader className="gap-0.5 p-4 pr-12">
          <SheetDescription className="text-[11px]">Kelas kamar BPJS</SheetDescription>
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <SheetTitle className="truncate text-sm">{tampil ? namaKelasTampil(tampil.kodekelas, tampil.namakelas) : ""}</SheetTitle>
            {g && (
              <BadgeNada tone={g.tone} titik>
                {g.label}
              </BadgeNada>
            )}
          </div>
          {tampil && (
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
              Kode kelas <span className="font-medium text-foreground">{tampil.kodekelas}</span>
              <CopyButton value={tampil.kodekelas} label={`kode kelas ${tampil.kodekelas}`} />
            </p>
          )}
        </SheetHeader>
        {tampil && <Isi key={tampil.kodekelas} k={tampil} />}
        <SheetFooter className="mt-auto flex-row justify-end gap-2 p-4 pt-0">
          <Button asChild variant="ghost" size="sm" className="text-xs">
            <Link href="/ehis-bpjs/aplicares/map-kelas">
              <Layers aria-hidden="true" />
              Atur pemetaan
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm" className="text-xs">
            <Link href="/ehis-bpjs/aplicares/ketersediaan">
              <BedDouble aria-hidden="true" />
              Lihat ketersediaan
            </Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
