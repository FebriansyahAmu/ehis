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

export const PaymentParam = z.object({
  id: z.string().uuid(),
  paymentId: z.string().uuid(),
});

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
