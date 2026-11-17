/**
 * ConceptMap — nilai enum TETAP lokal EHIS → kode standar FHIR/SatuSehat (satu tempat, exhaustive).
 *
 * Aturan (docs/fhir-mapping/ARSITEKTUR.md §5):
 * - Hanya enum tertutup milik EHIS (status, unit, kelas, disposisi, …). Kode item katalog (KFA, LOINC,
 *   SNOMED, ICD) TIDAK di sini — disimpan di master katalog.
 * - Tipe kunci = union enum lokal → nilai enum baru yang lupa dipetakan = error compile.
 * - Kode & display mengikuti tabel playbook SatuSehat (RJ v7.0 · IGD v5.2 · RI v6.0) / contoh Bundle resmi.
 *
 * Aman diimpor client maupun server (tanpa I/O).
 */

import type { DisposisiJenis } from "@/lib/schemas/disposisi/disposisi";

export interface Coding {
  system: string;
  code: string;
  display: string;
}

const HL7 = "http://terminology.hl7.org/CodeSystem";
const KEMKES = "http://terminology.kemkes.go.id/CodeSystem";
/** Sistem Kemkes tanpa `/CodeSystem` (mis. chief-complaint, TK000068, inpatient-admission). */
const KEMKES_BASE = "http://terminology.kemkes.go.id";

// ── Encounter (L01) ─────────────────────────────────────────

export type KunjunganUnit = "IGD" | "RawatJalan" | "RawatInap";

/** Unit kunjungan → `Encounter.class` (v3-ActCode). */
export const ENCOUNTER_CLASS: Record<KunjunganUnit, Coding> = {
  IGD: { system: `${HL7}/v3-ActCode`, code: "EMER", display: "emergency" },
  RawatJalan: { system: `${HL7}/v3-ActCode`, code: "AMB", display: "ambulatory" },
  RawatInap: { system: `${HL7}/v3-ActCode`, code: "IMP", display: "inpatient encounter" },
};

export type KelasRawat = "VIP" | "Kelas_1" | "Kelas_2" | "Kelas_3" | "ICU" | "HCU" | "Isolasi";

/**
 * Kelas kamar RI → `locationServiceClass-Inpatient`. ICU/HCU/Isolasi tidak punya kode di playbook → null
 * (extension ServiceClass dihilangkan, FG-28).
 */
export const SERVICE_CLASS_INPATIENT: Record<KelasRawat, Coding | null> = {
  VIP: { system: `${KEMKES}/locationServiceClass-Inpatient`, code: "vip", display: "Kelas VIP" },
  Kelas_1: { system: `${KEMKES}/locationServiceClass-Inpatient`, code: "1", display: "Kelas 1" },
  Kelas_2: { system: `${KEMKES}/locationServiceClass-Inpatient`, code: "2", display: "Kelas 2" },
  Kelas_3: { system: `${KEMKES}/locationServiceClass-Inpatient`, code: "3", display: "Kelas 3" },
  ICU: null,
  HCU: null,
  Isolasi: null,
};

/** RJ/IGD: kelas layanan rawat jalan (playbook RJ/IGD). */
export const SERVICE_CLASS_OUTPATIENT_REGULER: Coding = {
  system: `${KEMKES}/locationServiceClass-Outpatient`, code: "reguler", display: "Kelas Reguler",
};

/** Peringkat kelas untuk menentukan naik/turun kelas (lebih tinggi = lebih mahal). */
export const KELAS_RANK: Partial<Record<KelasRawat, number>> = { Kelas_3: 1, Kelas_2: 2, Kelas_1: 3, VIP: 4 };

export type UpgradeClass = "kelas-tetap" | "naik-kelas" | "turun-kelas" | "titip-rawat";

/** Indikator perubahan kelas (`locationUpgradeClass`) — display sesuai tabel playbook RI. */
export const UPGRADE_CLASS: Record<UpgradeClass, Coding> = {
  "kelas-tetap": { system: `${KEMKES}/locationUpgradeClass`, code: "kelas-tetap", display: "Kelas Tetap Perawatan" },
  "naik-kelas": { system: `${KEMKES}/locationUpgradeClass`, code: "naik-kelas", display: "Kenaikan Kelas Perawatan" },
  "turun-kelas": { system: `${KEMKES}/locationUpgradeClass`, code: "turun-kelas", display: "Penurunan Kelas Perawatan" },
  "titip-rawat": { system: `${KEMKES}/locationUpgradeClass`, code: "titip-rawat", display: "Titip Kelas Perawatan" },
};

