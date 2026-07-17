// Zod input + DTO — Payment (Kasir, Slice 2a) + InvoiceState (proyeksi charge + invoice + payment).
// Charge = proyeksi order (schemas/billing/projection). Invoice = header persist; total/sisa DIHITUNG.

import { z } from "zod";
import type { BillingChargeDTO } from "./projection";

export const MetodeBayarEnum = z.enum(["Tunai", "Transfer", "QRIS", "EDC", "Voucher"]);
export const PaymentKategoriEnum = z.enum(["Pembayaran", "Deposit", "Refund"]);

// ── Catat pembayaran (POST /kunjungan/:id/billing/payment) ───────────────────
export const PaymentInput = z.object({
  metode: MetodeBayarEnum,
  kategori: PaymentKategoriEnum.default("Pembayaran"),
  nominal: z.coerce.number().int().min(1).max(2_000_000_000),
  bank: z.string().trim().max(80).optional(),
  noRef: z.string().trim().max(80).optional(),
  bukti: z.string().trim().max(300).optional(),
  catatan: z.string().trim().max(500).optional(),
  source: z.enum(["Quick", "Detail"]).optional(),
  shiftId: z.string().trim().max(60).optional(),
});
export type PaymentInput = z.infer<typeof PaymentInput>;

// ── Void payment ─────────────────────────────────────────────────────────────
export const VoidPaymentInput = z.object({
  alasan: z.string().trim().min(1, "Alasan pembatalan wajib").max(500),
});
export type VoidPaymentInput = z.infer<typeof VoidPaymentInput>;

// ── Penyesuaian invoice level (Slice 2d — Fase 1) ────────────────────────────
// Diskon/materai/PPN level-invoice (bukan per item). total = (subtotal − diskon) + PPN + materai.
export const InvoiceAdjustmentInput = z.object({
  diskonInvoice: z.coerce.number().int().min(0).max(2_000_000_000).default(0),
  materai: z.coerce.number().int().min(0).max(100_000_000).default(0),
  ppnPct: z.coerce.number().int().min(0).max(100).default(0),
  alasan: z.string().trim().max(500).optional(),
  /** Optimistic concurrency — versi invoice yang dilihat FE (opsional; 0 = invoice belum ada). */
  expectedVersion: z.coerce.number().int().min(0).optional(),
});
export type InvoiceAdjustmentInput = z.infer<typeof InvoiceAdjustmentInput>;

export const PaymentParam = z.object({
  id: z.string().uuid(),
  paymentId: z.string().uuid(),
});

// ── Recent payments (feed Kasir) ─────────────────────────────────────────────
export const RecentPaymentsQuery = z.object({
  shiftId: z.string().trim().max(60).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type RecentPaymentsQuery = z.infer<typeof RecentPaymentsQuery>;

// ── Ringkasan pembayaran (Dashboard Kasir) ──────────────────────────────────
export const PaymentSummaryQuery = z.object({
  shiftId: z.string().trim().max(60).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD").optional(),
});
export type PaymentSummaryQuery = z.infer<typeof PaymentSummaryQuery>;

export interface PaymentSummaryDTO {
  byMetode: { Tunai: number; Transfer: number; QRIS: number; EDC: number; Voucher: number };
  totalMasuk: number;      // Σ pembayaran/deposit (non-refund)
  totalRefund: number;     // Σ refund
  totalTransaksi: number;  // jumlah transaksi non-refund
}

export interface RecentPaymentDTO {
  id: string;
  noKwitansi: string;
  metode: string;
  kategori: string;
  nominal: number;
  kasir: string;
  source: string | null;
  bank: string | null;
  noRef: string | null;
  catatan: string | null;
  voided: boolean;
  tanggalISO: string;      // createdAt
  kunjunganId: string;     // invoice.kunjunganId (deep-link + kwitansi source)
  noInvoice: string;
  noKunjungan: string;
  pasienNama: string;
  pasienRM: string;
}

// ── DTO ──────────────────────────────────────────────────────────────────────
export interface PaymentDTO {
  id: string;
  noKwitansi: string;
  metode: string;
  kategori: string;
  nominal: number;
  kasir: string;
  source: string | null;
  bank: string | null;
  noRef: string | null;
  catatan: string | null;
  voided: boolean;
  voidReason: string | null;
  createdAt: string; // ISO
}

export interface InvoiceStateDTO {
  invoiceId: string | null; // null = invoice belum dibuat (belum ada pembayaran)
  noInvoice: string | null;
  kunjunganId: string;
  noKunjungan: string;
  unit: string;
  status: string; // Draft | Belum Lunas | Lunas Sebagian | Lunas
  locked: boolean;
  selesaiAt: string | null;
  waktuKunjungan: string | null; // ISO — waktu masuk (utk header/banner)
  pasien: { noRM: string; nama: string; gender: "L" | "P"; age: number };
  penjaminTipe: string;
  dpjp: string | null;
  kelas: string | null;
  noSep: string | null;
  // Charge = proyeksi
  items: BillingChargeDTO[];
  subtotal: number;
  untariffedCount: number;
  // Adjustment level-invoice (Slice 2d)
  diskonInvoice: number;
  materai: number;
  ppnPct: number;
  // Total & bayar (dihitung)
  grandTotal: number;
  dibayar: number;
  sisa: number;
  payments: PaymentDTO[];
  version: number;
}
