/**
 * Klaim Board — pure filter/sort/KPI logic (EK2.3).
 *
 * Semua fungsi PURE, no side effect, deterministic.
 *
 * Single source: `CLAIM_BOARD_MOCK` dari `@/lib/eklaim/claimsMock`.
 * Saat backend ready, swap source via dependency injection (param `claims`).
 *
 * Reference: TODO-EKLAIM.md § EK2.3.
 */

import { CLAIM_BOARD_MOCK } from "@/lib/eklaim/claimsMock";
import {
  approvalRate,
  countByStatus,
  totalApproved,
  totalPaid,
  totalTarifRS,
} from "@/lib/eklaim/claimCalc";
import { addRupiah } from "@/lib/eklaim/money";
import type { ClaimRecord, Rupiah } from "@/lib/eklaim/eklaimShared";
import { fmtRupiahKpi } from "@/components/eklaim/beranda/berandaEklaimShared";

import {
  type KlaimFilterState,
  type QuickTab,
  type PenjaminFilter,
  type EraFilter,
  todayISO,
  firstOfMonthISO,
} from "./klaimBoardShared";

// ── Single source ──────────────────────────────────────

export const KLAIM_BOARD_MOCK = CLAIM_BOARD_MOCK;

// ── Filter ─────────────────────────────────────────────

/**
 * Apply ALL filters (sidebar) tapi BUKAN quick-tab.
 * Quick-tab di-apply terpisah supaya counter per tab tetap aware ke filter lain.
 */
export function applyFilters(
  claims: ReadonlyArray<ClaimRecord>,
  f: KlaimFilterState,
): ReadonlyArray<ClaimRecord> {
  const searchLower = f.search.trim().toLowerCase();
  const fromDate = f.periodeFrom;
  const toDate = f.periodeTo;
  const penjaminNamaLower = f.penjaminNama.trim().toLowerCase();

  return claims.filter((c) => {
    // Search: noKlaim / pasienId / SEP noKartu
    if (searchLower) {
      const haystack = [
        c.noKlaim,
        c.pasienId,
        c.penjamin.sep?.noKartu ?? "",
        c.penjamin.sep?.noSEP ?? "",
        c.penjamin.nama,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(searchLower)) return false;
    }

    // Periode (basis: createdAt → tanggal kunjungan/koding pertama)
    const claimDate = c.createdAt.slice(0, 10);
    if (claimDate < fromDate) return false;
    if (claimDate > toDate) return false;

    // Unit (tipePelayanan)
    if (f.units.length > 0 && !f.units.includes(c.tipePelayanan)) return false;

    // Kelas
    if (f.kelas.length > 0 && !f.kelas.includes(c.kelas)) return false;

    // Penjamin tipe
    if (f.penjamin !== "all" && c.penjamin.tipe !== f.penjamin) return false;

    // Penjamin nama spesifik
    if (penjaminNamaLower && !c.penjamin.nama.toLowerCase().includes(penjaminNamaLower)) {
      return false;
    }

    // Status (multi-select)
    if (f.status.length > 0 && !f.status.includes(c.statusPenjamin)) return false;

    // Era grouper
    if (f.era !== "all" && c.eraGrouper !== f.era) return false;

    return true;
  });
}

// ── Quick Tab ──────────────────────────────────────────

const QUICK_TAB_PREDICATES: Record<QuickTab, (c: ClaimRecord) => boolean> = {
  semua: () => true,
  "belum-submit": (c) =>
    c.statusPenjamin === "Draft Coding" || c.statusPenjamin === "Belum Submit",
  "pending-verif": (c) =>
    c.statusPenjamin === "Submitted" ||
    c.statusPenjamin === "Pending Verifikasi" ||
    c.statusPenjamin === "Susulan Required",
  rejected: (c) =>
    c.statusPenjamin === "Rejected" || c.statusPenjamin === "Banding Rejected",
  paid: (c) => c.statusPenjamin === "Paid",
};

/** Apply quick-tab predicate setelah `applyFilters`. */
export function applyQuickTab(
  claims: ReadonlyArray<ClaimRecord>,
  tab: QuickTab,
): ReadonlyArray<ClaimRecord> {
  return claims.filter(QUICK_TAB_PREDICATES[tab]);
}

/**
 * Compose: sidebar filters + quick-tab dalam 1 call.
 * Helper untuk konsumer yang butuh final list saja.
 */
export function applyAllFilters(
  claims: ReadonlyArray<ClaimRecord>,
  f: KlaimFilterState,
): ReadonlyArray<ClaimRecord> {
  return applyQuickTab(applyFilters(claims, f), f.quickTab);
}