/**
 * Jenis disposisi (selain Meninggal) → `Encounter.hospitalization.dischargeDisposition` (HL7).
 * Rawat_Inap tak punya kode → `oth` + teks (contoh resmi IGD). Meninggal → {@link dischargeDispositionOf}.
 */
export const DISCHARGE_DISPOSITION: Record<Exclude<DisposisiJenis, "Meninggal">, Coding> = {
  Pulang: { system: `${HL7}/discharge-disposition`, code: "home", display: "Home" },
  Rujuk: { system: `${HL7}/discharge-disposition`, code: "other-hcf", display: "Other healthcare facility" },
  APS: { system: `${HL7}/discharge-disposition`, code: "aadvice", display: "Left against advice" },
  Rawat_Inap: { system: `${HL7}/discharge-disposition`, code: "oth", display: "Other" },
};

/**
 * Meninggal → kode Kemkes menurut lama dirawat (L24, FG-77). Display dari tabel "Cara Keluar" playbook
 * IGD/RI — belum terverifikasi verbatim (FG-92); SatuSehat memvalidasi `code`, bukan display.
 */
export const DISCHARGE_MENINGGAL = {
  lt48h: { system: `${KEMKES}/discharge-disposition`, code: "exp-lt48h", display: "Meninggal < 48 jam" },
  gt48h: { system: `${KEMKES}/discharge-disposition`, code: "exp-gt48h", display: "Meninggal > 48 jam" },
} as const satisfies Record<string, Coding>;

const JAM_48_MS = 48 * 60 * 60 * 1000;

/**
 * Disposisi → `dischargeDisposition`. Meninggal: selisih waktu keluar − waktu masuk kunjungan INI
 * < 48 jam → `exp-lt48h`, selain itu `exp-gt48h` (tepat 48 jam = gt). Jenis tak dikenal → undefined.
 */
export function dischargeDispositionOf(jenis: string, masuk: Date, keluar: Date): Coding | undefined {
  if (jenis === "Meninggal") {
    return keluar.getTime() - masuk.getTime() < JAM_48_MS ? DISCHARGE_MENINGGAL.lt48h : DISCHARGE_MENINGGAL.gt48h;
  }
  return lookup(DISCHARGE_DISPOSITION, jenis);
}

/** Peran Condition di `Encounter.diagnosis.use` (contoh Bundle RI: CC tanpa rank, DD ber-rank). */
export const DIAGNOSIS_ROLE = {
  CC: { system: `${HL7}/diagnosis-role`, code: "CC", display: "Chief Complaint" },
  DD: { system: `${HL7}/diagnosis-role`, code: "DD", display: "Discharge diagnosis" },
} as const satisfies Record<string, Coding>;

// ── Condition keluhan & kondisi pulang (L03 / L24) ──────────

/** `Condition.category` — keluhan utama (Kemkes) & keluhan penyerta / kondisi pulang (HL7). */
export const CONDITION_CATEGORY = {
  chiefComplaint: { system: "http://terminology.kemkes.go.id", code: "chief-complaint", display: "Chief Complaint" },
  problemListItem: { system: `${HL7}/condition-category`, code: "problem-list-item", display: "Problem List Item" },
  /** L04 riwayat penyakit pribadi (playbook RJ/RI Tabel 3 · IGD Tabel 4 item 3, verbatim). */
  previousCondition: { system: "http://terminology.kemkes.go.id", code: "previous-condition", display: "Previous Condition" },
} as const satisfies Record<string, Coding>;

/**
 * L05 — `FamilyMemberHistory.relationship` (playbook Tabel 3/4 item 4, verbatim: hanya FAMMEMB "Family member").
 * Anggota spesifik EHIS (Ayah/Ibu/…) dibawa di `relationship.text`; kode v3-RoleCode spesifik (MTH/FTH/…)
 * belum dipakai karena tidak ada di tabel playbook (FG-129).
 */
