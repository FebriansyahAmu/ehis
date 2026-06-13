import type { Metadata } from "next";
import SdkiPage from "@/components/master/sdki/SdkiPage";
import { sdkiService } from "@/lib/services/master/sdkiService";
import type { SdkiDTO } from "@/lib/schemas/master/sdki";

export const metadata: Metadata = { title: "Katalog Keperawatan — Master" };

// Data master bisa berubah → render fresh per request. Saat Redis siap, cache-aside di Service
// → SSR & client /api berbagi satu cache (API-RULES §6.1).
export const dynamic = "force-dynamic";

export default async function Page() {
  // SSR first paint — panggil SERVICE LANGSUNG (tanpa hop HTTP, type-safe). API-RULES §6.1.
  // Gagal → render kosong + prefetched:false → client refetch saat mount (degradasi anggun).
  let initial: SdkiDTO[] = [];
  let prefetched = false;
  try {
    const { items } = await sdkiService.list({ limit: 300 });
    initial = items;
    prefetched = true;
  } catch {
    /* abaikan — fallback ke client fetch */
  }

  return <SdkiPage initial={initial} prefetched={prefetched} />;
}
