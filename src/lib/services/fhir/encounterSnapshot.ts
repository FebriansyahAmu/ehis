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
import * as rencanaSrc from "@/lib/dal/fhir/rencanaSourceDal";
import * as anamnesisSrc from "@/lib/dal/fhir/anamnesisSourceDal";

export async function loadEncounterSnapshot(kunjunganId: string) {
  const [
    diagnosa, prosedur, tindakan, ttv, alergi, triase, penilaianSkala, resep, mar, lab, rad, resume, anamnesis, triaseWaktu,
    carePlan, dischargeAsesmen, edukasi, jadwalKontrol, konsultasi, rujukan, spri, rsKontak,
    penyakitDahulu, penyakitKeluarga, pemeriksaanFisik, katalogRiwayat,
  ] = await Promise.all([
    clinicalSrc.listDiagnosa(kunjunganId),
    clinicalSrc.listProsedur(kunjunganId),
    clinicalSrc.listTindakan(kunjunganId),
    clinicalSrc.listTtv(kunjunganId),
    clinicalSrc.listAlergi(kunjunganId),
    clinicalSrc.listTriaseAvpu(kunjunganId), // L09 kesadaran (IGD)
    clinicalSrc.listPenilaianSkala(kunjunganId), // L11/L12 skala

    medicationSrc.listResep(kunjunganId), // L18/L19/L20 (+ telaah)
    medicationSrc.listMar(kunjunganId), // L21 pemberian obat
    diagnosticSrc.listLab(kunjunganId),
    diagnosticSrc.listRad(kunjunganId),
    encounterSrc.getLatestResume(kunjunganId),
    encounterSrc.getLatestAnamnesis(kunjunganId), // L03 keluhan utama
    encounterSrc.getFirstTriaseWaktu(kunjunganId), // L01 statusHistory `triaged` (IGD)

    rencanaSrc.listCarePlan(kunjunganId), // L22 rencana asuhan
    rencanaSrc.getLatestDischargeAsesmen(kunjunganId), // L23 rencana pemulangan
    rencanaSrc.listDischargeEdukasi(kunjunganId), // L15 edukasi
    rencanaSrc.listJadwalKontrol(kunjunganId), // L25 kontrol
    rencanaSrc.listKonsultasi(kunjunganId), // L25 konsultasi
    rencanaSrc.listRujukanEksternal(kunjunganId), // L25 rujukan eksternal
    rencanaSrc.listSpri(kunjunganId), // L25 SPRI (ditahan D8)
    rencanaSrc.getRsKontak(), // patientInstruction kontak darurat

    anamnesisSrc.listPenyakitDahulu(kunjunganId), // L04 riwayat penyakit pribadi
    anamnesisSrc.listPenyakitKeluarga(kunjunganId), // L05 riwayat penyakit keluarga
    anamnesisSrc.listPemeriksaanFisik(kunjunganId), // L10 head-to-toe
    anamnesisSrc.listKatalogRiwayat(), // SNOMED katalog riwayat (D7)
  ]);
  return {
    kunjunganId, diagnosa, prosedur, tindakan, ttv, alergi, triase, penilaianSkala, resep, mar, lab, rad, resume, anamnesis,
    triaseWaktu,
    carePlan, dischargeAsesmen, edukasi, jadwalKontrol, konsultasi, rujukan, spri, rsKontak,
    penyakitDahulu, penyakitKeluarga, pemeriksaanFisik, katalogRiwayat,
  };
}

export type EncounterSnapshot = Awaited<ReturnType<typeof loadEncounterSnapshot>>;
