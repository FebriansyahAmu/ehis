import type { Metadata } from "next";
import StatusEnumPage from "@/components/master/status-enum/StatusEnumPage";
import { statusEnumService } from "@/lib/services/master/statusEnumService";
import type { EnumEntryDTO } from "@/lib/schemas/master/statusEnum";

export const metadata: Metadata = { title: "Status Enum — Master" };

// Data master bisa berubah → render fresh per request. Saat Redis siap, cache-aside di Service
// → SSR & client /api berbagi satu cache (API-RULES §6.1).
export const dynamic = "force-dynamic";

export default async function Page() {
  // SSR first paint — panggil SERVICE LANGSUNG (tanpa hop HTTP, type-safe). API-RULES §6.1.
  // Gagal → render kosong + prefetched:false → client refetch saat mount (degradasi anggun).
  let initial: EnumEntryDTO[] = [];
  let prefetched = false;
  try {
    const { items } = await statusEnumService.list({ limit: 500 });
    initial = items;
    prefetched = true;
  } catch {
    /* abaikan — fallback ke client fetch */
  }

  return <StatusEnumPage initial={initial} prefetched={prefetched} />;
}
