/**
 * Source Adapter — pure converters dari event klinis ke `ChargeItem[]`.
 *
 * **Pure functions, no side effects.** Tiap adapter:
 *   - Input: 1 entity klinis + `PriceContext` (penjamin + kelas)
 *   - Output: `ChargeItem[]` siap di-append ke invoice
 *   - `sourceRef` deterministik (stable id) — supaya dedupe by sourceRef bekerja
 *     saat ingest dipanggil ulang (idempotent).
 *
 * Yang **bukan** tanggung jawab adapter:
 *   - Resolve invoiceId target → di `chargeIngest.ts`
 *   - Tulis ke store → di `billingStore.appendCharges()`
 *   - Notifikasi UI → store handles via subscribe pattern
 *
 * Backend ready: adapter pattern tetap. Yang berubah cuma sumber data
 * (Prisma query) + price resolver query API.
 */

import type { LabOrder } from "@/components/lab/labShared";
import type { RadOrder } from "@/components/rad/radShared";
import type { FarmasiOrder } from "@/components/farmasi/farmasiShared";
import type {
  ChargeItem, Coverage, KategoriCharge, SourceModul,
} from "@/components/billing/invoice/invoiceShared";
import {
  getHargaLab, getHargaRad, getHargaObat,
  getHargaTindakan, getHargaJasaDokter, getHargaAkomodasi,
  type PriceContext,
} from "./priceResolver";

// ── Helpers ──────────────────────────────────────────────

/**
 * Default coverage dari penjamin tipe. BPJS/Asuransi/Jamkesda → Penjamin
 * (kecuali obat non-formularium di formularium mapping → Pasien); Umum →
 * selalu Pasien.
 */
function defaultCoverage(penjamin: PriceContext["penjamin"]): Coverage {
  return penjamin === "umum" ? "Pasien" : "Penjamin";
}

/** Generate sourceRef yang stable + dedupe-friendly. */
function makeSourceRef(prefix: string, ...parts: string[]): string {
  return [prefix, ...parts.map((p) => p.trim()).filter(Boolean)].join(":");
}

/** Bangun ChargeItem helper agar field konsisten. */
interface BuildChargeArgs {
  id:           string;
  tanggalISO:   string;
  nama:         string;
  sourceModul:  SourceModul;
  sourceRef:    string;
  kategori:     KategoriCharge;
  qty:          number;
  satuan:       string;
  hargaSatuan:  number;
  coverage:     Coverage;
}
function buildCharge(args: BuildChargeArgs): ChargeItem {
  return { ...args };
}

// ── Lab adapter ──────────────────────────────────────────

/**
 * Konversi lab order Tervalidasi → 1 charge per test item.
 *
 * Idempotent: sourceRef = `lab:{orderId}:{testKode}`. Ingest ulang aman.
 */
export function chargeFromLabOrder(
  order: LabOrder,
  ctx: PriceContext,
): ChargeItem[] {
  const baseTime = order.timestamps.validasi ?? order.timestamps.order ?? `${order.tanggal}T${order.jam}`;
  const coverage = defaultCoverage(ctx.penjamin);

  return order.items.map((item, idx) => {
    const price = getHargaLab(item.nama, ctx);
    return buildCharge({
      id:          `${order.id}-lab-${idx}`,
      tanggalISO:  baseTime,
      nama:        `Lab — ${item.nama}`,
      sourceModul: "Lab",
      sourceRef:   makeSourceRef("lab", order.id, item.kode),
      kategori:    "Lab",
      qty:         1,
      satuan:      "tes",
      hargaSatuan: price.hargaSatuan,
      coverage,
    });
  });
}

// ── Rad adapter ──────────────────────────────────────────

/** Konversi rad order Tervalidasi → 1 charge per modalitas item. */
export function chargeFromRadOrder(
  order: RadOrder,
  ctx: PriceContext,
): ChargeItem[] {
  const baseTime =
    order.timestamps.verifikasiHasil ??
    order.timestamps.rilis ??
    order.timestamps.expertise ??
    order.timestamps.order ??
    `${order.tanggal}T${order.jam}`;
  const coverage = defaultCoverage(ctx.penjamin);

  return order.items.map((item, idx) => {
    const price = getHargaRad(item.nama, ctx);
    return buildCharge({
      id:          `${order.id}-rad-${idx}`,
      tanggalISO:  baseTime,
      nama:        `Rad — ${item.nama}`,
      sourceModul: "Rad",
      sourceRef:   makeSourceRef("rad", order.id, item.kode),
      kategori:    "Rad",
      qty:         1,
      satuan:      "kali",
      hargaSatuan: price.hargaSatuan,
      coverage,
    });
  });
}

// ── Farmasi adapter ──────────────────────────────────────

/**
 * Konversi farmasi order Selesai → 1 charge per item obat.
 *
 * `qty` ambil dari `item.jumlahDispensasi` jika ada, else `item.jumlah`.
 * Coverage: Penjamin default, kecuali obat non-formularium → Pasien.
 */
