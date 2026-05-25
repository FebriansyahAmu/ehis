/**
 * Beranda Billing — aggregator + types untuk dashboard landing /ehis-billing.
 *
 * Pattern mirror `berandaShared.ts` di Beranda Master (Phase 3.1):
 *   - `getBillingStats()` — angka realtime dari mock source-of-truth
 *   - `getBillingQuickNavGroups()` — denormalisasi nav cards per grup
 *   - `getPasienSiapBayar()` — list discharge belum lunas (sort sisa desc)
 *   - `getKlaimHariIni()` — list klaim status changed today (mock inline)
 *   - `getRecentPaymentsLintasCounter()` — feed lintas semua shift
 *
 * "Hari ini" memakai TODAY_ISO konstan = `2026-05-24` agar konsisten dengan
 * mock data (TAGIHAN_BOARD_MOCK + KASIR_SHIFT_MOCK semua seed di tanggal ini).
 * Saat backend ready: ganti dengan `new Date().toISOString().slice(0,10)`.
 */

import {
  Receipt, Wallet, ShieldCheck, RotateCcw,
  PiggyBank, Layers, Banknote, ListChecks,
  LineChart, AlertCircle, FileBarChart,
  type LucideIcon,
} from "lucide-react";

import { TAGIHAN_BOARD_MOCK, sisa, type TagihanRow } from "@/lib/billing/tagihanBoardMock";
import { KASIR_SHIFT_MOCK, totalShiftAll, type KasirShift } from "@/lib/billing/kasirShiftMock";
import { SHIFT_PAYMENTS_MOCK, type ShiftPaymentLog } from "@/lib/billing/shiftPaymentsMock";

// ── Konstanta demo ──────────────────────────────────────

/** Tanggal "hari ini" untuk demo (selaras dengan seed mock). */
export const TODAY_ISO = "2026-05-24";

function isToday(iso: string): boolean {
  return iso.startsWith(TODAY_ISO);
}

// ── Public stats ─────────────────────────────────────────

export interface BillingStats {
  tagihanHariIni:    { count: number; total: number };
  outstanding:       { count: number; total: number };
  klaimPending:      { count: number; total: number };
  pendapatanHariIni: { count: number; total: number };
  shiftAktif:        { count: number; counters: number };
}

export function getBillingStats(): BillingStats {
  const todayRows = TAGIHAN_BOARD_MOCK.filter((r) => isToday(r.tanggalISO));
  const outstandingRows = TAGIHAN_BOARD_MOCK.filter(
    (r) => sisa(r) > 0 && r.status !== "Void" && r.status !== "Draft",
  );
  const klaimPendingRows = TAGIHAN_BOARD_MOCK.filter(
    (r) => r.status === "Proses Klaim",
  );

  // Pendapatan hari ini = aggregate semua shift payment today (lintas counter)
  let pendapatanTotal = 0;
  let pendapatanCount = 0;
  for (const logs of Object.values(SHIFT_PAYMENTS_MOCK)) {
    for (const log of logs) {
      if (!isToday(log.tanggalISO) || log.voided) continue;
      pendapatanCount += 1;
      // Refund kategori nominal sudah negatif (atau di-prefix "−") — kita treat sebagai self-cancel
      pendapatanTotal += log.nominal;
    }
  }

  const openShifts = KASIR_SHIFT_MOCK.filter((s) => s.status === "Open");
  const uniqCounters = new Set(openShifts.map((s) => s.counter)).size;

  return {
    tagihanHariIni: {
      count: todayRows.length,
      total: todayRows.reduce((a, r) => a + r.total, 0),
    },
    outstanding: {
      count: outstandingRows.length,
      total: outstandingRows.reduce((a, r) => a + sisa(r), 0),
    },
    klaimPending: {
      count: klaimPendingRows.length,
      total: klaimPendingRows.reduce((a, r) => a + r.total, 0),
    },
    pendapatanHariIni: {
      count: pendapatanCount,
      total: pendapatanTotal,
    },
    shiftAktif: {
      count: openShifts.length,
      counters: uniqCounters,
    },
  };
}

// ── Quick-nav grouped structure ──────────────────────────

export type QuickNavTone =
  | "amber" | "emerald" | "sky" | "rose"
  | "violet" | "pink" | "slate" | "teal" | "indigo";

