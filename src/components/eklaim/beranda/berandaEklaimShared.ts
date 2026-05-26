/**
 * Beranda E-Klaim — shared types, palette, derived stats.
 *
 * Single source for KPI/QuickNav/Panel components.
 * - Compute stats murni dari `CLAIM_BOARD_MOCK` (zero side-effect).
 * - Tone palette pakai teal (primary E-Klaim) · amber · rose · emerald · sky.
 * - Default avoid indigo per user preference.
 *
 * Reference: TODO-EKLAIM.md § EK1.
 */

import {
  Inbox,
  Scale,
  FileText,
  ArrowDownUp,
  type LucideIcon,
} from "lucide-react";

import { CLAIM_BOARD_MOCK } from "@/lib/eklaim/claimsMock";
import {
  totalApproved,
  totalPaid,
  approvalRate,
  isBelumSubmit,
  isPendingBPJS,
  isButuhBanding,
} from "@/lib/eklaim/claimCalc";
import type { ClaimRecord, Rupiah } from "@/lib/eklaim/eklaimShared";

// ── Tone palette ───────────────────────────────────────

export type EklaimTone = "teal" | "amber" | "rose" | "emerald" | "sky" | "slate";

export interface TonePalette {
  iconBg: string;
  iconText: string;
  ring: string;
  badgeBg: string;
  badgeText: string;
  bar: string;
  dot: string;
  cardHover: string;
}

export const EKLAIM_TONE: Record<EklaimTone, TonePalette> = {
  teal: {
    iconBg: "bg-teal-50",
    iconText: "text-teal-600",
    ring: "ring-teal-100",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-700",
    bar: "bg-teal-500",
    dot: "bg-teal-500",
    cardHover: "hover:border-teal-300 hover:shadow",
  },
  amber: {
    iconBg: "bg-amber-50",
    iconText: "text-amber-600",
    ring: "ring-amber-100",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
    cardHover: "hover:border-amber-300 hover:shadow",
  },
  rose: {
    iconBg: "bg-rose-50",
    iconText: "text-rose-600",
    ring: "ring-rose-100",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-700",
    bar: "bg-rose-500",
    dot: "bg-rose-500",
    cardHover: "hover:border-rose-300 hover:shadow",
  },
  emerald: {
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-600",
    ring: "ring-emerald-100",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
    cardHover: "hover:border-emerald-300 hover:shadow",
  },
  sky: {
    iconBg: "bg-sky-50",
    iconText: "text-sky-600",
    ring: "ring-sky-100",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-700",
    bar: "bg-sky-500",
    dot: "bg-sky-500",
    cardHover: "hover:border-sky-300 hover:shadow",
  },
  slate: {
    iconBg: "bg-slate-100",
    iconText: "text-slate-600",
    ring: "ring-slate-200",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700",
    bar: "bg-slate-500",
    dot: "bg-slate-400",
    cardHover: "hover:border-slate-300 hover:shadow",
  },
};

// ── Currency format (short) ────────────────────────────

const RUPIAH_FORMATTER = new Intl.NumberFormat("id-ID");

/** Compact rupiah display dengan suffix (M / jt / rb). Hindari import circular. */
export function fmtRupiahKpi(rp: Rupiah): string {
  const sign = rp < 0n ? "-" : "";
  const abs = rp < 0n ? -rp : rp;
  if (abs >= 1_000_000_000n) {
    const m = Number(abs) / 1_000_000_000;
    return `${sign}Rp ${m.toFixed(m >= 100 ? 0 : 2).replace(".", ",")} M`;
  }
  if (abs >= 1_000_000n) {
    const j = Number(abs) / 1_000_000;
    return `${sign}Rp ${j.toFixed(j >= 100 ? 0 : 1).replace(".", ",")} jt`;
  }
  if (abs >= 1_000n) {
    const k = Number(abs) / 1_000;
    return `${sign}Rp ${k.toFixed(k >= 100 ? 0 : 1).replace(".", ",")} rb`;
  }
  return `${sign}Rp ${abs.toString()}`;
}

export function fmtRupiahFull(rp: Rupiah): string {
  const sign = rp < 0n ? "-" : "";
  const abs = rp < 0n ? -rp : rp;
  return `${sign}Rp ${RUPIAH_FORMATTER.format(abs)}`;
}

