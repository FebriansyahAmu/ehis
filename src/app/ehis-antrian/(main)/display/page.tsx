import type { Metadata } from "next";
import { MonitorPlay } from "lucide-react";
import AntrianComingSoon from "@/components/antrean/AntrianComingSoon";

export const metadata: Metadata = { title: "Display — Antrean" };

export default function DisplayPage() {
  return (
    <AntrianComingSoon
      phase="Phase ANT7"
      title="Display Antrean"
      desc="Layar ruang tunggu: nomor yang sedang dipanggil per loket/poli + animasi & TTS opsional."
      icon={<MonitorPlay className="h-8 w-8" aria-hidden />}
    />
  );
}
