import type { Metadata } from "next";
import KatalogLabPage from "@/components/master/katalog-lab/KatalogLabPage";
import { labTestService } from "@/lib/services/master/labTestService";
import type { LabTestDTO } from "@/lib/schemas/master/labTest";

export const metadata: Metadata = { title: "Katalog Laboratorium — Master" };

// Data master bisa berubah → render fresh per request (API-RULES §6.1).
export const dynamic = "force-dynamic";

export default async function Page() {
  // SSR first paint — panggil SERVICE LANGSUNG (tanpa hop HTTP). Gagal → kosong +
  // prefetched:false → client refetch saat mount (degradasi anggun).
  let initial: LabTestDTO[] = [];
  let prefetched = false;
  try {
    const { items } = await labTestService.list({ limit: 200 });
    initial = items;
    prefetched = true;
  } catch {
    /* abaikan — fallback ke client fetch */
  }

  return <KatalogLabPage initial={initial} prefetched={prefetched} />;
}
