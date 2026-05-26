/**
 * VEDIKA Adapter — verifikasi digital BPJS-side.
 *
 * VEDIKA = "Verifikasi Digital Klaim" — proses BPJS-side dimana setelah RS
 * submit batch via V-Claim, BPJS verifikator review berkas + koding, lalu
 * RS PULL hasil verifikasi (BUKAN polling client side — BPJS expose endpoint
 * read-only untuk fetch latest status batch).
 *
 * Spek reference: BPJS Pedoman Verifikasi Digital + V-Claim batch APIs.
 *
 * Methods covered:
 * - `pullVerifikatorStatus(batchId)` → list status semua klaim dalam batch.
 *
 * Mock implementasi:
 * - Random distribution per klaim dalam batch:
 *   - 60% Approved (clean)
 *   - 25% Pending Verifikasi (belum di-review)
 *   - 10% Susulan Required (butuh berkas tambahan)
 *   - 5% Rejected (koding/diagnosa tidak match)
 *
 * Production swap: replace `mockBatchLookup()` dengan call ke `/Klaim/batch/{batchId}`.
 *
 * Referensi: TODO-EKLAIM.md § EK0.4.
 */

import { CLAIM_BOARD_MOCK } from "./claimsMock";
import {
  Err,
  Ok,
  type ClaimError,
  type ClaimStatus,
  type Result,
} from "./eklaimShared";

// ── Raw API Response Shape ─────────────────────────────

/**
 * Per-klaim status dari VEDIKA pull endpoint.
 * Real spec mengembalikan field tambahan (nominal disetujui, alasan reject, dsb.).
 */
export interface VedikaClaimStatusRaw {
  noKlaim: string;
  klaimId: string;
  statusVerifikator:
    | "BELUM_DIPROSES"
    | "DALAM_PROSES"
    | "DISETUJUI"
    | "DITOLAK"
    | "PENDING_BERKAS";
  tarifDisetujui?: string; // bigint string
  alasanReject?: string;
  daftarBerkasSusulan?: string[];
  verifierNama?: string;
  verifiedAt?: string;
}

export interface VedikaBatchResponse {
  batchId: string;
  totalKlaim: number;
  statusBatch: "QUEUED" | "PROCESSING" | "COMPLETED";
  klaimStatuses: ReadonlyArray<VedikaClaimStatusRaw>;
  retrievedAt: string;
}

// ── Config ─────────────────────────────────────────────

export interface VedikaConfig {
  failRate?: number;
  fixedLatencyMs?: number;
  /** Override distribution untuk deterministic test. Sum harus 1.0. */
  distribution?: {
    approved: number;
    pendingVerifikasi: number;
    susulanRequired: number;
    rejected: number;
  };
}

const DEFAULT_DISTRIBUTION = {
  approved: 0.6,
  pendingVerifikasi: 0.25,
  susulanRequired: 0.1,
  rejected: 0.05,
} as const;

// ── Public API ─────────────────────────────────────────

/**
 * Pull status batch dari VEDIKA endpoint.
 * Mock: filter `CLAIM_BOARD_MOCK` by `batchId`, generate random status per klaim.
 */
export async function pullVerifikatorStatus(
  batchId: string,
  config: VedikaConfig = {},
): Promise<Result<VedikaBatchResponse, ClaimError>> {
  await simulateLatency(config.fixedLatencyMs);

  const failRate = config.failRate ?? 0.03;
  if (failRate > 0 && Math.random() < failRate) {
    return Err({
      type: "NetworkError",
      message: "VEDIKA endpoint timeout (simulated)",
      retryable: true,
    });
  }

  const batchClaims = CLAIM_BOARD_MOCK.filter((c) => c.batchId === batchId);
  if (batchClaims.length === 0) {
    return Err({
      type: "ValidationError",
      field: "batchId",
      message: `Batch "${batchId}" tidak ditemukan`,
    });
  }

  const distribution = config.distribution ?? DEFAULT_DISTRIBUTION;
  const klaimStatuses: VedikaClaimStatusRaw[] = batchClaims.map((claim) => {
    const status = rollStatus(distribution);
    return {
      noKlaim: claim.noKlaim,
      klaimId: claim.id,
      statusVerifikator: status,
      tarifDisetujui:
        status === "DISETUJUI"
          ? (claim.iDRG?.tarifAktual ?? claim.tarifRS).toString()
          : undefined,
      alasanReject:
        status === "DITOLAK" ? "Diagnosa primer tidak match dengan tindakan" : undefined,
      daftarBerkasSusulan:
        status === "PENDING_BERKAS" ? ["Laporan Operasi", "Hasil Lab Lengkap"] : undefined,
      verifierNama: status !== "BELUM_DIPROSES" ? "Verifikator BPJS" : undefined,
      verifiedAt:
        status === "DISETUJUI" || status === "DITOLAK" ? new Date().toISOString() : undefined,
    };
  });

  return Ok({
    batchId,
    totalKlaim: batchClaims.length,
    statusBatch: klaimStatuses.every((k) => k.statusVerifikator !== "BELUM_DIPROSES")
      ? "COMPLETED"
      : klaimStatuses.some((k) => k.statusVerifikator !== "BELUM_DIPROSES")
        ? "PROCESSING"
        : "QUEUED",
    klaimStatuses,
    retrievedAt: new Date().toISOString(),
  });
}

// ── Mapper: raw → domain ───────────────────────────────

/** Map VEDIKA statusVerifikator → domain `ClaimStatus`. */
export function toClaimStatusFromVedika(raw: VedikaClaimStatusRaw["statusVerifikator"]): ClaimStatus {
  switch (raw) {
    case "DISETUJUI":
      return "Approved";
    case "DITOLAK":
      return "Rejected";
    case "PENDING_BERKAS":
      return "Susulan Required";
    case "DALAM_PROSES":
      return "Pending Verifikasi";
    case "BELUM_DIPROSES":
    default:
      return "Submitted";
  }
}

// ── Internal Helpers ───────────────────────────────────

function rollStatus(
  dist: NonNullable<VedikaConfig["distribution"]>,
): VedikaClaimStatusRaw["statusVerifikator"] {
  const r = Math.random();
  if (r < dist.approved) return "DISETUJUI";
  if (r < dist.approved + dist.pendingVerifikasi) return "DALAM_PROSES";
  if (r < dist.approved + dist.pendingVerifikasi + dist.susulanRequired) return "PENDING_BERKAS";
  return "DITOLAK";
}

function simulateLatency(fixedMs?: number): Promise<void> {
  const ms = fixedMs ?? 400 + Math.random() * 800;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
