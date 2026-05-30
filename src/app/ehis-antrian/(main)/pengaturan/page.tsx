import type { Metadata } from "next";
import { SlidersHorizontal } from "lucide-react";
import AntrianComingSoon from "@/components/antrean/AntrianComingSoon";

export const metadata: Metadata = { title: "Pengaturan — Antrean" };

export default function PengaturanPage() {
  return (
    <AntrianComingSoon
      phase="Phase ANT3"
      title="Pengaturan Antrian"
      desc="Mapping pos antrian → loket → poli, CRUD pos/loket, hak akses, dan jadwal dokter."
      icon={<SlidersHorizontal className="h-8 w-8" aria-hidden />}
    />
  );
}
