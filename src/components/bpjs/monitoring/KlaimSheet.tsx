"use client";

// Detail satu klaim (data sudah dimuat di tab Klaim, tanpa panggilan baru) di Sheet shadcn dari
// kanan: status + artinya, peserta, masa rawat, INA-CBG, rincian biaya (pengajuan · tarif INA-CBG
// · tarif RS · top-up · disetujui · selisih) dengan bilah persetujuan, dan No. FPK yang bisa
// disalin. Aksi "Lihat histori pelayanan" membuka tab Histori — fokus kembali tidak diarahkan ke
// baris asal (sudah tersembunyi) karena tab Histori memindahkan fokus ke hasilnya sendiri.
// Komponen shadcn: Sheet · Badge · Button.

import { useRef, useState, type ReactNode } from "react";
import { ArrowRight, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CopyButton } from "@/components/bpjs/shared/CopyButton";
import { fmtTglPendek } from "@/components/bpjs/shared/tanggal";
import { BadgeNada, Meter } from "@/components/bpjs/shared/vclaimUi";
import { cn } from "@/lib/ui/utils";
import type { KlaimMonitoringItem } from "@/lib/bpjs/bpjsShared";
import { angka, lamaRawat, persen, rupiah, type BukaHistori, type StatusKlaim } from "./monitoringShared";

export type BarisKlaim = KlaimMonitoringItem & { st: StatusKlaim };

const KOTAK_STATUS: Record<string, string> = {
  blue: "bg-blue-50 text-blue-950",
  amber: "bg-amber-50 text-amber-950",
  emerald: "bg-emerald-50 text-emerald-950",
  slate: "bg-slate-50 text-slate-900",
};

function Baris({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 text-xs">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium">{children}</dd>
    </div>
  );
}

function BarisBiaya({ label, nilai, kuat = false, className }: { label: string; nilai: string; kuat?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3 text-xs", className)}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("tabular-nums", kuat ? "font-semibold" : "font-medium")}>{nilai}</dd>
    </div>
  );
}

function Isi({ k }: { k: BarisKlaim }) {
  const b = k.biaya;
  const aju = angka(b.byPengajuan);
  const setuju = angka(b.bySetujui);
  const topup = angka(b.byTopup);
  const pct = persen(setuju, aju);
  const layak = k.st.kode === "3";
  const lama = lamaRawat(k.tglSep, k.tglPulang);

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <div className="flex flex-wrap gap-1.5">
        <BadgeNada tone={k.st.tone} titik>
          {k.st.label}
        </BadgeNada>
        <BadgeNada tone="slate">Kelas {k.kelasRawat}</BadgeNada>
        {k.poli && <BadgeNada tone="slate">{k.poli}</BadgeNada>}
      </div>

      {k.st.ket && <p className={cn("rounded-xl px-3 py-2.5 text-xs/relaxed", KOTAK_STATUS[k.st.tone] ?? KOTAK_STATUS.slate)}>{k.st.ket}</p>}

      <dl className="flex flex-col gap-3">
        <Baris label="Peserta">
          {k.peserta.nama}
          <span className="block text-[11px] font-normal text-muted-foreground tabular-nums">
            Kartu {k.peserta.noKartu}
            {k.peserta.noMR && <> · RM {k.peserta.noMR}</>}
          </span>
        </Baris>
        <Baris label="Masa rawat">
          <span className="inline-flex flex-wrap items-center gap-1 tabular-nums">
            {fmtTglPendek(k.tglSep)}
            <ArrowRight className="size-3 text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">sampai</span>
            {fmtTglPendek(k.tglPulang)}
            {lama !== null && <span className="font-normal text-muted-foreground">· {lama} hari</span>}
          </span>
        </Baris>
        <Baris label="No. FPK">
          {k.noFPK ? (
            <span className="inline-flex items-center gap-1">
              <span className="tabular-nums">{k.noFPK}</span>
              <CopyButton value={k.noFPK} label={`nomor FPK ${k.noFPK}`} />
            </span>
          ) : (
            <span className="font-normal text-muted-foreground">Belum terbit</span>
          )}
        </Baris>
      </dl>

      <div className="rounded-xl bg-slate-50 p-3">
        <p className="text-[11px] text-muted-foreground">Grup INA-CBG</p>
        <p className="text-xs font-semibold tabular-nums">{k.Inacbg.kode}</p>
        <p className="text-xs/relaxed">{k.Inacbg.nama}</p>
      </div>

      <section aria-label="Rincian biaya" className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold">Rincian biaya</h3>
        <dl className="flex flex-col gap-1.5">
          <BarisBiaya label="Pengajuan RS" nilai={rupiah(aju)} kuat />
          <BarisBiaya label="Tarif INA-CBG" nilai={rupiah(b.byTarifGruper)} />
          <BarisBiaya label="Tarif RS" nilai={rupiah(b.byTarifRS)} />
          {topup > 0 && <BarisBiaya label="Top-up" nilai={`+${rupiah(topup)}`} />}
          <BarisBiaya
            label="Disetujui BPJS"
            nilai={layak ? rupiah(setuju) : "Menunggu verifikasi"}
            kuat
            className={cn("mt-1 rounded-lg px-2 py-1.5", layak ? "bg-emerald-50 text-emerald-900" : "bg-slate-50")}
          />
          {layak && aju - setuju > 0 && <BarisBiaya label="Selisih" nilai={rupiah(aju - setuju)} className="px-2" />}
        </dl>
        {layak && pct !== null && (
          <div className="flex flex-col gap-1 px-2">
            <Meter value={Math.min(setuju, aju)} max={Math.max(aju, 1)} tone={pct >= 90 ? "emerald" : pct >= 75 ? "amber" : "rose"} label={`Disetujui ${pct} persen dari pengajuan`} />
            <p className="text-[11px] text-muted-foreground tabular-nums">{pct}% dari pengajuan disetujui</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default function KlaimSheet({ klaim, onClose, onHistori }: { klaim: BarisKlaim | null; onClose: () => void; onHistori?: BukaHistori }) {
  // Klaim terakhir tetap tampil selama animasi tutup (props sudah null) — pola adjust-on-render.
  const [tampil, setTampil] = useState(klaim);
  if (klaim !== null && klaim !== tampil) setTampil(klaim);
  const keHistori = useRef(false);

  return (
    <Sheet open={klaim !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        data-accent="emerald"
        className="w-full gap-0 overflow-y-auto border-0 p-0 text-foreground sm:max-w-md"
        onOpenAutoFocus={() => {
          keHistori.current = false;
        }}
        onCloseAutoFocus={(e) => {
          if (keHistori.current) e.preventDefault();
        }}
      >
        <SheetHeader className="gap-0.5 p-4 pr-12">
          <SheetDescription className="text-[11px]">Detail klaim</SheetDescription>
          <div className="flex min-w-0 items-center gap-1">
            <SheetTitle className="truncate text-sm tracking-wide tabular-nums">{tampil?.noSEP}</SheetTitle>
            {tampil && <CopyButton value={tampil.noSEP} label={`nomor SEP ${tampil.noSEP}`} />}
          </div>
        </SheetHeader>
        {tampil && <Isi key={tampil.noSEP} k={tampil} />}
        {tampil && onHistori && (
          <SheetFooter className="mt-auto p-4 pt-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                keHistori.current = true;
                onClose();
                onHistori(tampil.peserta.noKartu, tampil.tglSep);
              }}
              className="text-xs"
            >
              <History aria-hidden="true" />
              Lihat histori pelayanan peserta
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
