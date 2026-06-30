import type { Metadata } from "next";
import TemplateAnamnesisPage from "@/components/master/template-anamnesis/TemplateAnamnesisPage";
import { templateAnamnesisService } from "@/lib/services/master/templateAnamnesisService";
import type { TemplateAnamnesisDTO } from "@/lib/schemas/master/templateAnamnesis";

export const metadata: Metadata = { title: "Template Anamnesis — Master" };

// Data master bisa berubah → render fresh per request. Saat Redis siap, cache-aside di Service
// → SSR & client /api berbagi satu cache (API-RULES §6.1).
export const dynamic = "force-dynamic";

export default async function Page() {
  // SSR first paint — panggil SERVICE LANGSUNG (tanpa hop HTTP, type-safe). API-RULES §6.1.
  // Gagal → render kosong + prefetched:false → client refetch saat mount (degradasi anggun).
  let initial: TemplateAnamnesisDTO[] = [];
  let prefetched = false;
  try {
    const { items } = await templateAnamnesisService.list({ limit: 300 });
    initial = items;
    prefetched = true;
  } catch {
    /* abaikan — fallback ke client fetch */
  }

  return <TemplateAnamnesisPage initial={initial} prefetched={prefetched} />;
}
