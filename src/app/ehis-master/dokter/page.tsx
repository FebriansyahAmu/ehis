import type { Metadata } from "next";
import DokterPage from "@/components/master/dokter/DokterPage";
import { dokterService } from "@/lib/services/dokterService";
import type { DokterListItemDTO } from "@/lib/schemas/dokter";

export const metadata: Metadata = { title: "Dokter & Nakes — Master" };

// Data master bisa berubah → render fresh per request (jangan di-cache statis saat build).
// Saat Redis siap, cache-aside ada di Service → SSR & client /api berbagi satu cache (API-RULES §6.1).
export const dynamic = "force-dynamic";

export default async function Page() {
  // SSR first paint — panggil SERVICE LANGSUNG (tanpa hop HTTP, type-safe). API-RULES §6.1.
  // Gagal → render kosong + prefetched:false → client refetch saat mount (degradasi anggun).
  let initialDokters: DokterListItemDTO[] = [];
  let prefetched = false;
  try {
    const { items } = await dokterService.listDokter({ limit: 50 });
    initialDokters = items;
    prefetched = true;
  } catch {
    /* abaikan — fallback ke client fetch */
  }

  return <DokterPage initialDokters={initialDokters} prefetched={prefetched} />;
}
