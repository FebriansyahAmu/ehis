/**
 * Reconciliation Matcher — multi-criteria match transfer bank ↔ klaim approved.
 *
 * Real-world scenario (BPJS/Asuransi):
 * - BPJS transfer 1 nominal besar untuk N klaim approved 1 periode.
 * - Asuransi transfer 1:1 per klaim (cashless) atau 1:N (reimbursement batch).
 * - Selisih bisa: write-off (RS terima less), refund (RS terima excess), pending.
 *
 * Strategy (ordered, fail to next):
 * 1. **Exact nominal** (confidence 1.0) — sum klaim approved cocok persis.
 * 2. **Periode + count** (confidence 0.9) — count klaim cocok, nominal beda <2%.
 * 3. **Fuzzy nominal ±5%** (confidence 0.7) — total nominal within 5% band.
 * 4. Unmatched → flag manual review.
 *
 * Output deterministik (sort by confidence desc) — important untuk UI repro test.
 *
 * Referensi: TODO-EKLAIM.md § EK0.3 · architectural decision AD-16 (matching).
 */

import { addRupiah, rupiahToDisplayNumber } from "./money";
import type {
  ClaimRecord,
  ReconciliationMatch,
  ReconciliationRecord,
  Rupiah,
} from "./eklaimShared";

// ── Input/Output ───────────────────────────────────────

export interface TransferInput {
  noTransfer: string;
  tanggalTransfer: string;
  nominalTransfer: Rupiah;
  penjaminId: string;
  /** "YYYY-MM" — periode klaim yang ditargetkan transfer. */
  periodeKlaim: string;
}

export interface MatchResult {
  matched: ReadonlyArray<ReconciliationMatch>;
  unmatched: {
    transferLeft: Rupiah;
    claimsLeft: ReadonlyArray<ClaimRecord>;
  };
  selisih: Rupiah;
  recommendedStatus: "AutoMatched" | "NeedsReview" | "Unmatched";
}

// ── Public API ─────────────────────────────────────────

/**
 * Match transfer terhadap pool klaim approved.
 *
 * Filter pool dulu by `penjaminId` + `periodeKlaim` (saat ini hardcoded month
 * dari `approvedAt`/`updatedAt`). Klaim eligible = status Approved/Sengketa
 * dengan `approvedAmount` defined.
 *
 * Algorithm picks BEST strategy yang menghasilkan match, BUKAN try all then merge.
 */
export function matchTransfer(
  transfer: TransferInput,
  approvedPool: ReadonlyArray<ClaimRecord>,
  now: Date = new Date(),
): MatchResult {
  const candidates = approvedPool.filter((c) => isEligibleForMatch(c, transfer));

  // Strategy 1: exact nominal
  const exact = findExactSubset(candidates, transfer.nominalTransfer);
  if (exact) {
    return buildResult(exact, candidates, transfer, 1.0, "exact nominal · same periode + penjamin", now);
  }

  // Strategy 2: periode + count (sum within 2%)
  const periodeAll = findPeriodCountMatch(candidates, transfer.nominalTransfer);
  if (periodeAll) {
    return buildResult(
      periodeAll,
      candidates,
      transfer,
      0.9,
      "periode + count · nominal within 2%",
      now,
    );
  }

  // Strategy 3: fuzzy nominal ±5%
  const fuzzy = findFuzzySubset(candidates, transfer.nominalTransfer);
  if (fuzzy) {
    return buildResult(fuzzy, candidates, transfer, 0.7, "fuzzy nominal · within 5% band", now);
  }

  // Strategy 4: unmatched
  return {
    matched: [],
    unmatched: { transferLeft: transfer.nominalTransfer, claimsLeft: candidates },
    selisih: transfer.nominalTransfer,
    recommendedStatus: "Unmatched",
  };
}

// ── Strategy: Exact ─────────────────────────────────────

/**
 * Cari subset klaim yang sum-nya persis cocok dengan target.
 * Greedy: sort desc nominal, ambil sampai cukup, backtrack kalau over.
 * O(n) untuk happy path, O(n²) worst case — acceptable untuk pool <500 klaim per periode.
 */
function findExactSubset(
  pool: ReadonlyArray<ClaimRecord>,
  target: Rupiah,
): ReadonlyArray<ClaimRecord> | null {
  if (target === 0n) return null;

  // Cek single match dulu (paling umum untuk asuransi 1:1)
  const single = pool.find((c) => c.approvedAmount === target);
  if (single) return [single];

  // Greedy sum (BPJS multi-klaim 1 transfer)
  const sorted = [...pool].sort((a, b) => {
    const aa = a.approvedAmount ?? 0n;
    const bb = b.approvedAmount ?? 0n;
    return rupiahToDisplayNumber(bb - aa);
  });

  const selected: ClaimRecord[] = [];
  let sum = 0n;
  for (const c of sorted) {
    const amt = c.approvedAmount ?? 0n;
    if (sum + amt <= target) {
      selected.push(c);
      sum += amt;
      if (sum === target) return selected;
    }
  }
  return null;
}

// ── Strategy: Periode + Count ───────────────────────────

/** Sum semua eligible klaim, accept kalau within ±2% target. */
function findPeriodCountMatch(
  pool: ReadonlyArray<ClaimRecord>,
  target: Rupiah,
): ReadonlyArray<ClaimRecord> | null {
  if (pool.length === 0) return null;
  const sum = addRupiah(...pool.map((c) => c.approvedAmount ?? 0n));
  if (sum === 0n) return null;
  const diff = sum > target ? sum - target : target - sum;
  const tolerance = (target * 2n) / 100n;
  return diff <= tolerance ? pool : null;
}

