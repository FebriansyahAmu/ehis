/**
 * bandingShared — shared types, filter state, tone tokens, KPI logic (EK6.1).
 */

import type { BandingRecord, BandingStatus, ClaimRecord } from "@/lib/eklaim/eklaimShared";
import { CLAIM_BOARD_MOCK } from "@/lib/eklaim/claimsMock";
import { BANDING_MOCK } from "@/lib/eklaim/bandingMock";

// ── View Item ─────────────────────────────────────────────

/** Joined view: banding + linked claim context for table rows. */
export interface BandingViewItem {
  banding: BandingRecord;
  claim: ClaimRecord | null;
}

// ── Filter Types ──────────────────────────────────────────

export type BandingStatusFilter = BandingStatus | "all";
export type PenjaminFilter = "all" | "bpjs" | "asuransi" | "jamkesda";
export type TingkatFilter = "all" | "1" | "2";
export type PeriodePreset = "7d" | "30d" | "90d" | "custom";

export interface BandingFilterState {
  search: string;
  status: BandingStatusFilter;
  penjamin: PenjaminFilter;
  tingkat: TingkatFilter;
  periodePreset: PeriodePreset;
  periodeFrom: string;
  periodeTo: string;
}

// ── Tone Tokens ───────────────────────────────────────────

export type ToneKey = "amber" | "teal" | "emerald" | "rose" | "sky" | "slate";

interface ToneTokens {
  ringIdle: string;
  ringHover: string;
  barFrom: string;
  valueText: string;
  iconBg: string;
  iconText: string;
  chipBg: string;
  chipText: string;
  chipRing: string;
  dot: string;
}

export const BANDING_TONE: Record<ToneKey, ToneTokens> = {
  amber: {
    ringIdle: "ring-amber-100", ringHover: "hover:ring-amber-200",
    barFrom: "from-amber-400", valueText: "text-amber-700",
    iconBg: "bg-amber-50", iconText: "text-amber-600",
    chipBg: "bg-amber-50", chipText: "text-amber-700", chipRing: "ring-amber-200",
    dot: "bg-amber-400",
  },
  teal: {
    ringIdle: "ring-teal-100", ringHover: "hover:ring-teal-200",
    barFrom: "from-teal-400", valueText: "text-teal-700",
    iconBg: "bg-teal-50", iconText: "text-teal-600",
    chipBg: "bg-teal-50", chipText: "text-teal-700", chipRing: "ring-teal-200",
    dot: "bg-teal-400",
  },
  emerald: {
    ringIdle: "ring-emerald-100", ringHover: "hover:ring-emerald-200",
    barFrom: "from-emerald-400", valueText: "text-emerald-700",
    iconBg: "bg-emerald-50", iconText: "text-emerald-600",
    chipBg: "bg-emerald-50", chipText: "text-emerald-700", chipRing: "ring-emerald-200",
    dot: "bg-emerald-400",
  },
  rose: {
    ringIdle: "ring-rose-100", ringHover: "hover:ring-rose-200",
    barFrom: "from-rose-400", valueText: "text-rose-700",
    iconBg: "bg-rose-50", iconText: "text-rose-600",
    chipBg: "bg-rose-50", chipText: "text-rose-700", chipRing: "ring-rose-200",
    dot: "bg-rose-400",
  },
  sky: {
    ringIdle: "ring-sky-100", ringHover: "hover:ring-sky-200",
    barFrom: "from-sky-400", valueText: "text-sky-700",
    iconBg: "bg-sky-50", iconText: "text-sky-600",
    chipBg: "bg-sky-50", chipText: "text-sky-700", chipRing: "ring-sky-200",
    dot: "bg-sky-400",
  },
  slate: {
    ringIdle: "ring-slate-200", ringHover: "hover:ring-slate-300",
    barFrom: "from-slate-300", valueText: "text-slate-700",
    iconBg: "bg-slate-50", iconText: "text-slate-500",
    chipBg: "bg-slate-50", chipText: "text-slate-600", chipRing: "ring-slate-200",
    dot: "bg-slate-300",
  },
};

// ── Status Config ─────────────────────────────────────────

export const BANDING_STATUS_CFG: Record<BandingStatus, { label: string; tone: ToneKey }> = {
  Submitted: { label: "Diajukan",     tone: "sky"     },
  Review:    { label: "Dalam Review", tone: "amber"   },
  Approved:  { label: "Disetujui",    tone: "emerald" },
  Rejected:  { label: "Ditolak",      tone: "rose"    },
};

export const BANDING_STATUS_ORDER: BandingStatus[] = [
  "Submitted", "Review", "Approved", "Rejected",
];

// ── Quick Tabs ────────────────────────────────────────────

export type QuickTab = "all" | BandingStatus;

export const QUICK_TABS: { value: QuickTab; label: string; tone: ToneKey | null }[] = [
  { value: "all",       label: "Semua",        tone: null       },
  { value: "Submitted", label: "Diajukan",      tone: "sky"      },
  { value: "Review",    label: "Dalam Review",  tone: "amber"    },
  { value: "Approved",  label: "Disetujui",     tone: "emerald"  },
  { value: "Rejected",  label: "Ditolak",       tone: "rose"     },
];

