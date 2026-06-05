import type { Metadata } from "next";
import { Suspense } from "react";
import MappingHubPage from "@/components/master/mapping/MappingHubPage";
import { ruanganService } from "@/lib/services/ruanganService";
import { dokterService } from "@/lib/services/dokterService";
import { getServerActor } from "@/lib/auth/actor";
import type { AnyNode } from "@/components/master/ruangan/ruanganShared";
import type { DokterListItemDTO } from "@/lib/schemas/dokter";

export const metadata: Metadata = { title: "Mapping Hub — Master" };

// Data master bisa berubah → render fresh per request (API-RULES §6.1).
export const dynamic = "force-dynamic";

export default async function Page() {
  // SSR first paint untuk SDM Assignment — tree Ruangan + daftar dokter via Service langsung
  // (tanpa hop HTTP). Gagal → undefined → SDMAssignmentPane fallback client fetch (degradasi anggun).
  // Independen: gagalnya satu sumber tak menjatuhkan SSR sumber lain (masing-masing fallback client).
  let initialTree: AnyNode[] | undefined;
  let initialDokters: DokterListItemDTO[] | undefined;
  try {
    const actor = await getServerActor();
    const [treeRes, dokterRes] = await Promise.allSettled([
      ruanganService.getTree(actor),
      dokterService.listDokter({ limit: 50 }),
    ]);
    if (treeRes.status === "fulfilled") initialTree = treeRes.value as AnyNode[];
    if (dokterRes.status === "fulfilled") initialDokters = dokterRes.value.items;
  } catch {
    /* getServerActor gagal → keduanya undefined → fallback client fetch di pane */
  }

  return (
    <Suspense fallback={null}>
      <MappingHubPage initialTree={initialTree} initialDokters={initialDokters} />
    </Suspense>
  );
}
