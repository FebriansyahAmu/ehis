/**
 * Registry link pemetaan EMR → FHIR (L01–L26) — cermin tabel "Peta kamar" docs/fhir-mapping/README.md.
 * Dipakai untuk label Issue di konsol dan pengecekan konsistensi (test). Ubah status di sini SAAT link
 * selesai dikoreksi/dibangun, bersamaan dengan dokumen link-nya.
 */

import type { KunjunganUnit } from "../conceptMap";
import type { LinkId, LinkMeta } from "./types";

const ALL: KunjunganUnit[] = ["IGD", "RawatJalan", "RawatInap"];

export const LINKS: readonly LinkMeta[] = [
  { id: "L01", name: "kunjunganToEncounter", resourceTypes: ["Encounter"], units: ALL, status: "aktif", doc: "L01-kunjungan-to-encounter.md" }, // S2
  { id: "L02", name: "triaseToObservation", resourceTypes: ["Observation"], units: ["IGD"], status: "ditunda", doc: "L02-triase-to-observation.md" },
  { id: "L03", name: "keluhanToCondition", resourceTypes: ["Condition"], units: ALL, status: "aktif", doc: "L03-keluhan-to-condition.md" }, // S2 (keluhan utama)
  { id: "L04", name: "riwayatPenyakitToCondition", resourceTypes: ["Condition"], units: ALL, status: "baru", doc: "L04-riwayat-penyakit-to-condition.md" },
  { id: "L05", name: "riwayatKeluargaToFamilyMemberHistory", resourceTypes: ["FamilyMemberHistory"], units: ALL, status: "baru", doc: "L05-riwayat-keluarga-to-familymemberhistory.md" },
  { id: "L06", name: "alergiToAllergyIntolerance", resourceTypes: ["AllergyIntolerance"], units: ALL, status: "koreksi", doc: "L06-alergi-to-allergyintolerance.md" },
  { id: "L07", name: "riwayatObatToMedicationStatement", resourceTypes: ["MedicationStatement"], units: ALL, status: "baru", doc: "L07-riwayat-obat-to-medicationstatement.md" },
  { id: "L08", name: "ttvToObservation", resourceTypes: ["Observation"], units: ALL, status: "aktif", doc: "L08-ttv-to-observation.md" }, // S3
  { id: "L09", name: "kesadaranToObservation", resourceTypes: ["Observation"], units: ALL, status: "aktif", doc: "L09-kesadaran-to-observation.md" }, // S4 (Apatis ditahan D3)
  { id: "L10", name: "pemeriksaanFisikToObservation", resourceTypes: ["Observation"], units: ALL, status: "baru", doc: "L10-pemeriksaan-fisik-to-observation.md" },
  { id: "L11", name: "nyeriToObservation", resourceTypes: ["Observation"], units: ALL, status: "aktif", doc: "L11-nyeri-to-observation.md" }, // S4 (NRS TTV + Wong-Baker; NIPS ditahan)
  { id: "L12", name: "penilaianToObservation", resourceTypes: ["Observation"], units: ALL, status: "aktif", doc: "L12-penilaian-to-observation.md" }, // S4 (Morse/Humpty/Edmonson; Braden D13)
  { id: "L13", name: "diagnosaToCondition", resourceTypes: ["Condition"], units: ALL, status: "koreksi", doc: "L13-diagnosa-to-condition.md" },
  { id: "L14", name: "tindakanToProcedure", resourceTypes: ["Procedure"], units: ALL, status: "aktif", doc: "L14-tindakan-to-procedure.md" }, // S3
  { id: "L15", name: "edukasiToProcedure", resourceTypes: ["Procedure"], units: ALL, status: "aktif", doc: "L15-edukasi-to-procedure.md" }, // S4c (topik tanpa SNOMED ditahan)
  { id: "L16", name: "labToDiagnostic", resourceTypes: ["ServiceRequest", "Specimen", "Observation", "DiagnosticReport"], units: ALL, status: "koreksi", doc: "L16-lab-to-diagnostic.md" },
  { id: "L17", name: "radToDiagnostic", resourceTypes: ["ServiceRequest", "ImagingStudy", "Observation", "DiagnosticReport"], units: ALL, status: "koreksi", doc: "L17-rad-to-diagnostic.md" },
  { id: "L18", name: "resepToMedicationRequest", resourceTypes: ["Medication", "MedicationRequest"], units: ALL, status: "koreksi", doc: "L18-resep-to-medicationrequest.md" },
  { id: "L19", name: "telaahToQuestionnaireResponse", resourceTypes: ["QuestionnaireResponse"], units: ALL, status: "aktif", doc: "L19-telaah-to-questionnaireresponse.md" }, // S4b
  { id: "L20", name: "dispensingToMedicationDispense", resourceTypes: ["Medication", "MedicationDispense"], units: ALL, status: "koreksi", doc: "L20-dispensing-to-medicationdispense.md" },
  { id: "L21", name: "marToMedicationAdministration", resourceTypes: ["MedicationAdministration"], units: ["RawatInap", "IGD"], status: "aktif", doc: "L21-mar-to-medicationadministration.md" }, // S4b
  { id: "L22", name: "carePlanToGoalCarePlan", resourceTypes: ["Goal", "CarePlan"], units: ["RawatInap"], status: "aktif", doc: "L22-careplan-to-goal-careplan.md" }, // S4c
  { id: "L23", name: "dischargePlanningToObservation", resourceTypes: ["Observation", "CarePlan"], units: ["RawatInap", "IGD"], status: "aktif", doc: "L23-discharge-planning-to-observation.md" }, // S4c (CarePlan; kriteria OC000055 ditahan D15)
  { id: "L24", name: "disposisiToKondisiPulang", resourceTypes: ["Condition", "Encounter"], units: ALL, status: "aktif", doc: "L24-disposisi-to-kondisi-pulang.md" }, // S2
  { id: "L25", name: "tindakLanjutToServiceRequest", resourceTypes: ["ServiceRequest"], units: ALL, status: "aktif", doc: "L25-tindak-lanjut-to-servicerequest.md" }, // S4c (SPRI ditahan D8)
  { id: "L26", name: "resumeToComposition", resourceTypes: ["Composition"], units: ALL, status: "aktif", doc: "L26-resume-to-composition.md" }, // S3
];

export const LINK_BY_ID = Object.fromEntries(LINKS.map((l) => [l.id, l])) as Record<LinkId, LinkMeta>;
