/**
 * Kasir Shift — types, mock data, dan helpers (BL3).
 *
 * Schema 1:1 dengan target Prisma `KasirShift` (TODO-BILLING.md BL0.2).
 * Setiap transaksi pembayaran (PaymentRecord) HARUS terikat ke 1 shift Open.
 *
 * Workflow:
 *   Buka Shift  → status="Open" + bukaAt + bukaSaldoAwal (kas fisik di laci)
 *   ... transaksi masuk: totalTunai/Transfer/QRIS/EDC/Voucher terakumulasi
 *   Tutup Shift → input tutupSaldoAkhir (kas fisik actual) → selisih dihitung
 *                 (positif = surplus, negatif = minus → audit)
 *
 * Saat backend ready: swap `KASIR_SHIFT_MOCK` → Prisma query + WebSocket sync
 * untuk update total real-time saat ada payment baru di shift active.
 */

import type { MetodeBayar } from "@/components/billing/invoice/invoiceShared";

// ── Types ───────────────────────────────────────────────

export type CounterId = "Kasir-1" | "Kasir-2" | "Kasir-3" | "Kasir-IGD";

export type ShiftStatus = "Open" | "Closed";

/** Daftar counter aktif di RS — mock; backend ambil dari master counter. */
export const COUNTER_LIST: { id: CounterId; nama: string; lokasi: string }[] = [
  { id: "Kasir-1",   nama: "Kasir Utama",       lokasi: "Loket Depan, Lt. 1" },
  { id: "Kasir-2",   nama: "Kasir Rawat Inap",  lokasi: "Lt. 2, Sebelah Apotek" },
  { id: "Kasir-3",   nama: "Kasir Rawat Jalan", lokasi: "Lt. 1, Lobby Poli" },
  { id: "Kasir-IGD", nama: "Kasir IGD",         lokasi: "Pintu IGD 24 Jam" },
];

/** Daftar kasir aktif — mock; backend dari user session + role "Kasir". */
export const KASIR_LIST: { id: string; nama: string }[] = [
  { id: "sari",    nama: "Sari Wulandari" },
  { id: "bambang", nama: "Bambang Sutopo" },
  { id: "yanti",   nama: "Yanti Permatasari" },
  { id: "rian",    nama: "Rian Hidayat" },
];

/** Breakdown nominal per metode bayar — gross (refund self-cancel kalau termasuk). */
export interface ShiftMetodeBreakdown {
  Tunai:    number;
  Transfer: number;
  QRIS:     number;
  EDC:      number;
  Voucher:  number;
}

export interface KasirShift {
  id: string;
  counter: CounterId;
  kasirNama: string;
  status: ShiftStatus;
  // Buka
  bukaAt: string;             // ISO datetime
  bukaSaldoAwal: number;      // kas fisik di laci saat buka
  bukaCatatan?: string;
  // Live (Open) atau snapshot (Closed)
  totalByMetode: ShiftMetodeBreakdown;
  totalTransaksi: number;     // count payment record (exclude voided)
  totalRefund: number;        // total absolute refund
  // Tutup (Closed only)
  tutupAt?: string;
  tutupSaldoAkhir?: number;   // kas fisik di laci saat tutup
  selisih?: number;           // tutupSaldoAkhir − (bukaSaldoAwal + totalTunai − totalRefundTunai)
  tutupCatatan?: string;
  supervisor?: string;        // verifikator tutup shift
}

// ── Mock data ──────────────────────────────────────────

const today = "2026-05-24";
const yesterday = "2026-05-23";
const dayBefore = "2026-05-22";

/**
 * 1 OPEN shift hari ini (Sari · Kasir-1) + 5 CLOSED shifts beberapa hari terakhir.
 */
