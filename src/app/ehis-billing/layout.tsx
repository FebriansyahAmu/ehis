import ModuleLayout from "@/components/layout/ModuleLayout";
import { requireModule } from "@/lib/auth/requireModule";

export default async function EhisBillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireModule("billing");

  // Catatan: dulu di sini ada SSR-prefetch 300 baris master.obat → hydrate snapshot harga untuk
  // `priceResolver` (charge ingest client-side). Charge kini PROYEKSI server dengan harga snapshot
  // dari order, jadi rantai itu dibuang beserta query-nya.

  return <ModuleLayout moduleKey="billing">{children}</ModuleLayout>;
}