/**
 * Hitung count per quick tab dengan filter sidebar aktif (tapi tanpa quickTab itu sendiri).
 * Output: `{ semua, belum-submit, pending-verif, rejected, paid }`.
 *
 * Pattern sama dengan Tagihan BL1.4 — count "aware" ke filter lain supaya
 * user lihat berapa item match di setiap quick tab UNTUK filter yang aktif.
 */
export function computeQuickTabCounts(
  claims: ReadonlyArray<ClaimRecord>,
  f: KlaimFilterState,
): Record<QuickTab, number> {
  const pool = applyFilters(claims, f);
  const counts = {} as Record<QuickTab, number>;
  for (const tab of Object.keys(QUICK_TAB_PREDICATES) as QuickTab[]) {
    counts[tab] = pool.filter(QUICK_TAB_PREDICATES[tab]).length;
  }
  return counts;
}

// ── KPI Strip Derivation ───────────────────────────────

export interface KlaimBoardKPI {
  id: string;
  label: string;
  /** Primary value (count atau Rp short). */
  value: string;
  /** Sub line (e.g. nominal Rp, count breakdown). */
  sub: string;
  /** Trend hint — null kalau tidak ada baseline. */
  trend: { sign: "up" | "down" | "flat"; text: string } | null;
}

/**
 * Derive 4 KPI: Klaim Hari Ini · Pending Verifikasi · Rejected Bulan Ini · Approval Rate.
 *
 * Semua angka dari pool yang sudah di-apply filter sidebar (tanpa quickTab),
 * agar user lihat distribusi sesuai filter aktif (lebih helpful daripada KPI global).
 */
export function computeKPIs(
  claims: ReadonlyArray<ClaimRecord>,
  filters: KlaimFilterState,
): KlaimBoardKPI[] {
  const pool = applyFilters(claims, filters);
  const today = todayISO();
  const firstOfMonth = firstOfMonthISO();

  // KPI 1 — Klaim Hari Ini (yang createdAt-nya hari ini)
  const todayList = pool.filter((c) => c.createdAt.slice(0, 10) === today);
  const todayTotal = totalTarifRS(todayList);
  const yesterdayCount = pool.filter(
    (c) => c.createdAt.slice(0, 10) === shiftISO(today, -1),
  ).length;
  const delta = todayList.length - yesterdayCount;
  const todayTrend: KlaimBoardKPI["trend"] =
    delta > 0
      ? { sign: "up",   text: `+${delta} dari kemarin` }
      : delta < 0
        ? { sign: "down", text: `${delta} dari kemarin` }
        : { sign: "flat", text: "sama dengan kemarin" };

  // KPI 2 — Pending Verifikasi (Submitted + Pending + Susulan)
  const pendingList = pool.filter(
    (c) =>
      c.statusPenjamin === "Submitted" ||
      c.statusPenjamin === "Pending Verifikasi" ||
      c.statusPenjamin === "Susulan Required",
  );
  const pendingTotal = addRupiah(
    ...pendingList.map((c) => c.approvedAmount ?? c.tarifRS),
  );
  const susulanCount = pendingList.filter(
    (c) => c.statusPenjamin === "Susulan Required",
  ).length;
  const pendingTrend: KlaimBoardKPI["trend"] =
    susulanCount > 0
      ? { sign: "up", text: `${susulanCount} butuh berkas susulan` }
      : { sign: "flat", text: "Tidak ada susulan" };

  // KPI 3 — Rejected Bulan Ini (Rejected + Banding Rejected)
  const rejectedList = pool.filter(
    (c) =>
      (c.statusPenjamin === "Rejected" || c.statusPenjamin === "Banding Rejected") &&
      c.createdAt.slice(0, 10) >= firstOfMonth,
  );
  const rejectedSelisih = addRupiah(
    ...rejectedList.map((c) => {
      const tarifGrouper = c.iDRG?.tarifAktual ?? c.inaCbgLegacy?.tarif.kelas2 ?? 0n;
      return tarifGrouper > 0n ? tarifGrouper : c.tarifRS;
    }),
  );
  const rejectedTrend: KlaimBoardKPI["trend"] =
    rejectedList.length > 0
      ? { sign: "down", text: "perlu banding/write-off" }
      : { sign: "flat", text: "Tidak ada rejection" };

  // KPI 4 — Approval Rate (% dari pool decided)
  const rate = approvalRate(pool);
  const ratePct = Math.round(rate * 1000) / 10; // 1 desimal
  const approvedTotal = totalApproved(pool);
  const paidTotal = totalPaid(pool);
  const approvalTrend: KlaimBoardKPI["trend"] =
    ratePct >= 90
      ? { sign: "up", text: "Sehat (target 90%+)" }
      : ratePct >= 75
        ? { sign: "flat", text: "Stabil (target 90%+)" }
        : { sign: "down", text: "Di bawah target" };

  return [
    {
      id: "today",
      label: "Klaim Hari Ini",
      value: String(todayList.length),
      sub: `Tarif RS ${fmt(todayTotal)}`,
      trend: todayTrend,
    },
    {
      id: "pending",
      label: "Pending Verifikasi",
      value: String(pendingList.length),
      sub: `Nilai ${fmt(pendingTotal)} menunggu`,
      trend: pendingTrend,
    },
    {
      id: "rejected",
      label: "Rejected Bulan Ini",
      value: String(rejectedList.length),
      sub: `Selisih ${fmt(rejectedSelisih)}`,
      trend: rejectedTrend,
    },
    {
      id: "approval",
      label: "Approval Rate",
      value: `${ratePct.toFixed(1)}%`,
      sub: `Disetujui ${fmt(approvedTotal)} · Paid ${fmt(paidTotal)}`,
      trend: approvalTrend,
    },
  ];
}

