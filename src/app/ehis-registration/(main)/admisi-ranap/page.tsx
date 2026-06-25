import type { Metadata } from "next";
import AdmisiRanapBoard from "@/components/registration/admisi/AdmisiRanapBoard";

export const metadata: Metadata = { title: "Admisi Rawat Inap — Registrasi" };

export default function AdmisiRanapPage() {
  return <AdmisiRanapBoard />;
}
