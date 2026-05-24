import { notFound } from "next/navigation";
import InvoiceDetailPage from "@/components/billing/invoice/InvoiceDetailPage";
import { getInvoiceDetail } from "@/components/billing/invoice/invoiceMock";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: RouteParams) {
  const { id } = await params;
  const detail = getInvoiceDetail(id);
  if (!detail) notFound();
  return <InvoiceDetailPage initialDetail={detail} />;
}
