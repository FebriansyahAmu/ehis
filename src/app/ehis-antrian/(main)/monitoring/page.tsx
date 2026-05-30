import type { Metadata } from "next";
import { Activity } from "lucide-react";
import AntrianComingSoon from "@/components/antrean/AntrianComingSoon";

export const metadata: Metadata = { title: "Monitoring — Antrean" };

export default function MonitoringPage() {
  return (
    <AntrianComingSoon
      phase="Phase ANT5"
      title="Monitoring Status Antrean"
      desc="Timeline TaskID 1–7/99 per kodebooking, status pengiriman ke BPJS, koreksi & re-send."
      icon={<Activity className="h-8 w-8" aria-hidden />}
    />
  );
}