// ── Filter Defaults + Helpers ─────────────────────────────

export function defaultBandingFilters(): BandingFilterState {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 90);
  return {
    search: "",
    status: "all",
    penjamin: "all",
    tingkat: "all",
    periodePreset: "90d",
    periodeFrom: from.toISOString().slice(0, 10),
    periodeTo: today.toISOString().slice(0, 10),
  };
}

export function applyBandingPeriodePreset(preset: PeriodePreset): { from: string; to: string } {
  const today = new Date();
  const from = new Date(today);
  if (preset === "7d") from.setDate(from.getDate() - 7);
  else if (preset === "30d") from.setDate(from.getDate() - 30);
  else if (preset === "90d") from.setDate(from.getDate() - 90);
  else from.setFullYear(from.getFullYear() - 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  };
}

export function countBandingActiveFilters(f: BandingFilterState): number {
  let n = 0;
  if (f.search)           n++;
  if (f.status !== "all") n++;
  if (f.penjamin !== "all") n++;
  if (f.tingkat !== "all") n++;
  if (f.periodePreset !== "90d") n++;
  return n;
}

// ── Data Join + Filter ────────────────────────────────────

/** Join BandingRecord with ClaimRecord from the mock. */
export function buildViewItems(): BandingViewItem[] {
  return BANDING_MOCK.map((banding) => ({
    banding,
    claim: CLAIM_BOARD_MOCK.find((c) => c.id === banding.claimId) ?? null,
  }));
}

export function filterViewItems(
  items: BandingViewItem[],
  filters: BandingFilterState,
  quickTab: QuickTab,
): BandingViewItem[] {
  const effectiveStatus: BandingStatusFilter =
    quickTab !== "all" ? quickTab : filters.status;

  return items.filter(({ banding, claim }) => {
    // status
    if (effectiveStatus !== "all" && banding.status !== effectiveStatus) return false;

    // tingkat
    if (filters.tingkat !== "all" && String(banding.tingkat) !== filters.tingkat) return false;

    // penjamin
    if (filters.penjamin !== "all" && claim?.penjamin.tipe !== filters.penjamin) return false;

    // search — no klaim, pasienId, banding id
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const haystack = [
        banding.id,
        claim?.noKlaim ?? "",
        claim?.pasienId ?? "",
        claim?.penjamin.nama ?? "",
        banding.submittedBy,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    // periode (by submittedAt)
    if (filters.periodeFrom) {
      const d = banding.submittedAt.slice(0, 10);
      if (d < filters.periodeFrom || d > filters.periodeTo) return false;
    }

    return true;
  });
}

// ── KPI Computation ───────────────────────────────────────

export interface BandingKPIResult {
  id: string;
  label: string;
  value: string;
  sub: string;
  tone: ToneKey;
}

export function computeBandingKPIs(items: BandingViewItem[]): BandingKPIResult[] {
  const total = items.length;
  const approved = items.filter((i) => i.banding.status === "Approved").length;
  const rejected = items.filter((i) => i.banding.status === "Rejected").length;
  const pending = items.filter(
    (i) => i.banding.status === "Submitted" || i.banding.status === "Review",
  ).length;

  const decided = approved + rejected;
  const approvalRate = decided > 0 ? Math.round((approved / decided) * 100) : 0;

  // avg days to decision for resolved bandings
  const resolvedDays = items
    .filter((i) => i.banding.reviewedAt)
    .map((i) => {
      const start = new Date(i.banding.submittedAt).getTime();
      const end = new Date(i.banding.reviewedAt!).getTime();
      return Math.round((end - start) / (1000 * 60 * 60 * 24));
    });
  const avgDays =
    resolvedDays.length > 0
      ? Math.round(resolvedDays.reduce((a, b) => a + b, 0) / resolvedDays.length)
      : 0;

  return [
    {
      id: "total",
      label: "Total Banding",
      value: String(total),
      sub: `${pending} menunggu keputusan`,
      tone: "teal",
    },
    {
      id: "approval-rate",
      label: "Approval Rate",
      value: decided > 0 ? `${approvalRate}%` : "—",
      sub: `${approved} disetujui · ${rejected} ditolak`,
      tone: approvalRate >= 60 ? "emerald" : approvalRate >= 40 ? "amber" : "rose",
    },
    {
      id: "avg-days",
      label: "Rata-rata Hari Keputusan",
      value: avgDays > 0 ? `${avgDays} hari` : "—",
      sub: resolvedDays.length > 0 ? `dari ${resolvedDays.length} banding selesai` : "belum ada data",
      tone: avgDays > 0 && avgDays <= 14 ? "emerald" : avgDays > 14 ? "amber" : "slate",
    },
  ];
}

// ── Date Formatters ───────────────────────────────────────

export function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtDatetime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })} ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
}