export interface QuickNavItem {
  label:    string;
  href:     string;
  icon:     LucideIcon;
  /** Sub-label muted di bawah judul nav card. */
  subLabel: string;
  /** Badge counter mono di kanan (string supaya bisa "Rp 2.4jt" atau "12"). */
  badge:    string;
  /** Disabled jika route belum dibangun — abu-abu + cursor-not-allowed. */
  disabled?: boolean;
}

export interface QuickNavGroup {
  label: string;
  tone: QuickNavTone;
  desc: string;
  items: QuickNavItem[];
}

export function getBillingQuickNavGroups(stats: BillingStats): QuickNavGroup[] {
  return [
    {
      label: "Transaksi",
      tone: "amber",
      desc: "Worklist tagihan, pembayaran, dan klaim",
      items: [
        { label: "Tagihan",       href: "/ehis-billing/tagihan",     icon: Receipt,     subLabel: "Worklist invoice lintas unit",       badge: String(TAGIHAN_BOARD_MOCK.length) },
        { label: "Pembayaran",    href: "/ehis-billing/pembayaran",  icon: Wallet,      subLabel: "Counter kasir + Quick Bayar + Deposit", badge: `${stats.shiftAktif.count} shift` },
        { label: "Klaim Penjamin",href: "/ehis-eklaim",              icon: ShieldCheck, subLabel: "BPJS · Asuransi · Jamkesda (E-Klaim)",   badge: "Modul Lain", disabled: true },
        { label: "Refund",        href: "/ehis-billing/refund",      icon: RotateCcw,   subLabel: "Pengembalian dana ke pasien",          badge: "Soon",       disabled: true },
      ],
    },
    {
      label: "Operasional",
      tone: "emerald",
      desc: "Tutup kas, deposit, adjustment",
      items: [
        { label: "Kasir Shift",    href: "/ehis-billing/pembayaran",         icon: Layers,    subLabel: "Buka · Tutup · Setoran ke keuangan",     badge: `${stats.shiftAktif.count} buka` },
        { label: "Deposit Awal",   href: "/ehis-billing/pembayaran?tab=deposit", icon: PiggyBank, subLabel: "Penerimaan deposit untuk admisi",     badge: "Aktif" },
        { label: "Adjustment",     href: "/ehis-billing/adjustment",         icon: Banknote,  subLabel: "Diskon · Pembebasan · Write-off (BL5)", badge: "Soon",   disabled: true },
      ],
    },
    {
      label: "Laporan",
      tone: "sky",
      desc: "Analitik pendapatan, outstanding, dan klaim",
      items: [
        { label: "Pendapatan",      href: "/ehis-billing/report/pendapatan", icon: LineChart,    subLabel: "Harian · Bulanan · Per Unit",       badge: "Soon", disabled: true },
        { label: "Outstanding",     href: "/ehis-billing/report/outstanding",icon: AlertCircle,  subLabel: "Aging piutang per penjamin",       badge: "Soon", disabled: true },
        { label: "Pendapatan Dokter", href: "/ehis-billing/report/dokter",   icon: ListChecks,   subLabel: "Recap jasa pelayanan per DPJP",     badge: "Soon", disabled: true },
        { label: "Recap Klaim",     href: "/ehis-eklaim/report",             icon: FileBarChart, subLabel: "Approval rate · INA-CBG margin",    badge: "Soon", disabled: true },
      ],
    },
  ];
}

// ── Tone palette (purge-safe static) ─────────────────────

