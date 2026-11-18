/**
 * Kontrak "link" pemetaan EMR → FHIR (docs/fhir-mapping/ARSITEKTUR.md §4, FLOW.md §2–§4).
 * Satu link = satu sumber data EHIS → satu "kamar" resource SatuSehat (spesifikasi: docs/fhir-mapping/Lnn-*.md).
 *
 * Aman diimpor client maupun server (tipe saja).
 */

import type { KunjunganUnit } from "../conceptMap";

export type LinkId =
  | "L01" | "L02" | "L03" | "L04" | "L05" | "L06" | "L07" | "L08" | "L09" | "L10" | "L11" | "L12" | "L13"
  | "L14" | "L15" | "L16" | "L17" | "L18" | "L19" | "L20" | "L21" | "L22" | "L23" | "L24" | "L25" | "L26"
  | "L27";

/**
 * Status implementasi link (README "Peta kamar"):
 * aktif = sudah ada & sesuai · koreksi = ada tapi salah kamar/kode/pola · baru = belum dibangun ·
 * ditunda = keputusan user (mis. L02 triase).
 */
export type LinkStatus = "aktif" | "koreksi" | "baru" | "ditunda";

export interface LinkMeta {
  id: LinkId;
  /** Nama camelCase sesuai dokumen, mis. `kunjunganToEncounter`. */
  name: string;
  resourceTypes: string[];
  units: KunjunganUnit[];
  status: LinkStatus;
  /** Dokumen spesifikasi relatif dari docs/fhir-mapping/. */
  doc: string;
}

/** Alasan item belum siap dikirim (gerbang readiness, FLOW.md §4). */
export type IssueCode =
  | "kode-kosong" //       kode standar wajib belum diisi (ICD-10 / ICD-9-CM / LOINC / KFA / SNOMED)
  | "kode-tidak-valid" //  format / check digit salah
  | "kategori-salah" //    mis. kode LOINC "Hasil" dipakai di ServiceRequest
  | "nakes-tanpa-ihs" //   Practitioner (penulis/pelaksana) belum terpetakan
  | "di-luar-playbook" // parameter tanpa kamar resmi (GCS, SpO₂, Barthel — D5)
  | "menunggu-keputusan" // padanan kode ada tapi menunggu keputusan klinis (D-nomor di README, mis. D3 Apatis · D13 Braden)
  | "syarat-finished"; //  Encounter ditahan `in-progress`: syarat finished (CC + diagnosis) belum terpenuhi

/** Item yang ditahan: tidak dikirim, tidak menggagalkan job, tampil di konsol per kunjungan. */
export interface Issue {
  link: LinkId;
  resourceType: string;
  localId: string;
  code: IssueCode;
  message: string;
}

/**
 * Kontrak builder link (dipakai link baru mulai S2). `build` murni: tanpa I/O, tanpa `new Date()` — semua
 * waktu dari kolom klinis, semua id dari `ctx` → hash stabil.
 */
export interface FhirLink<Row, Ctx, Res> {
  meta: LinkMeta;
  rows(snapshot: unknown): Row[];
  localId(row: Row, key?: string): string;
  readiness(row: Row, ctx: Ctx): Issue[];
  build(row: Row, ctx: Ctx): { key?: string; resource: Res }[];
}
