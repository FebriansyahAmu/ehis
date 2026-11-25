"use client";

// Potongan UI tab Monitoring: tombol "Histori" (membuka tab Histori pelayanan untuk peserta itu).
// Potongan daftar generik (kepala kartu, ubin angka, keadaan kosong, kerangka, unduh CSV,
// pengumuman aksi) kini bersama di bpjs/shared/daftarUi — diekspor ulang.
// Komponen shadcn: Button.

import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BukaHistori } from "./monitoringShared";

export {
  KepalaKartu,
  KerangkaDaftar,
  KosongData,
  PilihanUji,
  SaringKosong,
  TombolUnduh,
  UbinAngka,
  useStatusAksi,
} from "@/components/bpjs/shared/daftarUi";

export function TombolHistori({ kartu, acuan, nama, onHistori }: { kartu: string; acuan: string; nama: string; onHistori?: BukaHistori }) {
  if (!onHistori) return null;
  return (
    <Button variant="ghost" size="xs" onClick={() => onHistori(kartu, acuan)} className="text-emerald-700 hover:text-emerald-800">
      <History aria-hidden="true" />
      Histori<span className="sr-only"> pelayanan {nama}</span>
    </Button>
  );
}
