import type { Metadata } from "next";
import KasirCounterPage from "@/components/billing/kasir/KasirCounterPage";
import type { KasirTabKey } from "@/components/billing/kasir/KasirTabs";

export const metadata: Metadata = { title: "Kasir Counter · EHIS Billing" };

interface RouteParams {
  searchParams: Promise<{ tab?: string; invoice?: string; mode?: string }>;
}

const TAB_VALUES: KasirTabKey[] = ["dashboard", "quick", "deposit"];

export default async function Page({ searchParams }: RouteParams) {
  const { tab, invoice, mode } = await searchParams;
  const initialTab = TAB_VALUES.includes(tab as KasirTabKey) ? (tab as KasirTabKey) : undefined;
  // Deep-link dari detail tagihan: bayar/refund tagihan kunjungan tertentu langsung.
  const deepLinkInvoice = invoice && invoice.trim() !== "" ? invoice : undefined;
  const deepLinkMode = mode === "refund" ? "refund" : undefined;
  return <KasirCounterPage initialTab={initialTab} deepLinkInvoice={deepLinkInvoice} deepLinkMode={deepLinkMode} />;
}