export function chargeFromFarmasiOrder(
  order: FarmasiOrder,
  ctx: PriceContext,
): ChargeItem[] {
  const baseTime =
    order.timestamps?.serahTerima ??
    order.timestamps?.dispensing ??
    `${order.tanggal}T${order.jam}`;
  const baseCoverage = defaultCoverage(ctx.penjamin);

  return order.items.map((item) => {
    const qty = item.jumlah || 1;
    // Obat sudah punya `hargaSatuan` di item (dari form input). Fallback ke
    // master OBAT_MOCK by kode jika tidak ada.
    const harga = item.hargaSatuan ?? getHargaObat(item.kodeObat || item.namaObat).hargaSatuan;
    // Obat non-formularium → coverage Pasien (selisih dibayar pasien). Field
    // optional di mock, default true jika undefined.
    const coverage: Coverage = item.isFormularium === false ? "Pasien" : baseCoverage;
    return buildCharge({
      id:          `${order.id}-${item.id}`,
      tanggalISO:  baseTime,
      nama:        item.namaObat,
      sourceModul: "Farmasi",
      sourceRef:   makeSourceRef("farmasi", order.id, item.id),
      kategori:    "Obat & BMHP",
      qty,
      satuan:      item.satuanObat ?? "pcs",
      hargaSatuan: harga,
      coverage,
    });
  });
}

// ── Tindakan adapter ─────────────────────────────────────

export interface TindakanInput {
  id:         string;
  nama:       string;
  unit:       SourceModul;       // "IGD" | "RI" | "RJ"
  tanggalISO: string;
  qty?:       number;
}

/** Konversi 1 tindakan entry → 1 charge. */
export function chargeFromTindakan(
  entry: TindakanInput,
  ctx: PriceContext,
): ChargeItem {
  const price = getHargaTindakan(entry.nama, ctx);
  const coverage = defaultCoverage(ctx.penjamin);
  return buildCharge({
    id:          entry.id,
    tanggalISO:  entry.tanggalISO,
    nama:        entry.nama,
    sourceModul: entry.unit,
    sourceRef:   makeSourceRef("tindakan", entry.id),
    kategori:    "Tindakan",
    qty:         entry.qty ?? 1,
    satuan:      "kali",
    hargaSatuan: price.hargaSatuan,
    coverage,
  });
}

// ── Akomodasi adapter ────────────────────────────────────

export interface AkomodasiInput {
  kunjunganId:     string;
  kelas:           PriceContext["kelas"];
  tanggalAdmisi:   string;    // ISO datetime
  /** Sampai kapan (exclusive). Default = today. */
  tanggalSampai?:  string;
}

/**
 * Konversi range hari rawat → N charge (1 per hari) "Kamar Kelas X".
 *
 * Per konvensi: hari masuk dihitung 1, hari pulang tidak dihitung (kecuali
 * hari masuk = hari pulang → tetap 1).
 */
export function chargeFromAkomodasi(
  input: AkomodasiInput,
  ctx: PriceContext,
): ChargeItem[] {
  const start = new Date(input.tanggalAdmisi);
  const end = new Date(input.tanggalSampai ?? new Date().toISOString());
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.max(1, Math.round((endDay.getTime() - startDay.getTime()) / dayMs));

  const price = getHargaAkomodasi(ctx.kelas);
  const coverage = defaultCoverage(ctx.penjamin);

  const items: ChargeItem[] = [];
  for (let i = 0; i < diffDays; i++) {
    const day = new Date(startDay.getTime() + i * dayMs);
    const dayISO = day.toISOString().slice(0, 10);
    items.push(
      buildCharge({
        id:          `${input.kunjunganId}-akom-${dayISO}`,
        tanggalISO:  `${dayISO}T07:00`,
        nama:        `Kamar ${ctx.kelas} — ${dayISO}`,
        sourceModul: "Akomodasi",
        sourceRef:   makeSourceRef("akomodasi", input.kunjunganId, dayISO),
        kategori:    "Akomodasi",
        qty:         1,
        satuan:      "hari",
        hargaSatuan: price.hargaSatuan,
        coverage,
      }),
    );
  }
  return items;
}

// ── Jasa Dokter adapter ──────────────────────────────────

export interface JasaDokterInput {
  id:         string;
  nama:       string;          // "Visite DPJP Sp.JP" / "Konsultasi Sp.PD"
  unit:       SourceModul;     // "IGD" | "RI" | "RJ"
  tanggalISO: string;
  /** Kategori jasa untuk lookup tarif: konsultasi/visite/dst. */
  jenis?:     "Konsultasi" | "Visite" | "Tindakan";
}

/** Konversi 1 entry verifikasi DPJP / konsultasi → 1 charge jasa dokter. */
export function chargeFromJasaDokter(
  entry: JasaDokterInput,
  ctx: PriceContext,
): ChargeItem {
  const price = getHargaJasaDokter(entry.nama, ctx);
  const coverage = defaultCoverage(ctx.penjamin);
  return buildCharge({
    id:          entry.id,
    tanggalISO:  entry.tanggalISO,
    nama:        entry.nama,
    sourceModul: entry.unit,
    sourceRef:   makeSourceRef("jasa", entry.id),
    kategori:    "Jasa Dokter",
    qty:         1,
    satuan:      "kali",
    hargaSatuan: price.hargaSatuan,
    coverage,
  });
}
