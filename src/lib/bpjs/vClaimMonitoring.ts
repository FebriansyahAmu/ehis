/**
 * V-Claim Adapter — Monitoring (BP0.4).
 *
 * Aligned 1:1 dengan [contracts/Monitoring-Contracts.md] — 4 endpoint:
 * - Spec 1: monitoringKunjungan (tglSEP + jnsPelayanan) → KunjunganMonitoringItem[]
 * - Spec 2: monitoringKlaim (tglPulang + jnsPelayanan + statusKode "1"/"2"/"3") → KlaimMonitoringItem[]
 * - Spec 3: monitoringHistoriPelayanan (noKartu + periode) → HistoriPelayananMonitoringItem[]
 * - Spec 4: monitoringJasaRaharja (jnsPelayanan + periode) → JasaRaharjaMonitoringItem[]
 *
 * Wire format = response shape 1:1 spec BPJS V-Claim. Domain rich types
 * (`KunjunganBPJSRecord`/`HistoriPelayananRecord`) tetap ada di
 * [bpjsShared.ts] untuk derived analytics — adapter TIDAK return type tsb.
 *
 * Mock derive dari `KUNJUNGAN_MONITORING_MOCK` / `KLAIM_MONITORING_MOCK` /
 * `HISTORI_MONITORING_MOCK` / `JASA_RAHARJA_MONITORING_MOCK` di
 * `monitoringMock.ts`.
 */

import {
  Err,
  type BPJSConfig,
  type BPJSEnvelope,
  type BPJSError,
  type HistoriPelayananMonitoringItem,
  type JasaRaharjaMonitoringItem,
  type JnsPelayananKode,
  type KlaimMonitoringItem,
  type KlaimMonitoringStatusKode,
  type KunjunganMonitoringItem,
  type Result,
} from "./bpjsShared";
import { errEnvelope, okEnvelope, preflightMock, wrapWithAudit } from "./vClaimShared";
import { VCLAIM_ENDPOINTS } from "./bpjsEndpoints";
import {
  HISTORI_MONITORING_MOCK,
  JASA_RAHARJA_MONITORING_MOCK,
  KLAIM_MONITORING_MOCK,
  KUNJUNGAN_MONITORING_MOCK,
} from "./mock/monitoringMock";

// ── Spec 1: monitoringKunjungan ────────────────────────

/**
 * Data Kunjungan — spec endpoint 1.
 * Filter mock by `tglSep` + `jnsPelayanan` (kode "1"/"2" mapped ke display).
 */
export function monitoringKunjungan(
  tglSEP: string,
  jnsPelayanan: JnsPelayananKode,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<KunjunganMonitoringItem[]>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.monitoring.kunjungan(tglSEP, jnsPelayanan);
  const jnsDisplay = jnsPelayanan === "1" ? "R.Inap" : "R.Jalan";
  return wrapWithAudit<KunjunganMonitoringItem[]>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const list = KUNJUNGAN_MONITORING_MOCK.filter(
        (k) => k.tglSep === tglSEP && k.jnsPelayanan === jnsDisplay,
      );
      return okEnvelope(list);
    },
  )();
}

// ── Spec 2: monitoringKlaim ────────────────────────────

/**
 * Data Klaim — spec endpoint 2.
 *
 * Parameter `statusKode`: "1"=Proses Verifikasi, "2"=Pending Verifikasi, "3"=Klaim.
 * Use `KLAIM_MONITORING_STATUS_LABEL[kode]` untuk display.
 */
export function monitoringKlaim(
  tglPulang: string,
  jnsPelayanan: JnsPelayananKode,
  statusKode: KlaimMonitoringStatusKode,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<KlaimMonitoringItem[]>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.monitoring.klaim(tglPulang, jnsPelayanan, statusKode);
  const expectedStatus =
    statusKode === "1"
      ? "Proses Verifikasi"
      : statusKode === "2"
        ? "Pending Verifikasi"
        : "Klaim";
  return wrapWithAudit<KlaimMonitoringItem[]>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const list = KLAIM_MONITORING_MOCK.filter(
        (k) => k.tglPulang === tglPulang && k.status === expectedStatus,
      );
      // Filter kelas RI/RJ: spec parameter jnsPelayanan filter berdasarkan
      // kelas SEP. Karena KlaimMonitoringItem tidak ada `jnsPelayanan` field
      // direct, mock store metadata internal. Skip filter di mock — biarkan
      // semua status yang match status saja (mock simplification).
      void jnsPelayanan;
      return okEnvelope(list);
    },
  )();
}

// ── Spec 3: monitoringHistoriPelayanan ─────────────────

/**
 * Data Histori Pelayanan Peserta — spec endpoint 3.
 * Filter by `noKartu` + periode (`tglMulai`-`tglAkhir`).
 *
 * Validation:
 * - `noKartu` 13 digit numerik.
 * - Periode max 90 hari + valid (tglMulai ≤ tglAkhir).
 */
export function monitoringHistoriPelayanan(
  noKartu: string,
  tglMulai: string,
  tglAkhir: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<HistoriPelayananMonitoringItem[]>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.monitoring.historiPelayanan(noKartu, tglMulai, tglAkhir);
  return wrapWithAudit<HistoriPelayananMonitoringItem[]>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      if (!/^\d{13}$/.test(noKartu)) {
        return errEnvelope("204", endpoint, "Nomor kartu harus 13 digit");
      }
      const startMs = new Date(tglMulai).getTime();
      const endMs = new Date(tglAkhir).getTime();
      const diffDays = (endMs - startMs) / (1000 * 60 * 60 * 24);
      if (diffDays > 90 || diffDays < 0) {
        return errEnvelope("204", endpoint, "Periode max 90 hari & valid");
      }
      const list = HISTORI_MONITORING_MOCK.filter(
        (h) =>
          h.noKartu === noKartu &&
          h.tglSep >= tglMulai &&
          h.tglSep <= tglAkhir,
      );
      return okEnvelope(list);
    },
  )();
}

// ── Spec 4: monitoringJasaRaharja ──────────────────────

/**
 * Data Klaim Jaminan Jasa Raharja — spec endpoint 4.
 *
 * Signature DIUBAH dari single-tgl ke periode (per spec resmi):
 * - Param 1: jnsPelayanan
 * - Param 2: tglMulai
 * - Param 3: tglAkhir
 */
export function monitoringJasaRaharja(
  jnsPelayanan: JnsPelayananKode,
  tglMulai: string,
  tglAkhir: string,
  config: BPJSConfig = {},
): Promise<Result<BPJSEnvelope<JasaRaharjaMonitoringItem[]>, BPJSError>> {
  const endpoint = VCLAIM_ENDPOINTS.monitoring.klaimJasaRaharja(
    jnsPelayanan,
    tglMulai,
    tglAkhir,
  );
  return wrapWithAudit<JasaRaharjaMonitoringItem[]>(
    { endpoint, method: "GET" },
    async () => {
      const err = await preflightMock(config);
      if (err) return Err(err);
      const startMs = new Date(tglMulai).getTime();
      const endMs = new Date(tglAkhir).getTime();
      if (endMs < startMs) {
        return errEnvelope("204", endpoint, "tglAkhir harus >= tglMulai");
      }
      const list = JASA_RAHARJA_MONITORING_MOCK.filter(
        (j) =>
          j.sep.jnsPelayanan === jnsPelayanan &&
          j.sep.tglSEP >= tglMulai &&
          j.sep.tglSEP <= tglAkhir,
      );
      return okEnvelope(list);
    },
  )();
}
