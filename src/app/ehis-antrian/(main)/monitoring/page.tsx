import type { Metadata } from "next";
import { MonitoringPage } from "@/components/antrean/monitoring/MonitoringPage";

export const metadata: Metadata = { title: "Monitoring — Antrean" };

export default function Page() {
  return <MonitoringPage />;
}
