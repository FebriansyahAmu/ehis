/**
 * Dashboard Analytics — shared types + pure data builders (EK8).
 *
 * Mock-first: swap CLAIM_BOARD_MOCK → REST call tanpa refactor consumer.
 * Semua fungsi PURE — no side effect.
 *
 * Referensi: TODO-EKLAIM.md § EK8.
 */

import type { Rupiah } from "./eklaimShared";
import { CLAIM_BOARD_MOCK } from "./claimsMock";
import { agingBucket, approvalRate } from "./claimCalc";
import type { AgingBucket } from "./claimCalc";

// ── Report Tabs ─────────────────────────────────────────

export type ReportTab = "approval" | "aging" | "margin" | "coder";

export type PeriodKey = "3m" | "6m" | "12m";

// ── Approval Rate Types ─────────────────────────────────

export interface MonthPoint {
  label: string;      // "Jun '25"
  yearMonth: string;  // "2025-06"
  bpjs: number;       // 0–1
  asuransi: number;
  jamkesda: number;
  overall: number;
}

export interface RejectedReason {
  reason: string;
  count: number;
  percent: number;
}

// ── Aging Types ─────────────────────────────────────────

export interface AgingRow {
  bucket: AgingBucket;
  label: string;
  bpjs: number;
  asuransi: number;
  jamkesda: number;
  total: number;
}

export interface StuckClaim {
  id: string;
  noKlaim: string;
  pasienId: string;
  penjaminNama: string;
  daysPending: number;
  tarifRS: Rupiah;
}

// ── Margin Types ────────────────────────────────────────

export interface MarginGroup {
  label: string;        // MDC group label
  code: string;         // iDRG code range (display)
  count: number;        // jumlah klaim
  avgMarginPct: number; // + = untung RS, − = rugi
  totalNominal: Rupiah;
}

// ── Dashboard KPIs ──────────────────────────────────────

export interface DashboardKPIs {
  approvalRatePct: number;
  klaimBulanIni: number;
  avgDaysPending: number;
  stuckCount: number;
}

// ── Month Config (rolling 12 bulan → Jun '25 – Mei '26) ─

const ALL_MONTHS: { label: string; yearMonth: string }[] = [
  { label: "Jun '25", yearMonth: "2025-06" },
  { label: "Jul '25", yearMonth: "2025-07" },
  { label: "Agu '25", yearMonth: "2025-08" },
  { label: "Sep '25", yearMonth: "2025-09" },
  { label: "Okt '25", yearMonth: "2025-10" },
  { label: "Nov '25", yearMonth: "2025-11" },
  { label: "Des '25", yearMonth: "2025-12" },
  { label: "Jan '26", yearMonth: "2026-01" },
  { label: "Feb '26", yearMonth: "2026-02" },
  { label: "Mar '26", yearMonth: "2026-03" },
  { label: "Apr '26", yearMonth: "2026-04" },
  { label: "Mei '26", yearMonth: "2026-05" },
];

// Synthetic approval rates — realistic RS Indonesia.
// BPJS ~78-91%  ·  Asuransi ~85-96%  ·  Jamkesda ~70-83%.
const BPJS_R     = [0.78, 0.80, 0.79, 0.83, 0.82, 0.85, 0.84, 0.87, 0.89, 0.88, 0.91, 0.89];
const ASURANSI_R = [0.85, 0.86, 0.87, 0.89, 0.90, 0.91, 0.93, 0.91, 0.94, 0.92, 0.96, 0.95];
const JAMKESDA_R = [0.70, 0.72, 0.75, 0.73, 0.76, 0.78, 0.74, 0.79, 0.77, 0.80, 0.82, 0.83];

export function buildApprovalRateData(): MonthPoint[] {
  return ALL_MONTHS.map((m, i) => ({
    ...m,
    bpjs:     BPJS_R[i],
    asuransi: ASURANSI_R[i],
    jamkesda: JAMKESDA_R[i],
    overall:  BPJS_R[i] * 0.6 + ASURANSI_R[i] * 0.3 + JAMKESDA_R[i] * 0.1,
  }));
}

// ── Rejected Reasons (synthetic — top 5) ───────────────

const RAW_REASONS = [
  { reason: "Berkas tidak lengkap / rusak",    count: 28 },
  { reason: "Diagnosa tidak sesuai tindakan",  count: 22 },
  { reason: "SEP tidak valid / expired",       count: 18 },
  { reason: "Tarif tidak sesuai standar BPJS", count: 14 },
  { reason: "Duplikasi klaim",                  count:  9 },
];

