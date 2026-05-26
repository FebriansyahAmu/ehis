/**
 * iDRG Grouper Adapter (PRIMARY).
 *
 * Bridging layer ke INA-Grouper iDRG (real-time REST). Adapter ini PURE
 * TRANSPORT — caller (groupingResolver) handle orchestration + retry +
 * Result mapping ke domain type.
 *
 * Spek reference: Pedoman Pengodean iDRG 2025 Kemenkes + INA-Grouper iDRG API.
 *
 * Mock implementasi:
 * - Lookup `IDRG_LOOKUP_MOCK` by primary ICD-10-IM.
 * - Severity scoring heuristik (sekunder count + LOS + caraPulang).
 * - Random fail rate parameterized via `iDRGGrouperConfig` (default 5%).
 * - Latency 500-1500ms match real grouper.
 *
 * Production swap:
 * - Replace `mockGrouperCall()` body dengan `fetch(GROUPER_URL, {...})`.
 * - Header pattern `{ Authorization: 'Bearer X-grouper-token' }`.
 * - Response shape `iDRGGrouperRawResponse` match spek INA-Grouper iDRG.
 *
 * Referensi: TODO-EKLAIM.md § EK0.4.
 */

import { findIDRGByICD10IM } from "./iDRGLookupMock";
import {
  Err,
  Ok,
  type ClaimError,
  type Result,
  type iDRGResult,
} from "./eklaimShared";
import type { ClaimGrouperContext } from "./groupingResolver";

// ── Raw API Response Shape (mimics real spec) ──────────

/**
 * Raw response dari INA-Grouper iDRG REST endpoint.
 *
 * Note: shape ini tentative — real spec belum dirilis Kemenkes per 2026-05.
 * Saat spec final keluar, hanya field ini yang diupdate; caller tetap konsumsi
 * `iDRGResult` clean type via `toIDRGResult()` mapper.
 */
