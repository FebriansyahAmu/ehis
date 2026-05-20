import type { Metadata } from "next";
import TarifPage from "@/components/master/tarif/TarifPage";

export const metadata: Metadata = { title: "Tarif & Paket Layanan — EHIS Master" };

export default function Page() {
  return <TarifPage />;
}
