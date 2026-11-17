/**
 * Gerbang & localId link rencana & pulang (fase B6, FLOW.md §3): L15 edukasi · L22 rencana asuhan · L23 rencana
 * pemulangan · L25 rencana tindak lanjut. docs/fhir-mapping/L15 · L22 · L23 · L25.
 *
 * Murni (tanpa I/O) — aman diimpor client maupun server.
 */

import { EDUKASI_TOPIK, TINDAK_LANJUT, lookup, type Coding } from "../conceptMap";
import type { Issue } from "./types";

/**
 * localId per sumber. Sumber "latest wins" (DischargeAsesmen) memakai kunci KUNJUNGAN, bukan id baris, agar revisi =
 * PUT resource yang sama. ServiceRequest tindak lanjut diberi prefix tabel (kunci antar-tabel tidak boleh bentrok, L25).
 */
export const rencanaLocalId = {
  rencanaPemulangan: (kunjunganId: string) => `${kunjunganId}:rencana-pemulangan`,
  kriteriaPemulangan: (kunjunganId: string) => `${kunjunganId}:kriteria-pemulangan`,
  kontrol: (id: string) => `jadwal-kontrol:${id}`,
  konsultasi: (id: string) => `konsultasi:${id}`,
  rujukan: (id: string) => `rujukan:${id}`,
  spri: (id: string) => `spri:${id}`,
};

// ── L15 edukasi ─────────────────────────────────────────────

/** Topik edukasi → SNOMED; tanpa padanan → Issue (KPTL 10913 saja tidak cukup — playbook: 2 coding). */
export function edukasiKodeOf(e: { id: string; topikId: string; topik: string }): { ok: true; coding: Coding } | { ok: false; issue: Issue } {
  const coding = lookup(EDUKASI_TOPIK, e.topikId);
  if (coding) return { ok: true, coding };
  return {
    ok: false,
    issue: {
      link: "L15", resourceType: "Procedure", localId: e.id, code: "kode-kosong",
      message: `Edukasi "${e.topik}" belum punya kode topik SNOMED (daftar playbook) — ditahan`,
    },
  };
}

/** Tanggal WIB (YYYY-MM-DD) suatu instant. */
export function tanggalWib(d: Date): string {
  return new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 10);
}

// ── L23 rencana pemulangan ──────────────────────────────────

export interface DischargeAsesmenRow {
  tanggalRencanaKrs: string;
  kondisiPulang: string;
  caregiverNama: string;
  caregiverHubungan: string;
  kebutuhanHomecare: boolean;
  jenisHomecare: string[];
  kebutuhanAlatBantu: boolean;
  alatBantu: string[];
  catatan: string;
}

/** Ringkasan rencana pemulangan untuk `CarePlan.description` (teks; kolom terstruktur EHIS → kalimat). */
export function rencanaPemulanganTeks(a: DischargeAsesmenRow): string {
  const caregiver = a.caregiverNama.trim()
    ? `pendamping ${a.caregiverNama.trim()}${a.caregiverHubungan.trim() ? ` (${a.caregiverHubungan.trim()})` : ""}`
    : "";
  const parts = [
    a.tanggalRencanaKrs ? `rencana pulang ${a.tanggalRencanaKrs}` : "",
    a.kondisiPulang ? `perkiraan kondisi pulang ${a.kondisiPulang}` : "",
    caregiver,
    a.kebutuhanHomecare ? `perawatan di rumah${a.jenisHomecare.length ? `: ${a.jenisHomecare.join(", ")}` : ""}` : "",
    a.kebutuhanAlatBantu ? `alat bantu${a.alatBantu.length ? `: ${a.alatBantu.join(", ")}` : ""}` : "",
    a.catatan.trim(),
  ].filter(Boolean);
  if (!parts.length) return "Perencanaan pemulangan pasien";
  const teks = parts.join("; ");
  return teks.charAt(0).toUpperCase() + teks.slice(1);
}

/** L23 — Observation kriteria `OC000055` tidak bisa diturunkan dari data EHIS (D15) → selalu Issue bila ada asesmen. */
export function kriteriaPemulanganIssue(kunjunganId: string): Issue {
  return {
    link: "L23", resourceType: "Observation", localId: rencanaLocalId.kriteriaPemulangan(kunjunganId), code: "menunggu-keputusan",
    message: "Kriteria rencana pemulangan (OC000055) belum dicatat di Asesmen Discharge (keputusan D15) — Observation ditahan",
  };
}

// ── L25 rencana tindak lanjut ───────────────────────────────

/** Snapshot `RujukanEksternal.detail` (JSONB) — dibaca defensif. */
export interface RujukanDetailLite {
  jnsPelayanan: string;
  tipeRujukan: string;
  tglRencanaKunjungan: string;
  tujuan: string;
  poli: string;
  diagnosa: { kode: string; nama: string } | null;
  catatan: string;
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const namaOf = (v: unknown) => (v && typeof v === "object" ? str((v as Record<string, unknown>).nama) : "");

export function rujukanDetailOf(detail: unknown): RujukanDetailLite {
  const d = (detail && typeof detail === "object" ? detail : {}) as Record<string, unknown>;
  const dx = (d.diagnosa && typeof d.diagnosa === "object" ? d.diagnosa : {}) as Record<string, unknown>;
  return {
    jnsPelayanan: str(d.jnsPelayanan),
    tipeRujukan: str(d.tipeRujukan),
    tglRencanaKunjungan: str(d.tglRencanaKunjungan),
    tujuan: namaOf(d.tujuanRujukan),
    poli: namaOf(d.poliTujuan),
    diagnosa: str(dx.kode) ? { kode: str(dx.kode).toUpperCase(), nama: str(dx.nama) } : null,
    catatan: str(d.catatan),
  };
}

/**
 * Rujukan eksternal → kode tindak lanjut. BPJS `jnsPelayanan`: "1" Rawat Inap → 737481003 · "2" Rawat Jalan → 737492002.
 * Lainnya = data rusak → Issue.
 */
export function rujukanKodeOf(id: string, d: RujukanDetailLite): { ok: true; coding: Coding } | { ok: false; issue: Issue } {
  if (d.jnsPelayanan === "1") return { ok: true, coding: TINDAK_LANJUT.rawatInap };
  if (d.jnsPelayanan === "2") return { ok: true, coding: TINDAK_LANJUT.rawatJalan };
  return {
    ok: false,
    issue: {
      link: "L25", resourceType: "ServiceRequest", localId: rencanaLocalId.rujukan(id), code: "kode-tidak-valid",
      message: `Rujukan eksternal tanpa jenis pelayanan yang valid ("${d.jnsPelayanan}") — ditahan`,
    },
  };
}

/** SPRI (rujukan internal rawat inap) — pola kirim menunggu keputusan D8 (SR SPRI + Encounter RI `basedOn`). */
export function spriIssue(id: string): Issue {
  return {
    link: "L25", resourceType: "ServiceRequest", localId: rencanaLocalId.spri(id), code: "menunggu-keputusan",
    message: "SPRI (rujukan internal rawat inap) ditahan — pola ServiceRequest SPRI + tautan Encounter RI menunggu keputusan D8",
  };
}