export interface iDRGGrouperRawResponse {
  status: "OK" | "ERROR";
  metadata: {
    grouperVersion: string;
    requestId: string;
    timestamp: string;
    elapsedMs: number;
  };
  result?: {
    code: string;
    mdc: string;
    group: string;
    severity: {
      level: 1 | 2 | 3;
      label: "Ringan" | "Sedang" | "Berat";
      ccCodes: string[];
      mccCodes: string[];
    };
    tarif: {
      dasar: string; // bigint string (avoid JSON number precision)
      menengah: string;
      utama: string;
      komprehensif: string;
    };
    topUpCmg: Array<{ eligible: boolean; alasan: string; nominalRp: string }>;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ── Config ─────────────────────────────────────────────

export interface iDRGGrouperConfig {
  /** 0-1. Default 0.05. Set 0 untuk deterministic test. */
  failRate?: number;
  /** Override latency simulation. Default random 500-1500ms. */
  fixedLatencyMs?: number;
}

// ── Public API ─────────────────────────────────────────

/**
 * Group klaim via iDRG grouper. Return raw response shape match spec.
 *
 * Caller (groupingResolver) bertanggung jawab map ke domain `iDRGResult`
 * via `toIDRGResult()` helper di file ini.
 */
export async function groupiDRG(
  ctx: ClaimGrouperContext,
  config: iDRGGrouperConfig = {},
): Promise<Result<iDRGGrouperRawResponse, ClaimError>> {
  const startMs = Date.now();
  await simulateLatency(config.fixedLatencyMs);

  // Transient fail simulation
  const failRate = config.failRate ?? 0.05;
  if (failRate > 0 && Math.random() < failRate) {
    return Err({
      type: "NetworkError",
      message: "INA-Grouper iDRG timeout (simulated)",
      retryable: true,
    });
  }

  const candidates = findIDRGByICD10IM(ctx.diagnosaPrimer.kode);
  if (candidates.length === 0) {
    return Ok({
      status: "ERROR",
      metadata: makeMetadata(startMs),
      error: {
        code: "ICD_NOT_MAPPED",
        message: `Tidak ada iDRG yang match ICD-10-IM "${ctx.diagnosaPrimer.kode}"`,
      },
    });
  }

  // Pilih entry: prefer match procedure code, fallback first
  const procCodes = ctx.tindakanProsedur.map((p) => p.kode);
  const matched =
    procCodes.length > 0
      ? candidates.find((e) => e.icd9CMIMList.some((c) => procCodes.includes(c)))
      : undefined;
  const entry = matched ?? candidates[0];

  const severity = scoreSeverity(ctx);
  const sev = entry.severityLevels[severity];
  const ccCodes = ctx.diagnosaSekunder
    .filter((d) => d.hospitalAcquired !== true)
    .map((d) => d.kode);
  const mccCodes = ctx.diagnosaSekunder
    .filter((d) => d.hospitalAcquired === true)
    .map((d) => d.kode);

  return Ok({
    status: "OK",
    metadata: makeMetadata(startMs),
    result: {
      code: entry.code,
      mdc: entry.mdc,
      group: entry.group,
      severity: {
        level: severity,
        label: sev.label,
        ccCodes,
        mccCodes,
      },
      tarif: {
        dasar: sev.tarifPerTingkat.dasar.toString(),
        menengah: sev.tarifPerTingkat.menengah.toString(),
        utama: sev.tarifPerTingkat.utama.toString(),
        komprehensif: sev.tarifPerTingkat.komprehensif.toString(),
      },
      topUpCmg: [],
    },
  });
}

// ── Mapper: raw → domain ───────────────────────────────

/**
 * Map raw API response → domain `iDRGResult`.
 * Throw kalau response error — caller convert ke `Result<>` via try/catch.
 */
export function toIDRGResult(
  raw: iDRGGrouperRawResponse,
  tingkatKompetensiRS: ClaimGrouperContext["tingkatKompetensiRS"],
): iDRGResult {
  if (raw.status === "ERROR" || !raw.result) {
    throw new Error(`Cannot map error response: ${raw.error?.message ?? "unknown"}`);
  }
  const r = raw.result;
  const tarifPerTingkat = {
    dasar: BigInt(r.tarif.dasar),
    menengah: BigInt(r.tarif.menengah),
    utama: BigInt(r.tarif.utama),
    komprehensif: BigInt(r.tarif.komprehensif),
  };
  return {
    code: r.code,
    mdc: r.mdc,
    group: r.group,
    severity: {
      level: r.severity.level,
      label: r.severity.label,
      ccList: r.severity.ccCodes,
      mccList: r.severity.mccCodes,
    },
    tarifAktual: tarifPerTingkat[tingkatKompetensiRS],
    tarifPerTingkat,
    topUpCmg: r.topUpCmg.map((t) => ({
      eligible: t.eligible,
      alasan: t.alasan,
      nominal: BigInt(t.nominalRp),
    })),
    versiGrouper: raw.metadata.grouperVersion,
    timestampGroup: raw.metadata.timestamp,
    sumberRegulasi: "Pedoman_iDRG_2025_Kemenkes",
  };
}

// ── Internal Helpers ───────────────────────────────────

function makeMetadata(startMs: number): iDRGGrouperRawResponse["metadata"] {
  return {
    grouperVersion: "iDRG_v1.0_2025",
    requestId: `REQ-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    elapsedMs: Date.now() - startMs,
  };
}

function scoreSeverity(ctx: ClaimGrouperContext): 1 | 2 | 3 {
  let score = 0;
  score += ctx.diagnosaSekunder.length;
  if (ctx.los >= 10) score += 2;
  else if (ctx.los >= 5) score += 1;
  if (ctx.caraPulang === "Meninggal" || ctx.kelas === "ICU") score += 2;
  if (ctx.age >= 70 || ctx.age <= 1) score += 1;
  if (score >= 5) return 3;
  if (score >= 2) return 2;
  return 1;
}

function simulateLatency(fixedMs?: number): Promise<void> {
  const ms = fixedMs ?? 500 + Math.random() * 1000;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
