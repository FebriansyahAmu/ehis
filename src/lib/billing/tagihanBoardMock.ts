/**
 * Mock data untuk Tagihan Board (BL1.2).
 *
 * Schema 1:1 dengan target `BillingRecord` extended di BL0.1 — kolom yang
 * dibutuhkan worklist denormalized (pasien.nama, penjamin.tipe) untuk
 * performa render. Saat backend ready, query API harus return field yang sama.
 */

import type {
  UnitFilter, KelasFilter, StatusFilter, PenjaminFilter,
} from "@/components/billing/tagihan/tagihanShared";

/** Penjamin tipe nyata di-row (tidak termasuk filter sentinel "all"). */
export type PenjaminTipeRow = Exclude<PenjaminFilter, "all">;

export interface TagihanRow {
  id: string;
  noTagihan: string;        // INV/2026/MM/NNNNN
  tanggalISO: string;       // YYYY-MM-DDTHH:mm
  noKunjungan: string;      // IGD/2026/04/0023
  pasien: { nama: string; noRM: string; gender: "L" | "P"; age: number };
  unit:    UnitFilter;
  kelas:   KelasFilter;
  penjamin: { tipe: PenjaminTipeRow; nama: string };
  dpjp:    string;
  total:    number;
  dibayar:  number;
  // sisa is derived: total - dibayar
  status:  StatusFilter;
}

export function sisa(row: TagihanRow): number {
  return Math.max(0, row.total - row.dibayar);
}

// ── Mock seed (25 rows) ─────────────────────────────────

