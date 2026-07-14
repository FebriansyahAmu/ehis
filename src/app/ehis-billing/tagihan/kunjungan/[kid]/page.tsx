import type { Metadata } from "next";
import KunjunganInvoiceView from "@/components/billing/invoice/KunjunganInvoiceView";

export const metadata: Metadata = { title: "Rincian Tagihan (Proyeksi) · EHIS Billing" };

interface RouteParams {
  params: Promise<{ kid: string }>;
}

export default async function Page({ params }: RouteParams) {
  const { kid } = await params;
  return <KunjunganInvoiceView kunjunganId={kid} />;
}
