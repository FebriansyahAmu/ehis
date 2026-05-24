/**
 * Pure calculation helpers untuk Invoice Detail (BL2).
 * Zero React state — testable, deterministic, swap-friendly ke backend.
 */

import type { ChargeItem, InvoiceDetail, KategoriCharge } from "@/components/billing/invoice/invoiceShared";
import { KATEGORI_ORDER } from "@/components/billing/invoice/invoiceShared";

/** Subtotal per row: qty × harga − diskonItem (jika ada). 0 jika voided. */
export function rowSubtotal(item: ChargeItem): number {
  if (item.voided) return 0;
  const gross = item.qty * item.hargaSatuan;
  return Math.max(0, gross - (item.diskonItem ?? 0));
}

/** Gross subtotal (sebelum diskon item). 0 untuk voided. */
export function rowGross(item: ChargeItem): number {
  if (item.voided) return 0;
  return item.qty * item.hargaSatuan;
}

/** Subtotal gabungan (gross) seluruh charge. */
export function totalGross(items: ChargeItem[]): number {
  return items.reduce((s, i) => s + rowGross(i), 0);
}

/** Total diskon level-item (akumulasi). */
export function totalDiskonItem(items: ChargeItem[]): number {
  return items.reduce((s, i) => s + (i.voided ? 0 : (i.diskonItem ?? 0)), 0);
}

/** Subtotal setelah diskon item, sebelum diskon invoice. */
export function netAfterItemDiskon(items: ChargeItem[]): number {
  return items.reduce((s, i) => s + rowSubtotal(i), 0);
}

/** PPN dihitung dari net (setelah diskon invoice). */
export function ppnAmount(netAfterAllDiskon: number, ppnPct: number): number {
  return Math.round((netAfterAllDiskon * ppnPct) / 100);
}

/** Grand total invoice. */
export function grandTotal(detail: InvoiceDetail): number {
  const net = netAfterItemDiskon(detail.items);
  const diskonInv = detail.diskonInvoice ?? 0;
  const afterInv = Math.max(0, net - diskonInv);
  const ppn = ppnAmount(afterInv, detail.ppnPct ?? 0);
  return afterInv + ppn + (detail.materai ?? 0);
}

/** Sisa = grand − dibayar (tidak negatif). */
export function sisaTagihan(detail: InvoiceDetail): number {
  return Math.max(0, grandTotal(detail) - detail.dibayar);
}

/** Saldo deposit (placeholder; akan diisi dari DepositRecord di BL2.3). */
export function saldoDeposit(detail: InvoiceDetail): number {
  // For now, treat `dibayar` as deposit. Real saldo = sum(deposits where !refund).
  return detail.dibayar;
}

// ── Aggregation per kategori ────────────────────────────

export interface KategoriSummary {
  kategori: KategoriCharge;
  items: ChargeItem[];      // hanya non-voided di-include
  voidedCount: number;      // voided dipajang sebagai info kecil
  count: number;
  subtotal: number;         // net per kategori (gross − diskonItem)
  gross: number;
}

export function groupByKategori(items: ChargeItem[]): KategoriSummary[] {
  const map = new Map<KategoriCharge, ChargeItem[]>();
  for (const k of KATEGORI_ORDER) map.set(k, []);
  for (const it of items) {
    if (!map.has(it.kategori)) map.set(it.kategori, []);
    map.get(it.kategori)!.push(it);
  }
  return KATEGORI_ORDER
    .map((kategori) => {
      const all = map.get(kategori) ?? [];
      const active = all.filter((i) => !i.voided);
      return {
        kategori,
        items: all,
        voidedCount: all.length - active.length,
        count: active.length,
        subtotal: active.reduce((s, i) => s + rowSubtotal(i), 0),
        gross: active.reduce((s, i) => s + rowGross(i), 0),
      } satisfies KategoriSummary;
    })
    .filter((s) => s.items.length > 0); // section kosong di-skip
}

// ── Coverage breakdown ──────────────────────────────────

export interface CoverageBreakdown {
  penjamin: number;   // total tagihan ditanggung penjamin
  pasien: number;     // total ditanggung pasien
  mixed: number;      // split — for v1 dimasukkan ke Pasien (treat as excess)
}

export function coverageBreakdown(items: ChargeItem[]): CoverageBreakdown {
  let penjamin = 0, pasien = 0, mixed = 0;
  for (const it of items) {
    if (it.voided) continue;
    const v = rowSubtotal(it);
    if (it.coverage === "Penjamin") penjamin += v;
    else if (it.coverage === "Pasien") pasien += v;
    else mixed += v;
  }
  return { penjamin, pasien, mixed };
}