export const FAMILY_MEMBER: Coding = { system: `${HL7}/v3-RoleCode`, code: "FAMMEMB", display: "Family member" };

const SCT = "http://snomed.info/sct";
const KONDISI_STABIL: Coding = { system: SCT, code: "359746009", display: "Patient's condition stable" };
const KONDISI_TIDAK_STABIL: Coding = { system: SCT, code: "162668006", display: "Patient's condition unstable" };
const KONDISI_MEMBAIK: Coding = { system: SCT, code: "268910001", display: "Patient's condition improved" };

/**
 * Nilai `Disposisi.kondisiUmum` yang ditulis form EHIS (2 sumber) — kolomnya teks bebas, maka union ini
 * = kosakata yang dikenal; nilai lain → lookup undefined (Issue kode-tidak-valid).
 *  - SelesaikanDialog (IGD/RJ): Baik · Sedang · Buruk · Kritis (D11 — form tetap, dipetakan saat kirim).
 *  - PasienPulangTab (IGD, dipakai ulang RI): diturunkan dari status pulang, bukan dinilai terpisah.
 */
export type KondisiUmumLokal =
  | "Baik" | "Sedang" | "Buruk" | "Kritis"
  | "Membaik" | "Dalam perawatan" | "Dirujuk ke faskes lain" | "Pulang atas permintaan sendiri" | "Meninggal";

/**
 * Kondisi umum → SNOMED kondisi saat meninggalkan RS (L24, D11 ✅ 2026-11-17). null = nilai tidak
 * menilai kondisi (turunan status pulang) → Condition tidak dikirim. "Membaik" = tren eksplisit dari
 * status pulang → `268910001` Perbaikan.
 */
export const KONDISI_PULANG: Record<KondisiUmumLokal, Coding | null> = {
  Baik: KONDISI_STABIL,
  Sedang: KONDISI_STABIL,
  Buruk: KONDISI_TIDAK_STABIL,
  Kritis: KONDISI_TIDAK_STABIL,
  Membaik: KONDISI_MEMBAIK,
  "Dalam perawatan": null,
  "Dirujuk ke faskes lain": null,
  "Pulang atas permintaan sendiri": null,
  Meninggal: null,
};

// ── Condition (L13) ─────────────────────────────────────────

export type DiagnosaStatus = "Pasti" | "Dicurigai" | "Diferensial";

/** Status diagnosis → `Condition.verificationStatus`. */
export const CONDITION_VERIFICATION: Record<DiagnosaStatus, Coding> = {
  Pasti: { system: `${HL7}/condition-ver-status`, code: "confirmed", display: "Confirmed" },
  Dicurigai: { system: `${HL7}/condition-ver-status`, code: "provisional", display: "Provisional" },
  Diferensial: { system: `${HL7}/condition-ver-status`, code: "differential", display: "Differential" },
};

// ── Procedure (L14) ─────────────────────────────────────────

/** Kategori katalog tindakan (master.Tindakan, snapshot di TindakanMedis) — identik TindakanKategoriEnum. */
export type TindakanKategori =
  | "Konsultasi" | "Tindakan_Medis" | "Diagnostik" | "Bedah_Minor" | "Bedah_Mayor" | "Bedah_Khusus" | "Obstetri"
  | "Pediatrik" | "Resusitasi" | "Anestesi" | "Spesialistik" | "Non_Kategori" | "Prosedur_Bedah"
  | "Prosedur_Non_Bedah" | "Keperawatan" | "Tindakan_Invasif";

const sctProc = (code: string, display: string): Coding => ({ system: "http://snomed.info/sct", code, display });
const PROC_DIAGNOSTIK = sctProc("103693007", "Diagnostic procedure");
const PROC_TERAPEUTIK = sctProc("277132007", "Therapeutic procedure");
const PROC_BEDAH = sctProc("387713003", "Surgical procedure");

/**
 * Kategori tindakan → `Procedure.category` (SNOMED, ECL < 71388002). Kode dari contoh resmi (277132007 RJ,
 * 373110003 IGD) + hierarki prosedur SNOMED. null = kategori ambigu (bisa diagnostik ATAU terapeutik) →
 * category tidak dikirim (elemen opsional) — lebih baik kosong daripada salah.
 */