// ── Strategy: Fuzzy ±5% ────────────────────────────────

function findFuzzySubset(
  pool: ReadonlyArray<ClaimRecord>,
  target: Rupiah,
): ReadonlyArray<ClaimRecord> | null {
  const tolerance = (target * 5n) / 100n;

  // Single fuzzy match
  const single = pool.find((c) => {
    const amt = c.approvedAmount ?? 0n;
    const diff = amt > target ? amt - target : target - amt;
    return diff <= tolerance;
  });
  if (single) return [single];

  // Greedy sum fuzzy
  const sorted = [...pool].sort((a, b) => {
    const aa = a.approvedAmount ?? 0n;
    const bb = b.approvedAmount ?? 0n;
    return rupiahToDisplayNumber(bb - aa);
  });

  const selected: ClaimRecord[] = [];
  let sum = 0n;
  for (const c of sorted) {
    const amt = c.approvedAmount ?? 0n;
    if (sum + amt <= target + tolerance) {
      selected.push(c);
      sum += amt;
      const diff = sum > target ? sum - target : target - sum;
      if (diff <= tolerance) return selected;
    }
  }
  return null;
}

// ── Helpers ────────────────────────────────────────────

function isEligibleForMatch(claim: ClaimRecord, transfer: TransferInput): boolean {
  if (claim.statusPenjamin !== "Approved" && claim.statusPenjamin !== "Sengketa") return false;
  if (claim.approvedAmount === undefined) return false;
  // Penjamin ID match — saat ini compare via penjamin.tipe + nama hash; backend ready ganti dengan FK proper.
  const claimPenjaminId = `${claim.penjamin.tipe}-${claim.penjamin.nama.toLowerCase().replace(/\s+/g, "-")}`;
  if (!claimPenjaminId.startsWith(claim.penjamin.tipe)) return false;
  if (transfer.penjaminId !== claimPenjaminId && transfer.penjaminId.split("-")[0] !== claim.penjamin.tipe) {
    return false;
  }
  // Periode match — bandingkan YYYY-MM dari submittedAt
  if (claim.submittedAt) {
    const claimPeriod = claim.submittedAt.slice(0, 7);
    if (claimPeriod !== transfer.periodeKlaim) return false;
  }
  return true;
}

function buildResult(
  matched: ReadonlyArray<ClaimRecord>,
  pool: ReadonlyArray<ClaimRecord>,
  transfer: TransferInput,
  confidence: number,
  reason: string,
  now: Date,
): MatchResult {
  const matchedAt = now.toISOString();
  const matches: ReconciliationMatch[] = matched.map((c) => ({
    claimId: c.id,
    amount: c.approvedAmount ?? 0n,
    autoMatched: confidence >= 0.9,
    matchingConfidence: confidence,
    matchingReason: reason,
    matchedAt,
  }));
  const matchedSum = addRupiah(...matches.map((m) => m.amount));
  const selisih = transfer.nominalTransfer - matchedSum;
  const unmatched = {
    transferLeft: selisih > 0n ? selisih : 0n,
    claimsLeft: pool.filter((c) => !matched.includes(c)),
  };
  return {
    matched: matches,
    unmatched,
    selisih,
    recommendedStatus: confidence >= 0.9 ? "AutoMatched" : "NeedsReview",
  };
}

// ── Bulk Matcher (untuk batch reconciliation) ──────────

/**
 * Run `matchTransfer` untuk N transfer terhadap shared pool.
 * Pool yang sudah matched di-exclude dari iterasi berikutnya untuk avoid
 * double-counting.
 */
export function matchBatch(
  transfers: ReadonlyArray<TransferInput>,
  approvedPool: ReadonlyArray<ClaimRecord>,
): ReadonlyArray<{ transfer: TransferInput; result: MatchResult }> {
  const remaining = new Set(approvedPool);
  const results: { transfer: TransferInput; result: MatchResult }[] = [];

  for (const transfer of transfers) {
    const result = matchTransfer(transfer, Array.from(remaining));
    for (const m of result.matched) {
      const claim = approvedPool.find((c) => c.id === m.claimId);
      if (claim) remaining.delete(claim);
    }
    results.push({ transfer, result });
  }
  return results;
}

/** Build `ReconciliationRecord` dari hasil match — bridge ke storage layer. */
export function toReconciliationRecord(
  transfer: TransferInput,
  result: MatchResult,
  opts: { reconciliationId: string; bank: string; completedBy?: string },
): ReconciliationRecord {
  return {
    id: opts.reconciliationId,
    noTransfer: transfer.noTransfer,
    tanggalTransfer: transfer.tanggalTransfer,
    nominalTransfer: transfer.nominalTransfer,
    bank: opts.bank,
    penjaminId: transfer.penjaminId,
    periodeKlaim: transfer.periodeKlaim,
    matchedClaims: result.matched,
    selisih: result.selisih,
    statusSelisih:
      result.recommendedStatus === "AutoMatched" && result.selisih === 0n
        ? undefined
        : result.recommendedStatus === "Unmatched"
          ? "Pending"
          : result.selisih > 0n
            ? "Pending"
            : "Write-off",
    completedAt: result.recommendedStatus === "AutoMatched" ? new Date().toISOString() : undefined,
    completedBy: result.recommendedStatus === "AutoMatched" ? "Sistem Auto-Matcher" : opts.completedBy,
  };
}
