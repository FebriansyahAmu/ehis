import type { Metadata } from "next";
import AsesmenKatalogPage from "@/components/master/asesmen-katalog/AsesmenKatalogPage";
import { asesmenKatalogService } from "@/lib/services/master/asesmenKatalogService";
import type { AsesmenItemDTO } from "@/lib/schemas/master/asesmenKatalog";

export const metadata: Metadata = { title: "Asesmen Katalog — Master" };

// Data master bisa berubah → render fresh per request. Saat Redis siap, cache-aside di Service
// → SSR & client /api berbagi satu cache (API-RULES §6.1).
export const dynamic = "force-dynamic";

export default async function Page() {
  // SSR first paint — panggil SERVICE LANGSUNG (tanpa hop HTTP, type-safe). API-RULES §6.1.
  // Gagal → render kosong + prefetched:false → client refetch saat mount (degradasi anggun).
  let initial: AsesmenItemDTO[] = [];
  let prefetched = false;
  try {
    const { items } = await asesmenKatalogService.list({ limit: 500 });
    initial = items;
    prefetched = true;
  } catch {
    /* abaikan — fallback ke client fetch */
  }

  return <AsesmenKatalogPage initial={initial} prefetched={prefetched} />;
}