export const TAGIHAN_BOARD_MOCK: TagihanRow[] = [
  // ── Hari ini (BL1.1 KPI "Tagihan Hari Ini" = 18) ──
  {
    id: "INV-001", noTagihan: "INV/2026/05/00231", tanggalISO: "2026-05-24T08:15",
    noKunjungan: "IGD/2026/05/0089",
    pasien: { nama: "Joko Prasetyo", noRM: "RM-2025-005", gender: "L", age: 55 },
    unit: "IGD", kelas: "K2", penjamin: { tipe: "bpjs", nama: "BPJS Non-PBI" },
    dpjp: "dr. Hendra Wijaya, Sp.EM",
    total: 1_775_000, dibayar: 500_000, status: "Belum Lunas",
  },
  {
    id: "INV-002", noTagihan: "INV/2026/05/00232", tanggalISO: "2026-05-24T09:42",
    noKunjungan: "RJ/2026/05/0421",
    pasien: { nama: "Siti Rahayu", noRM: "RM-2025-012", gender: "P", age: 32 },
    unit: "RJ", kelas: "RJ", penjamin: { tipe: "umum", nama: "Umum / Pribadi" },
    dpjp: "dr. Anisa Putri, Sp.PD",
    total: 245_000, dibayar: 245_000, status: "Lunas",
  },
  {
    id: "INV-003", noTagihan: "INV/2026/05/00233", tanggalISO: "2026-05-24T10:12",
    noKunjungan: "RI/2026/05/0058",
    pasien: { nama: "Bambang Sutrisno", noRM: "RM-2025-019", gender: "L", age: 68 },
    unit: "RI", kelas: "VIP", penjamin: { tipe: "asuransi", nama: "AXA Mandiri" },
    dpjp: "dr. Dewi Kusuma, Sp.JP",
    total: 12_450_000, dibayar: 5_000_000, status: "Lunas Sebagian",
  },
  {
    id: "INV-004", noTagihan: "INV/2026/05/00234", tanggalISO: "2026-05-24T10:48",
    noKunjungan: "LAB/2026/05/0512",
    pasien: { nama: "Maria Lestari", noRM: "RM-2025-022", gender: "P", age: 41 },
    unit: "LAB", kelas: "RJ", penjamin: { tipe: "bpjs", nama: "BPJS PBI" },
    dpjp: "dr. Anisa Putri, Sp.PD",
    total: 385_000, dibayar: 0, status: "Proses Klaim",
  },
  {
    id: "INV-005", noTagihan: "INV/2026/05/00235", tanggalISO: "2026-05-24T11:05",
    noKunjungan: "RAD/2026/05/0228",
    pasien: { nama: "Agus Salim", noRM: "RM-2025-031", gender: "L", age: 47 },
    unit: "RAD", kelas: "RJ", penjamin: { tipe: "umum", nama: "Umum / Pribadi" },
    dpjp: "dr. Rina Mahendra, Sp.Rad",
    total: 1_200_000, dibayar: 1_200_000, status: "Lunas",
  },
  {
    id: "INV-006", noTagihan: "INV/2026/05/00236", tanggalISO: "2026-05-24T11:33",
    noKunjungan: "FAR/2026/05/0890",
    pasien: { nama: "Linda Pratiwi", noRM: "RM-2025-038", gender: "P", age: 28 },
    unit: "FAR", kelas: "RJ", penjamin: { tipe: "umum", nama: "Umum / Pribadi" },
    dpjp: "dr. Anisa Putri, Sp.PD",
    total: 178_500, dibayar: 0, status: "Draft",
  },
  {
    id: "INV-007", noTagihan: "INV/2026/05/00237", tanggalISO: "2026-05-24T12:18",
    noKunjungan: "RI/2026/05/0059",
    pasien: { nama: "Hendro Wibowo", noRM: "RM-2025-041", gender: "L", age: 59 },
    unit: "RI", kelas: "K1", penjamin: { tipe: "bpjs", nama: "BPJS Non-PBI" },
    dpjp: "dr. Budi Santoso, Sp.JP",
    total: 8_750_000, dibayar: 0, status: "Klaim Disetujui",
  },
  {
    id: "INV-008", noTagihan: "INV/2026/05/00238", tanggalISO: "2026-05-24T13:25",
    noKunjungan: "IGD/2026/05/0090",
    pasien: { nama: "Putri Maharani", noRM: "RM-2025-045", gender: "P", age: 24 },
    unit: "IGD", kelas: "K3", penjamin: { tipe: "jamkesda", nama: "Jamkesda DKI" },
    dpjp: "dr. Hendra Wijaya, Sp.EM",
    total: 525_000, dibayar: 0, status: "Proses Klaim",
  },
  {
    id: "INV-009", noTagihan: "INV/2026/05/00239", tanggalISO: "2026-05-24T14:02",
    noKunjungan: "RI/2026/05/0060",
    pasien: { nama: "Sutrisno Bagus", noRM: "RM-2025-049", gender: "L", age: 72 },
    unit: "RI", kelas: "ICU", penjamin: { tipe: "bpjs", nama: "BPJS Non-PBI" },
    dpjp: "dr. Hendra Wijaya, Sp.EM",
    total: 18_650_000, dibayar: 2_000_000, status: "Lunas Sebagian",
  },
  {
    id: "INV-010", noTagihan: "INV/2026/05/00240", tanggalISO: "2026-05-24T14:55",
    noKunjungan: "RJ/2026/05/0422",
    pasien: { nama: "Andini Kusuma", noRM: "RM-2025-052", gender: "P", age: 36 },
    unit: "RJ", kelas: "RJ", penjamin: { tipe: "asuransi", nama: "Inhealth Mandiri" },
    dpjp: "dr. Dewi Kusuma, Sp.JP",
    total: 365_000, dibayar: 365_000, status: "Lunas",
  },

  // ── Kemarin (24h-48h) ──
  {
    id: "INV-011", noTagihan: "INV/2026/05/00220", tanggalISO: "2026-05-23T08:30",
    noKunjungan: "IGD/2026/05/0088",
    pasien: { nama: "Rini Astuti", noRM: "RM-2025-007", gender: "P", age: 44 },
    unit: "IGD", kelas: "K2", penjamin: { tipe: "bpjs", nama: "BPJS Non-PBI" },
    dpjp: "dr. Hendra Wijaya, Sp.EM",
    total: 925_000, dibayar: 925_000, status: "Klaim Disetujui",
  },
  {
    id: "INV-012", noTagihan: "INV/2026/05/00221", tanggalISO: "2026-05-23T10:12",
    noKunjungan: "RI/2026/05/0057",
    pasien: { nama: "Wahyu Pratama", noRM: "RM-2025-009", gender: "L", age: 51 },
    unit: "RI", kelas: "K2", penjamin: { tipe: "bpjs", nama: "BPJS PBI" },
    dpjp: "dr. Budi Santoso, Sp.JP",
    total: 6_320_000, dibayar: 0, status: "Klaim Ditolak",
  },
  {
    id: "INV-013", noTagihan: "INV/2026/05/00222", tanggalISO: "2026-05-23T11:48",
    noKunjungan: "LAB/2026/05/0510",
    pasien: { nama: "Indah Permata", noRM: "RM-2025-015", gender: "P", age: 29 },
    unit: "LAB", kelas: "RJ", penjamin: { tipe: "umum", nama: "Umum / Pribadi" },
    dpjp: "dr. Surya Putra, Sp.PK",
    total: 245_000, dibayar: 245_000, status: "Lunas",
  },
  {
    id: "INV-014", noTagihan: "INV/2026/05/00223", tanggalISO: "2026-05-23T13:35",
    noKunjungan: "RAD/2026/05/0226",
    pasien: { nama: "Eko Susanto", noRM: "RM-2025-021", gender: "L", age: 62 },
    unit: "RAD", kelas: "RJ", penjamin: { tipe: "bpjs", nama: "BPJS Non-PBI" },
    dpjp: "dr. Rina Mahendra, Sp.Rad",
    total: 480_000, dibayar: 0, status: "Proses Klaim",
  },
  {
    id: "INV-015", noTagihan: "INV/2026/05/00224", tanggalISO: "2026-05-23T15:20",
    noKunjungan: "RI/2026/05/0055",
    pasien: { nama: "Dewi Anggraini", noRM: "RM-2025-028", gender: "P", age: 38 },
    unit: "RI", kelas: "HCU", penjamin: { tipe: "asuransi", nama: "Allianz Life" },
    dpjp: "dr. Hendra Wijaya, Sp.EM",
    total: 9_850_000, dibayar: 5_000_000, status: "Lunas Sebagian",
  },

  // ── 3-7 hari lalu ──
  {
    id: "INV-016", noTagihan: "INV/2026/05/00205", tanggalISO: "2026-05-21T09:15",
    noKunjungan: "RJ/2026/05/0418",
    pasien: { nama: "Rizky Hidayat", noRM: "RM-2025-033", gender: "L", age: 26 },
    unit: "RJ", kelas: "RJ", penjamin: { tipe: "umum", nama: "Umum / Pribadi" },
    dpjp: "dr. Anisa Putri, Sp.PD",
    total: 195_000, dibayar: 0, status: "Belum Lunas",
  },
  {
    id: "INV-017", noTagihan: "INV/2026/05/00198", tanggalISO: "2026-05-20T14:42",
    noKunjungan: "IGD/2026/05/0085",
    pasien: { nama: "Toni Wijaya", noRM: "RM-2025-036", gender: "L", age: 49 },
    unit: "IGD", kelas: "K1", penjamin: { tipe: "bpjs", nama: "BPJS Non-PBI" },
    dpjp: "dr. Hendra Wijaya, Sp.EM",
    total: 2_140_000, dibayar: 0, status: "Klaim Ditolak",
  },
  {
    id: "INV-018", noTagihan: "INV/2026/05/00185", tanggalISO: "2026-05-18T11:30",
    noKunjungan: "FAR/2026/05/0880",
    pasien: { nama: "Mira Susanti", noRM: "RM-2025-040", gender: "P", age: 53 },
    unit: "FAR", kelas: "RJ", penjamin: { tipe: "umum", nama: "Umum / Pribadi" },
    dpjp: "dr. Anisa Putri, Sp.PD",
    total: 425_000, dibayar: 425_000, status: "Lunas",
  },
  {
    id: "INV-019", noTagihan: "INV/2026/05/00178", tanggalISO: "2026-05-17T08:20",
    noKunjungan: "RI/2026/05/0048",
    pasien: { nama: "Susilo Bambang", noRM: "RM-2025-043", gender: "L", age: 65 },
    unit: "RI", kelas: "K1", penjamin: { tipe: "bpjs", nama: "BPJS Non-PBI" },
    dpjp: "dr. Budi Santoso, Sp.JP",
    total: 14_200_000, dibayar: 0, status: "Klaim Disetujui",
  },
  {
    id: "INV-020", noTagihan: "INV/2026/05/00172", tanggalISO: "2026-05-16T16:05",
    noKunjungan: "LAB/2026/05/0498",
    pasien: { nama: "Vina Hartati", noRM: "RM-2025-047", gender: "P", age: 31 },
    unit: "LAB", kelas: "RJ", penjamin: { tipe: "asuransi", nama: "Inhealth Mandiri" },
    dpjp: "dr. Surya Putra, Sp.PK",
    total: 620_000, dibayar: 620_000, status: "Lunas",
  },

  // ── 7-14 hari (outstanding > 7 hari) ──
  {
    id: "INV-021", noTagihan: "INV/2026/05/00145", tanggalISO: "2026-05-14T10:30",
    noKunjungan: "RJ/2026/05/0395",
    pasien: { nama: "Doni Kurniawan", noRM: "RM-2025-053", gender: "L", age: 42 },
    unit: "RJ", kelas: "RJ", penjamin: { tipe: "umum", nama: "Umum / Pribadi" },
    dpjp: "dr. Anisa Putri, Sp.PD",
    total: 350_000, dibayar: 0, status: "Belum Lunas",
  },
  {
    id: "INV-022", noTagihan: "INV/2026/05/00132", tanggalISO: "2026-05-12T08:45",
    noKunjungan: "RI/2026/05/0041",
    pasien: { nama: "Ahmad Fauzi", noRM: "RM-2025-058", gender: "L", age: 56 },
    unit: "RI", kelas: "K2", penjamin: { tipe: "umum", nama: "Umum / Pribadi" },
    dpjp: "dr. Budi Santoso, Sp.JP",
    total: 8_900_000, dibayar: 3_000_000, status: "Belum Lunas",
  },
  {
    id: "INV-023", noTagihan: "INV/2026/05/00118", tanggalISO: "2026-05-10T15:20",
    noKunjungan: "IGD/2026/05/0078",
    pasien: { nama: "Sri Wahyuni", noRM: "RM-2025-061", gender: "P", age: 47 },
    unit: "IGD", kelas: "K3", penjamin: { tipe: "jamkesda", nama: "Jamkesda DKI" },
    dpjp: "dr. Hendra Wijaya, Sp.EM",
    total: 1_350_000, dibayar: 0, status: "Refund",
  },

  // ── Lebih dari 14 hari ──
  {
    id: "INV-024", noTagihan: "INV/2026/05/00088", tanggalISO: "2026-05-06T11:10",
    noKunjungan: "RAD/2026/05/0198",
    pasien: { nama: "Rina Marlina", noRM: "RM-2025-065", gender: "P", age: 39 },
    unit: "RAD", kelas: "RJ", penjamin: { tipe: "asuransi", nama: "AXA Mandiri" },
    dpjp: "dr. Rina Mahendra, Sp.Rad",
    total: 1_850_000, dibayar: 1_850_000, status: "Klaim Disetujui",
  },
  {
    id: "INV-025", noTagihan: "INV/2026/04/00982", tanggalISO: "2026-04-28T09:30",
    noKunjungan: "RI/2026/04/0029",
    pasien: { nama: "Bagus Hermawan", noRM: "RM-2025-069", gender: "L", age: 71 },
    unit: "RI", kelas: "K3", penjamin: { tipe: "bpjs", nama: "BPJS PBI" },
    dpjp: "dr. Hendra Wijaya, Sp.EM",
    total: 7_650_000, dibayar: 0, status: "Void",
  },
];
