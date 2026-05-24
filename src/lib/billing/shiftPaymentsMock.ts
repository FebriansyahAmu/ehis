/**
 * Shift Payment Log (BL3.2) — payment records per shift.
 *
 * Separate dari `KASIR_SHIFT_MOCK` agar shift type tetap ramping (aggregate
 * only). Detail records di sini untuk Recent Payments feed + audit per shift.
 *
 * Mock-first: schema sama dengan `PaymentRecord` di invoiceShared.ts (sengaja
 * agar swap konsumen tidak perlu adapter). Saat backend ready, query:
 *   prisma.payment.findMany({ where: { shiftId }, orderBy: { tanggalISO: "desc" }, take: 10 })
 */

import type {
  PaymentRecord, InvoiceDetail,
} from "@/components/billing/invoice/invoiceShared";

/**
 * Extended payment record dengan referensi invoice (untuk display di Recent Feed).
 * Backend: payment HARUS terikat ke 1 invoice + 1 shift (relation many-to-1).
 */
export interface ShiftPaymentLog extends PaymentRecord {
  invoiceId: string;
  invoiceNo: string;
  pasienNama: string;
  pasienRM: string;
  /**
   * Cache InvoiceDetail synthesized untuk deposit awal (invoice masih draft,
   * tidak ada di `INVOICE_DETAIL_MOCK`). Dipakai oleh kwitansiContext.ts
   * supaya reprint dari Recent Feed tetap bisa render header lengkap.
   * Hapus saat backend ready (real invoice query menggantikan synthesize).
   */
  draftDetail?: InvoiceDetail;
}

/**
 * Pre-seed payments untuk shift Open hari ini (Sari · Kasir-1).
 * 8 entries mix Tunai/Transfer/QRIS/EDC + 1 deposit dengan referensi ke
 * TAGIHAN_BOARD_MOCK invoices.
 */
const SHIFT_001_PAYMENTS: ShiftPaymentLog[] = [
  {
    id: "log-001-08",
    tanggalISO: "2026-05-24T11:45",
    metode: "Tunai", nominal: 500_000, kategori: "Deposit", source: "Deposit",
    kasir: "Sari Wulandari", noKwitansi: "KW/2026/05/00188",
    catatan: "Deposit awal saat pendaftaran IGD",
    invoiceId: "INV-001", invoiceNo: "INV/2026/05/00231",
    pasienNama: "Joko Prasetyo", pasienRM: "RM-2025-005",
  },
  {
    id: "log-001-07",
    tanggalISO: "2026-05-24T11:20",
    metode: "QRIS", nominal: 245_000, kategori: "Pembayaran", source: "Quick",
    kasir: "Sari Wulandari", noKwitansi: "KW/2026/05/00187",
    noRef: "QRIS-MID-7782341",
    invoiceId: "INV-002", invoiceNo: "INV/2026/05/00232",
    pasienNama: "Siti Rahayu", pasienRM: "RM-2025-012",
  },
  {
    id: "log-001-06",
    tanggalISO: "2026-05-24T10:55",
    metode: "Tunai", nominal: 850_000, kategori: "Pembayaran", source: "Quick",
    kasir: "Sari Wulandari", noKwitansi: "KW/2026/05/00186",
    invoiceId: "INV-004", invoiceNo: "INV/2026/05/00234",
    pasienNama: "Maria Hutapea", pasienRM: "RM-2025-027",
  },
  {
    id: "log-001-05",
    tanggalISO: "2026-05-24T10:30",
    metode: "EDC", nominal: 500_000, kategori: "Pembayaran", source: "Quick",
    kasir: "Sari Wulandari", noKwitansi: "KW/2026/05/00185",
    bank: "BCA", noRef: "EDC-BCA-99481",
    invoiceId: "INV-007", invoiceNo: "INV/2026/05/00237",
    pasienNama: "Andi Pratama", pasienRM: "RM-2025-031",
  },
  {
    id: "log-001-04",
    tanggalISO: "2026-05-24T09:50",
    metode: "Transfer", nominal: 750_000, kategori: "Pembayaran", source: "Detail",
    kasir: "Sari Wulandari", noKwitansi: "KW/2026/05/00184",
    bank: "Mandiri", noRef: "TRF-MDI-2026052401",
    invoiceId: "INV-006", invoiceNo: "INV/2026/05/00236",
    pasienNama: "Hartono Sukirman", pasienRM: "RM-2025-040",
  },
  {
    id: "log-001-03",
    tanggalISO: "2026-05-24T09:15",
    metode: "QRIS", nominal: 380_000, kategori: "Pembayaran", source: "Quick",
    kasir: "Sari Wulandari", noKwitansi: "KW/2026/05/00183",
    noRef: "QRIS-MID-7782200",
    invoiceId: "INV-008", invoiceNo: "INV/2026/05/00238",
    pasienNama: "Lestari Wibowo", pasienRM: "RM-2025-045",
  },
  {
    id: "log-001-02",
    tanggalISO: "2026-05-24T08:40",
    metode: "Tunai", nominal: 500_000, kategori: "Pembayaran", source: "Quick",
    kasir: "Sari Wulandari", noKwitansi: "KW/2026/05/00182",
    invoiceId: "INV-005", invoiceNo: "INV/2026/05/00235",
    pasienNama: "Yulianti Sari", pasienRM: "RM-2025-038",
  },
  {
    id: "log-001-01",
    tanggalISO: "2026-05-24T07:30",
    metode: "QRIS", nominal: 500_000, kategori: "Pembayaran", source: "Quick",
    kasir: "Sari Wulandari", noKwitansi: "KW/2026/05/00181",
    noRef: "QRIS-MID-7781990",
    invoiceId: "INV-010", invoiceNo: "INV/2026/05/00240",
    pasienNama: "Agus Setiawan", pasienRM: "RM-2025-052",
  },
];

export const SHIFT_PAYMENTS_MOCK: Record<string, ShiftPaymentLog[]> = {
  "shift-2026-0524-001": SHIFT_001_PAYMENTS,
  // shift-2026-0524-002 (Bambang) sengaja dikosongkan — demonstrate feed empty state
};

/**
 * Get recent payments for a shift, sorted DESC by tanggalISO, limited.
 */
export function getShiftPayments(
  shiftId: string,
  limit = 10,
): ShiftPaymentLog[] {
  const logs = SHIFT_PAYMENTS_MOCK[shiftId] ?? [];
  return [...logs]
    .sort((a, b) => b.tanggalISO.localeCompare(a.tanggalISO))
    .slice(0, limit);
}

/**
 * Append a new payment log to a shift (mock mutation — backend pakai INSERT).
 * Auto-sort terbaru-dulu.
 */
export function appendShiftPayment(shiftId: string, log: ShiftPaymentLog): void {
  if (!SHIFT_PAYMENTS_MOCK[shiftId]) SHIFT_PAYMENTS_MOCK[shiftId] = [];
  SHIFT_PAYMENTS_MOCK[shiftId].unshift(log);
}
