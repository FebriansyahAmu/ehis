import type { Metadata } from "next";
import KatalogBmhpPage from "@/components/master/katalog-bmhp/KatalogBmhpPage";
import { bmhpService } from "@/lib/services/master/bmhpService";
import type { BmhpDTO } from "@/lib/schemas/master/bmhp";

export const metadata: Metadata = { title: "Katalog BMHP/BHP — Master" };

// Data master bisa berubah → render fresh per request (API-RULES §6.1).
export const dynamic = "force-dynamic";

export default async function Page() {
  // SSR first paint — panggil SERVICE LANGSUNG (tanpa hop HTTP). Gagal → kosong +
  // prefetched:false → client refetch saat mount (degradasi anggun).
  let initial: BmhpDTO[] = [];
  let prefetched = false;
  try {
    const { items } = await bmhpService.list({ limit: 300 });
    initial = items;
    prefetched = true;
  } catch {
    /* abaikan — fallback ke client fetch */
  }

  return <KatalogBmhpPage initial={initial} prefetched={prefetched} />;
}
