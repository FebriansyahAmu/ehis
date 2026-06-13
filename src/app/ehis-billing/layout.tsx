import ModuleLayout from "@/components/layout/ModuleLayout";
import { requireModule } from "@/lib/auth/requireModule";
import ObatPriceHydrator from "@/components/billing/ObatPriceHydrator";
import { obatService } from "@/lib/services/master/obatService";
import type { ObatPriceEntry } from "@/lib/billing/obatPriceCatalog";

export default async function EhisBillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireModule("billing");

  // SSR-prefetch harga obat (master.obat) → hydrate snapshot client utk priceResolver.
  let obatPrices: ObatPriceEntry[] = [];
  try {
    const { items } = await obatService.list({ limit: 300 });
    obatPrices = items.map((o) => ({
      id: o.id, kode: o.kode, namaGenerik: o.namaGenerik, namaDagang: o.namaDagang, hargaSatuan: o.hargaSatuan,
    }));
  } catch {
    /* abaikan — getHargaObat fallback */
  }

  return (
    <ModuleLayout moduleKey="billing">
      <ObatPriceHydrator entries={obatPrices} />
      {children}
    </ModuleLayout>
  );
}
