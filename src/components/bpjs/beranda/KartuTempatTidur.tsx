"use client";

// Kartu "Tempat tidur di Aplicares" Beranda BPJS: angka yang TERAKHIR DILAPORKAN RS ke BPJS (GET
// /bed/read) — tersedia dari kapasitas, keterisian (bilah), dan berapa ruangan yang laporannya
// terkini (≤ 15 menit) — lalu rincian per kelas BPJS. Galat Aplicares tampil dengan "Coba lagi".
// Komponen shadcn: Card · Button · Skeleton · Alert (lewat GalatVClaim) · Empty (lewat KosongData).

import { useId } from "react";
import Link from "next/link";
import { ArrowUpRight, Bed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KepalaKartu, KosongData, UbinAngka } from "@/components/bpjs/shared/daftarUi";
import { GalatVClaim, KARTU, Meter } from "@/components/bpjs/shared/vclaimUi";
import { nadaKeterisian } from "@/components/bpjs/aplicares/aplicaresShared";
import { BATAS_TERKINI_MENIT } from "@/components/bpjs/aplicares/ketersediaanShared";
import type { BPJSError } from "@/lib/bpjs/bpjsShared";
import { HREF_KETERSEDIAAN, type RingkasKamar } from "./berandaShared";

function persen(n: number, dari: number): number {
  return dari > 0 ? Math.round((n / dari) * 100) : 0;
}

function Kerangka() {
  return (
    <div className="flex flex-col gap-3 px-4" aria-hidden="true">
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-17 rounded-xl" />
        ))}
      </div>
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-8 rounded-lg" />
      ))}
    </div>
  );
}

export default function KartuTempatTidur({
  siap,
  memuat,
  kamar,
  error,
  onUlang,
}: {
  siap: boolean;
  memuat: boolean;
  kamar: RingkasKamar | null;
  error: BPJSError | null;
  onUlang: () => void;
}) {
  const id = useId();
  const pctTerisi = kamar ? persen(kamar.terisi, kamar.kapasitas) : 0;

  return (
    <Card className={KARTU}>
      <section className="flex flex-col gap-3 py-4">
        <KepalaKartu
          judulId={`${id}-judul`}
          judul="Tempat tidur di Aplicares"
          deskripsi={kamar ? `Yang terakhir dilaporkan RS ke BPJS · ${kamar.ruang} ruang rawat` : "Yang terakhir dilaporkan RS ke BPJS"}
        />

        {!siap || (memuat && !kamar) ? (
          <Kerangka />
        ) : error ? (
          <div className="px-4">
            <GalatVClaim error={error} layanan="Aplicares" onUlang={onUlang} />
          </div>
        ) : !kamar || kamar.ruang === 0 ? (
          <KosongData ikon={Bed} judul="Belum ada ruang rawat yang dilaporkan" deskripsi="Daftarkan ruang rawat di halaman Ketersediaan kamar." />
        ) : (
          <>
            <dl className="grid grid-cols-3 gap-2 px-4">
              <UbinAngka label="Tersedia" nilai={kamar.tersedia} ket={`dari ${kamar.kapasitas} tempat tidur`} nada={kamar.tersedia === 0 ? "rose" : undefined} />
              <UbinAngka label="Keterisian" nilai={`${pctTerisi}%`} ket={`${kamar.terisi} terisi`}>
                <Meter value={kamar.terisi} max={Math.max(kamar.kapasitas, 1)} tone={nadaKeterisian(kamar.terisi, kamar.kapasitas)} label="Keterisian seluruh ruang rawat" />
              </UbinAngka>
              <UbinAngka
                label="Laporan terkini"
                nilai={`${kamar.terkini} dari ${kamar.aktif}`}
                ket={`≤ ${BATAS_TERKINI_MENIT} menit`}
                nada={kamar.terkini < kamar.aktif ? "amber" : "emerald"}
              />
            </dl>

            <div className="flex flex-col gap-1 px-4">
              <h3 className="text-[11px] font-medium text-muted-foreground">Per kelas BPJS</h3>
              <ul className="flex flex-col">
                {kamar.perKelas.map((k) => (
                  <li key={k.kode} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-1.5 text-xs">
                    <span className="min-w-0 truncate font-medium">
                      {k.label}
                      <span className="font-normal text-muted-foreground tabular-nums"> · {k.ruang} ruang</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      <span className="font-semibold text-foreground">{k.tersedia}</span> tersedia dari {k.kapasitas}
                    </span>
                    <Meter
                      value={k.terisi}
                      max={Math.max(k.kapasitas, 1)}
                      tone={nadaKeterisian(k.terisi, k.kapasitas)}
                      label={`Keterisian ${k.label}: ${persen(k.terisi, k.kapasitas)}%`}
                      className="col-span-2"
                    />
                  </li>
                ))}
              </ul>
            </div>

            {(kamar.tutup.length > 0 || kamar.penuh > 0) && (
              <p className="px-4 text-[11px] text-muted-foreground tabular-nums">
                {[kamar.penuh > 0 ? `${kamar.penuh} ruangan penuh` : null, kamar.tutup.length > 0 ? `${kamar.tutup.length} ditutup sementara` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}

            <div className="-mb-1 flex justify-end px-3">
              <Button asChild variant="ghost" size="xs" className="text-emerald-800 hover:text-emerald-900">
                <Link href={HREF_KETERSEDIAAN}>
                  Buka ketersediaan kamar
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </section>
    </Card>
  );
}