export const KASIR_SHIFT_MOCK: KasirShift[] = [
  // ── OPEN: Sari di Kasir-1 buka pagi ini ──
  {
    id: "shift-2026-0524-001",
    counter: "Kasir-1",
    kasirNama: "Sari Wulandari",
    status: "Open",
    bukaAt: `${today}T07:00`,
    bukaSaldoAwal: 500_000,
    bukaCatatan: "Saldo kas awal shift pagi (sesuai serah-terima dari shift malam)",
    totalByMetode: {
      Tunai:    1_850_000,
      Transfer:   750_000,
      QRIS:     1_125_000,
      EDC:        500_000,
      Voucher:          0,
    },
    totalTransaksi: 14,
    totalRefund: 0,
  },

  // ── OPEN: Bambang di Kasir-2 (pagi shift, masih berjalan) ──
  {
    id: "shift-2026-0524-002",
    counter: "Kasir-2",
    kasirNama: "Bambang Sutopo",
    status: "Open",
    bukaAt: `${today}T07:15`,
    bukaSaldoAwal: 750_000,
    totalByMetode: {
      Tunai:      450_000,
      Transfer: 2_500_000,
      QRIS:             0,
      EDC:      1_750_000,
      Voucher:          0,
    },
    totalTransaksi: 8,
    totalRefund: 250_000,
  },

  // ── CLOSED: shift kemarin malam (Yanti · Kasir-IGD) ──
  {
    id: "shift-2026-0523-malam",
    counter: "Kasir-IGD",
    kasirNama: "Yanti Permatasari",
    status: "Closed",
    bukaAt:  `${yesterday}T22:00`,
    bukaSaldoAwal: 500_000,
    totalByMetode: {
      Tunai:    2_300_000,
      Transfer:         0,
      QRIS:       450_000,
      EDC:        150_000,
      Voucher:          0,
    },
    totalTransaksi: 12,
    totalRefund: 0,
    tutupAt: `${today}T07:00`,
    tutupSaldoAkhir: 2_800_000,
    selisih: 0,
    tutupCatatan: "Balance — serah-terima ke shift pagi",
    supervisor: "dr. Indra (Supervisor Keuangan)",
  },

  // ── CLOSED: shift kemarin sore (Sari · Kasir-1) ──
  {
    id: "shift-2026-0523-sore",
    counter: "Kasir-1",
    kasirNama: "Sari Wulandari",
    status: "Closed",
    bukaAt:  `${yesterday}T14:00`,
    bukaSaldoAwal: 800_000,
    totalByMetode: {
      Tunai:    3_450_000,
      Transfer: 1_200_000,
      QRIS:       875_000,
      EDC:        650_000,
      Voucher:    100_000,
    },
    totalTransaksi: 21,
    totalRefund: 150_000,
    tutupAt: `${yesterday}T22:00`,
    tutupSaldoAkhir: 4_100_000,
    selisih: 0,
    tutupCatatan: "Balance — selisih nol",
    supervisor: "dr. Indra (Supervisor Keuangan)",
  },

  // ── CLOSED: shift kemarin pagi dengan selisih MINUS ──
  {
    id: "shift-2026-0523-pagi",
    counter: "Kasir-2",
    kasirNama: "Rian Hidayat",
    status: "Closed",
    bukaAt:  `${yesterday}T07:00`,
    bukaSaldoAwal: 500_000,
    totalByMetode: {
      Tunai:    1_950_000,
      Transfer: 2_750_000,
      QRIS:             0,
      EDC:        450_000,
      Voucher:          0,
    },
    totalTransaksi: 18,
    totalRefund: 200_000,
    tutupAt: `${yesterday}T14:00`,
    tutupSaldoAkhir: 2_200_000,
    selisih: -50_000,
    tutupCatatan: "Selisih minus Rp 50.000 — sudah dilaporkan ke audit",
    supervisor: "dr. Indra (Supervisor Keuangan)",
  },

  // ── CLOSED: shift 2 hari lalu dengan selisih PLUS ──
  {
    id: "shift-2026-0522-pagi",
    counter: "Kasir-1",
    kasirNama: "Bambang Sutopo",
    status: "Closed",
    bukaAt:  `${dayBefore}T07:00`,
    bukaSaldoAwal: 500_000,
    totalByMetode: {
      Tunai:    2_780_000,
      Transfer:   650_000,
      QRIS:     1_250_000,
      EDC:              0,
      Voucher:          0,
    },
    totalTransaksi: 16,
    totalRefund: 0,
    tutupAt: `${dayBefore}T14:00`,
    tutupSaldoAkhir: 3_315_000,
    selisih: 35_000,
    tutupCatatan: "Surplus Rp 35.000 — kemungkinan tip pasien (sudah dicatat)",
    supervisor: "dr. Indra (Supervisor Keuangan)",
  },
];