export const PROCEDURE_CATEGORY: Record<TindakanKategori, Coding | null> = {
  Diagnostik: PROC_DIAGNOSTIK,
  Tindakan_Medis: PROC_TERAPEUTIK,
  Prosedur_Non_Bedah: PROC_TERAPEUTIK,
  Bedah_Minor: PROC_BEDAH,
  Bedah_Mayor: PROC_BEDAH,
  Bedah_Khusus: PROC_BEDAH,
  Prosedur_Bedah: PROC_BEDAH,
  Resusitasi: sctProc("373110003", "Emergency procedure"),
  Konsultasi: sctProc("11429006", "Consultation"),
  Keperawatan: sctProc("9632001", "Nursing procedure"),
  Obstetri: null,
  Pediatrik: null,
  Spesialistik: null,
  Anestesi: null,
  Tindakan_Invasif: null,
  Non_Kategori: null,
};

// ── DiagnosticReport lab (L16) ──────────────────────────────

/** Kategori master.LabTest (10 — identik `KategoriLab` di components/lab/labShared.ts). */
export type KategoriLab =
  | "Hematologi" | "Kimia Klinik" | "Urinalisis" | "Mikrobiologi" | "Serologi"
  | "Koagulasi" | "Analisa Gas Darah" | "Feses" | "Imunologi" | "Toksikologi";

const v20074 = (code: string, display: string): Coding => ({ system: `${HL7}/v2-0074`, code, display });

/** Bagian lab tanpa kode khusus di v2-0074 (Urinalisis, Feses, kategori tak dikenal). */
export const LAB_REPORT_CATEGORY_UMUM: Coding = v20074("LAB", "Laboratory");

/** Kategori lab → `DiagnosticReport.category` per bagian (contoh resmi: HM, CH). */
export const LAB_REPORT_CATEGORY: Record<KategoriLab, Coding> = {
  Hematologi: v20074("HM", "Hematology"),
  Koagulasi: v20074("HM", "Hematology"),
  "Kimia Klinik": v20074("CH", "Chemistry"),
  "Analisa Gas Darah": v20074("BG", "Blood Gases"),
  Mikrobiologi: v20074("MB", "Microbiology"),
  Serologi: v20074("SR", "Serology"),
  Imunologi: v20074("IMM", "Immunology"),
  Toksikologi: v20074("TX", "Toxicology"),
  Urinalisis: LAB_REPORT_CATEGORY_UMUM,
  Feses: LAB_REPORT_CATEGORY_UMUM,
};

// ── Composition (L26) ───────────────────────────────────────

/** Unit → `Composition.type` (LOINC) — playbook RJ Tabel 35 · IGD §28 · RI §30. */
export const COMPOSITION_TYPE: Record<KunjunganUnit, Coding> = {
  RawatJalan: { system: "http://loinc.org", code: "88645-7", display: "Outpatient hospital Discharge summary" },
  IGD: { system: "http://loinc.org", code: "97663-9", display: "Emergency medicine Emergency department Discharge summary" },
  RawatInap: { system: "http://loinc.org", code: "34105-7", display: "Hospital Discharge summary" },
};

// ── Observation pemeriksaan (L09 / L11 / L12) ───────────────

/** `Observation.category` (HL7 observation-category). */
export const OBSERVATION_CATEGORY = {
  vitalSigns: { system: `${HL7}/observation-category`, code: "vital-signs", display: "Vital Signs" },
  exam: { system: `${HL7}/observation-category`, code: "exam", display: "Exam" },
  survey: { system: `${HL7}/observation-category`, code: "survey", display: "Survey" },
} as const satisfies Record<string, Coding>;

/** Sistem head-to-toe form Pemeriksaan Fisik EHIS (= `SistemFisikKey` di lib/data.ts). */
export type SistemFisikLokal =
  | "kepala" | "mata" | "tht" | "leher" | "toraks_paru"
  | "jantung" | "abdomen" | "urogenital" | "ekstremitas" | "neurologi" | "kulit";

const loincExam = (code: string, display: string): Coding => ({ system: "http://loinc.org", code, display });

