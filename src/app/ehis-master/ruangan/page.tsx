import type { Metadata } from "next";
import RuanganPage from "@/components/master/ruangan/RuanganPage";
import { ruanganService } from "@/lib/services/ruanganService";
import { getServerActor } from "@/lib/auth/actor";
import type { AnyNode } from "@/components/master/ruangan/ruanganShared";

export const metadata: Metadata = { title: "Unit & Ruangan — Master" };

// Data master bisa berubah → render fresh per request (jangan di-cache statis saat build).
// Saat Redis siap, cache-aside ada di Service → SSR & client /api berbagi satu cache (API-RULES §6.1).
export const dynamic = "force-dynamic";

export default async function Page() {
  // SSR first paint — panggil SERVICE LANGSUNG (tanpa hop HTTP, type-safe). API-RULES §6.1.
  // Gagal → render kosong + prefetched:false → client refetch saat mount (degradasi anggun).
  let initialTree: AnyNode[] = [];
  let prefetched = false;
  try {
    const actor = await getServerActor();
    initialTree = await ruanganService.getTree(actor);
    prefetched = true;
  } catch {
    /* abaikan — fallback ke client fetch */
  }

  return <RuanganPage initialTree={initialTree} prefetched={prefetched} />;
}
