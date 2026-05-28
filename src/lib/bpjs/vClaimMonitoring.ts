/**
 * V-Claim Adapter — Monitoring (BP0.4).
 *
 * 4 method covering monitoring data:
 * - monitoringKunjungan (per tgl + jnsPelayanan)
 * - monitoringKlaim (per tgl + jnsPelayanan + status)
 * - monitoringHistoriPelayanan (per peserta + periode)
 * - monitoringJasaRaharja (per tgl + jnsPelayanan)
 *
 * Mock derive dari `KUNJUNGAN_BPJS_MOCK` / `HISTORI_PELAYANAN_MOCK` /
 * `JASA_RAHARJA_MOCK` di `monitoringMock.ts`.
 */

import {
  Err,
  type BPJSConfig,
  type BPJSEnvelope,
  type BPJSError,
  type ClaimStatusRingkas,
  type HistoriPelayananRecord,
  type JnsPelayananKode,
  type KunjunganBPJSRecord,
  type Result,
} from "./bpjsShared";
import { errEnvelope, okEnvelope, preflightMock, wrapWithAudit } from "./vClaimShared";
import { VCLAIM_ENDPOINTS } from "./bpjsEndpoints";
import {
  HISTORI_PELAYANAN_MOCK,
  JASA_RAHARJA_MOCK,
  KUNJUNGAN_BPJS_MOCK,
} from "./mock/monitoringMock";

// ── monitoringKunjungan ────────────────────────────────

export function monitoringKunjungan(
  tgl: string,
  jnsPelayanan: JnsPelayananKode,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<KunjunganBPJSRecord[]>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.monitoring.kunjungan(tgl, jnsPelayanan);
  return wrapWithAudit<KunjunganBPJSRecord[]>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const list = KUNJUNGAN_BPJS_MOCK.filter(
        (k) => k.tglSEP === tgl && k.jnsPelayanan === jnsPelayanan,
      );
      return okEnvelope(list);
    },
  )();
}

// ── monitoringKlaim ────────────────────────────────────

export function monitoringKlaim(
  tgl: string,
  jnsPelayanan: JnsPelayananKode,
  status: ClaimStatusRingkas | "All",
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<KunjunganBPJSRecord[]>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.monitoring.klaim(tgl, jnsPelayanan, status);
  return wrapWithAudit<KunjunganBPJSRecord[]>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const list = KUNJUNGAN_BPJS_MOCK.filter((k) => {
        if (k.tglSEP !== tgl) return false;
        if (k.jnsPelayanan !== jnsPelayanan) return false;
        if (status !== "All" && k.statusKlaim !== status) return false;
        return true;
      });
      return okEnvelope(list);
    },
  )();
}

// ── monitoringHistoriPelayanan ─────────────────────────

export function monitoringHistoriPelayanan(
  noKartu: string,
  tglMulai: string,
  tglAkhir: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<HistoriPelayananRecord[]>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.monitoring.historiPelayanan(noKartu, tglMulai, tglAkhir);
  return wrapWithAudit<HistoriPelayananRecord[]>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      if (!/^\d{13}$/.test(noKartu)) {
        return errEnvelope("204", endpoint, "Nomor kartu harus 13 digit");
      }
      // Mock: periode validation - max 90 hari
      const startMs = new Date(tglMulai).getTime();
      const endMs = new Date(tglAkhir).getTime();
      const diffDays = (endMs - startMs) / (1000 * 60 * 60 * 24);
      if (diffDays > 90 || diffDays < 0) {
        return errEnvelope("204", endpoint, "Periode max 90 hari & valid");
      }
      const list = HISTORI_PELAYANAN_MOCK.filter(
        (h) => h.tglSEP >= tglMulai && h.tglSEP <= tglAkhir,
      );
      return okEnvelope(list);
    },
  )();
}

// ── monitoringJasaRaharja ──────────────────────────────

export function monitoringJasaRaharja(
  tgl: string,
  jnsPelayanan: JnsPelayananKode,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<KunjunganBPJSRecord[]>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.monitoring.klaimJasaRaharja(tgl, jnsPelayanan);
  return wrapWithAudit<KunjunganBPJSRecord[]>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const list = JASA_RAHARJA_MOCK.filter(
        (k) => k.tglSEP === tgl && k.jnsPelayanan === jnsPelayanan,
      );
      return okEnvelope(list);
    },
  )();
}