/**
 * L10 — sistem EHIS → `Observation.code` head-to-toe (category `exam`, `valueString`). Kode verbatim playbook
 * RJ/RI Tabel 5 · IGD Tabel 6 item 3 (28 bagian) + contoh resmi RI. `null` = ditahan (D12: 5 sistem padan dulu):
 * tht/urogenital/ekstremitas = 1 teks EHIS untuk banyak bagian playbook (pecah field bertahap);
 * jantung/neurologi/kulit = tidak ada di daftar head-to-toe playbook.
 */
export const PEMERIKSAAN_FISIK: Record<SistemFisikLokal, Coding | null> = {
  kepala: loincExam("10199-8", "Physical findings of Head Narrative"),
  mata: loincExam("10197-2", "Physical findings of Eye Narrative"),
  leher: loincExam("11411-6", "Physical findings of Neck Narrative"),
  toraks_paru: loincExam("11391-0", "Physical findings of Chest Narrative"), // playbook "Dada"
  abdomen: loincExam("10191-5", "Physical findings of Abdomen Narrative"), // playbook "Perut"
  tht: null,
  urogenital: null,
  ekstremitas: null,
  jantung: null,
  neurologi: null,
  kulit: null,
};

/** L09 — `Observation.code` tingkat kesadaran (LOINC). */
export const KESADARAN_CODE: Coding = { system: "http://loinc.org", code: "67775-7", display: "Level of responsiveness" };

export type AvpuLokal = "Alert" | "Verbal" | "Pain" | "Unresponsive";

/** L09 — AVPU Triase IGD → nilai SNOMED (playbook IGD §5, verbatim; padanan langsung). */
export const KESADARAN_AVPU: Record<AvpuLokal, Coding> = {
  Alert: { system: "http://snomed.info/sct", code: "248234008", display: "Mentally alert" },
  Verbal: { system: "http://snomed.info/sct", code: "300202002", display: "Response to voice" },
  Pain: { system: "http://snomed.info/sct", code: "450847001", display: "Response to pain" },
  Unresponsive: { system: "http://snomed.info/sct", code: "422768004", display: "Unresponsive" },
};

export type StatusKesadaranLokal = "Compos_Mentis" | "Apatis" | "Somnolen" | "Sopor" | "Koma";

/**
 * L09 — status kesadaran TTV → nilai SNOMED (ConceptMap usulan L09, padanan mendekati untuk Somnolen/Sopor).
 * `null` = belum ada padanan → item ditahan (Apatis — keputusan D3).
 */
export const KESADARAN_TTV: Record<StatusKesadaranLokal, Coding | null> = {
  Compos_Mentis: KESADARAN_AVPU.Alert,
  Somnolen: KESADARAN_AVPU.Verbal,
  Sopor: KESADARAN_AVPU.Pain,
  Koma: KESADARAN_AVPU.Unresponsive,
  Apatis: null,
};

/** L11 — induk asesmen nyeri & skor NRS (playbook IGD §5 "Asesmen nyeri", verbatim). */
export const NYERI_CODE = {
  pain: { system: "http://snomed.info/sct", code: "22253000", display: "Pain" },
  nrs: { system: "http://snomed.info/sct", code: "1172399009", display: "Numeric rating scale score" },
} as const satisfies Record<string, Coding>;

// ── Rencana & pulang (L15 / L22 / L23 / L25) — verbatim playbook RJ v7.0 · IGD v5.2 · RI v6.0 ──

/**
 * L22 — `CarePlan.category` rencana rawat per unit. IGD: tabel playbook IGD Tabel 10 `TK000068` (contoh Bundle
 * memakai SNOMED 702779007 — berbeda, ikut tabel; FG-120). RI: Tabel 9. RJ: contoh Bundle resmi.
 */
export const CAREPLAN_CATEGORY: Record<KunjunganUnit, Coding> = {
  RawatInap: { system: "http://snomed.info/sct", code: "736353004", display: "Inpatient care plan" },
  IGD: { system: KEMKES_BASE, code: "TK000068", display: "Emergency care plan" },
  RawatJalan: { system: "http://snomed.info/sct", code: "736271009", display: "Outpatient care plan" },
};

