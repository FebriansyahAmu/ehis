/**
 * Charge Summary helpers (BL3.2 + BL3.3) — derive breakdown per-kategori dari
 * `INVOICE_DETAIL_MOCK` untuk ditampilkan di Quick Bayar header + Deposit form.
 *
 * Reuse `groupByKategori` dari invoiceCalc.ts — single source of truth, tidak
 * re-implement aggregation logic.
 *
 * 2 mode usage:
 *   - `getChargeSummary(invoiceId)` — invoice yang sudah ada (Quick Bayar)
 *   - `projectDepositBreakdown(input)` — estimasi rencana charge untuk deposit
 *     awal (pasien baru, belum ada invoice — projection dari kelas × LOS)
 */

import { INVOICE_DETAIL_MOCK } from "@/components/billing/invoice/invoiceMock";
import {
  groupByKategori, netAfterItemDiskon, grandTotal, sisaTagihan, saldoDeposit,
  type KategoriSummary,
} from "@/lib/billing/invoiceCalc";
import type {
  ChargeItem, KategoriCharge, Coverage,
} from "@/components/billing/invoice/invoiceShared";
import type { KelasFilter, PenjaminFilter } from "@/components/billing/tagihan/tagihanShared";
import type { AdmisiKategori } from "@/lib/billing/depositMock";

// ── Quick Bayar: real charge summary ───────────────────

export interface ChargeKategoriRow {
  kategori: KategoriCharge;
  count: number;             // jumlah item aktif
  subtotal: number;          // net (sudah include diskonItem)
  /** Coverage dominan di kategori ini (untuk badge — Penjamin/Pasien/Mixed). */
  dominantCoverage: Coverage;
  /** Item aktif (voided di-skip — audit lengkap via deep-link tab Rincian). */
  items: ChargeItem[];
}

export interface ChargeSummary {
  invoiceId: string;
  hasDetail: boolean;        // false = tidak ada detail di INVOICE_DETAIL_MOCK
  kategori: ChargeKategoriRow[];
  subTotal: number;          // net items
  diskonInvoice: number;
  ppn: number;
  materai: number;
  grandTotal: number;
  dibayar: number;
  sisa: number;
  itemCountTotal: number;    // untuk auto-expand decision
}

/** Determine dominant coverage per kategori (untuk badge). */
function deriveDominantCoverage(sum: KategoriSummary): Coverage {
  const tally: Record<Coverage, number> = { Penjamin: 0, Pasien: 0, Mixed: 0 };
  for (const it of sum.items) {
    if (it.voided) continue;
    tally[it.coverage] += 1;
  }
  if (tally.Penjamin > tally.Pasien && tally.Penjamin > tally.Mixed) return "Penjamin";
  if (tally.Pasien > tally.Penjamin && tally.Pasien > tally.Mixed) return "Pasien";
  return "Mixed";
}

/**
 * Derive ChargeSummary dari INVOICE_DETAIL_MOCK[invoiceId].
 * Return `hasDetail: false` jika invoice tidak ada di mock — UI handle fallback.
 */
export function getChargeSummary(invoiceId: string): ChargeSummary {
  const detail = INVOICE_DETAIL_MOCK[invoiceId];
  if (!detail) {
    return {
      invoiceId, hasDetail: false,
      kategori: [], subTotal: 0, diskonInvoice: 0, ppn: 0, materai: 0,
      grandTotal: 0, dibayar: 0, sisa: 0, itemCountTotal: 0,
    };
  }

  const sections = groupByKategori(detail.items);
  const kategori: ChargeKategoriRow[] = sections.map((s) => ({
    kategori: s.kategori,
    count: s.count,
    subtotal: s.subtotal,
    dominantCoverage: deriveDominantCoverage(s),
    items: s.items.filter((it) => !it.voided),
  }));

  const subTotal = netAfterItemDiskon(detail.items);
  const diskonInv = detail.diskonInvoice ?? 0;
  const grand = grandTotal(detail);
  // PPN dihitung pure: ((subTotal - diskonInv) * ppnPct / 100)
  const afterDiskonInv = Math.max(0, subTotal - diskonInv);
  const ppn = Math.round((afterDiskonInv * (detail.ppnPct ?? 0)) / 100);

  return {
    invoiceId,
    hasDetail: true,
    kategori,
    subTotal,
    diskonInvoice: diskonInv,
    ppn,
    materai: detail.materai ?? 0,
    grandTotal: grand,
    dibayar: saldoDeposit(detail),
    sisa: sisaTagihan(detail),
    itemCountTotal: kategori.reduce((s, k) => s + k.count, 0),
  };
}

