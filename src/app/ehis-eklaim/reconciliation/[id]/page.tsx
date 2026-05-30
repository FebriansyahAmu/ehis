import type { Metadata } from "next";
import ReconciliationDetailPage from "@/components/eklaim/reconciliation/ReconciliationDetailPage";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "E-Klaim · Detail Rekonsiliasi",
  description: "Laporan rekonsiliasi transfer pembayaran BPJS / Asuransi per batch",
};

export default async function ReconciliationDetailRoute({
  params,
}: RouteParams) {
  const { id } = await params;
  return <ReconciliationDetailPage id={id} />;
}
