import type { Metadata } from "next";
import BerandaBillingPage from "@/components/billing/beranda/BerandaBillingPage";

export const metadata: Metadata = { title: "Billing · Beranda" };

export default function EhisBillingPage() {
  return <BerandaBillingPage />;
}
