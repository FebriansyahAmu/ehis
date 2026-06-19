import type { Metadata } from "next";
import { Suspense } from "react";
import MappingHubPage from "@/components/master/mapping/MappingHubPage";
import { ruanganService } from "@/lib/services/ruanganService";
import { dokterService } from "@/lib/services/dokterService";
import { pegawaiService } from "@/lib/services/pegawaiService";
import { penugasanRuanganService } from "@/lib/services/penugasanRuanganService";
import { tindakanService } from "@/lib/services/master/tindakanService";
import { labTestService } from "@/lib/services/master/labTestService";
import { radCatalogService } from "@/lib/services/master/radCatalogService";
import { layananUnitService } from "@/lib/services/master/layananUnitService";
import { layananUnitLabService } from "@/lib/services/master/layananUnitLabService";
import { layananUnitRadService } from "@/lib/services/master/layananUnitRadService";
import { tarifTindakanService } from "@/lib/services/master/tarifTindakanService";
import { tarifLabTestService } from "@/lib/services/master/tarifLabTestService";
import { tarifRadCatalogService } from "@/lib/services/master/tarifRadCatalogService";
import { obatService } from "@/lib/services/master/obatService";
import { formulariumService } from "@/lib/services/master/formulariumService";
import { bmhpService } from "@/lib/services/master/bmhpService";
import { formulariumBmhpService } from "@/lib/services/master/formulariumBmhpService";
import { getServerActor } from "@/lib/auth/actor";
import type { AnyNode } from "@/components/master/ruangan/ruanganShared";
import type { DokterListItemDTO } from "@/lib/schemas/dokter";
import type { PegawaiListItemDTO } from "@/lib/schemas/pegawai";
import type { PenugasanRuanganDTO } from "@/lib/schemas/penugasanRuangan";
import type { TindakanDTO } from "@/lib/schemas/master/tindakan";
import type { LabTestDTO } from "@/lib/schemas/master/labTest";
import type { RadCatalogDTO } from "@/lib/schemas/master/radCatalog";
import type { LayananUnitEdgeDTO } from "@/lib/schemas/master/layananUnit";
import type { LayananUnitLabEdgeDTO } from "@/lib/schemas/master/layananUnitLab";
import type { LayananUnitRadEdgeDTO } from "@/lib/schemas/master/layananUnitRad";
import type { TarifTindakanDTO } from "@/lib/schemas/master/tarifTindakan";
import type { TarifLabTestDTO } from "@/lib/schemas/master/tarifLabTest";
import type { TarifRadCatalogDTO } from "@/lib/schemas/master/tarifRadCatalog";
import type { ObatDTO } from "@/lib/schemas/master/obat";
import type { FormulariumEdgeDTO } from "@/lib/schemas/master/formularium";
import type { BmhpDTO } from "@/lib/schemas/master/bmhp";
import type { FormulariumBmhpEdgeDTO } from "@/lib/schemas/master/formulariumBmhp";

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
  let initialLab: LabTestDTO[] | undefined;
  let initialRad: RadCatalogDTO[] | undefined;
  let initialLayanan: LayananUnitEdgeDTO[] | undefined;
  let initialLayananLab: LayananUnitLabEdgeDTO[] | undefined;
  let initialLayananRad: LayananUnitRadEdgeDTO[] | undefined;
  let initialTarif: TarifTindakanDTO[] | undefined;
  let initialTarifLab: TarifLabTestDTO[] | undefined;
  let initialTarifRad: TarifRadCatalogDTO[] | undefined;
  let initialObat: ObatDTO[] | undefined;
  let initialFormularium: FormulariumEdgeDTO[] | undefined;
  let initialBmhp: BmhpDTO[] | undefined;
  let initialFormulariumBmhp: FormulariumBmhpEdgeDTO[] | undefined;
  try {
    const actor = await getServerActor();
    const [treeRes, dokterRes, pegawaiRes, penugasanRes, tindakanRes, labRes, radRes, layananRes, layananLabRes, layananRadRes, tarifRes, tarifLabRes, tarifRadRes, obatRes, formulariumRes, bmhpRes, formulariumBmhpRes] = await Promise.allSettled([
      ruanganService.getTree(actor),
      dokterService.listDokter({ limit: 50 }),
      pegawaiService.listPegawai({ aktif: "true", limit: 50 }),
      penugasanRuanganService.listPenugasan({ limit: 100 }),
      tindakanService.list({ limit: 200 }), // Layanan Unit + Tarif: baris matrix tindakan (actor-less)
      labTestService.list({ status: "Aktif", limit: 200 }), // Layanan Unit + Tarif: baris grup Lab (actor-less)
      radCatalogService.list({ status: "Aktif", limit: 500 }), // Layanan Unit + Tarif: baris grup Rad (actor-less)
      layananUnitService.list({ limit: 1000 }), // Layanan Unit: edge tindakan (actor-less)
      layananUnitLabService.list({ limit: 1000 }), // Layanan Unit: edge lab (actor-less)
      layananUnitRadService.list({ limit: 1000 }), // Layanan Unit: edge rad (actor-less)
      tarifTindakanService.list({ limit: 2000 }), // Tarif Matrix: edge tarif tindakan (actor-less)
      tarifLabTestService.list({ limit: 2000 }), // Tarif Matrix: edge tarif lab (actor-less)
      tarifRadCatalogService.list({ limit: 2000 }), // Tarif Matrix: edge tarif rad (actor-less)
      obatService.list({ limit: 300 }), // Ketersediaan Farmasi (Obat): baris matrix obat (actor-less)
      formulariumService.list({ limit: 2000 }), // Ketersediaan Farmasi (Obat): edge formularium (actor-less)
      bmhpService.list({ limit: 300 }), // Ketersediaan Farmasi (BMHP): baris matrix BMHP (actor-less)
      formulariumBmhpService.list({ limit: 2000 }), // Ketersediaan Farmasi (BMHP): edge ketersediaan (actor-less)
    ]);
    if (treeRes.status === "fulfilled") initialTree = treeRes.value as AnyNode[];
    if (dokterRes.status === "fulfilled") initialDokters = dokterRes.value.items;
    if (pegawaiRes.status === "fulfilled") initialPegawai = pegawaiRes.value.items;
    if (penugasanRes.status === "fulfilled") initialPenugasan = penugasanRes.value.items;
    if (tindakanRes.status === "fulfilled") initialTindakan = tindakanRes.value.items;
    if (labRes.status === "fulfilled") initialLab = labRes.value.items;
    if (radRes.status === "fulfilled") initialRad = radRes.value.items;
    if (layananRes.status === "fulfilled") initialLayanan = layananRes.value.items;
    if (layananLabRes.status === "fulfilled") initialLayananLab = layananLabRes.value.items;
    if (layananRadRes.status === "fulfilled") initialLayananRad = layananRadRes.value.items;
    if (tarifRes.status === "fulfilled") initialTarif = tarifRes.value.items;
    if (tarifLabRes.status === "fulfilled") initialTarifLab = tarifLabRes.value.items;
    if (tarifRadRes.status === "fulfilled") initialTarifRad = tarifRadRes.value.items;
    if (obatRes.status === "fulfilled") initialObat = obatRes.value.items;
    if (formulariumRes.status === "fulfilled") initialFormularium = formulariumRes.value.items;
    if (bmhpRes.status === "fulfilled") initialBmhp = bmhpRes.value.items;
    if (formulariumBmhpRes.status === "fulfilled") initialFormulariumBmhp = formulariumBmhpRes.value.items;
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
        initialLab={initialLab}
        initialRad={initialRad}
        initialLayanan={initialLayanan}
        initialLayananLab={initialLayananLab}
        initialLayananRad={initialLayananRad}
        initialTarif={initialTarif}
        initialTarifLab={initialTarifLab}
        initialTarifRad={initialTarifRad}
        initialObat={initialObat}
        initialFormularium={initialFormularium}
        initialBmhp={initialBmhp}
        initialFormulariumBmhp={initialFormulariumBmhp}
      />
    </Suspense>
  );
}
