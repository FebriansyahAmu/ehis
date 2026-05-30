/**
 * Aplicares Adapter (BP0.4).
 *
 * Bridging ke BPJS Aplicares REST API — bed monitoring sync.
 * Aligned 1:1 dengan [contracts/Aplicares-contracts.md].
 *
 * Base URL: `BPJS_CREDS_MOCK.aplicaresBaseUrl` = "https://apijkn.bpjs-kesehatan.go.id/aplicaresws-rest"
 *
 * 5 endpoints:
 * - getRefKelas       — GET  /ref/kelas                      (spec 1)
 * - listKamar         — GET  /bed/read/{kodeppk}/{start}/{limit} (spec 4)
 * - insertKamar       — POST /bed/create/{kodeppk}           (spec 3)
 * - updateKamar       — POST /bed/update/{kodeppk}           (spec 2)
 * - deleteKamar       — POST /bed/delete/{kodeppk}           (spec 5)
 *
 * + setMaintenance: wrapper updateKamar (set tersedia=0 saat maintenance aktif).
 * + getMapKelas: internal mapping kelas BPJS → kelas RS lokal (dari getRefKelas).
 *
 * Mock derive dari `RUANGAN_MOCK` (master ruangan) via `aplicaresKamarMock`.
 * Auto-audit via `wrapWithAudit`.
 *
 * Cross-link:
 * - `LocationNode.beds[]` di master ruangan = source of truth bed.
 * - Aplicares = mirror untuk transparansi publik (PMK 4/2018).
 */

import {
  Err,
  type AplicaresKamarRecord,
  type BPJSConfig,
  type BPJSEnvelope,
  type BPJSError,
  type KelasBPJSKode,
  type MapKelasRecord,
  type Result,
} from "./bpjsShared";
import type { BedAplicaresRecord, BedDeleteAplicaresPayload, RefKelasAplicaresItem } from "./bpjsContracts";
import { errEnvelope, okEnvelope, preflightMock, wrapWithAudit } from "./vClaimShared";
import { APLICARES_ENDPOINTS } from "./bpjsEndpoints";
import { BPJS_CREDS_MOCK } from "./credentialsStore";
import { APLICARES_KAMAR_MOCK, findKamarByKode } from "./mock/aplicaresKamarMock";

// ── Resolve kodePPK ────────────────────────────────────

function resolvePPK(config: BPJSConfig): string {
  return config.kodePPK ?? BPJS_CREDS_MOCK.kodePPK;
}

// ── getRefKelas ────────────────────────────────────────
// Spec 1: GET /ref/kelas — referensi kelas kamar

const REF_KELAS_MOCK: RefKelasAplicaresItem[] = [
  { kodekelas: "NON", namakelas: "-" },
  { kodekelas: "VVP", namakelas: "VVIP" },
  { kodekelas: "VIP", namakelas: "VIP" },
  { kodekelas: "1",   namakelas: "Kelas 1" },
  { kodekelas: "2",   namakelas: "Kelas 2" },
  { kodekelas: "3",   namakelas: "Kelas 3" },
];

export function getRefKelas(
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<RefKelasAplicaresItem[]>, BPJSError>> {
  const endpoint = APLICARES_ENDPOINTS.ref.kelas;
  return wrapWithAudit<RefKelasAplicaresItem[]>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      return okEnvelope(REF_KELAS_MOCK);
    },
  )();
}

// ── getMapKelas ────────────────────────────────────────
// Mapping kelas BPJS (dari /ref/kelas) → kelas RS lokal (internal enrichment)

