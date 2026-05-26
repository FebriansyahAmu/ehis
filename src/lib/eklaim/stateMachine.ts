/**
 * Claim State Machine — transition rules + role-based authorization.
 *
 * Klaim BPJS/Asuransi punya 13 status granular dengan transisi terbatas.
 * Bad transition (e.g. "Paid" → "Draft Coding") harus throw, bukan silent allow.
 *
 * Pattern:
 * - `ALLOWED_TRANSITIONS`: map `from → ReadonlySet<to>`.
 * - `canTransition(from, to, role)`: pure predicate, dipakai UI guard + service.
 * - `transitionClaim(claim, to, reason, actor)`: append timeline entry, bump
 *   optimisticLock.version, return updated `ClaimRecord` atau `ClaimError`.
 *
 * Referensi: TODO-EKLAIM.md § EK0.3 · PMK 26/2021 (banding flow).
 */

import { Err, Ok, type ClaimError, type ClaimRecord, type ClaimStatus, type Result } from "./eklaimShared";

// ── Role-Based Auth ────────────────────────────────────

/**
 * Persona modul e-klaim (sesuai TODO-EKLAIM § Personas).
 * `system` = automated transition (mis. reconciliation auto-match).
 */
export type ClaimActorRole = "Coder" | "TimKlaim" | "VerifikatorBPJS" | "Kasir" | "system";

// ── Transition Rules ───────────────────────────────────

/**
 * Map status sumber → set status tujuan yang valid.
 *
 * Append-only: jangan hapus entry tanpa migrasi data lama.
 * Status terminal (Paid, Write-off, Banding Rejected final): empty set.
 */
export const ALLOWED_TRANSITIONS: Record<ClaimStatus, ReadonlySet<ClaimStatus>> = {
  "Draft Coding": new Set<ClaimStatus>(["Belum Submit"]),
  "Belum Submit": new Set<ClaimStatus>(["Draft Coding", "Submitted"]),
  "Submitted": new Set<ClaimStatus>(["Pending Verifikasi"]),
  "Pending Verifikasi": new Set<ClaimStatus>([
    "Approved",
    "Rejected",
    "Susulan Required",
  ]),
  "Susulan Required": new Set<ClaimStatus>(["Submitted", "Rejected"]),
  "Approved": new Set<ClaimStatus>(["Paid", "Sengketa"]),
  "Rejected": new Set<ClaimStatus>(["Banding Submitted", "Write-off"]),
  "Banding Submitted": new Set<ClaimStatus>(["Banding Approved", "Banding Rejected"]),
  "Banding Approved": new Set<ClaimStatus>(["Approved"]),
  "Banding Rejected": new Set<ClaimStatus>(["Banding Submitted", "Write-off"]),
  "Sengketa": new Set<ClaimStatus>(["Approved", "Write-off"]),
  "Paid": new Set<ClaimStatus>(),
  "Write-off": new Set<ClaimStatus>(),
};

/**
 * Map status target → set role yang authorized melakukan transition tersebut.
 *
 * Convention: status downstream BPJS (Pending Verifikasi, Approved, Rejected,
 * Susulan Required, Banding*) hanya boleh oleh VerifikatorBPJS atau system.
 * Status internal coding (Draft, Belum Submit) oleh Coder.
 * Submit batch oleh TimKlaim. Paid oleh Kasir/system (reconciliation).
 */
const REQUIRED_ROLE: Record<ClaimStatus, ReadonlySet<ClaimActorRole>> = {
  "Draft Coding": new Set<ClaimActorRole>(["Coder"]),
  "Belum Submit": new Set<ClaimActorRole>(["Coder"]),
  "Submitted": new Set<ClaimActorRole>(["TimKlaim"]),
  "Pending Verifikasi": new Set<ClaimActorRole>(["VerifikatorBPJS", "system"]),
  "Susulan Required": new Set<ClaimActorRole>(["VerifikatorBPJS"]),
  "Approved": new Set<ClaimActorRole>(["VerifikatorBPJS", "system"]),
  "Rejected": new Set<ClaimActorRole>(["VerifikatorBPJS"]),
  "Banding Submitted": new Set<ClaimActorRole>(["TimKlaim"]),
  "Banding Approved": new Set<ClaimActorRole>(["VerifikatorBPJS"]),
  "Banding Rejected": new Set<ClaimActorRole>(["VerifikatorBPJS"]),
  "Sengketa": new Set<ClaimActorRole>(["TimKlaim"]),
  "Paid": new Set<ClaimActorRole>(["Kasir", "system"]),
  "Write-off": new Set<ClaimActorRole>(["TimKlaim"]),
};

