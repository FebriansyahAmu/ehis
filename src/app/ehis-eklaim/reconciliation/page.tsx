import type { Metadata } from "next";
import ReconciliationPage from "@/components/eklaim/reconciliation/ReconciliationPage";

export const metadata: Metadata = {
  title: "E-Klaim · Rekonsiliasi Transfer",
  description: "Rekonsiliasi transfer pembayaran BPJS & Asuransi ke klaim.",
};

export default function ReconciliationRoute() {
  return <ReconciliationPage />;
}