export const TONE_PALETTE: Record<QuickNavTone, {
  ring: string;
  iconBg: string;
  iconText: string;
  dot: string;
  cardHover: string;
  badgeBg: string;
  badgeText: string;
  bar: string;
}> = {
  amber:   { ring: "ring-amber-100",   iconBg: "bg-amber-50",   iconText: "text-amber-600",   dot: "bg-amber-500",   cardHover: "hover:border-amber-300",   badgeBg: "bg-amber-50",   badgeText: "text-amber-700",   bar: "bg-amber-500"   },
  emerald: { ring: "ring-emerald-100", iconBg: "bg-emerald-50", iconText: "text-emerald-600", dot: "bg-emerald-500", cardHover: "hover:border-emerald-300", badgeBg: "bg-emerald-50", badgeText: "text-emerald-700", bar: "bg-emerald-500" },
  sky:     { ring: "ring-sky-100",     iconBg: "bg-sky-50",     iconText: "text-sky-600",     dot: "bg-sky-500",     cardHover: "hover:border-sky-300",     badgeBg: "bg-sky-50",     badgeText: "text-sky-700",     bar: "bg-sky-500"     },
  rose:    { ring: "ring-rose-100",    iconBg: "bg-rose-50",    iconText: "text-rose-600",    dot: "bg-rose-500",    cardHover: "hover:border-rose-300",    badgeBg: "bg-rose-50",    badgeText: "text-rose-700",    bar: "bg-rose-500"    },
  violet:  { ring: "ring-violet-100",  iconBg: "bg-violet-50",  iconText: "text-violet-600",  dot: "bg-violet-500",  cardHover: "hover:border-violet-300",  badgeBg: "bg-violet-50",  badgeText: "text-violet-700",  bar: "bg-violet-500"  },
  pink:    { ring: "ring-pink-100",    iconBg: "bg-pink-50",    iconText: "text-pink-600",    dot: "bg-pink-500",    cardHover: "hover:border-pink-300",    badgeBg: "bg-pink-50",    badgeText: "text-pink-700",    bar: "bg-pink-500"    },
  slate:   { ring: "ring-slate-100",   iconBg: "bg-slate-100",  iconText: "text-slate-600",   dot: "bg-slate-500",   cardHover: "hover:border-slate-300",   badgeBg: "bg-slate-100",  badgeText: "text-slate-700",   bar: "bg-slate-500"   },
  teal:    { ring: "ring-teal-100",    iconBg: "bg-teal-50",    iconText: "text-teal-600",    dot: "bg-teal-500",    cardHover: "hover:border-teal-300",    badgeBg: "bg-teal-50",    badgeText: "text-teal-700",    bar: "bg-teal-500"    },
  indigo:  { ring: "ring-indigo-100",  iconBg: "bg-indigo-50",  iconText: "text-indigo-600",  dot: "bg-indigo-500",  cardHover: "hover:border-indigo-300",  badgeBg: "bg-indigo-50",  badgeText: "text-indigo-700",  bar: "bg-indigo-500"  },
};

// ── Pasien Siap Bayar ────────────────────────────────────

export interface PasienSiapBayarEntry {
  row: TagihanRow;
  sisaNominal: number;
  /** Persen sisa relatif ke total (0-100). */
  sisaPct: number;
}

/**
 * Pasien yang sudah dapat tagihan tapi belum lunas, urut sisa terbesar dulu.
 * Exclude Draft (belum final) + Void.
 */
export function getPasienSiapBayar(limit = 6): PasienSiapBayarEntry[] {
  return TAGIHAN_BOARD_MOCK
    .filter((r) => sisa(r) > 0 && r.status !== "Void" && r.status !== "Draft")
    .map((r) => {
      const s = sisa(r);
      return { row: r, sisaNominal: s, sisaPct: r.total > 0 ? Math.round((s / r.total) * 100) : 0 };
    })
    .sort((a, b) => b.sisaNominal - a.sisaNominal)
    .slice(0, limit);
}

// ── Klaim Hari Ini (inline mock — billing read-only view) ─

/**
 * Mock klaim activity hari ini untuk dashboard panel.
 *
 * Source of truth nantinya di `/ehis-eklaim` (claimsMock di EK0). Untuk Beranda
 * billing kita inline ringkas — sama pattern dengan `RECENT_EDITS_MOCK` di
 * Beranda Master yang inline aktivitas tanpa import seluruh audit store.
 */
export type KlaimActivityKind =
  | "Submitted" | "Approved" | "Rejected" | "Paid";

export interface KlaimActivityEntry {
  id: string;
  invoiceNo: string;
  pasienNama: string;
  pasienRM: string;
  penjamin: string;
  penjaminTipe: "bpjs" | "asuransi" | "jamkesda";
  nominal: number;
  kind: KlaimActivityKind;
  /** Detik dari TODAY_ISO start-of-day (negatif). */
  agoSec: number;
  actor: string;
}

