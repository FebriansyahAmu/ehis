export type KategoriTarif =
  | "Tindakan Medis"
  | "Laboratorium"
  | "Radiologi"
  | "Kamar Rawat"
  | "Obat & BMHP"
  | "Jasa Dokter"
  | "Ambulans"
  | "Lainnya";

export type StatusTarif = "Aktif" | "Non-Aktif" | "Draft";
export type SatuanTarif = "Per Tindakan" | "Per Item" | "Per Hari" | "Per Paket" | "Per Kali";

export interface TarifRecord {
  id:            string;
  kode:          string;
  nama:          string;
  kategori:      KategoriTarif;
  satuan:        SatuanTarif;
  tarifUmum:     number;
  tarifBPJS?:    number;
  tarifAsuransi?: number;
  hpp?:          number;
  status:        StatusTarif;
  unitTerkait:   string[];
  deskripsi?:    string;
  kodeICD?:      string;
}

export interface PaketItem {
  tarifId: string;
  qty:     number;
}

export interface PaketLayanan {
  id:          string;
  kode:        string;
  nama:        string;
  deskripsi?:  string;
  items:       PaketItem[];
  tarifUmum:   number;
  tarifBPJS?:  number;
  diskon?:     number;
  status:      StatusTarif;
}

export function emptyTarif(): TarifRecord {
  return {
    id: `tarif-${Date.now()}`,
    kode: "", nama: "", kategori: "Tindakan Medis",
    satuan: "Per Tindakan", tarifUmum: 0,
    status: "Draft", unitTerkait: [],
  };
}

export function emptyPaket(): PaketLayanan {
  return {
    id: `paket-${Date.now()}`,
    kode: "", nama: "", items: [],
    tarifUmum: 0, status: "Draft",
  };
}

