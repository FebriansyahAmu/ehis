/**
 * Deposit Awal (BL3.3) — pasien admisi RI yang butuh deposit di muka sebelum
 * pelayanan dimulai.
 *
 * DATA NYATA: daftar pasien admisi kini diturunkan dari proyeksi billing
 * (`GET /billing/kunjungan` → kunjungan Rawat Inap yang belum ada pembayaran),
 * di-adapt ke `PasienAdmisi` via `components/billing/kasir/deposit/realAdmisi`.
 * File ini menyimpan HANYA tipe + heuristik saran nominal (bukan data pasien).
 */

import type {
  UnitFilter, KelasFilter, PenjaminFilter,
} from "@/components/billing/tagihan/tagihanShared";

export type AdmisiKategori = "RI Baru" | "Pre-Op Major" | "ICU Admisi";

export type AdmisiUrgensi = "Rutin" | "Cito" | "Emergency";

export interface PasienAdmisi {
  id: string;
  noKunjungan: string;                // kunjungan sudah dibuat saat daftar
  pasien: {
    nama: string;
    noRM: string;
    gender: "L" | "P";
    age: number;
  };
  unit: Extract<UnitFilter, "RI">;
  kelas: KelasFilter;
  penjamin: { tipe: Exclude<PenjaminFilter, "all">; nama: string };
  dpjp: string;
  kategori: AdmisiKategori;
  urgensi: AdmisiUrgensi;
  rencanaAdmisi: string;              // ISO datetime
  diagnosaSementara?: string;
  rencanaTindakan?: string;           // utk pre-op
  estimasiLOS?: number;               // hari, optional override
  catatan?: string;
}

// ── Suggest amount per kelas (single-day rate × LOS) ────

/**
 * Tarif akomodasi per hari per kelas (Rp). Mock — backend ambil dari
 * Master Tarif dengan join ke Penjamin (BPJS rate vs Umum rate).
 */
const KELAS_RATE_PER_HARI: Record<KelasFilter, number> = {
  VIP:     2_000_000,
  K1:     1_200_000,
  K2:       800_000,
  K3:       450_000,
  ICU:    1_500_000,
  HCU:    1_000_000,
  RJ:       100_000,    // tidak relevant untuk deposit RI
};

/** Estimasi LOS default per kategori admisi (hari). */
const DEFAULT_LOS: Record<AdmisiKategori, number> = {
  "RI Baru":      5,
  "Pre-Op Major": 7,    // 1 hari pre-op + recovery 6 hari
  "ICU Admisi":   3,
};

/**
 * Suggest nominal deposit awal berdasarkan kelas + estimasi LOS + buffer 30%
 * untuk obat/tindakan. Pasien BPJS biasanya butuh deposit lebih kecil
 * (cuma cover non-cover items).
 */
export function suggestDeposit(input: {
  kelas: KelasFilter;
  losDays?: number;
  kategori: AdmisiKategori;
  penjaminTipe: Exclude<PenjaminFilter, "all">;
}): {
  base: number;
  buffer: number;
  total: number;
  rateInfo: string;
} {
  const ratePerHari = KELAS_RATE_PER_HARI[input.kelas];
  const los = input.losDays ?? DEFAULT_LOS[input.kategori];
  const base = ratePerHari * los;

  // BPJS / Jamkesda hanya cover non-formularium + selisih kelas — deposit lebih kecil
  const bufferPct = input.penjaminTipe === "umum" ? 0.30
                  : input.penjaminTipe === "asuransi" ? 0.20
                  : 0.10;  // BPJS / Jamkesda
  const buffer = Math.round(base * bufferPct);
  const total = base + buffer;

  return {
    base,
    buffer,
    total,
    rateInfo: `${formatRupiahShort(ratePerHari)}/hari × ${los} hari`,
  };
}

function formatRupiahShort(v: number): string {
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1).replace(".0", "")}jt`;
  if (v >= 1_000)     return `Rp ${(v / 1_000).toFixed(0)}rb`;
  return `Rp ${v}`;
}

// ── Search + sort pasien admisi (data NYATA di-supply caller) ──────────

/**
 * Search pasien admisi by nama / noRM / noKunjungan atas `source` NYATA.
 * Sort: urgensi (Emergency > Cito > Rutin) lalu rencanaAdmisi asc.
 */
export function searchPasienAdmisi(
  query: string,
  source: PasienAdmisi[],
): PasienAdmisi[] {
  const q = query.trim().toLowerCase();
  const urgensiRank = { Emergency: 0, Cito: 1, Rutin: 2 };
  return source
    .filter((p) => {
      if (!q) return true;
      const hay = `${p.pasien.nama} ${p.pasien.noRM} ${p.noKunjungan}`.toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => {
      const r = urgensiRank[a.urgensi] - urgensiRank[b.urgensi];
      if (r !== 0) return r;
      return a.rencanaAdmisi.localeCompare(b.rencanaAdmisi);
    });
}
