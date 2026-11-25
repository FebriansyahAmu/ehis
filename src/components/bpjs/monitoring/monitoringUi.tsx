"use client";

// Potongan UI tab Monitoring: ubin angka ringkasan dan tombol "Histori" (membuka tab Histori
// pelayanan untuk peserta itu). Potongan daftar generik (kepala kartu, keadaan kosong, kerangka,
// unduh CSV, pengumuman aksi) kini bersama di bpjs/shared/daftarUi — diekspor ulang.
// Komponen shadcn: Button.

import type { ReactNode } from "react";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/utils";
import type { BukaHistori } from "./monitoringShared";

export {
  KepalaKartu,
  KerangkaDaftar,
  KosongData,
  PilihanUji,
  SaringKosong,
  TombolUnduh,
  useStatusAksi,
} from "@/components/bpjs/shared/daftarUi";

const NADA_NILAI = {
  emerald: "text-emerald-800",
  amber: "text-amber-800",
  rose: "text-rose-800",
} as const;

/** Satu pasangan label–nilai ringkasan; dipakai di dalam <dl>. */
export function UbinAngka({
  label,
  nilai,
  ket,
  nada,
  children,
  className,
}: {
  label: string;
  nilai: ReactNode;
  ket?: ReactNode;
  nada?: keyof typeof NADA_NILAI;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5 rounded-xl bg-slate-50 px-3 py-2.5", className)}>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className={cn("text-sm font-semibold wrap-break-word tabular-nums", nada && NADA_NILAI[nada])}>{nilai}</dd>
      {ket && <dd className="text-[11px] text-muted-foreground tabular-nums">{ket}</dd>}
      {children && <dd className="mt-1">{children}</dd>}
    </div>
  );
}

export function TombolHistori({ kartu, acuan, nama, onHistori }: { kartu: string; acuan: string; nama: string; onHistori?: BukaHistori }) {
  if (!onHistori) return null;
  return (
    <Button variant="ghost" size="xs" onClick={() => onHistori(kartu, acuan)} className="text-emerald-700 hover:text-emerald-800">
      <History aria-hidden="true" />
      Histori<span className="sr-only"> pelayanan {nama}</span>
    </Button>
  );
}
