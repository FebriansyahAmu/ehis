import type { Metadata } from "next";
import KasirCounterPage from "@/components/billing/kasir/KasirCounterPage";

export const metadata: Metadata = { title: "Kasir Counter · EHIS Billing" };

export default function Page() {
  return <KasirCounterPage />;
}