// ── Deposit Awal: estimated breakdown ──────────────────

export interface EstimateRow {
  kategori: KategoriCharge;
  hint: string;          // mis. "Akomodasi K1 × 5 hari" atau "Buffer obat & BMHP"
  nominal: number;
}

export interface DepositEstimate {
  kategori: KelasFilter;
  losDays: number;
  penjaminTipe: Exclude<PenjaminFilter, "all">;
  admisiKategori: AdmisiKategori;
  rows: EstimateRow[];
  subTotal: number;        // akomodasi + jasa dokter projected
  buffer: number;          // buffer obat/tindakan
  total: number;
}

/**
 * Project rencana charge untuk pasien admisi (deposit awal).
 *
 * Komponen estimasi:
 *  - Akomodasi: rate kelas × LOS
 *  - Jasa Dokter: 1 visite/hari × rate dokter (~Rp 250K/visite default)
 *  - Buffer (obat + lab + tindakan): % dari akomodasi (per penjamin tipe)
 *
 * Total estimasi ini ≠ saran deposit (suggestDeposit) — yang ini lebih lengkap
 * untuk educate pasien "rencana biaya rawat selama X hari kira-kira segini".
 */
const KELAS_RATE_PER_HARI: Record<KelasFilter, number> = {
  VIP: 2_000_000, K1: 1_200_000, K2: 800_000, K3: 450_000,
  ICU: 1_500_000, HCU: 1_000_000, RJ: 100_000,
};

const VISITE_RATE = 250_000;

export function projectDepositBreakdown(input: {
  kelas: KelasFilter;
  losDays: number;
  penjaminTipe: Exclude<PenjaminFilter, "all">;
  admisiKategori: AdmisiKategori;
}): DepositEstimate {
  const akomRate = KELAS_RATE_PER_HARI[input.kelas];
  const akomTotal = akomRate * input.losDays;
  const visiteTotal = VISITE_RATE * input.losDays;

  const rows: EstimateRow[] = [
    {
      kategori: "Akomodasi",
      hint: `Kelas ${input.kelas} × ${input.losDays} hari`,
      nominal: akomTotal,
    },
    {
      kategori: "Jasa Dokter",
      hint: `Visite DPJP × ${input.losDays} hari`,
      nominal: visiteTotal,
    },
  ];

  // Buffer untuk Lab/Rad/Obat/Tindakan — tergantung kategori admisi
  const bufferPctByKat: Record<AdmisiKategori, number> = {
    "RI Baru":      0.25,
    "Pre-Op Major": 0.50,   // major ops butuh banyak BMHP + obat post-op
    "ICU Admisi":   0.80,   // ICU = high-cost items (sedasi, kultur, ventilator)
  };
  const subTotal = akomTotal + visiteTotal;
  const buffer = Math.round(subTotal * bufferPctByKat[input.admisiKategori]);

  rows.push({
    kategori: "Obat & BMHP",
    hint: `Estimasi ${input.admisiKategori} (Lab/Rad/Obat/Tindakan)`,
    nominal: buffer,
  });

  // Penjamin BPJS/Jamkesda: total estimasi diturunkan 70% karena cover ditanggung
  const coveragePct = input.penjaminTipe === "umum" ? 1
                    : input.penjaminTipe === "asuransi" ? 0.85
                    : 0.30;
  const total = Math.round((subTotal + buffer) * coveragePct);

  return {
    kategori: input.kelas,
    losDays: input.losDays,
    penjaminTipe: input.penjaminTipe,
    admisiKategori: input.admisiKategori,
    rows,
    subTotal,
    buffer,
    total,
  };
}