const MAP_KELAS_MOCK: MapKelasRecord[] = [
  { kdKelasBPJS: "VIP", namaKelasBPJS: "VIP",     kdKelasLokal: "VIP",     namaKelasLokal: "VIP",     multiplier: 1.5  },
  { kdKelasBPJS: "1",   namaKelasBPJS: "Kelas 1", kdKelasLokal: "Kelas_1", namaKelasLokal: "Kelas 1", multiplier: 1.0  },
  { kdKelasBPJS: "2",   namaKelasBPJS: "Kelas 2", kdKelasLokal: "Kelas_2", namaKelasLokal: "Kelas 2", multiplier: 0.85 },
  { kdKelasBPJS: "3",   namaKelasBPJS: "Kelas 3", kdKelasLokal: "Kelas_3", namaKelasLokal: "Kelas 3", multiplier: 0.7  },
  { kdKelasBPJS: "1",   namaKelasBPJS: "Kelas 1", kdKelasLokal: "ICU",     namaKelasLokal: "ICU",     multiplier: 1.3  },
  { kdKelasBPJS: "1",   namaKelasBPJS: "Kelas 1", kdKelasLokal: "HCU",     namaKelasLokal: "HCU",     multiplier: 1.15 },
  { kdKelasBPJS: "1",   namaKelasBPJS: "Kelas 1", kdKelasLokal: "Isolasi", namaKelasLokal: "Isolasi", multiplier: 1.1  },
];

export function getMapKelas(
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<MapKelasRecord[]>, BPJSError>> {
  const endpoint = APLICARES_ENDPOINTS.ref.kelas;
  return wrapWithAudit<MapKelasRecord[]>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      return okEnvelope(MAP_KELAS_MOCK);
    },
  )();
}

// ── listKamar ──────────────────────────────────────────
// Spec 4: GET /bed/read/{kodeppk}/{start}/{limit}

export function listKamar(
  start = 1,
  limit = 100,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<AplicaresKamarRecord[]>, BPJSError>> {
  const kodeppk = resolvePPK(config);
  const endpoint = APLICARES_ENDPOINTS.bed.read(kodeppk, start, limit);
  return wrapWithAudit<AplicaresKamarRecord[]>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      return okEnvelope([...APLICARES_KAMAR_MOCK]);
    },
  )();
}

// ── insertKamar ────────────────────────────────────────
// Spec 3: POST /bed/create/{kodeppk}

export interface InsertKamarPayload {
  kdKelas: KelasBPJSKode;
  kodeRuang: string;
  namaRuang: string;
  kapasitas: number;
  tersedia: number;
  tersediaPria?: number;
  tersediaWanita?: number;
  tersediaPriaWanita?: number;
}

