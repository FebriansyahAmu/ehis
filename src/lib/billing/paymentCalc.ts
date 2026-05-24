/**
 * Pure calc helpers untuk pembayaran (BL2.3).
 * Zero React state — testable, deterministic.
 *
 * Konvensi:
 *  - `nominal` di PaymentRecord: positif untuk Pembayaran/Deposit, negatif untuk Refund.
 *  - `voided=true` → tidak dihitung di total.
 *  - `saldoDibayar` = sum(active payments) — refund (negatif) sudah self-cancel.
 */

import type { PaymentRecord, MetodeBayar, PaymentKategori } from "@/components/billing/invoice/invoiceShared";
import { METODE_ORDER } from "@/components/billing/invoice/invoiceShared";

/** Total bersih yang sudah dibayar (pembayaran + deposit + refund). */
export function totalDibayar(payments: PaymentRecord[]): number {
  return payments.reduce((s, p) => (p.voided ? s : s + p.nominal), 0);
}

/** Total pembayaran gross (tanpa refund). */
export function totalPembayaranGross(payments: PaymentRecord[]): number {
  return payments.reduce(
    (s, p) => (p.voided || p.kategori === "Refund" ? s : s + p.nominal),
    0,
  );
}

/** Total refund (absolute value, positif). */
export function totalRefund(payments: PaymentRecord[]): number {
  return payments.reduce(
    (s, p) => (!p.voided && p.kategori === "Refund" ? s + Math.abs(p.nominal) : s),
    0,
  );
}

/** Total per metode bayar (untuk laporan kasir / breakdown). */
export function totalByMetode(payments: PaymentRecord[]): Record<MetodeBayar, number> {
  const acc: Record<MetodeBayar, number> = {
    Tunai: 0, Transfer: 0, QRIS: 0, EDC: 0, Voucher: 0,
  };
  for (const p of payments) {
    if (p.voided) continue;
    acc[p.metode] += p.nominal;
  }
  return acc;
}

/** Count breakdown per kategori (untuk header filter chip). */
export function countByKategori(payments: PaymentRecord[]): Record<PaymentKategori | "Voided", number> {
  const acc = { Pembayaran: 0, Deposit: 0, Refund: 0, Voided: 0 };
  for (const p of payments) {
    if (p.voided) acc.Voided += 1;
    else acc[p.kategori] += 1;
  }
  return acc;
}

/**
 * Generate nomor kwitansi sequential: KW/YYYY/MM/NNNNN.
 * Mock: cari max running number di list lalu +1.
 * Backend (BL3): sequence di DB per shift.
 */
export function nextNoKwitansi(payments: PaymentRecord[], now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `KW/${yyyy}/${mm}/`;
  let max = 0;
  for (const p of payments) {
    if (!p.noKwitansi.startsWith(prefix)) continue;
    const n = Number(p.noKwitansi.slice(prefix.length));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(5, "0")}`;
}

/**
 * Refund yang sudah dilakukan untuk satu payment tertentu (absolute value).
 * Dipakai di RefundModal untuk hitung sisa-yang-bisa-direfund.
 */
export function refundedAmountFor(paymentId: string, payments: PaymentRecord[]): number {
  return payments.reduce(
    (s, p) =>
      !p.voided && p.kategori === "Refund" && p.refundOf === paymentId
        ? s + Math.abs(p.nominal)
        : s,
    0,
  );
}

/** Sisa pembayaran yang masih bisa direfund (gross - sudah direfund). */
export function refundableAmount(payment: PaymentRecord, allPayments: PaymentRecord[]): number {
  if (payment.voided || payment.kategori === "Refund" || payment.nominal <= 0) return 0;
  return Math.max(0, payment.nominal - refundedAmountFor(payment.id, allPayments));
}

/** Order payments: terbaru dulu. */
export function sortPaymentsDesc(payments: PaymentRecord[]): PaymentRecord[] {
  return [...payments].sort((a, b) => b.tanggalISO.localeCompare(a.tanggalISO));
}

/** Re-export METODE_ORDER untuk konsumen helper. */
export { METODE_ORDER };