// ── KPI stats ──────────────────────────────────────────

export interface EklaimStats {
  klaimHariIni: { count: number; total: Rupiah };
  pendingVerifikasi: { count: number; total: Rupiah };
  belumSubmit: { count: number; daysLeftToDeadline: number };
  approvalBulanIni: { rate: number; nominal: Rupiah };
  pembayaranBulanIni: { total: Rupiah; trf: number };
}

/** Hari ke-X bulan ini. Pakai untuk deadline submit 10 bulan depan. */
function daysUntilDeadlineSubmit(now: Date = new Date()): number {
  const tahun = now.getFullYear();
  const bulan = now.getMonth() + 1;
  // Deadline biasanya tgl 10 bulan depan untuk klaim bulan ini
  const deadline = new Date(tahun, bulan, 10);
  const ms = deadline.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export function getEklaimStats(now: Date = new Date()): EklaimStats {
  const today = now.toISOString().slice(0, 10);
  const period = today.slice(0, 7);

  const todayClaims = CLAIM_BOARD_MOCK.filter(
    (c) => c.createdAt.slice(0, 10) === today,
  );
  const pendingClaims = CLAIM_BOARD_MOCK.filter(isPendingBPJS);
  const belumSubmitClaims = CLAIM_BOARD_MOCK.filter(isBelumSubmit);
  const periodClaims = CLAIM_BOARD_MOCK.filter(
    (c) => (c.submittedAt ?? c.createdAt).slice(0, 7) === period,
  );
  const paidThisPeriod = CLAIM_BOARD_MOCK.filter(
    (c) => c.statusPenjamin === "Paid" && c.paidAt?.slice(0, 7) === period,
  );

  return {
    klaimHariIni: {
      count: todayClaims.length,
      total: todayClaims.reduce<Rupiah>((a, c) => a + c.tarifRS, 0n),
    },
    pendingVerifikasi: {
      count: pendingClaims.length,
      total: pendingClaims.reduce<Rupiah>((a, c) => a + c.tarifRS, 0n),
    },
    belumSubmit: {
      count: belumSubmitClaims.length,
      daysLeftToDeadline: daysUntilDeadlineSubmit(now),
    },
    approvalBulanIni: {
      rate: approvalRate(periodClaims),
      nominal: totalApproved(periodClaims),
    },
    pembayaranBulanIni: {
      total: totalPaid(paidThisPeriod),
      trf: paidThisPeriod.length,
    },
  };
}

// ── Quick Nav ──────────────────────────────────────────

export interface QuickNavCard {
  href: string;
  icon: LucideIcon;
  label: string;
  desc: string;
  badge: string;
  tone: EklaimTone;
  disabled?: boolean;
}

export function getQuickNavCards(stats: EklaimStats): QuickNavCard[] {
  return [
    {
      href: "/ehis-eklaim/klaim",
      icon: Inbox,
      label: "Klaim Board",
      desc: "Worklist semua klaim lintas penjamin & status",
      badge: String(CLAIM_BOARD_MOCK.length),
      tone: "teal",
    },
    {
      href: "/ehis-eklaim/grouper",
      icon: Scale,
      label: "iDRG Calculator",
      desc: "Hitung tarif iDRG + Comparator INA-CBG",
      badge: "PRIMARY",
      tone: "emerald",
      disabled: true,
    },
    {
      href: "/ehis-eklaim/banding",
      icon: FileText,
      label: "Banding",
      desc: "Klaim ditolak yang berhak diajukan banding",
      badge: String(CLAIM_BOARD_MOCK.filter(isButuhBanding).length),
      tone: "rose",
      disabled: true,
    },
    {
      href: "/ehis-eklaim/reconciliation",
      icon: ArrowDownUp,
      label: "Reconciliation",
      desc: "Match transfer bank dengan klaim approved",
      badge: String(stats.pembayaranBulanIni.trf),
      tone: "sky",
      disabled: true,
    },
  ];
}

// ── Panel: Butuh Banding ───────────────────────────────

export interface ButuhBandingEntry {
  claim: ClaimRecord;
  hariSejakRejection: number;
  selisihMinus: Rupiah;
}

export function getButuhBanding(max: number = 6, now: Date = new Date()): ButuhBandingEntry[] {
  const entries: ButuhBandingEntry[] = CLAIM_BOARD_MOCK
    .filter((c) => c.statusPenjamin === "Rejected" || c.statusPenjamin === "Banding Rejected")
    .map((claim) => {
      const baseISO = claim.submittedAt ?? claim.createdAt;
      const hari = Math.floor((now.getTime() - new Date(baseISO).getTime()) / 86_400_000);
      const tarifGrouper =
        claim.iDRG?.tarifAktual ?? claim.inaCbgLegacy?.tarif.kelas2 ?? claim.tarifRS;
      return {
        claim,
        hariSejakRejection: hari,
        selisihMinus: claim.tarifRS - tarifGrouper,
      };
    })
    .sort((a, b) => b.hariSejakRejection - a.hariSejakRejection);

  return entries.slice(0, max);
}

// ── Panel: Akan Expired Submit ─────────────────────────

export interface AkanExpiredEntry {
  claim: ClaimRecord;
  hariSinceKunjungan: number;
  hariSampaiDeadline: number;
}

/**
 * Klaim belum-submit dengan kunjungan >25 hari (mendekati batas tgl 10 next month).
 * Sort by deadline asc (paling urgent dulu).
 */
export function getAkanExpired(max: number = 6, now: Date = new Date()): AkanExpiredEntry[] {
  const deadline = daysUntilDeadlineSubmit(now);
  const entries: AkanExpiredEntry[] = CLAIM_BOARD_MOCK
    .filter(isBelumSubmit)
    .map((claim) => {
      const hari = Math.floor(
        (now.getTime() - new Date(claim.createdAt).getTime()) / 86_400_000,
      );
      return {
        claim,
        hariSinceKunjungan: hari,
        hariSampaiDeadline: deadline,
      };
    })
    .filter((e) => e.hariSinceKunjungan >= 0) // all belum-submit
    .sort((a, b) => b.hariSinceKunjungan - a.hariSinceKunjungan);

  return entries.slice(0, max);
}

// ── Panel: Recent Submission ───────────────────────────

export interface RecentSubmissionEntry {
  claim: ClaimRecord;
  agoSec: number;
  kind: "submitted" | "approved" | "paid" | "rejected";
}

function kindFromStatus(claim: ClaimRecord): RecentSubmissionEntry["kind"] {
  if (claim.statusPenjamin === "Paid") return "paid";
  if (claim.statusPenjamin === "Approved") return "approved";
  if (claim.statusPenjamin === "Rejected" || claim.statusPenjamin === "Banding Rejected")
    return "rejected";
  return "submitted";
}

export const RECENT_KIND_CFG: Record<
  RecentSubmissionEntry["kind"],
  { label: string; tone: EklaimTone }
> = {
  submitted: { label: "Submitted", tone: "amber" },
  approved: { label: "Approved", tone: "emerald" },
  paid: { label: "Paid", tone: "teal" },
  rejected: { label: "Rejected", tone: "rose" },
};

export function getRecentSubmissions(
  max: number = 8,
  now: Date = new Date(),
): RecentSubmissionEntry[] {
  return CLAIM_BOARD_MOCK
    .filter((c) => c.submittedAt)
    .map((claim) => {
      const submittedMs = new Date(claim.submittedAt as string).getTime();
      return {
        claim,
        agoSec: Math.max(0, Math.floor((now.getTime() - submittedMs) / 1000)),
        kind: kindFromStatus(claim),
      };
    })
    .sort((a, b) => a.agoSec - b.agoSec)
    .slice(0, max);
}

// ── Pipeline (Status Funnel) ───────────────────────────

export interface PipelineStage {
  key: string;
  label: string;
  count: number;
  total: Rupiah;
  tone: EklaimTone;
  href: string;
  /** Status values yang termasuk stage ini. */
  statuses: ReadonlyArray<ClaimRecord["statusPenjamin"]>;
}

/** 5 stage utama: Draft → Belum Submit → Pending → Approved → Paid. */
export function getPipelineStages(): PipelineStage[] {
  const buckets: ReadonlyArray<{
    key: string;
    label: string;
    statuses: ReadonlyArray<ClaimRecord["statusPenjamin"]>;
    tone: EklaimTone;
    href: string;
  }> = [
    {
      key: "draft",
      label: "Draft Koding",
      statuses: ["Draft Coding"],
      tone: "slate",
      href: "/ehis-eklaim/klaim?status=draft",
    },
    {
      key: "belum",
      label: "Belum Submit",
      statuses: ["Belum Submit"],
      tone: "rose",
      href: "/ehis-eklaim/klaim?status=belum-submit",
    },
    {
      key: "pending",
      label: "Pending",
      statuses: ["Submitted", "Pending Verifikasi", "Susulan Required"],
      tone: "amber",
      href: "/ehis-eklaim/klaim?status=pending",
    },
    {
      key: "approved",
      label: "Approved",
      statuses: ["Approved"],
      tone: "emerald",
      href: "/ehis-eklaim/klaim?status=approved",
    },
    {
      key: "paid",
      label: "Paid",
      statuses: ["Paid"],
      tone: "teal",
      href: "/ehis-eklaim/klaim?status=paid",
    },
  ];

  return buckets.map((b) => {
    const items = CLAIM_BOARD_MOCK.filter((c) => b.statuses.includes(c.statusPenjamin));
    return {
      key: b.key,
      label: b.label,
      tone: b.tone,
      href: b.href,
      statuses: b.statuses,
      count: items.length,
      total: items.reduce<Rupiah>((a, c) => a + (c.approvedAmount ?? c.tarifRS), 0n),
    };
  });
}

// ── Sparkline (last 14 days created counts) ────────────

export interface SparklineDatum {
  iso: string; // YYYY-MM-DD
  count: number;
  nominal: Rupiah;
}

/**
 * Generate sparkline data dari CLAIM_BOARD_MOCK groupBy createdAt date.
 * Anchored window: 14 hari ending at `now`.
 */
export function getSparkline14d(now: Date = new Date()): SparklineDatum[] {
  const days: SparklineDatum[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const items = CLAIM_BOARD_MOCK.filter((c) => c.createdAt.slice(0, 10) === iso);
    days.push({
      iso,
      count: items.length,
      nominal: items.reduce<Rupiah>((a, c) => a + c.tarifRS, 0n),
    });
  }
  return days;
}

/** Convert sparkline data points → SVG path "d" string (smooth cubic). */
export function buildSparklinePath(
  data: SparklineDatum[],
  width: number,
  height: number,
  padding: number = 4,
): { line: string; area: string } {
  if (data.length === 0) return { line: "", area: "" };

  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const stepX = (width - padding * 2) / Math.max(1, data.length - 1);
  const points = data.map((d, i) => {
    const x = padding + i * stepX;
    const y = padding + (height - padding * 2) * (1 - d.count / maxCount);
    return [x, y] as const;
  });

  const line = points
    .map(([x, y], i) => (i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : `L ${x.toFixed(2)} ${y.toFixed(2)}`))
    .join(" ");

  const first = points[0];
  const last = points[points.length - 1];
  const area = `${line} L ${last[0].toFixed(2)} ${(height - padding).toFixed(2)} L ${first[0].toFixed(2)} ${(height - padding).toFixed(2)} Z`;

  return { line, area };
}

// ── Period Selector (display-only segmented) ───────────

export type Period = "hari-ini" | "minggu-ini" | "bulan-ini";

export const PERIOD_OPTIONS: ReadonlyArray<{ key: Period; label: string }> = [
  { key: "hari-ini", label: "Hari Ini" },
  { key: "minggu-ini", label: "7 Hari" },
  { key: "bulan-ini", label: "Bulan Ini" },
];

// ── Trend calc (vs prev period) ────────────────────────

export interface Trend {
  currentNominal: Rupiah;
  previousNominal: Rupiah;
  /** -100..+999. 0 saat previous = 0. */
  deltaPercent: number;
  direction: "up" | "down" | "flat";
}

/**
 * Compare nominal periode current vs previous (window sama length).
 * Misal current = bulan ini → previous = bulan lalu.
 */
export function calcTrend(period: Period, now: Date = new Date()): Trend {
  const ranges = periodRanges(period, now);
  const current = CLAIM_BOARD_MOCK.filter((c) =>
    c.createdAt.slice(0, 10) >= ranges.curr.from && c.createdAt.slice(0, 10) <= ranges.curr.to,
  );
  const previous = CLAIM_BOARD_MOCK.filter((c) =>
    c.createdAt.slice(0, 10) >= ranges.prev.from && c.createdAt.slice(0, 10) <= ranges.prev.to,
  );
  const cur = current.reduce<Rupiah>((a, c) => a + c.tarifRS, 0n);
  const prv = previous.reduce<Rupiah>((a, c) => a + c.tarifRS, 0n);

  let delta = 0;
  if (prv > 0n) {
    const ratio = (Number(cur) - Number(prv)) / Number(prv);
    delta = Math.round(ratio * 100);
  } else if (cur > 0n) {
    delta = 100;
  }

  return {
    currentNominal: cur,
    previousNominal: prv,
    deltaPercent: delta,
    direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
  };
}

function periodRanges(period: Period, now: Date): {
  curr: { from: string; to: string };
  prev: { from: string; to: string };
} {
  const today = now.toISOString().slice(0, 10);
  const isoOfDate = (d: Date) => d.toISOString().slice(0, 10);
  const addDays = (d: Date, n: number) => {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + n);
    return nd;
  };

  if (period === "hari-ini") {
    const yesterday = isoOfDate(addDays(now, -1));
    return {
      curr: { from: today, to: today },
      prev: { from: yesterday, to: yesterday },
    };
  }
  if (period === "minggu-ini") {
    const from = isoOfDate(addDays(now, -6));
    const prevFrom = isoOfDate(addDays(now, -13));
    const prevTo = isoOfDate(addDays(now, -7));
    return {
      curr: { from, to: today },
      prev: { from: prevFrom, to: prevTo },
    };
  }
  // bulan-ini
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthFirst = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthLast = new Date(now.getFullYear(), now.getMonth(), 0);
  return {
    curr: { from: isoOfDate(firstOfMonth), to: today },
    prev: { from: isoOfDate(lastMonthFirst), to: isoOfDate(lastMonthLast) },
  };
}