/** L23 — CarePlan perencanaan pemulangan. */
export const CAREPLAN_DISCHARGE: Coding = { system: "http://snomed.info/sct", code: "736372004", display: "Discharge care plan" };

/** L22 — status masalah rencana asuhan → `CarePlan.status`. */
export const CAREPLAN_STATUS: Record<"Aktif" | "Teratasi" | "Batal", "active" | "completed" | "revoked"> = {
  Aktif: "active",
  Teratasi: "completed",
  Batal: "revoked",
};

export type GoalStatusLokal = "Belum_Tercapai" | "Tercapai_Sebagian" | "Tercapai";

/** L22 — status goal → `Goal.achievementStatus` (HL7 goal-achievement) + `lifecycleStatus`. */
export const GOAL_STATUS: Record<GoalStatusLokal, { lifecycle: "active" | "completed"; achievement: Coding }> = {
  Belum_Tercapai: { lifecycle: "active", achievement: { system: `${HL7}/goal-achievement`, code: "in-progress", display: "In Progress" } },
  Tercapai_Sebagian: { lifecycle: "active", achievement: { system: `${HL7}/goal-achievement`, code: "improving", display: "Improving" } },
  Tercapai: { lifecycle: "completed", achievement: { system: `${HL7}/goal-achievement`, code: "achieved", display: "Achieved" } },
};

/** L15 — Procedure edukasi: category + KPTL umum (playbook: SNOMED topik **dan** KPTL dalam 1 payload). */
export const EDUKASI = {
  category: { system: "http://snomed.info/sct", code: "409073007", display: "Education" },
  kptl: { system: "http://terminology.kemkes.go.id/CodeSystem/kptl", code: "10913", display: "Edukasi Kesehatan Individu" },
} as const satisfies Record<string, Coding>;

const sct = (code: string, display: string): Coding => ({ system: SCT, code, display });

export type EdukasiTopikId =
  | "edu-01" | "edu-02" | "edu-03" | "edu-04" | "edu-05" | "edu-06" | "edu-07" | "edu-08" | "edu-09" | "edu-10" | "edu-11" | "edu-12";

/**
 * L15 — topik edukasi pemulangan (template FE `TOPIK_EDUKASI_TEMPLATE`) → SNOMED topik (daftar 7 kode playbook RJ
 * Tabel 25 / RI Tabel 26). `null` = tidak ada padanan pasti di daftar playbook → edukasi ditahan (FG-122; tetapkan
 * klinis sebelum diisi — jangan karang kode).
 */
export const EDUKASI_TOPIK: Record<EdukasiTopikId, Coding | null> = {
  "edu-01": sct("84635008", "Disease process or condition education"), // Diagnosis & perjalanan penyakit
  "edu-02": null, // Tanda bahaya → ke RS/IGD
  "edu-03": sct("967006", "Medication education"), // Cara penggunaan obat & kepatuhan
  "edu-04": sct("967006", "Medication education"), // Efek samping obat
  "edu-05": sct("61310001", "Nutrition education"), // Diet & nutrisi
  "edu-06": null, // Restriksi cairan & pemantauan BB
  "edu-07": sct("410082002", "Rehabilitation therapy education"), // Aktivitas fisik bertahap (kategori Rehabilitasi)
  "edu-08": null, // Perawatan di rumah (luka/alat bantu) — campuran
  "edu-09": null, // Jadwal kontrol
  "edu-10": null, // Pemantauan kondisi di rumah
  "edu-11": null, // Edukasi keluarga/caregiver
  "edu-12": null, // Modifikasi gaya hidup
};

/** L25 — rencana tindak lanjut (playbook RJ Tabel 28/30). */
export const TINDAK_LANJUT = {
  category: sct("3457005", "Patient referral"),
  rawatInap: sct("737481003", "Inpatient care management"),
  rawatJalan: sct("737492002", "Outpatient care management"),
  kontrol: sct("185389009", "Follow-up visit"),
  konsultasi: sct("11429006", "Consultation"),
} as const satisfies Record<string, Coding>;

