import type { Metadata } from "next";
import { BookMarked } from "lucide-react";
import AntrianComingSoon from "@/components/antrean/AntrianComingSoon";

export const metadata: Metadata = { title: "Referensi — Antrean" };

export default function ReferensiPage() {
  return (
    <AntrianComingSoon
      phase="Phase ANT6"
      title="Referensi HFIS / Mobile JKN"
      desc="Mapping poli RS ↔ poli BPJS, kapasitas/kuota JKN & non-JKN, dan sinkron jadwal dokter HFIS."
      icon={<BookMarked className="h-8 w-8" aria-hidden />}
    />
  );
}
