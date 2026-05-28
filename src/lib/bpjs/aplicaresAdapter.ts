/**
 * Aplicares Adapter (BP0.4).
 *
 * Bridging ke BPJS Aplicares REST API — bed monitoring sync.
 *
 * Spek reference: BPJS Aplicares API spec
 * https://apijkn.bpjs-kesehatan.go.id/aplicaresws-rest/
 *
 * 7 methods covering bed CRUD + ref data:
 * - getReferensiKamar — `/ref/kamar`
 * - getMapKelas — `/ref/kelas`
 * - listKamar — `/kamar/list`
 * - insertKamar — `/kamar/insert`
 * - updateKamar — `/kamar/update`
 * - deleteKamar — `/kamar/delete`
 * - setMaintenance (wrapper updateKamar dengan flagMaintenance)
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
import { errEnvelope, okEnvelope, preflightMock, wrapWithAudit } from "./vClaimShared";
import { APLICARES_ENDPOINTS } from "./bpjsEndpoints";
import { APLICARES_KAMAR_MOCK, findKamarByKode } from "./mock/aplicaresKamarMock";

// ── getReferensiKamar ──────────────────────────────────

export interface ReferensiKamarRecord {
  kdKelas: KelasBPJSKode;
  namaKelas: string;
  kapasitasStandar: number;
}

const REFERENSI_KAMAR_REF: ReferensiKamarRecord[] = [
  { kdKelas: "VIP", namaKelas: "VIP", kapasitasStandar: 1 },
  { kdKelas: "1", namaKelas: "Kelas 1", kapasitasStandar: 2 },
  { kdKelas: "2", namaKelas: "Kelas 2", kapasitasStandar: 4 },
  { kdKelas: "3", namaKelas: "Kelas 3", kapasitasStandar: 6 },
];

export function getReferensiKamar(
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<ReferensiKamarRecord[]>, BPJSError>> {
  const endpoint = APLICARES_ENDPOINTS.ref.kamar;
  return wrapWithAudit<ReferensiKamarRecord[]>(
    { endpoint, method: "POST" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      return okEnvelope(REFERENSI_KAMAR_REF);
    },
  )();
}

// ── getMapKelas ────────────────────────────────────────

const MAP_KELAS_MOCK: MapKelasRecord[] = [
  { kdKelasBPJS: "VIP", namaKelasBPJS: "VIP", kdKelasLokal: "VIP", namaKelasLokal: "VIP", multiplier: 1.5 },
  { kdKelasBPJS: "1", namaKelasBPJS: "Kelas 1", kdKelasLokal: "Kelas_1", namaKelasLokal: "Kelas 1", multiplier: 1.0 },
  { kdKelasBPJS: "2", namaKelasBPJS: "Kelas 2", kdKelasLokal: "Kelas_2", namaKelasLokal: "Kelas 2", multiplier: 0.85 },
  { kdKelasBPJS: "3", namaKelasBPJS: "Kelas 3", kdKelasLokal: "Kelas_3", namaKelasLokal: "Kelas 3", multiplier: 0.7 },
  { kdKelasBPJS: "1", namaKelasBPJS: "Kelas 1", kdKelasLokal: "ICU", namaKelasLokal: "ICU", multiplier: 1.3 },
  { kdKelasBPJS: "1", namaKelasBPJS: "Kelas 1", kdKelasLokal: "HCU", namaKelasLokal: "HCU", multiplier: 1.15 },
  { kdKelasBPJS: "1", namaKelasBPJS: "Kelas 1", kdKelasLokal: "Isolasi", namaKelasLokal: "Isolasi", multiplier: 1.1 },
];

export function getMapKelas(
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<MapKelasRecord[]>, BPJSError>> {
  const endpoint = APLICARES_ENDPOINTS.ref.kelas;
  return wrapWithAudit<MapKelasRecord[]>(
    { endpoint, method: "POST" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      return okEnvelope(MAP_KELAS_MOCK);
    },
  )();
}

// ── listKamar ──────────────────────────────────────────

export function listKamar(
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<AplicaresKamarRecord[]>, BPJSError>> {
  const endpoint = APLICARES_ENDPOINTS.kamar.list;
  return wrapWithAudit<AplicaresKamarRecord[]>(
    { endpoint, method: "POST" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      return okEnvelope([...APLICARES_KAMAR_MOCK]);
    },
  )();
}

// ── insertKamar ────────────────────────────────────────

export interface InsertKamarPayload {
  kdKelas: KelasBPJSKode;
  namaKelas: string;
  kapasitas: number;
  namaRuang: string;
  kodeRuang: string;
}

export function insertKamar(
  payload: InsertKamarPayload,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ kodeRuang: string }>, BPJSError>> {
  const endpoint = APLICARES_ENDPOINTS.kamar.insert;
  return wrapWithAudit<{ kodeRuang: string }>(
    { endpoint, method: "POST" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const exists = findKamarByKode(payload.kodeRuang);
      if (exists) return errEnvelope("202", endpoint, "Kode ruang sudah terdaftar");
      if (payload.kapasitas <= 0) {
        return errEnvelope("204", endpoint, "Kapasitas harus > 0");
      }
      return okEnvelope({ kodeRuang: payload.kodeRuang }, "Kamar berhasil di-insert");
    },
  )();
}

// ── updateKamar ────────────────────────────────────────

export interface UpdateKamarPayload {
  kodeRuang: string;
  tersedia?: number;
  terisi?: number;
  kosong?: number;
  flagMaintenance?: boolean;
}

export function updateKamar(
  payload: UpdateKamarPayload,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ kodeRuang: string; lastSyncISO: string }>, BPJSError>> {
  const endpoint = APLICARES_ENDPOINTS.kamar.update;
  return wrapWithAudit<{ kodeRuang: string; lastSyncISO: string }>(
    { endpoint, method: "POST" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const exists = findKamarByKode(payload.kodeRuang);
      if (!exists) return errEnvelope("201", endpoint, "Kamar tidak ditemukan");
      return okEnvelope({
        kodeRuang: payload.kodeRuang,
        lastSyncISO: new Date().toISOString(),
      }, "Kamar berhasil di-update");
    },
  )();
}

// ── deleteKamar ────────────────────────────────────────

export function deleteKamar(
  kodeRuang: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ kodeRuang: string }>, BPJSError>> {
  const endpoint = APLICARES_ENDPOINTS.kamar.delete;
  return wrapWithAudit<{ kodeRuang: string }>(
    { endpoint, method: "POST" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const exists = findKamarByKode(kodeRuang);
      if (!exists) return errEnvelope("201", endpoint, "Kamar tidak ditemukan");
      if (exists.terisi > 0) {
        return errEnvelope("204", endpoint, "Kamar masih terisi pasien");
      }
      return okEnvelope({ kodeRuang }, "Kamar berhasil dihapus");
    },
  )();
}

// ── setMaintenance ─────────────────────────────────────

/**
 * Wrapper `updateKamar` dengan `flagMaintenance: true`.
 * Aplicares pakai endpoint sama (/kamar/update) untuk maintenance toggle.
 */
export function setMaintenance(
  payload: { kodeRuang: string; aktif: boolean; alasan?: string; estimasiSelesaiISO?: string },
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<{ kodeRuang: string; flagMaintenance: boolean }>, BPJSError>> {
  const endpoint = APLICARES_ENDPOINTS.kamar.update;
  return wrapWithAudit<{ kodeRuang: string; flagMaintenance: boolean }>(
    { endpoint, method: "POST" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const exists = findKamarByKode(payload.kodeRuang);
      if (!exists) return errEnvelope("201", endpoint, "Kamar tidak ditemukan");
      if (payload.aktif && (!payload.alasan || payload.alasan.trim().length < 10)) {
        return errEnvelope("204", endpoint, "Alasan maintenance minimal 10 karakter");
      }
      return okEnvelope(
        { kodeRuang: payload.kodeRuang, flagMaintenance: payload.aktif },
        payload.aktif ? "Status maintenance aktif" : "Maintenance dinonaktifkan",
      );
    },
  )();
}

/** Re-export full mock untuk consumer inspection. */
export { APLICARES_KAMAR_MOCK };
