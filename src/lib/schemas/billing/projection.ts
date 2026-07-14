// Projeksi Billing (READ-ONLY, Slice 1) — charge invoice DIPROYEKSIKAN dari tabel order klinis
// per kunjungan (Tindakan + Resep + Lab + Rad + BMHP + Akomodasi). ORDER = sumber kebenaran; billing
// tidak menyalin baris. Harga = SNAPSHOT saat order (kecuali akomodasi = rate per kelas). Bentuk
// `BillingChargeDTO` selaras ChargeItem UI (components/billing/invoice/invoiceShared) agar FE
// merender tanpa remap berat. Tanpa persist — pembayaran & penyesuaian menyusul (Slice 2+).

export type BillingCoverage = "Penjamin" | "Pasien" | "Mixed";

export type BillingSourceModul =
  | "IGD" | "RI" | "RJ" | "Farmasi" | "Lab" | "Rad" | "Akomodasi" | "Adjustment";

export type BillingKategori =
  | "Akomodasi" | "Tindakan" | "Lab" | "Rad" | "Obat & BMHP" | "Jasa Dokter" | "Lain-lain";

export interface BillingChargeDTO {
  id: string;
  tanggalISO: string;       // ISO — waktu order/tindakan (atau hari akomodasi)
  nama: string;
  sourceModul: BillingSourceModul;
  sourceRef: string;        // stable dedupe key (tindakan:… / lab:… / akomodasi:…)
  kategori: BillingKategori;
  qty: number;
  satuan: string;
  hargaSatuan: number;      // Rp (0 bila belum bertarif)
  coverage: BillingCoverage;
  /** Harga snapshot null (belum bertarif saat order) → ditandai; hargaSatuan=0. */
  untariffed?: boolean;
}

// Baris worklist "Tagihan Kunjungan" — 1 kunjungan + total proyeksi (order + akomodasi).
export interface BillingKunjunganRowDTO {
  kunjunganId: string;
  noKunjungan: string;
  unit: string;             // IGD | RawatInap | RawatJalan
  status: string;
  locked: boolean;
  waktuKunjungan: string;   // ISO
  selesaiAt: string | null;
  pasien: { noRM: string; nama: string; gender: "L" | "P"; age: number };
  penjaminTipe: string;
  kelas: string | null;
  total: number;            // Σ order (harga snapshot) + akomodasi RI (grand total, adjustment=0 s/d Slice 2d)
  itemCount: number;        // jumlah baris order (tanpa akomodasi)
  dibayar: number;          // Σ payment non-void (0 bila belum ada invoice/bayar)
  sisa: number;             // max(0, total − dibayar)
  billingStatus: string;    // Draft | Belum Lunas | Lunas Sebagian | Lunas
}

export interface BillingProjectionDTO {
  kunjunganId: string;
  noKunjungan: string;
  unit: string;             // IGD | RawatInap | RawatJalan (raw kunjungan.unit)
  status: string;           // status kunjungan
  locked: boolean;          // rekam medis terkunci (Completed)
  selesaiAt: string | null; // ISO — waktu selesai efektif
  pasien: { id: string; noRM: string; nama: string };
  penjaminTipe: string;     // BPJS_Non_PBI | BPJS_PBI | Umum | Asuransi | Jamkesda
  kelas: string | null;     // kelas KAMAR (RI)
  kelasHak: string | null;  // hak kelas — basis tagihan akomodasi (titipan)
  noSep: string | null;
  items: BillingChargeDTO[];
  subtotal: number;         // Σ qty×hargaSatuan (untariffed = 0)
  untariffedCount: number;  // jumlah item tanpa tarif (perlu ditinjau billing)
}
