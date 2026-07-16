/**
 * Beranda Billing — aggregator + types untuk dashboard landing /ehis-billing.
 *
 * DATA NYATA (tanpa mock): angka & daftar diturunkan dari proyeksi billing + pembayaran
 * + shift NYATA yang di-fetch di `BerandaBillingPage`, lalu di-agregat oleh fungsi murni
 * di sini (menerima input, tidak membaca store):
 *   - `getBillingStats(input)`        — 5 KPI (tagihan hari ini · outstanding · klaim penjamin · pendapatan · shift)
 *   - `getBillingQuickNavGroups(stats)` — denormalisasi nav cards per grup (badge dari stats)
 *   - `getPasienSiapBayar(rows)`      — kunjungan outstanding (sort sisa desc)
 *
 * Panel Klaim Hari Ini = feed aktivitas E-Klaim (belum ada backend → empty state);
 * Pembayaran Terbaru = feed pembayaran NYATA lintas counter (RecentPaymentDTO, prop-driven).
 */

import {
  Receipt, Wallet, ShieldCheck, RotateCcw,
  PiggyBank, Layers, Banknote, ListChecks,
  LineChart, AlertCircle, FileBarChart,
  type LucideIcon,
} from "lucide-react";

import type { TagihanRow } from "@/lib/billing/tagihanBoardMock";

// ── Helpers ──────────────────────────────────────────────

const todayISO = () => new Date().toISOString().slice(0, 10);

/** Sisa tagihan baris (proyeksi) = total − dibayar, tak negatif. */
function rowSisa(r: TagihanRow): number {
  return Math.max(0, r.total - r.dibayar);
}

// ── Public stats ─────────────────────────────────────────

export interface BillingStats {
  tagihanHariIni:    { count: number; total: number };
  outstanding:       { count: number; total: number };
  klaimPending:      { count: number; total: number };
  pendapatanHariIni: { count: number; total: number };
  shiftAktif:        { count: number; counters: number };
}

/** Input agregasi KPI dari sumber NYATA (di-fetch di page). */
export interface BillingStatsInput {
  /** Baris tagihan kunjungan (proyeksi billing) → mapProjectionRow. */
  rows: TagihanRow[];
  /** Pendapatan hari ini (ringkasan pembayaran NYATA by date). */
  pendapatan: { count: number; total: number };
  /** Shift kasir Open (papan shift NYATA). */
  openShifts: { counter: string }[];
}

export function getBillingStats(input: BillingStatsInput): BillingStats {
  const today = todayISO();
  const todayRows = input.rows.filter((r) => r.tanggalISO.startsWith(today));
  // Outstanding = tagihan belum lunas (ada sisa) & bukan Draft (belum ada charge).
  const outstandingRows = input.rows.filter((r) => rowSisa(r) > 0 && r.status !== "Draft");
  // Klaim penjamin pending = tagihan outstanding milik penjamin (bukan Umum) → menunggu klaim/settle.
  const klaimPendingRows = outstandingRows.filter((r) => r.penjamin.tipe !== "umum");
  const uniqCounters = new Set(input.openShifts.map((s) => s.counter)).size;

  return {
    tagihanHariIni: {
      count: todayRows.length,
      total: todayRows.reduce((a, r) => a + r.total, 0),
    },
    outstanding: {
      count: outstandingRows.length,
      total: outstandingRows.reduce((a, r) => a + rowSisa(r), 0),
    },
    klaimPending: {
      count: klaimPendingRows.length,
      total: klaimPendingRows.reduce((a, r) => a + rowSisa(r), 0),
    },
    pendapatanHariIni: input.pendapatan,
    shiftAktif: {
      count: input.openShifts.length,
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
        { label: "Tagihan",       href: "/ehis-billing/tagihan",     icon: Receipt,     subLabel: "Tagihan pasien dari order klinis (nyata)", badge: "Nyata" },
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
 * Exclude Draft (belum ada charge). Sumber = baris proyeksi billing NYATA.
 */
export function getPasienSiapBayar(rows: TagihanRow[], limit = 6): PasienSiapBayarEntry[] {
  return rows
    .filter((r) => rowSisa(r) > 0 && r.status !== "Draft")
    .map((r) => {
      const s = rowSisa(r);
      return { row: r, sisaNominal: s, sisaPct: r.total > 0 ? Math.round((s / r.total) * 100) : 0 };
    })
    .sort((a, b) => b.sisaNominal - a.sisaNominal)
    .slice(0, limit);
}

// ── Klaim Hari Ini (feed aktivitas E-Klaim) ──────────────
//
// Belum ada backend E-Klaim → panel menerima `entries` (prop). Tanpa data nyata =
// empty state. Tipe + config dipertahankan agar siap saat modul E-Klaim di-backend-kan.

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
  /** Detik relatif sekarang (negatif = lampau). */
  agoSec: number;
  actor: string;
}

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

// ── Format helpers ──────────────────────────────────────

/** Format "X menit lalu" / "X jam lalu" / "X hari lalu". */
export function fmtAgo(sec: number): string {
  const abs = Math.abs(sec);
  if (abs < 60) return `${abs}d lalu`;
  if (abs < 3600) return `${Math.round(abs / 60)} mnt lalu`;
  if (abs < 86400) return `${Math.round(abs / 3600)} jam lalu`;
  return `${Math.round(abs / 86400)} hari lalu`;
}

/** Format jam HH:mm (waktu lokal) dari ISO datetime. */
export function fmtJam(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
