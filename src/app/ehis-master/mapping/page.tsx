import type { Metadata } from "next";
import { Suspense } from "react";
import MappingHubPage from "@/components/master/mapping/MappingHubPage";
import { ruanganService } from "@/lib/services/ruanganService";
import { dokterService } from "@/lib/services/dokterService";
import { pegawaiService } from "@/lib/services/pegawaiService";
import { penugasanRuanganService } from "@/lib/services/penugasanRuanganService";
import { tindakanService } from "@/lib/services/master/tindakanService";
import { getServerActor } from "@/lib/auth/actor";
import type { AnyNode } from "@/components/master/ruangan/ruanganShared";
import type { DokterListItemDTO } from "@/lib/schemas/dokter";
import type { PegawaiListItemDTO } from "@/lib/schemas/pegawai";
import type { PenugasanRuanganDTO } from "@/lib/schemas/penugasanRuangan";
import type { TindakanDTO } from "@/lib/schemas/master/tindakan";

export const metadata: Metadata = { title: "Mapping Hub — Master" };

// Data master bisa berubah → render fresh per request (API-RULES §6.1).
export const dynamic = "force-dynamic";

export default async function Page() {
  // SSR first paint untuk SDM Assignment — tree Ruangan + daftar dokter via Service langsung
  // (tanpa hop HTTP). Gagal → undefined → SDMAssignmentPane fallback client fetch (degradasi anggun).
  // Independen: gagalnya satu sumber tak menjatuhkan SSR sumber lain (masing-masing fallback client).
  let initialTree: AnyNode[] | undefined;
  let initialDokters: DokterListItemDTO[] | undefined;
  let initialPegawai: PegawaiListItemDTO[] | undefined;
  let initialPenugasan: PenugasanRuanganDTO[] | undefined;
  let initialTindakan: TindakanDTO[] | undefined;
  try {
    const actor = await getServerActor();
    const [treeRes, dokterRes, pegawaiRes, penugasanRes, tindakanRes] = await Promise.allSettled([
      ruanganService.getTree(actor),
      dokterService.listDokter({ limit: 50 }),
      pegawaiService.listPegawai({ aktif: "true", limit: 50 }),
      penugasanRuanganService.listPenugasan({ limit: 100 }),
      tindakanService.list({ limit: 200 }), // Layanan Unit: baris matrix (actor-less)
    ]);
    if (treeRes.status === "fulfilled") initialTree = treeRes.value as AnyNode[];
    if (dokterRes.status === "fulfilled") initialDokters = dokterRes.value.items;
    if (pegawaiRes.status === "fulfilled") initialPegawai = pegawaiRes.value.items;
    if (penugasanRes.status === "fulfilled") initialPenugasan = penugasanRes.value.items;
    if (tindakanRes.status === "fulfilled") initialTindakan = tindakanRes.value.items;
  } catch {
    /* getServerActor gagal → semua undefined → fallback client fetch di pane */
  }

  return (
    <Suspense fallback={null}>
      <MappingHubPage
        initialTree={initialTree}
        initialDokters={initialDokters}
        initialPegawai={initialPegawai}
        initialPenugasan={initialPenugasan}
        initialTindakan={initialTindakan}
      />
    </Suspense>
  );
}
