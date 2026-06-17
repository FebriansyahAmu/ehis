import type { Metadata } from "next";
import KatalogRadiologiPage from "@/components/master/katalog-radiologi/KatalogRadiologiPage";
import { radCatalogService } from "@/lib/services/master/radCatalogService";
import type { RadCatalogDTO } from "@/lib/schemas/master/radCatalog";

export const metadata: Metadata = { title: "Katalog Radiologi — Master" };

// Data master bisa berubah → render fresh per request. Saat Redis siap, cache-aside di Service
// → SSR & client /api berbagi satu cache (API-RULES §6.1).
export const dynamic = "force-dynamic";

export default async function Page() {
  // SSR first paint — panggil SERVICE LANGSUNG (tanpa hop HTTP, type-safe). API-RULES §6.1.
  // Gagal → render kosong + prefetched:false → client refetch saat mount (degradasi anggun).
  let initial: RadCatalogDTO[] = [];
  let prefetched = false;
  try {
    const { items } = await radCatalogService.list({ limit: 500 });
    initial = items;
    prefetched = true;
  } catch {
    /* abaikan — fallback ke client fetch */
  }

  return <KatalogRadiologiPage initial={initial} prefetched={prefetched} />;
}