// ── Penjamin nama dropdown derivation ──────────────────

/**
 * Unique penjamin nama dari claim pool, optionally filtered by tipe.
 * Untuk dropdown sekunder "Penjamin spesifik" di FilterPanel.
 */
export function listPenjaminNama(
  claims: ReadonlyArray<ClaimRecord>,
  tipe: PenjaminFilter,
): string[] {
  const filtered = tipe === "all" ? claims : claims.filter((c) => c.penjamin.tipe === tipe);
  const names = new Set<string>();
  for (const c of filtered) names.add(c.penjamin.nama);
  return Array.from(names).sort((a, b) => a.localeCompare(b, "id-ID"));
}

// ── Status count (for chip badge) ──────────────────────

/** Re-export — count per status setelah filter sidebar (tanpa filter status itu sendiri). */
export function statusCountsForChips(
  claims: ReadonlyArray<ClaimRecord>,
  f: KlaimFilterState,
): Record<ClaimRecord["statusPenjamin"], number> {
  const stripped: KlaimFilterState = { ...f, status: [] };
  return countByStatus(applyFilters(claims, stripped));
}

// ── Sort (scaffold — EK2.2 detail) ─────────────────────

export type SortKey =
  | "noKlaim"
  | "pasienId"
  | "createdAt"
  | "tarifRS"
  | "selisih"
  | "status"
  | "iDRGCode";

export type SortDir = "asc" | "desc" | null;

export interface SortState {
  key: SortKey | null;
  dir: SortDir;
}

export const defaultSort: SortState = { key: "createdAt", dir: "desc" };

/** Cycle 3-state sort: asc → desc → null. */
export function cycleSort(current: SortState, key: SortKey): SortState {
  if (current.key !== key) return { key, dir: "asc" };
  if (current.dir === "asc") return { key, dir: "desc" };
  if (current.dir === "desc") return { key: null, dir: null };
  return { key, dir: "asc" };
}

/** Apply sort to filtered claims. Stable for null. */
export function applySort(
  claims: ReadonlyArray<ClaimRecord>,
  s: SortState,
): ReadonlyArray<ClaimRecord> {
  if (!s.key || !s.dir) return claims;
  const sign = s.dir === "asc" ? 1 : -1;
  const sorted = [...claims].sort((a, b) => sign * compareByKey(a, b, s.key as SortKey));
  return sorted;
}

function compareByKey(a: ClaimRecord, b: ClaimRecord, key: SortKey): number {
  switch (key) {
    case "noKlaim":   return a.noKlaim.localeCompare(b.noKlaim, "id-ID");
    case "pasienId":  return a.pasienId.localeCompare(b.pasienId, "id-ID");
    case "createdAt": return a.createdAt.localeCompare(b.createdAt);
    case "tarifRS":   return cmpBig(a.tarifRS, b.tarifRS);
    case "selisih":   return cmpBig(a.selisih ?? 0n, b.selisih ?? 0n);
    case "status":    return a.statusPenjamin.localeCompare(b.statusPenjamin, "id-ID");
    case "iDRGCode": {
      const ac = a.iDRG?.code ?? a.inaCbgLegacy?.code ?? "";
      const bc = b.iDRG?.code ?? b.inaCbgLegacy?.code ?? "";
      return ac.localeCompare(bc, "id-ID");
    }
  }
}

function cmpBig(a: Rupiah, b: Rupiah): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

// ── Internal helpers ───────────────────────────────────

function shiftISO(iso: string, delta: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Compact Rupiah format — re-use beranda formatter. */
function fmt(rp: Rupiah): string {
  return fmtRupiahKpi(rp);
}

// Re-export untuk konsumer eksternal
export { type EraFilter };
