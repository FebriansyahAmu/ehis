import type { Metadata } from "next";
import KatalogObatPage from "@/components/master/katalog-obat/KatalogObatPage";
import { obatService } from "@/lib/services/master/obatService";
import type { ObatDTO } from "@/lib/schemas/master/obat";

export const metadata: Metadata = { title: "Katalog Obat — Master" };

// Data master bisa berubah → render fresh per request (API-RULES §6.1).
export const dynamic = "force-dynamic";

export default async function Page() {
  // SSR first paint — panggil SERVICE LANGSUNG (tanpa hop HTTP). Gagal → kosong +
  // prefetched:false → client refetch saat mount (degradasi anggun).
  let initial: ObatDTO[] = [];
  let prefetched = false;
  try {
    const { items } = await obatService.list({ limit: 300 });
    initial = items;
    prefetched = true;
  } catch {
    /* abaikan — fallback ke client fetch */
  }

  return <KatalogObatPage initial={initial} prefetched={prefetched} />;
}