export const KLAIM_HARI_INI_MOCK: KlaimActivityEntry[] = [
  { id: "k1", invoiceNo: "INV/2026/05/00239", pasienNama: "Sutrisno Bagus",  pasienRM: "RM-2025-008", penjamin: "BPJS Non-PBI",   penjaminTipe: "bpjs",     nominal: 16_265_000, kind: "Submitted", agoSec: -2_400,  actor: "Susi (Tim Klaim)" },
  { id: "k2", invoiceNo: "INV/2026/05/00237", pasienNama: "Andi Pratama",    pasienRM: "RM-2025-031", penjamin: "BPJS Non-PBI",   penjaminTipe: "bpjs",     nominal: 11_450_000, kind: "Approved",  agoSec: -5_400,  actor: "Verifikator BPJS" },
  { id: "k3", invoiceNo: "INV/2026/05/00220", pasienNama: "Hartono Sukirman",pasienRM: "RM-2025-040", penjamin: "AXA Mandiri",    penjaminTipe: "asuransi", nominal:  4_780_000, kind: "Rejected",  agoSec: -10_800, actor: "Verifikator AXA" },
  { id: "k4", invoiceNo: "INV/2026/05/00198", pasienNama: "Indah Lestari",   pasienRM: "RM-2025-022", penjamin: "BPJS PBI",       penjaminTipe: "bpjs",     nominal:  8_320_000, kind: "Paid",      agoSec: -14_400, actor: "Bendahara BPJS" },
  { id: "k5", invoiceNo: "INV/2026/05/00222", pasienNama: "Yuni Astuti",     pasienRM: "RM-2025-029", penjamin: "Jamkesda DKI",   penjaminTipe: "jamkesda", nominal:  2_640_000, kind: "Submitted", agoSec: -21_600, actor: "Susi (Tim Klaim)" },
];

export const KLAIM_KIND_CFG: Record<KlaimActivityKind, { label: string; tone: QuickNavTone; verb: string }> = {
  Submitted: { label: "Submitted", tone: "sky",     verb: "dikirim"     },
  Approved:  { label: "Approved",  tone: "emerald", verb: "disetujui"   },
  Rejected:  { label: "Rejected",  tone: "rose",    verb: "ditolak"     },
  Paid:      { label: "Paid",      tone: "teal",    verb: "dibayar"     },
};

export const PENJAMIN_TIPE_CFG: Record<"bpjs" | "asuransi" | "jamkesda" | "umum", { label: string; tone: QuickNavTone }> = {
  bpjs:     { label: "BPJS",     tone: "emerald" },
  asuransi: { label: "Asuransi", tone: "sky"     },
  jamkesda: { label: "Jamkesda", tone: "amber"   },
  umum:     { label: "Umum",     tone: "slate"   },
};

// ── Recent Payments lintas counter ───────────────────────

export interface RecentPaymentEntry extends ShiftPaymentLog {
  shiftId: string;
  counter: string;
}

/**
 * Feed pembayaran terakhir lintas semua shift (Open + Closed) — sortir DESC by
 * tanggalISO. Voided di-skip dari feed (audit ada di tab Riwayat invoice).
 */
export function getRecentPaymentsLintasCounter(limit = 10): RecentPaymentEntry[] {
  const all: RecentPaymentEntry[] = [];
  const shiftIndex: Record<string, KasirShift> = {};
  for (const s of KASIR_SHIFT_MOCK) shiftIndex[s.id] = s;

  for (const [shiftId, logs] of Object.entries(SHIFT_PAYMENTS_MOCK)) {
    for (const log of logs) {
      if (log.voided) continue;
      all.push({
        ...log,
        shiftId,
        counter: shiftIndex[shiftId]?.counter ?? shiftId,
      });
    }
  }

  return all
    .sort((a, b) => b.tanggalISO.localeCompare(a.tanggalISO))
    .slice(0, limit);
}

// ── Format helpers ──────────────────────────────────────

/** Format "X menit lalu" / "X jam lalu" / "X hari lalu". */
export function fmtAgo(sec: number): string {
  const abs = Math.abs(sec);
  if (abs < 60) return `${abs}d lalu`;
  if (abs < 3600) return `${Math.round(abs / 60)} mnt lalu`;
  if (abs < 86400) return `${Math.round(abs / 3600)} jam lalu`;
  return `${Math.round(abs / 86400)} hari lalu`;
}

/** Format jam HH:mm dari ISO datetime. */
export function fmtJam(iso: string): string {
  const time = iso.slice(11, 16);
  return time || "--:--";
}

/** Re-export aggregator total shift. */
export { totalShiftAll };
