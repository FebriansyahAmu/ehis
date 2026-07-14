import type { Metadata } from "next";
import KunjunganInvoiceDetail from "@/components/billing/invoice/KunjunganInvoiceDetail";

export const metadata: Metadata = { title: "Rincian Tagihan · EHIS Billing" };

interface RouteParams {
  params: Promise<{ kid: string }>;
}

export default async function Page({ params }: RouteParams) {
  const { kid } = await params;
  return <KunjunganInvoiceDetail kunjunganId={kid} />;
}