export function buildRejectedReasons(): RejectedReason[] {
  const total = RAW_REASONS.reduce((s, r) => s + r.count, 0);
  return RAW_REASONS.map(r => ({
    ...r,
    percent: Math.round((r.count / total) * 100),
  }));
}

// ── Aging Data ──────────────────────────────────────────

const AGING_LABELS: Record<AgingBucket, string> = {
  "0-30":  "0–30 hari",
  "31-60": "31–60 hari",
  "61-90": "61–90 hari",
  ">90":   "> 90 hari",
};

// Synthetic additions to make chart more meaningful
const AGING_SYNTHETIC: Record<AgingBucket, { bpjs: number; asuransi: number; jamkesda: number }> = {
  "0-30":  { bpjs:  3, asuransi: 2, jamkesda: 1 },
  "31-60": { bpjs: 12, asuransi: 5, jamkesda: 2 },
  "61-90": { bpjs:  8, asuransi: 3, jamkesda: 1 },
  ">90":   { bpjs:  5, asuransi: 2, jamkesda: 1 },
};

export function buildAgingData(): AgingRow[] {
  const now = new Date().toISOString();
  const BUCKETS: AgingBucket[] = ["0-30", "31-60", "61-90", ">90"];

  const counts: Record<AgingBucket, { bpjs: number; asuransi: number; jamkesda: number }> = {
    "0-30":  { bpjs: 0, asuransi: 0, jamkesda: 0 },
    "31-60": { bpjs: 0, asuransi: 0, jamkesda: 0 },
    "61-90": { bpjs: 0, asuransi: 0, jamkesda: 0 },
    ">90":   { bpjs: 0, asuransi: 0, jamkesda: 0 },
  };

  for (const claim of CLAIM_BOARD_MOCK) {
    const b = agingBucket(claim, now);
    const tipe = claim.penjamin.tipe as "bpjs" | "asuransi" | "jamkesda";
    counts[b][tipe]++;
  }

  for (const b of BUCKETS) {
    counts[b].bpjs     += AGING_SYNTHETIC[b].bpjs;
    counts[b].asuransi += AGING_SYNTHETIC[b].asuransi;
    counts[b].jamkesda += AGING_SYNTHETIC[b].jamkesda;
  }

  return BUCKETS.map(bucket => ({
    bucket,
    label: AGING_LABELS[bucket],
    ...counts[bucket],
    total: counts[bucket].bpjs + counts[bucket].asuransi + counts[bucket].jamkesda,
  }));
}

// ── Stuck Claims (Pending Verifikasi dari CLAIM_BOARD_MOCK) ─

export function buildStuckClaims(): StuckClaim[] {
  return CLAIM_BOARD_MOCK
    .filter(c => c.statusPenjamin === "Pending Verifikasi" && c.submittedAt)
    .map(c => {
      const ms = Date.now() - new Date(c.submittedAt as string).getTime();
      return {
        id:          c.id,
        noKlaim:     c.noKlaim,
        pasienId:    c.pasienId,
        penjaminNama: c.penjamin.nama,
        daysPending: Math.max(0, Math.floor(ms / 86_400_000)),
        tarifRS:     c.tarifRS,
      };
    })
    .sort((a, b) => b.daysPending - a.daysPending);
}

// ── Margin Groups (iDRG MDC — synthetic) ───────────────

const RAW_MARGIN: MarginGroup[] = [
  { label: "Sistem Saraf",        code: "001xxxx", count: 4, avgMarginPct:  15.1, totalNominal:  60_400_000n },
  { label: "Jantung & Vaskular",  code: "050xxxx", count: 8, avgMarginPct:  12.5, totalNominal:  98_500_000n },
  { label: "Bedah Obstetri",      code: "054xxxx", count: 6, avgMarginPct:   8.3, totalNominal:  49_800_000n },
  { label: "Ginjal & Urologi",    code: "011xxxx", count: 5, avgMarginPct:   6.7, totalNominal:  33_500_000n },
  { label: "Pencernaan",          code: "060xxxx", count: 6, avgMarginPct:   3.4, totalNominal:  20_400_000n },
  { label: "Musculoskeletal",     code: "080xxxx", count: 5, avgMarginPct:  -4.2, totalNominal: -21_000_000n },
  { label: "Pernapasan",          code: "040xxxx", count: 7, avgMarginPct:  -8.7, totalNominal: -52_200_000n },
  { label: "Endokrin & DM",       code: "010xxxx", count: 9, avgMarginPct: -12.3, totalNominal: -110_700_000n },
];

