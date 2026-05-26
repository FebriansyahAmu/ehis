/**
 * Eligibility Checker — orchestration layer di atas `vClaimAdapter`.
 *
 * Adapter (`vClaimAdapter.getEligibility`) return raw V-Claim envelope shape.
 * Checker ini map ke domain `EligibilityCheckResult` + apply business rules
 * yang tidak ada di adapter (kelas fallback, regulasi-driven rejection).
 *
 * Validation order (fail-fast):
 * 1. Shape (noKartu 13 digit, tanggalSEP ISO).
 * 2. Adapter call (`getEligibility`).
 * 3. Envelope `metaData.code` → map ke `EligibilityError` reason.
 * 4. Mapper raw → domain via `toEligibilityDomain()`.
 *
 * Production swap: nothing — caller tetap `checkEligibility(input)`.
 *
 * Referensi: TODO-EKLAIM.md § EK0.3 + EK0.4 · BPJS V-Claim spec.
 */

import { CLAIM_BOARD_MOCK } from "./claimsMock";
import { getEligibility, toEligibilityDomain, type VClaimConfig } from "./vClaimAdapter";
import {
  Err,
  Ok,
  type ClaimError,
  type KelasRawat,
  type Result,
  type Rupiah,
  type TingkatKompetensiRS,
} from "./eklaimShared";

// ── Input/Output Types ─────────────────────────────────

export interface EligibilityCheckInput {
  /** 13-digit BPJS card number. */
  noKartu: string;
  /** ISO date "YYYY-MM-DD". */
  tanggalSEP: string;
  /** 1=Rawat Inap, 2=Rawat Jalan (match V-Claim convention). */
  jnsPelayanan: 1 | 2;
}

export interface EligibilityCheckResult {
  valid: boolean;
  kelasDijamin: KelasRawat;
  tingkatKompetensiRSDijamin: TingkatKompetensiRS;
  plafon?: Rupiah;
  sisaHariRawat?: number;
  remark?: string;
}

export interface EligibilityCheckerOptions {
  /** Pass through ke `vClaimAdapter`. */
  adapter?: VClaimConfig;
  /** Override result tanpa adapter call — test deterministic. */
  forceResult?: EligibilityCheckResult;
}

// ── Public API ─────────────────────────────────────────

/**
 * Cek eligibilitas pasien BPJS. Orchestration di atas `vClaimAdapter.getEligibility`.
 *
 * Domain rules tambahan (selain shape adapter):
 * - Map V-Claim `metaData.code` ke `EligibilityError.reason` yang typed.
 * - Resolve `tingkatKompetensiRS` dari context klaim (V-Claim tidak return ini).
 */
export async function checkEligibility(
  input: EligibilityCheckInput,
  opts: EligibilityCheckerOptions = {},
): Promise<Result<EligibilityCheckResult, ClaimError>> {
  // Shape validation
  if (!/^\d{13}$/.test(input.noKartu)) {
    return Err({
      type: "ValidationError",
      field: "noKartu",
      message: `noKartu harus 13 digit angka (got "${input.noKartu}")`,
    });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.tanggalSEP)) {
    return Err({
      type: "ValidationError",
      field: "tanggalSEP",
      message: `tanggalSEP harus format ISO YYYY-MM-DD (got "${input.tanggalSEP}")`,
    });
  }

  if (opts.forceResult) {
    return Ok(opts.forceResult);
  }

  // Adapter call
  const raw = await getEligibility(input.noKartu, input.tanggalSEP, input.jnsPelayanan, opts.adapter);
  if (!raw.ok) return Err(raw.error);

  // Envelope metaData → EligibilityError mapping
  const env = raw.value;
  if (env.metaData.code !== "200" || !env.response) {
    return Err(mapMetaDataToEligibilityError(env.metaData));
  }

  // Resolve tingkatKompetensiRS fallback dari klaim mock yang punya noKartu match
  // (V-Claim tidak return field ini — di production resolve dari master RS profile)
  const fallback = resolveFallbackContext(input.noKartu);

  return Ok(toEligibilityDomain(env.response, fallback));
}

// ── Internal Helpers ───────────────────────────────────

function mapMetaDataToEligibilityError(meta: { code: string; message: string }): ClaimError {
  const msg = meta.message.toLowerCase();
  if (msg.includes("masa berlaku") || msg.includes("expired")) {
    return { type: "EligibilityError", reason: "SEP_EXPIRED" };
  }
  if (msg.includes("tidak ditemukan") || msg.includes("not found")) {
    return { type: "EligibilityError", reason: "NIK_NOT_FOUND" };
  }
  if (msg.includes("kelas")) {
    return { type: "EligibilityError", reason: "KELAS_NOT_COVERED" };
  }
  return {
    type: "ValidationError",
    field: "vClaim",
    message: `[${meta.code}] ${meta.message}`,
  };
}

function resolveFallbackContext(noKartu: string): {
  kelas: KelasRawat;
  tingkat: TingkatKompetensiRS;
} {
  const claim = CLAIM_BOARD_MOCK.find((c) => c.penjamin.sep?.noKartu === noKartu);
  return {
    kelas: claim?.kelas ?? "KRIS",
    tingkat: claim?.tingkatKompetensiRS ?? "utama",
  };
}
