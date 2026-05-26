/**
 * Claim Calc — pure aggregation/derivation untuk `ClaimRecord[]` lists.
 *
 * Semua fungsi PURE — no side effect, deterministic. Aman dipakai di:
 * - KPI Strip Beranda E-Klaim (EK1)
 * - Filter Board (EK2)
 * - Reports rekap (EK7)
 *
 * Aging buckets sesuai industri RS Indonesia (30/60/90 hari sejak submitted).
 * cbgMarginPercent direname dari `marginCbg` untuk clarity: comparing tarif
 * grouper (iDRG/INA-CBG) vs tarif RS internal.
 *
 * Referensi: TODO-EKLAIM.md § EK0.3.
 */

import { addRupiah, rupiahToDisplayNumber } from "./money";
import type { ClaimRecord, Rupiah } from "./eklaimShared";

// ── Aggregates ─────────────────────────────────────────

/** Sum `approvedAmount` semua klaim yang punya. Skip undefined. */
export function totalApproved(claims: ReadonlyArray<ClaimRecord>): Rupiah {
  return addRupiah(
    ...claims
      .map((c) => c.approvedAmount)
      .filter((v): v is Rupiah => v !== undefined),
  );
}

/** Sum `paidAmount` semua klaim yang sudah dibayar. */
export function totalPaid(claims: ReadonlyArray<ClaimRecord>): Rupiah {
  return addRupiah(
    ...claims
      .map((c) => c.paidAmount)
      .filter((v): v is Rupiah => v !== undefined),
  );
}

/** Sum `tarifRS` semua klaim (basis perhitungan margin). */
export function totalTarifRS(claims: ReadonlyArray<ClaimRecord>): Rupiah {
  return addRupiah(...claims.map((c) => c.tarifRS));
}

// ── Rate / Ratio ───────────────────────────────────────

/**
 * Approval rate = #Approved / (#Approved + #Rejected + #Banding Rejected).
 * Exclude status in-progress (Draft, Belum Submit, Pending Verifikasi, Susulan).
 * Return 0 kalau no decisive outcome.
 */
export function approvalRate(claims: ReadonlyArray<ClaimRecord>): number {
  const decided = claims.filter((c) =>
    c.statusPenjamin === "Approved" ||
    c.statusPenjamin === "Paid" ||
    c.statusPenjamin === "Rejected" ||
    c.statusPenjamin === "Banding Rejected" ||
    c.statusPenjamin === "Write-off",
  );
  if (decided.length === 0) return 0;
  const approved = decided.filter((c) =>
    c.statusPenjamin === "Approved" || c.statusPenjamin === "Paid",
  );
  return approved.length / decided.length;
}

// ── Days / Timing ──────────────────────────────────────

const MS_PER_DAY = 86_400_000;

/** Beda hari antara 2 ISO date string (round down). */
function daysBetween(fromISO: string, toISO: string): number {
  const from = new Date(fromISO).getTime();
  const to = new Date(toISO).getTime();
  return Math.floor((to - from) / MS_PER_DAY);
}

/**
 * Rata-rata hari dari `submittedAt` → `paidAt`.
 * Skip klaim yang belum paid atau belum submitted. Return 0 kalau no data.
 */
export function avgDaysToPaid(claims: ReadonlyArray<ClaimRecord>): number {
  const paid = claims.filter((c) => c.submittedAt && c.paidAt);
  if (paid.length === 0) return 0;
  const total = paid.reduce(
    (sum, c) => sum + daysBetween(c.submittedAt as string, c.paidAt as string),
    0,
  );
  return Math.round((total / paid.length) * 10) / 10;
}

// ── Aging ──────────────────────────────────────────────

export type AgingBucket = "0-30" | "31-60" | "61-90" | ">90";

/**
 * Aging klaim relatif terhadap `referenceISO` (default: now).
 * Basis: `submittedAt` kalau ada, fallback ke `createdAt`.
 */
export function agingBucket(
  claim: ClaimRecord,
  referenceISO: string = new Date().toISOString(),
): AgingBucket {
  const base = claim.submittedAt ?? claim.createdAt;
  const days = daysBetween(base, referenceISO);
  if (days <= 30) return "0-30";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  return ">90";
}

/** Group klaim by aging bucket — untuk chart Beranda. */
export function bucketByAging(
  claims: ReadonlyArray<ClaimRecord>,
  referenceISO: string = new Date().toISOString(),
): Record<AgingBucket, number> {
  const result: Record<AgingBucket, number> = { "0-30": 0, "31-60": 0, "61-90": 0, ">90": 0 };
  for (const c of claims) {
    result[agingBucket(c, referenceISO)]++;
  }
  return result;
}

// ── Margin (Grouper vs RS) ─────────────────────────────

/**
 * Margin persen tarif grouper vs tarif RS.
 *
 * Formula: `(tarifGrouper - tarifRS) / tarifRS * 100`
 * - Positif → RS untung (grouper bayar lebih dari biaya RS).
 * - Negatif → RS rugi (grouper bayar kurang).
 *
 * Renamed dari `marginCbg` untuk clarity (berlaku iDRG + INA-CBG legacy).
 * Return `null` kalau klaim belum punya grouper result atau tarifRS 0.
 */
export function cbgMarginPercent(claim: ClaimRecord): number | null {
  const tarifGrouper =
    claim.iDRG?.tarifAktual ??
    claim.inaCbgLegacy?.tarif.kelas2 ??
    null;
  if (tarifGrouper === null) return null;
  if (claim.tarifRS === 0n) return null;
  const numerator = rupiahToDisplayNumber(tarifGrouper - claim.tarifRS);
  const denominator = rupiahToDisplayNumber(claim.tarifRS);
  return Math.round((numerator / denominator) * 1000) / 10;
}

/** Rata-rata margin persen across list. Skip klaim yang return null. */
export function avgMarginPercent(claims: ReadonlyArray<ClaimRecord>): number {
  const margins = claims.map(cbgMarginPercent).filter((v): v is number => v !== null);
  if (margins.length === 0) return 0;
  const sum = margins.reduce((s, m) => s + m, 0);
  return Math.round((sum / margins.length) * 10) / 10;
}

// ── Status Group Counters ──────────────────────────────

/** Count by status — untuk filter chip Board. */
export function countByStatus(
  claims: ReadonlyArray<ClaimRecord>,
): Record<ClaimRecord["statusPenjamin"], number> {
  const result = {} as Record<ClaimRecord["statusPenjamin"], number>;
  for (const c of claims) {
    result[c.statusPenjamin] = (result[c.statusPenjamin] ?? 0) + 1;
  }
  return result;
}

/** Filter helper — belum submit (Draft/Belum Submit). */
export function isBelumSubmit(claim: ClaimRecord): boolean {
  return claim.statusPenjamin === "Draft Coding" || claim.statusPenjamin === "Belum Submit";
}

/** Filter helper — sedang proses BPJS (Submitted/Pending/Susulan). */
export function isPendingBPJS(claim: ClaimRecord): boolean {
  return (
    claim.statusPenjamin === "Submitted" ||
    claim.statusPenjamin === "Pending Verifikasi" ||
    claim.statusPenjamin === "Susulan Required"
  );
}

/** Filter helper — butuh banding (Rejected/Banding Rejected belum write-off). */
export function isButuhBanding(claim: ClaimRecord): boolean {
  return claim.statusPenjamin === "Rejected" || claim.statusPenjamin === "Banding Rejected";
}