export function buildMarginGroups(): MarginGroup[] {
  return [...RAW_MARGIN].sort((a, b) => b.avgMarginPct - a.avgMarginPct);
}

// ── Coder Productivity Types ──────────────────────────────

export interface CoderProfile {
  id: string;
  name: string;
  colorHex: string;
  totalKoded: number;
  avgDaysToSubmit: number;
  trend: number;      // % delta vs prev period, + = improvement
  accuracy: number;   // 0–1, % accepted
}

export interface CoderDailyOutput {
  dateKey: string;    // "2026-05-DD"
  label: string;      // "19 Mei"
  totals: { coderId: string; count: number }[];
  total: number;
}

// ── Coder Seed Data ──────────────────────────────────────

const CODER_SEED: CoderProfile[] = [
  { id: "coder-1", name: "Ari Kusuma",     colorHex: "#14b8a6", totalKoded: 37, avgDaysToSubmit: 4.2, trend: 12, accuracy: 0.94 },
  { id: "coder-2", name: "Budi Santoso",   colorHex: "#0ea5e9", totalKoded: 28, avgDaysToSubmit: 5.8, trend: -3, accuracy: 0.89 },
  { id: "coder-3", name: "Citra Maharani", colorHex: "#f59e0b", totalKoded: 45, avgDaysToSubmit: 3.9, trend: 18, accuracy: 0.96 },
  { id: "coder-4", name: "Dewi Rahayu",    colorHex: "#f43f5e", totalKoded: 23, avgDaysToSubmit: 6.1, trend:  5, accuracy: 0.91 },
];

// [coder-1, coder-2, coder-3, coder-4] counts per day
type DayCounts = [number, number, number, number];

const DAILY_SEED: { dateKey: string; label: string; counts: DayCounts }[] = [
  { dateKey: "2026-05-19", label: "19 Mei", counts: [4, 3, 5, 2] },
  { dateKey: "2026-05-20", label: "20 Mei", counts: [5, 4, 6, 3] },
  { dateKey: "2026-05-21", label: "21 Mei", counts: [3, 2, 4, 2] },
  { dateKey: "2026-05-22", label: "22 Mei", counts: [6, 4, 7, 3] },
  { dateKey: "2026-05-23", label: "23 Mei", counts: [4, 5, 6, 4] },
  { dateKey: "2026-05-26", label: "26 Mei", counts: [7, 4, 8, 4] },
  { dateKey: "2026-05-27", label: "27 Mei", counts: [5, 4, 6, 3] },
  { dateKey: "2026-05-28", label: "28 Mei", counts: [3, 2, 3, 2] },
];

export function buildCoderProfiles(): CoderProfile[] {
  return CODER_SEED;
}

export function buildCoderDailyOutputs(): CoderDailyOutput[] {
  return DAILY_SEED.map(d => ({
    dateKey: d.dateKey,
    label: d.label,
    totals: CODER_SEED.map((c, i) => ({ coderId: c.id, count: d.counts[i] })),
    total:  d.counts.reduce((s, v) => s + v, 0),
  }));
}

// ── Dashboard KPIs ──────────────────────────────────────

export function buildDashboardKPIs(): DashboardKPIs {
  const claims = CLAIM_BOARD_MOCK;
  const rate = approvalRate(claims);

  const bulanIni = claims.filter(c => c.createdAt.startsWith("2026-05")).length;

  const pending = claims.filter(
    c => c.statusPenjamin === "Pending Verifikasi" && c.submittedAt,
  );
  let avgDays = 0;
  if (pending.length > 0) {
    const totalDays = pending.reduce((s, c) => {
      const ms = Date.now() - new Date(c.submittedAt as string).getTime();
      return s + Math.floor(ms / 86_400_000);
    }, 0);
    avgDays = Math.round(totalDays / pending.length);
  }

  const stuck = buildStuckClaims().filter(c => c.daysPending > 30).length;

  return {
    approvalRatePct: Math.round(rate * 100) || 87,
    klaimBulanIni:   bulanIni || 8,
    avgDaysPending:  avgDays  || 23,
    stuckCount:      stuck + 3,
  };
}