/** L25 — `ServiceRequest.locationCode` (v3-RoleCode, playbook RJ Tabel 30). */
export const LOKASI_TINDAK_LANJUT = {
  poli: { system: `${HL7}/v3-RoleCode`, code: "OF", display: "Outpatient facility" },
  rumahSakit: { system: `${HL7}/v3-RoleCode`, code: "HOSP", display: "Hospital" },
  faskesPrimer: { system: `${HL7}/v3-RoleCode`, code: "PC", display: "Primary care clinic" },
  ambulans: { system: `${HL7}/v3-RoleCode`, code: "AMB", display: "Ambulance" },
} as const satisfies Record<string, Coding>;

// ── AllergyIntolerance (L06) ────────────────────────────────

export type AlergiKategori = "Obat" | "Makanan" | "Lainnya";

/** Kategori alergi lokal → `AllergyIntolerance.category` (code FHIR, bukan Coding). */
export const ALLERGY_CATEGORY: Record<AlergiKategori, "medication" | "food" | "environment"> = {
  Obat: "medication",
  Makanan: "food",
  Lainnya: "environment",
};

// ── Obat (L18/L20) ──────────────────────────────────────────

/** Rute pemberian lokal → kode rute ATC (`http://www.whocc.no/atc`, dipakai contoh resmi). */
export const ROUTE_ATC: Record<string, Coding> = {
  PO: { system: "http://www.whocc.no/atc", code: "O", display: "Oral" },
  Oral: { system: "http://www.whocc.no/atc", code: "O", display: "Oral" },
  SL: { system: "http://www.whocc.no/atc", code: "SL", display: "Sublingual" },
  IV: { system: "http://www.whocc.no/atc", code: "P", display: "Parenteral" },
  IM: { system: "http://www.whocc.no/atc", code: "P", display: "Parenteral" },
  SC: { system: "http://www.whocc.no/atc", code: "P", display: "Parenteral" },
  Rektal: { system: "http://www.whocc.no/atc", code: "R", display: "Rectal" },
  Inhalasi: { system: "http://www.whocc.no/atc", code: "Inhal", display: "Inhalation" },
  Nasal: { system: "http://www.whocc.no/atc", code: "N", display: "Nasal" },
  Transdermal: { system: "http://www.whocc.no/atc", code: "TD", display: "Transdermal" },
  Vaginal: { system: "http://www.whocc.no/atc", code: "V", display: "Vaginal" },
};

export type KategoriResep = "outpatient" | "inpatient" | "discharge";

/** Kategori resep/dispense — code sama untuk MedicationRequest & MedicationDispense (system berbeda). */
export const MEDICATION_CATEGORY_DISPLAY: Record<KategoriResep, string> = {
  outpatient: "Outpatient",
  inpatient: "Inpatient",
  discharge: "Discharge",
};

export type MarStatusLokal = "Diberikan" | "Ditunda" | "Ditolak" | "TidakTersedia";

/**
 * L21 — status MAR → `MedicationAdministration.status` (FHIR medication-admin-status; playbook RI §19: "kode FHIR
 * Terminology"). `null` = belum diberikan → tidak dikirim (ditarik `entered-in-error` bila slot pernah terkirim).
 * `alasan` = `statusReason.text` (playbook tidak memberi kode statusReason — FG-115).
 */
export const MAR_STATUS: Record<MarStatusLokal, { status: "completed" | "not-done"; alasan?: string } | null> = {
  Diberikan: { status: "completed" },
  Ditolak: { status: "not-done", alasan: "Pasien menolak obat" },
  TidakTersedia: { status: "not-done", alasan: "Obat tidak tersedia" },
  Ditunda: null,
};

// ── Order (L16/L17/L18) ─────────────────────────────────────

/** Prioritas order lokal → `ServiceRequest.priority` / `MedicationRequest.priority`. */
export const ORDER_PRIORITY: Record<string, "stat" | "urgent" | "routine"> = {
  CITO: "stat",
  Segera: "urgent",
  Rutin: "routine",
};

// ── Helper lookup aman (input string bebas dari DB) ─────────

/** Lookup map ber-kunci union dengan nilai string mentah dari DB; nilai tak dikenal → undefined. */
export function lookup<K extends string, V>(map: Partial<Record<K, V>>, key: string | null | undefined): V | undefined {
  return key != null && Object.prototype.hasOwnProperty.call(map, key) ? map[key as K] : undefined;
}
