"use client";

// Potongan UI bersama tab Monitoring: kepala kartu (judul + kontrol), ubin angka ringkasan,
// keadaan kosong, saringan tanpa hasil, kerangka daftar, tombol "Histori" (membuka tab Histori
// pelayanan untuk peserta itu), tombol unduh CSV, dan pengumuman hasil aksi (live region).
// Komponen shadcn: Empty · Button · Skeleton.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Download, History, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/ui/utils";
import type { BukaHistori } from "./monitoringShared";

export function KepalaKartu({ judulId, judul, deskripsi, children }: { judulId: string; judul: string; deskripsi: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4">
      <div className="min-w-0 flex-1 basis-56">
        <h2 id={judulId} className="text-sm font-semibold">
          {judul}
        </h2>
        <p className="text-xs text-muted-foreground">{deskripsi}</p>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

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

export function KosongData({ ikon: Ikon, judul, deskripsi, children }: { ikon: LucideIcon; judul: string; deskripsi: ReactNode; children?: ReactNode }) {
  return (
    <Empty className="gap-3 p-6 md:p-8">
      <EmptyHeader className="gap-1">
        <EmptyMedia variant="icon" className="mb-2 size-10 rounded-xl bg-slate-100 text-slate-500">
          <Ikon className="size-5" aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle className="text-sm font-semibold tracking-normal">{judul}</EmptyTitle>
        <EmptyDescription className="text-xs">{deskripsi}</EmptyDescription>
      </EmptyHeader>
      {children && <EmptyContent className="gap-2">{children}</EmptyContent>}
    </Empty>
  );
}

/** Tombol pilihan data uji dalam keadaan kosong (label tanggal/kartu + keterangan). */
export function PilihanUji({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      <span className="text-[11px] text-muted-foreground">Data uji:</span>
      {children}
    </div>
  );
}

export function SaringKosong({ pesan, onReset }: { pesan: ReactNode; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <p className="text-xs text-muted-foreground">{pesan}</p>
      <Button variant="ghost" size="xs" onClick={onReset}>
        <X aria-hidden="true" />
        Hapus saringan
      </Button>
    </div>
  );
}

export function KerangkaDaftar({ baris = 3, tinggi = "h-16" }: { baris?: number; tinggi?: string }) {
  return (
    <div className="flex flex-col gap-1.5 px-1" aria-hidden="true">
      {Array.from({ length: baris }, (_, i) => (
        <Skeleton key={i} className={cn("rounded-xl", tinggi)} />
      ))}
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

export function TombolUnduh({ onClick, jumlah }: { onClick: () => void; jumlah: number }) {
  return (
    <Button
      variant="secondary"
      size="xs"
      onClick={() => {
        if (jumlah > 0) onClick();
      }}
      aria-disabled={jumlah === 0}
      className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
    >
      <Download aria-hidden="true" />
      Unduh CSV
    </Button>
  );
}

/**
 * Pengumuman hasil aksi tanpa perubahan tampilan (mis. unduh CSV) lewat live region. Dikosongkan
 * dulu lalu diisi sesaat kemudian agar pesan yang sama tetap dibacakan bila aksi diulang.
 */
export function useStatusAksi() {
  const [teks, setTeks] = useState("");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const umumkan = useCallback((pesan: string) => {
    window.clearTimeout(timer.current);
    setTeks("");
    timer.current = window.setTimeout(() => setTeks(pesan), 120);
  }, []);
  return { teks, umumkan };
}