// ── Mini KPI tiles untuk hero card ─────────────────────

export interface MiniKpi {
  key: string;
  label: string;
  value: string;
  hint: string;
  tone: EklaimTone;
}

export function getMiniKpis(stats: EklaimStats): MiniKpi[] {
  const ratePct = Math.round(stats.approvalBulanIni.rate * 100);
  return [
    {
      key: "hari-ini",
      label: "Klaim Hari Ini",
      value: String(stats.klaimHariIni.count),
      hint: fmtRupiahKpi(stats.klaimHariIni.total),
      tone: "teal",
    },
    {
      key: "pending",
      label: "Pending Verif",
      value: String(stats.pendingVerifikasi.count),
      hint: fmtRupiahKpi(stats.pendingVerifikasi.total),
      tone: "amber",
    },
    {
      key: "belum-submit",
      label: "Belum Submit",
      value: String(stats.belumSubmit.count),
      hint: `Deadline ${stats.belumSubmit.daysLeftToDeadline}h`,
      tone: "rose",
    },
    {
      key: "approval-rate",
      label: "Approval Rate",
      value: `${ratePct}%`,
      hint: fmtRupiahKpi(stats.approvalBulanIni.nominal),
      tone: "emerald",
    },
  ];
}

// ── Penjamin tipe palette ──────────────────────────────

export const PENJAMIN_TIPE_CFG: Record<
  ClaimRecord["penjamin"]["tipe"],
  { label: string; tone: EklaimTone }
> = {
  bpjs: { label: "BPJS", tone: "teal" },
  asuransi: { label: "Asuransi", tone: "sky" },
  jamkesda: { label: "Jamkesda", tone: "amber" },
};

// ── Relative-time helper ───────────────────────────────

export function fmtAgo(sec: number): string {
  if (sec < 60) return `${sec}d`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j`;
  const d = Math.floor(h / 24);
  return `${d}h`;
}