export function insertKamar(
  payload: InsertKamarPayload,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<BedAplicaresRecord>, BPJSError>> {
  const kodeppk = resolvePPK(config);
  const endpoint = APLICARES_ENDPOINTS.bed.create(kodeppk);
  return wrapWithAudit<BedAplicaresRecord>(
    { endpoint, method: "POST" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const exists = findKamarByKode(payload.kodeRuang);
      if (exists) return errEnvelope("202", endpoint, "Kode ruang sudah terdaftar");
      if (payload.kapasitas <= 0) return errEnvelope("204", endpoint, "Kapasitas harus > 0");
      if (payload.tersedia > payload.kapasitas) {
        return errEnvelope("204", endpoint, "Tersedia tidak boleh melebihi kapasitas");
      }
      const wire: BedAplicaresRecord = {
        kodekelas: payload.kdKelas,
        koderuang: payload.kodeRuang,
        namaruang: payload.namaRuang,
        kapasitas: String(payload.kapasitas),
        tersedia: String(payload.tersedia),
        ...(payload.tersediaPria != null && { tersediapria: String(payload.tersediaPria) }),
        ...(payload.tersediaWanita != null && { tersediawanita: String(payload.tersediaWanita) }),
        ...(payload.tersediaPriaWanita != null && { tersediapriawanita: String(payload.tersediaPriaWanita) }),
      };
      return okEnvelope(wire, "Kamar berhasil di-insert");
    },
  )();
}

// ── updateKamar ────────────────────────────────────────
// Spec 2: POST /bed/update/{kodeppk}

export interface UpdateKamarPayload {
  kdKelas: KelasBPJSKode;
  kodeRuang: string;
  namaRuang: string;
  kapasitas: number;
  tersedia: number;
  tersediaPria?: number;
  tersediaWanita?: number;
  tersediaPriaWanita?: number;
}

export function updateKamar(
  payload: UpdateKamarPayload,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<BedAplicaresRecord>, BPJSError>> {
  const kodeppk = resolvePPK(config);
  const endpoint = APLICARES_ENDPOINTS.bed.update(kodeppk);
  return wrapWithAudit<BedAplicaresRecord>(
    { endpoint, method: "POST" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const exists = findKamarByKode(payload.kodeRuang);
      if (!exists) return errEnvelope("201", endpoint, "Kamar tidak ditemukan");
      if (payload.tersedia > payload.kapasitas) {
        return errEnvelope("204", endpoint, "Tersedia tidak boleh melebihi kapasitas");
      }
      const wire: BedAplicaresRecord = {
        kodekelas: payload.kdKelas,
        koderuang: payload.kodeRuang,
        namaruang: payload.namaRuang,
        kapasitas: String(payload.kapasitas),
        tersedia: String(payload.tersedia),
        ...(payload.tersediaPria != null && { tersediapria: String(payload.tersediaPria) }),
        ...(payload.tersediaWanita != null && { tersediawanita: String(payload.tersediaWanita) }),
        ...(payload.tersediaPriaWanita != null && { tersediapriawanita: String(payload.tersediaPriaWanita) }),
      };
      return okEnvelope(wire, "Kamar berhasil di-update");
    },
  )();
}

// ── deleteKamar ────────────────────────────────────────
// Spec 5: POST /bed/delete/{kodeppk}

export function deleteKamar(
  payload: BedDeleteAplicaresPayload,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<BedDeleteAplicaresPayload>, BPJSError>> {
  const kodeppk = resolvePPK(config);
  const endpoint = APLICARES_ENDPOINTS.bed.delete(kodeppk);
  return wrapWithAudit<BedDeleteAplicaresPayload>(
    { endpoint, method: "POST" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const exists = findKamarByKode(payload.koderuang);
      if (!exists) return errEnvelope("201", endpoint, "Kamar tidak ditemukan");
      if (exists.terisi > 0) {
        return errEnvelope("204", endpoint, "Kamar masih terisi pasien");
      }
      return okEnvelope(
        { kodekelas: payload.kodekelas, koderuang: payload.koderuang },
        "Kamar berhasil dihapus",
      );
    },
  )();
}

// ── setMaintenance ─────────────────────────────────────
// Wrapper updateKamar — set tersedia=0 saat maintenance aktif.
// Tidak ada di contract Aplicares; ini abstraksi RS-side (PMK 4/2018 transparansi).

export function setMaintenance(
  payload: {
    kdKelas: KelasBPJSKode;
    kodeRuang: string;
    namaRuang: string;
    kapasitas: number;
    aktif: boolean;
    alasan?: string;
  },
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<BedAplicaresRecord>, BPJSError>> {
  const kodeppk = resolvePPK(config);
  const endpoint = APLICARES_ENDPOINTS.bed.update(kodeppk);
  return wrapWithAudit<BedAplicaresRecord>(
    { endpoint, method: "POST" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const exists = findKamarByKode(payload.kodeRuang);
      if (!exists) return errEnvelope("201", endpoint, "Kamar tidak ditemukan");
      if (payload.aktif && (!payload.alasan || payload.alasan.trim().length < 10)) {
        return errEnvelope("204", endpoint, "Alasan maintenance minimal 10 karakter");
      }
      const tersedia = payload.aktif ? 0 : payload.kapasitas;
      const wire: BedAplicaresRecord = {
        kodekelas: payload.kdKelas,
        koderuang: payload.kodeRuang,
        namaruang: payload.namaRuang,
        kapasitas: String(payload.kapasitas),
        tersedia: String(tersedia),
      };
      return okEnvelope(
        wire,
        payload.aktif ? "Status maintenance aktif (tersedia=0)" : "Maintenance dinonaktifkan",
      );
    },
  )();
}

/** Re-export full mock untuk consumer inspection. */
export { APLICARES_KAMAR_MOCK };
