import type { Metadata } from "next";
import KatalogTindakanPage from "@/components/master/katalog-tindakan/KatalogTindakanPage";
import { tindakanService } from "@/lib/services/master/tindakanService";
import type { TindakanDTO } from "@/lib/schemas/master/tindakan";

export const metadata: Metadata = { title: "Katalog Tindakan — Master" };

// Data master bisa berubah → render fresh per request. Saat Redis siap, cache-aside di Service
// → SSR & client /api berbagi satu cache (API-RULES §6.1).
export const dynamic = "force-dynamic";

export default async function Page() {
  // SSR first paint — panggil SERVICE LANGSUNG (tanpa hop HTTP, type-safe). API-RULES §6.1.
  // Gagal → render kosong + prefetched:false → client refetch saat mount (degradasi anggun).
  let initial: TindakanDTO[] = [];
  let prefetched = false;
  try {
    const { items } = await tindakanService.list({ limit: 200 });
    initial = items;
    prefetched = true;
  } catch {
    /* abaikan — fallback ke client fetch */
  }

  return <KatalogTindakanPage initial={initial} prefetched={prefetched} />;
}
