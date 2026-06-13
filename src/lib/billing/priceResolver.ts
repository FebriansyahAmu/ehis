/**
 * Price Resolver — single source of truth untuk semua harga charge.
 *
 * Strategi mock-first:
 *   - Tarif: scan `TARIF_MOCK` per-kategori + fuzzy match by name, pakai
 *     `tarifUmum/tarifBPJS/tarifAsuransi` sesuai penjamin tipe.
 *   - Obat: lookup snapshot katalog obat (DB master.obat) by kode/nama, pakai `hargaSatuan`.
 *   - Akomodasi: hardcoded rate per kelas (RS bisa override di profil nanti).
 *   - Fallback: return harga default + flag `resolved: false` agar caller bisa
 *     warn/log.
 *
 * Backend ready: ganti `TARIF_MOCK` query → `prisma.tarif.findFirst(...)` +
 * lookup Mapping Hub Tarif Matrix per-penjamin × kelas. Zero refactor caller.
 */

import { TARIF_MOCK, type KategoriTarif, type TarifRecord } from "@/lib/master/tarifMock";
import { lookupObatPrice } from "@/lib/billing/obatPriceCatalog";
import type { KelasFilter } from "@/components/billing/tagihan/tagihanShared";
import type { PenjaminTipeRow } from "@/lib/billing/tagihanBoardMock";

// ── Types ───────────────────────────────────────────────

export interface PriceResolution {
  hargaSatuan: number;
  resolved:    boolean;
  /** Sumber resolusi — untuk debugging + audit log. */
  source:      "tarif-master" | "obat-master" | "akomodasi-default" | "fallback";
  /** ID record master jika di-resolve via master (untuk `tarifMasterId` field). */
  masterId?:   string;
}

export interface PriceContext {
  penjamin: PenjaminTipeRow;
  kelas:    KelasFilter;
}

// ── Internal helpers ─────────────────────────────────────

/** Pilih tarif sesuai penjamin tipe dengan fallback ke tarifUmum. */
function pickTarif(record: TarifRecord, penjamin: PenjaminTipeRow): number {
  switch (penjamin) {
    case "bpjs":
    case "jamkesda":
      return record.tarifBPJS ?? record.tarifUmum;
    case "asuransi":
      return record.tarifAsuransi ?? record.tarifUmum;
    case "umum":
    default:
      return record.tarifUmum;
  }
}

/** Cari TarifRecord by kategori + fuzzy name match. */
function findTarifByName(
  kategori: KategoriTarif,
  namaPattern: string,
): TarifRecord | null {
  const q = namaPattern.toLowerCase().trim();
  if (!q) return null;

  const candidates = TARIF_MOCK.filter(
    (t) => t.kategori === kategori && t.status === "Aktif",
  );

  // Exact match (case-insensitive) first
  const exact = candidates.find((t) => t.nama.toLowerCase() === q);
  if (exact) return exact;

  // Contains match (either direction)
  const contains = candidates.find(
    (t) => t.nama.toLowerCase().includes(q) || q.includes(t.nama.toLowerCase()),
  );
  return contains ?? null;
}

// ── Public resolvers ─────────────────────────────────────

/**
 * Harga 1 tindakan (kategori "Tindakan Medis").
 *
 * `nama` boleh dari catalog (TINDAKAN_MOCK) atau bebas — fuzzy match ke
 * TARIF_MOCK.
 */
export function getHargaTindakan(nama: string, ctx: PriceContext): PriceResolution {
  const record = findTarifByName("Tindakan Medis", nama);
  if (!record) {
    return { hargaSatuan: 100_000, resolved: false, source: "fallback" };
  }
  return {
    hargaSatuan: pickTarif(record, ctx.penjamin),
    resolved:    true,
    source:      "tarif-master",
    masterId:    record.id,
  };
}

/** Harga 1 test laboratorium. */
export function getHargaLab(nama: string, ctx: PriceContext): PriceResolution {
  const record = findTarifByName("Laboratorium", nama);
  if (!record) {
    return { hargaSatuan: 75_000, resolved: false, source: "fallback" };
  }
  return {
    hargaSatuan: pickTarif(record, ctx.penjamin),
    resolved:    true,
    source:      "tarif-master",
    masterId:    record.id,
  };
}

/** Harga 1 modalitas radiologi. */
export function getHargaRad(nama: string, ctx: PriceContext): PriceResolution {
  const record = findTarifByName("Radiologi", nama);
  if (!record) {
    return { hargaSatuan: 250_000, resolved: false, source: "fallback" };
  }
  return {
    hargaSatuan: pickTarif(record, ctx.penjamin),
    resolved:    true,
    source:      "tarif-master",
    masterId:    record.id,
  };
}

/** Harga jasa dokter (konsultasi/visite). */
export function getHargaJasaDokter(nama: string, ctx: PriceContext): PriceResolution {
  const record = findTarifByName("Jasa Dokter", nama);
  if (!record) {
    return { hargaSatuan: 150_000, resolved: false, source: "fallback" };
  }
  return {
    hargaSatuan: pickTarif(record, ctx.penjamin),
    resolved:    true,
    source:      "tarif-master",
    masterId:    record.id,
  };
}

/**
 * Harga obat per-satuan.
 *
 * Lookup by `kode` (preferred) atau `nama` (fallback). Penjamin tidak
 * memengaruhi harga di mock — di backend akan dimodifikasi via formularium
 * mapping (penjamin × obat × kelas → coverage).
 */
export function getHargaObat(kodeOrNama: string): PriceResolution {
  const obat = lookupObatPrice(kodeOrNama); // snapshot katalog obat (DB) — hydrate di layout billing

  if (!obat) {
    return { hargaSatuan: 5_000, resolved: false, source: "fallback" };
  }
  return {
    hargaSatuan: obat.hargaSatuan,
    resolved:    true,
    source:      "obat-master",
    masterId:    obat.id,
  };
}

/**
 * Tarif akomodasi (kamar rawat) per hari, per kelas.
 *
 * Tidak ada master "akomodasi rate" — di mock pakai konstanta. Backend nanti
 * di-extend `RS_PROFIL.kamarRate[kelas]` atau master `RuanganRecord.rate`.
 */
const AKOMODASI_RATE_PER_HARI: Record<KelasFilter, number> = {
  VIP: 2_000_000,
  K1:  1_200_000,
  K2:    800_000,
  K3:    450_000,
  ICU: 1_500_000,
  HCU: 1_000_000,
  RJ:          0, // rawat jalan tidak ada akomodasi
};

export function getHargaAkomodasi(kelas: KelasFilter): PriceResolution {
  const rate = AKOMODASI_RATE_PER_HARI[kelas] ?? 500_000;
  return {
    hargaSatuan: rate,
    resolved:    rate > 0,
    source:      "akomodasi-default",
  };
}