// ── Predicates ─────────────────────────────────────────

/** Pure: cek apakah transition `from → to` valid untuk `role`. */
export function canTransition(from: ClaimStatus, to: ClaimStatus, role: ClaimActorRole): boolean {
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed.has(to)) return false;
  const roles = REQUIRED_ROLE[to];
  return roles.has(role);
}

/** Status terminal — tidak bisa transition lagi. */
export function isTerminal(status: ClaimStatus): boolean {
  return ALLOWED_TRANSITIONS[status].size === 0;
}

/** Return list semua status target yang valid untuk UI dropdown. */
export function allowedNextStatuses(
  from: ClaimStatus,
  role: ClaimActorRole,
): ReadonlyArray<ClaimStatus> {
  return Array.from(ALLOWED_TRANSITIONS[from]).filter((to) => REQUIRED_ROLE[to].has(role));
}

// ── Transition Executor ────────────────────────────────

export interface TransitionInput {
  to: ClaimStatus;
  actor: string;
  role: ClaimActorRole;
  /** Wajib untuk transition ke Rejected/Susulan Required/Write-off/Sengketa. */
  alasan?: string;
  /** Override clock untuk test determinisme. Default: `new Date().toISOString()`. */
  now?: string;
}

/** Status yang require `alasan` non-empty. */
const STATUS_REQUIRE_REASON: ReadonlySet<ClaimStatus> = new Set<ClaimStatus>([
  "Rejected",
  "Susulan Required",
  "Write-off",
  "Sengketa",
  "Banding Rejected",
]);

/**
 * Transition klaim ke status baru — return updated `ClaimRecord` atau `ClaimError`.
 *
 * Side-effect dalam scope record (pure-ish):
 * - Append `status-transition` event ke timeline.
 * - Bump `optimisticLock.version` + update `updatedBy`/`updatedAt`.
 * - Set field downstream sesuai status (mis. `submittedAt` saat ke Submitted).
 *
 * TIDAK mutasi input — return new record (caller persist via repo).
 */
export function transitionClaim(
  claim: ClaimRecord,
  input: TransitionInput,
): Result<ClaimRecord, ClaimError> {
  const now = input.now ?? new Date().toISOString();

  if (!canTransition(claim.statusPenjamin, input.to, input.role)) {
    return Err({
      type: "ValidationError",
      field: "statusPenjamin",
      message: `Transisi ${claim.statusPenjamin} → ${input.to} tidak diizinkan untuk role ${input.role}.`,
    });
  }

  if (STATUS_REQUIRE_REASON.has(input.to) && (!input.alasan || input.alasan.trim() === "")) {
    return Err({
      type: "ValidationError",
      field: "alasan",
      message: `Transisi ke ${input.to} wajib menyertakan alasan.`,
    });
  }

  const next: ClaimRecord = {
    ...claim,
    statusPenjamin: input.to,
    timeline: [
      ...claim.timeline,
      {
        type: "status-transition",
        from: claim.statusPenjamin,
        to: input.to,
        alasan: input.alasan,
        by: input.actor,
        at: now,
      },
    ],
    optimisticLock: {
      version: claim.optimisticLock.version + 1,
      updatedBy: input.actor,
      updatedAt: now,
    },
    updatedAt: now,
  };

  if (input.to === "Submitted") {
    next.submittedAt = now;
    next.submittedBy = input.actor;
  }
  if (input.to === "Rejected" && input.alasan) {
    next.rejectionReason = input.alasan;
  }
  if (input.to === "Banding Submitted") {
    next.bandingCount = (claim.bandingCount ?? 0) + 1;
  }
  if (input.to === "Paid") {
    next.paidAt = now;
  }

  return Ok(next);
}
