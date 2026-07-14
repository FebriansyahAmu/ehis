import type { Metadata } from "next";
import KasirCounterPage from "@/components/billing/kasir/KasirCounterPage";
import type { KasirTabKey } from "@/components/billing/kasir/KasirTabs";

export const metadata: Metadata = { title: "Kasir Counter · EHIS Billing" };

interface RouteParams {
  searchParams: Promise<{ tab?: string; invoice?: string }>;
}

const TAB_VALUES: KasirTabKey[] = ["dashboard", "quick", "deposit"];

export default async function Page({ searchParams }: RouteParams) {
  const { tab, invoice } = await searchParams;
  const initialTab = TAB_VALUES.includes(tab as KasirTabKey) ? (tab as KasirTabKey) : undefined;
  // Deep-link dari detail tagihan: bayar tagihan kunjungan tertentu langsung.
  const deepLinkInvoice = invoice && invoice.trim() !== "" ? invoice : undefined;
  return <KasirCounterPage initialTab={initialTab} deepLinkInvoice={deepLinkInvoice} />;
}