export const TARIF_MOCK: TarifRecord[] = [
  {
    id: "t-001", kode: "JD-001", nama: "Konsultasi Dokter Umum",
    kategori: "Jasa Dokter", satuan: "Per Kali",
    tarifUmum: 75_000, tarifBPJS: 16_000, tarifAsuransi: 100_000, hpp: 30_000,
    status: "Aktif", unitTerkait: ["Poli Umum", "IGD"],
    deskripsi: "Konsultasi dokter umum rawat jalan",
  },
  {
    id: "t-002", kode: "JD-002", nama: "Konsultasi Dokter Spesialis",
    kategori: "Jasa Dokter", satuan: "Per Kali",
    tarifUmum: 200_000, tarifBPJS: 25_000, tarifAsuransi: 275_000, hpp: 80_000,
    status: "Aktif", unitTerkait: ["Poli Jantung", "Poli Bedah", "Poli Anak", "Poli Penyakit Dalam"],
  },
  {
    id: "t-003", kode: "TM-001", nama: "Hecting / Jahit Luka",
    kategori: "Tindakan Medis", satuan: "Per Tindakan", kodeICD: "86.59",
    tarifUmum: 250_000, tarifBPJS: 80_000, tarifAsuransi: 350_000, hpp: 100_000,
    status: "Aktif", unitTerkait: ["IGD", "Poli Bedah"],
  },
  {
    id: "t-004", kode: "TM-002", nama: "Pemasangan Infus",
    kategori: "Tindakan Medis", satuan: "Per Tindakan", kodeICD: "99.18",
    tarifUmum: 80_000, tarifBPJS: 35_000, tarifAsuransi: 110_000, hpp: 40_000,
    status: "Aktif", unitTerkait: ["IGD", "Rawat Inap"],
  },
  {
    id: "t-005", kode: "TM-003", nama: "EKG (Elektrokardiogram)",
    kategori: "Tindakan Medis", satuan: "Per Tindakan", kodeICD: "89.52",
    tarifUmum: 150_000, tarifBPJS: 45_000, tarifAsuransi: 200_000, hpp: 50_000,
    status: "Aktif", unitTerkait: ["IGD", "Poli Jantung", "Rawat Inap"],
  },
  {
    id: "t-006", kode: "TM-004", nama: "Nebulisasi",
    kategori: "Tindakan Medis", satuan: "Per Tindakan", kodeICD: "93.94",
    tarifUmum: 95_000, tarifBPJS: 40_000, tarifAsuransi: 130_000, hpp: 35_000,
    status: "Aktif", unitTerkait: ["IGD", "Poli Paru", "Rawat Inap"],
  },
  {
    id: "t-007", kode: "TM-005", nama: "Bedah Minor",
    kategori: "Tindakan Medis", satuan: "Per Tindakan", kodeICD: "86.4",
    tarifUmum: 500_000, tarifBPJS: 185_000, tarifAsuransi: 700_000, hpp: 200_000,
    status: "Draft", unitTerkait: ["Poli Bedah"],
    deskripsi: "Eksisi kista, insisi abses, dll",
  },
  {
    id: "t-008", kode: "LAB-001", nama: "Darah Lengkap (CBC)",
    kategori: "Laboratorium", satuan: "Per Tindakan",
    tarifUmum: 120_000, tarifBPJS: 47_000, tarifAsuransi: 160_000, hpp: 60_000,
    status: "Aktif", unitTerkait: ["Laboratorium"],
  },
  {
    id: "t-009", kode: "LAB-002", nama: "Gula Darah Sewaktu",
    kategori: "Laboratorium", satuan: "Per Tindakan",
    tarifUmum: 45_000, tarifBPJS: 15_000, tarifAsuransi: 60_000, hpp: 20_000,
    status: "Aktif", unitTerkait: ["Laboratorium"],
  },
  {
    id: "t-010", kode: "LAB-003", nama: "Elektrolit (Na/K/Cl)",
    kategori: "Laboratorium", satuan: "Per Tindakan",
    tarifUmum: 180_000, tarifBPJS: 72_000, tarifAsuransi: 240_000, hpp: 85_000,
    status: "Aktif", unitTerkait: ["Laboratorium"],
  },
  {
    id: "t-011", kode: "RAD-001", nama: "Foto Thorax AP",
    kategori: "Radiologi", satuan: "Per Tindakan", kodeICD: "87.44",
    tarifUmum: 200_000, tarifBPJS: 90_000, tarifAsuransi: 270_000, hpp: 80_000,
    status: "Aktif", unitTerkait: ["Radiologi"],
  },
  {
    id: "t-012", kode: "RAD-002", nama: "USG Abdomen",
    kategori: "Radiologi", satuan: "Per Tindakan", kodeICD: "88.76",
    tarifUmum: 350_000, tarifBPJS: 145_000, tarifAsuransi: 475_000, hpp: 140_000,
    status: "Aktif", unitTerkait: ["Radiologi"],
  },
  {
    id: "t-013", kode: "RAD-003", nama: "CT Scan Kepala Non-Kontras",
    kategori: "Radiologi", satuan: "Per Tindakan", kodeICD: "87.03",
    tarifUmum: 1_200_000, tarifBPJS: 480_000, tarifAsuransi: 1_600_000, hpp: 500_000,
    status: "Aktif", unitTerkait: ["Radiologi"],
  },
  {
    id: "t-014", kode: "KMR-001", nama: "Kamar VIP",
    kategori: "Kamar Rawat", satuan: "Per Hari",
    tarifUmum: 750_000, tarifAsuransi: 900_000, hpp: 350_000,
    status: "Aktif", unitTerkait: ["Rawat Inap"],
    deskripsi: "1 TT + sofa penunggu + AC + TV",
  },
  {
    id: "t-015", kode: "KMR-002", nama: "Kamar Kelas 1",
    kategori: "Kamar Rawat", satuan: "Per Hari",
    tarifUmum: 350_000, tarifBPJS: 250_000, tarifAsuransi: 420_000, hpp: 160_000,
    status: "Aktif", unitTerkait: ["Rawat Inap"],
  },
  {
    id: "t-016", kode: "KMR-003", nama: "Kamar Kelas 2",
    kategori: "Kamar Rawat", satuan: "Per Hari",
    tarifUmum: 200_000, tarifBPJS: 190_000, tarifAsuransi: 240_000, hpp: 95_000,
    status: "Aktif", unitTerkait: ["Rawat Inap"],
  },
  {
    id: "t-017", kode: "KMR-004", nama: "Kamar ICU",
    kategori: "Kamar Rawat", satuan: "Per Hari",
    tarifUmum: 1_500_000, tarifBPJS: 600_000, tarifAsuransi: 2_000_000, hpp: 700_000,
    status: "Aktif", unitTerkait: ["ICU"],
    deskripsi: "Rawat ICU termasuk monitoring kontinu",
  },
  {
    id: "t-018", kode: "AMB-001", nama: "Ambulans Dalam Kota",
    kategori: "Ambulans", satuan: "Per Kali",
    tarifUmum: 350_000, tarifAsuransi: 450_000, hpp: 150_000,
    status: "Aktif", unitTerkait: ["IGD"],
    deskripsi: "Radius dalam kota, termasuk BBM",
  },
];

export const PAKET_MOCK: PaketLayanan[] = [
  {
    id: "pk-001", kode: "PKT-IGD-01", nama: "Paket IGD Dewasa",
    deskripsi: "Paket tindakan IGD dasar untuk pasien dewasa",
    items: [
      { tarifId: "t-001", qty: 1 }, { tarifId: "t-004", qty: 1 },
      { tarifId: "t-008", qty: 1 }, { tarifId: "t-011", qty: 1 },
    ],
    tarifUmum: 550_000, tarifBPJS: 200_000, diskon: 10, status: "Aktif",
  },
  {
    id: "pk-002", kode: "PKT-MCU-01", nama: "Paket Medical Check-Up Dasar",
    deskripsi: "Lab + thorax + konsultasi untuk karyawan / asuransi",
    items: [
      { tarifId: "t-001", qty: 1 }, { tarifId: "t-008", qty: 1 },
      { tarifId: "t-009", qty: 1 }, { tarifId: "t-011", qty: 1 },
    ],
    tarifUmum: 430_000, tarifBPJS: 168_000, diskon: 15, status: "Aktif",
  },
  {
    id: "pk-003", kode: "PKT-JANTUNG-01", nama: "Paket Pemeriksaan Jantung",
    deskripsi: "Konsultasi SpJP + EKG + lab kardiovaskular",
    items: [
      { tarifId: "t-002", qty: 1 }, { tarifId: "t-005", qty: 1 },
      { tarifId: "t-008", qty: 1 }, { tarifId: "t-010", qty: 1 },
    ],
    tarifUmum: 600_000, tarifBPJS: 177_000, diskon: 10, status: "Draft",
  },
];
