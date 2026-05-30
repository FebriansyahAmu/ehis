import type { Metadata } from "next";
import { ListChecks } from "lucide-react";
import AntrianComingSoon from "@/components/antrean/AntrianComingSoon";

export const metadata: Metadata = { title: "Antrean List — Antrean" };

export default function AntreanListPage() {
  return (
    <AntrianComingSoon
      phase="Phase ANT2"
      title="Antrean List (Board Loket)"
      desc="Tabel antrean petugas admisi + Respon Kedatangan. Hasil kiosk APM akan tampil di sini."
      icon={<ListChecks className="h-8 w-8" aria-hidden />}
    />
  );
}