// ── Helpers ────────────────────────────────────────────

export function totalShiftAll(breakdown: ShiftMetodeBreakdown): number {
  return breakdown.Tunai + breakdown.Transfer + breakdown.QRIS + breakdown.EDC + breakdown.Voucher;
}

export function totalShiftNonTunai(breakdown: ShiftMetodeBreakdown): number {
  return breakdown.Transfer + breakdown.QRIS + breakdown.EDC + breakdown.Voucher;
}

/**
 * Saldo kas fisik yang seharusnya ada di laci saat ini (untuk shift Open) atau
 * di akhir shift (untuk shift Closed).
 *
 *   = bukaSaldoAwal + totalTunai − totalRefund (jika refund pakai tunai)
 *
 * Asumsi mock: semua refund dianggap tunai (worst case). Backend bisa
 * track refund per-metode untuk akurasi maksimum.
 */
export function expectedCashOnHand(shift: KasirShift): number {
  return shift.bukaSaldoAwal + shift.totalByMetode.Tunai - shift.totalRefund;
}

export function computeSelisih(shift: KasirShift, saldoAkhir: number): number {
  return saldoAkhir - expectedCashOnHand(shift);
}

/** Format durasi shift dalam "Xh Ym" — dipakai di header card + recent table. */
export function formatDuration(bukaAt: string, sampai: string = new Date().toISOString()): string {
  const start = new Date(bukaAt).getTime();
  const end = new Date(sampai).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return "—";
  const diffMin = Math.floor((end - start) / 60_000);
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

export function formatJam(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatTanggalShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

/**
 * Cari shift Open milik kasir tertentu. Jika kasir tidak diisi, return shift
 * Open pertama (mock: anggap user session sebagai "Sari").
 */
export function getOpenShift(
  shifts: KasirShift[] = KASIR_SHIFT_MOCK,
  kasirNama?: string,
): KasirShift | null {
  if (kasirNama) {
    return shifts.find((s) => s.status === "Open" && s.kasirNama === kasirNama) ?? null;
  }
  return shifts.find((s) => s.status === "Open") ?? null;
}

/** Cek apakah counter sudah punya shift Open (tidak boleh double). */
export function isCounterOccupied(
  counter: CounterId,
  shifts: KasirShift[] = KASIR_SHIFT_MOCK,
): boolean {
  return shifts.some((s) => s.status === "Open" && s.counter === counter);
}

/** Recent shifts: sort DESC by bukaAt, exclude shift Open (yang aktif di header). */
export function recentClosedShifts(
  shifts: KasirShift[] = KASIR_SHIFT_MOCK,
  limit = 10,
): KasirShift[] {
  return shifts
    .filter((s) => s.status === "Closed")
    .sort((a, b) => b.bukaAt.localeCompare(a.bukaAt))
    .slice(0, limit);
}

/** Aggregate transaksi semua shift hari ini (untuk KPI). */
export function aggregateHariIni(
  shifts: KasirShift[] = KASIR_SHIFT_MOCK,
  dateISO: string = new Date().toISOString().slice(0, 10),
): {
  totalTransaksi: number;
  totalTunai: number;
  totalNonTunai: number;
  totalRefund: number;
  totalAll: number;
  countersAktif: number;
} {
  const todayShifts = shifts.filter((s) => s.bukaAt.startsWith(dateISO));
  let totalTransaksi = 0, totalTunai = 0, totalNonTunai = 0, totalRefund = 0;
  const countersSet = new Set<CounterId>();
  for (const s of todayShifts) {
    totalTransaksi += s.totalTransaksi;
    totalTunai += s.totalByMetode.Tunai;
    totalNonTunai += totalShiftNonTunai(s.totalByMetode);
    totalRefund += s.totalRefund;
    if (s.status === "Open") countersSet.add(s.counter);
  }
  return {
    totalTransaksi,
    totalTunai,
    totalNonTunai,
    totalRefund,
    totalAll: totalTunai + totalNonTunai,
    countersAktif: countersSet.size,
  };
}

/** Re-export untuk konsumen. */
export type { MetodeBayar };
