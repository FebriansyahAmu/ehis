// FLOW.md §2 ① — Snapshot sumber 1 kunjungan untuk sinkron FHIR: SEMUA baris sumber dibaca dalam satu
// putaran query paralel ber-indeks `kunjungan_id`, lalu dibagikan ke semua builder (klinis · obat ·
// diagnostik · resume · Encounter final). Menggantikan query berulang per layanan (sebelumnya diagnosa
// dibaca ±5× per job). Link baru menambah sumbernya DI SINI, bukan query sendiri.
//
// Termasuk baris soft-deleted (deletedAt) — builder mengirim `entered-in-error` untuk yang pernah terkirim.

import "server-only";
import * as clinicalSrc from "@/lib/dal/fhir/clinicalSourceDal";
import * as medicationSrc from "@/lib/dal/fhir/medicationSourceDal";
import * as diagnosticSrc from "@/lib/dal/fhir/diagnosticSourceDal";
import * as encounterSrc from "@/lib/dal/fhir/encounterSourceDal";

export async function loadEncounterSnapshot(kunjunganId: string) {
  const [
    diagnosa, prosedur, tindakan, ttv, alergi, triase, penilaianSkala, resep, lab, rad, resume, anamnesis, triaseWaktu,
  ] = await Promise.all([
    clinicalSrc.listDiagnosa(kunjunganId),
    clinicalSrc.listProsedur(kunjunganId),
    clinicalSrc.listTindakan(kunjunganId),
    clinicalSrc.listTtv(kunjunganId),
    clinicalSrc.listAlergi(kunjunganId),
    clinicalSrc.listTriaseAvpu(kunjunganId), // L09 kesadaran (IGD)
    clinicalSrc.listPenilaianSkala(kunjunganId), // L11/L12 skala

    medicationSrc.listResep(kunjunganId),
    diagnosticSrc.listLab(kunjunganId),
    diagnosticSrc.listRad(kunjunganId),
    encounterSrc.getLatestResume(kunjunganId),
    encounterSrc.getLatestAnamnesis(kunjunganId), // L03 keluhan utama
    encounterSrc.getFirstTriaseWaktu(kunjunganId), // L01 statusHistory `triaged` (IGD)
  ]);
  return {
    kunjunganId, diagnosa, prosedur, tindakan, ttv, alergi, triase, penilaianSkala, resep, lab, rad, resume, anamnesis, triaseWaktu,
  };
}

export type EncounterSnapshot = Awaited<ReturnType<typeof loadEncounterSnapshot>>;
