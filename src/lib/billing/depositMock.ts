/**
 * Deposit Awal (BL3.3) — pasien baru admisi RI / pre-op tindakan major yang
 * butuh deposit di muka sebelum pelayanan dimulai.
 *
 * Mock-first: separate dari `TAGIHAN_BOARD_MOCK` (yang sudah ada invoice).
 * Daftar ini = "pasien sudah daftar admisi, belum punya tagihan/deposit".
 *
 * Saat backend ready: query `prisma.kunjungan.findMany({ where: {
 *   status: "Admisi_Pending", invoiceId: null,
 * }})` lalu sort by urgensi (pre-op CITO duluan).
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

// ── Mock pasien admisi ────────────────────────────────

const today = "2026-05-24";
const tomorrow = "2026-05-25";

export const PASIEN_ADMISI_MOCK: PasienAdmisi[] = [
  {
    id: "adm-001",
    noKunjungan: "RI/2026/05/0078",
    pasien: { nama: "Hadi Wijaya", noRM: "RM-2025-091", gender: "L", age: 58 },
    unit: "RI",
    kelas: "K1",
    penjamin: { tipe: "umum", nama: "Umum / Pribadi" },
    dpjp: "dr. Budi Santoso, Sp.JP",
    kategori: "RI Baru",
    urgensi: "Rutin",
    rencanaAdmisi: `${today}T15:00`,
    diagnosaSementara: "Hipertensi Krisis + CHF NYHA III",
    estimasiLOS: 5,
    catatan: "Pasien rujukan dari poli jantung — admisi sore",
  },
  {
    id: "adm-002",
    noKunjungan: "RI/2026/05/0079",
    pasien: { nama: "Lina Sari", noRM: "RM-2025-092", gender: "P", age: 42 },
    unit: "RI",
    kelas: "VIP",
    penjamin: { tipe: "asuransi", nama: "AXA Mandiri" },
    dpjp: "dr. Anisa Putri, Sp.OG",
    kategori: "Pre-Op Major",
    urgensi: "Rutin",
    rencanaAdmisi: `${tomorrow}T07:00`,
    diagnosaSementara: "Mioma Uteri",
    rencanaTindakan: "Total Abdominal Hysterectomy",
    estimasiLOS: 5,
    catatan: "Asuransi sudah konfirmasi cashless — deposit utk uang muka",
  },
  {
    id: "adm-003",
    noKunjungan: "RI/2026/05/0080",
    pasien: { nama: "Sutrisno Aji", noRM: "RM-2025-093", gender: "L", age: 64 },
    unit: "RI",
    kelas: "ICU",
    penjamin: { tipe: "bpjs", nama: "BPJS Non-PBI" },
    dpjp: "dr. Hendra Wijaya, Sp.EM",
    kategori: "ICU Admisi",
    urgensi: "Cito",
    rencanaAdmisi: `${today}T13:30`,
    diagnosaSementara: "Sepsis Berat dengan Gagal Napas",
    estimasiLOS: 4,
    catatan: "Transfer dari IGD — naik kelas ICU dari ICU BPJS",
  },
  {
    id: "adm-004",
    noKunjungan: "RI/2026/05/0081",
    pasien: { nama: "Maya Lestari", noRM: "RM-2025-094", gender: "P", age: 28 },
    unit: "RI",
    kelas: "K2",
    penjamin: { tipe: "bpjs", nama: "BPJS PBI" },
    dpjp: "dr. Anisa Putri, Sp.OG",
    kategori: "RI Baru",
    urgensi: "Rutin",
    rencanaAdmisi: `${tomorrow}T08:00`,
    diagnosaSementara: "Persalinan Spontan",
    estimasiLOS: 3,
  },
  {
    id: "adm-005",
    noKunjungan: "RI/2026/05/0082",
    pasien: { nama: "Bambang Hartono", noRM: "RM-2025-095", gender: "L", age: 71 },
    unit: "RI",
    kelas: "VIP",
    penjamin: { tipe: "umum", nama: "Umum / Pribadi" },
    dpjp: "dr. Indra Cahyo, Sp.B",
    kategori: "Pre-Op Major",
    urgensi: "Emergency",
    rencanaAdmisi: `${today}T16:30`,
    diagnosaSementara: "Appendisitis Perforata",
    rencanaTindakan: "Appendiktomi CITO + Laparotomi Eksplorasi",
    estimasiLOS: 8,
    catatan: "Operasi emergency malam ini — keluarga sudah konfirmasi deposit tunai",
  },
];

/**
 * Search pasien admisi by nama / noRM / noKunjungan.
 * Sort: urgensi (Emergency > Cito > Rutin) lalu rencanaAdmisi asc.
 */
export function searchPasienAdmisi(
  query: string,
  source: PasienAdmisi[] = PASIEN_ADMISI_MOCK,
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

/** Hapus pasien dari list (setelah deposit dibuka → invoice created). */
export function removePasienAdmisi(id: string): void {
  const idx = PASIEN_ADMISI_MOCK.findIndex((p) => p.id === id);
  if (idx >= 0) PASIEN_ADMISI_MOCK.splice(idx, 1);
}
