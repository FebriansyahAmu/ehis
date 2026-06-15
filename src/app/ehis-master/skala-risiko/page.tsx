import type { Metadata } from "next";
import SkalaRisikoPage from "@/components/master/skala-risiko/SkalaRisikoPage";
import { skalaRisikoService } from "@/lib/services/master/skalaRisikoService";
import type { SkalaRisikoDTO } from "@/lib/schemas/master/skalaRisiko";

export const metadata: Metadata = { title: "Skala Risiko — Master" };

// Data master bisa berubah → render fresh per request. Saat Redis siap, cache-aside di Service
// → SSR & client /api berbagi satu cache (API-RULES §6.1).
export const dynamic = "force-dynamic";

export default async function Page() {
  // SSR first paint — panggil SERVICE LANGSUNG (tanpa hop HTTP, type-safe). API-RULES §6.1.
  // Gagal → render kosong + prefetched:false → client refetch saat mount (degradasi anggun).
  let initial: SkalaRisikoDTO[] = [];
  let prefetched = false;
  try {
    const { items } = await skalaRisikoService.list({ limit: 300 });
    initial = items;
    prefetched = true;
  } catch {
    /* abaikan — fallback ke client fetch */
  }

  return <SkalaRisikoPage initial={initial} prefetched={prefetched} />;
}
