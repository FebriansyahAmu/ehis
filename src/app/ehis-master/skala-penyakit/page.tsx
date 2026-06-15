import type { Metadata } from "next";
import SkalaPenyakitPage from "@/components/master/skala-penyakit/SkalaPenyakitPage";
import { skalaPenyakitService } from "@/lib/services/master/skalaPenyakitService";
import type { SkalaRisikoDTO } from "@/lib/schemas/master/skalaRisiko";

export const metadata: Metadata = { title: "Skala Penyakit — Master" };

// Data master bisa berubah → render fresh per request (selaras skala-risiko).
export const dynamic = "force-dynamic";

export default async function Page() {
  // SSR first paint — panggil SERVICE LANGSUNG (tanpa hop HTTP). API-RULES §6.1.
  let initial: SkalaRisikoDTO[] = [];
  let prefetched = false;
  try {
    const { items } = await skalaPenyakitService.list({ limit: 300 });
    initial = items;
    prefetched = true;
  } catch {
    /* abaikan — fallback ke client fetch */
  }

  return <SkalaPenyakitPage initial={initial} prefetched={prefetched} />;
}
