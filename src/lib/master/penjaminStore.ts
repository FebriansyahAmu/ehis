/**
 * Penjamin & Kontrak — master data store
 *
 * Catatan: extends `penjaminMock.ts` (lightweight placeholder) menjadi schema
 * full untuk halaman Master `/ehis-master/penjamin`. Tetap re-export
 * `PenjaminTipe` core supaya Mapping Hub (Tarif/Formularium) tidak break.
 */

import type { PenjaminTipe } from "./penjaminMock";
export type { PenjaminTipe };

// ── Types ─────────────────────────────────────────────────

export type StatusPenjamin = "Aktif" | "Non_Aktif" | "Suspended";

export type SkemaPembayaran =
  | "INA_CBG"
  | "Fee_For_Service"
  | "Per_Diem"
  | "Hybrid";

export type TipeFaskesBPJS = "TKP" | "FKTP" | "FKRTL";

/**
 * Kode Ruangan / SMF dari sisi penjamin — yang dipakai saat klaim ke penjamin
 * yang bersangkutan.
 *
 * - BPJS: kode SMF/Poli standar 3 huruf (INT/ANA/BED/IGD/...). Lihat
 *   `lib/master/bpjsRuanganCatalog.ts` untuk katalog lengkap.
 * - Asuransi swasta: biasanya tier produk (Bronze/Silver/Gold).
 * - Umum: bebas (mis. VIP / Regular).
 *
 * Setiap kode ruangan penjamin di-map ke 1 atau lebih ruangan rumah sakit
 * (lihat `MappingRuanganRecord`).
 */
export interface PenjaminKelas {
  id: string;
  kode: string;
  nama: string;
  deskripsi?: string;
  /** Kategori untuk BPJS dari `bpjsRuanganCatalog.ts` — opsional */
  kategori?: string;
}

export interface BPJSConfig {
  kodeFaskes: string;
  regional: 1 | 2 | 3 | 4 | 5;
  noPKS: string;
  tipeFaskes: TipeFaskesBPJS;
  tanggalKredensialing?: string;
}

export interface PenjaminKontak {
  picNama: string;
  picJabatan?: string;
  picTelp: string;
  picEmail: string;
  alamatKantor: string;
  kota: string;
}

export interface PenjaminCoverage {
  rawatInap: boolean;
  rawatJalan: boolean;
  igd: boolean;
  laboratorium: boolean;
  radiologi: boolean;
  farmasi: boolean;
  tindakan: boolean;
  ambulans: boolean;
  catatan?: string;
}

export interface PenjaminKontrak {
  noPKS: string;
  tanggalMulai: string;
  tanggalAkhir: string;
  totalPlafon: number;
  plafonPerKlaim?: number;
  skemaPembayaran: SkemaPembayaran;
  tarifGroup: "Umum" | "BPJS" | "Asuransi";
  termCondition?: string;
}

export interface PenjaminRecord {
  id: string;
  kode: string;
  nama: string;
  tipe: PenjaminTipe;
  status: StatusPenjamin;
  kelas: PenjaminKelas[];
  kontak: PenjaminKontak;
  coverage: PenjaminCoverage;
  kontrak?: PenjaminKontrak;
  bpjsConfig?: BPJSConfig;
  catatan?: string;
}

/**
 * Mapping: kelas penjamin → ruangan rumah sakit.
 * Satu kelas penjamin bisa di-map ke beberapa ruangan (mis. BPJS K3 boleh
 * Bangsal A atau Bangsal B). Satu ruangan juga bisa di-map ke beberapa kelas
 * penjamin yang berbeda.
 */
export interface MappingRuanganRecord {
  id: string;
  penjaminId: string;
  penjaminKelasId: string;
  ruanganId: string;
  status: "Aktif" | "Non_Aktif";
}

// ── Mock Data: Penjamin ───────────────────────────────────

export const PENJAMIN_INITIAL: PenjaminRecord[] = [
  // ── BPJS Kesehatan ──
  {
    id: "pj-bpjs",
    kode: "BPJS",
    nama: "BPJS Kesehatan",
    tipe: "BPJS",
    status: "Aktif",
    kelas: [
      // SMF/Poli standar (BPJS V-Claim ruang code)
      { id: "pjk-bpjs-int", kode: "INT", nama: "Penyakit Dalam",            deskripsi: "Interna",                  kategori: "Spesialis_Dasar" },
      { id: "pjk-bpjs-ana", kode: "ANA", nama: "Anak",                      deskripsi: "Pediatri",                 kategori: "Spesialis_Dasar" },
      { id: "pjk-bpjs-bed", kode: "BED", nama: "Bedah Umum",                                                       kategori: "Spesialis_Dasar" },
      { id: "pjk-bpjs-obg", kode: "OBG", nama: "Obstetri & Ginekologi",     deskripsi: "Kebidanan & Kandungan",    kategori: "Spesialis_Dasar" },
      { id: "pjk-bpjs-mat", kode: "MAT", nama: "Mata",                      deskripsi: "Oftalmologi",              kategori: "Spesialis_Lain"  },
      { id: "pjk-bpjs-jan", kode: "JAN", nama: "Jantung & Pembuluh Darah",  deskripsi: "Kardiologi",               kategori: "Spesialis_Lain"  },
      { id: "pjk-bpjs-gig", kode: "GIG", nama: "Gigi & Mulut",                                                     kategori: "Spesialis_Lain"  },
      { id: "pjk-bpjs-igd", kode: "IGD", nama: "Instalasi Gawat Darurat",                                          kategori: "Ruangan"         },
      { id: "pjk-bpjs-icu", kode: "ICU", nama: "Intensive Care Unit",                                              kategori: "Ruangan"         },
      { id: "pjk-bpjs-hem", kode: "HEM", nama: "Hemodialisa",               deskripsi: "Cuci darah",               kategori: "Khusus"          },
    ],
    kontak: {
      picNama: "Andi Rusmawan",
      picJabatan: "Kepala Cabang",
      picTelp: "021-1500-400",
      picEmail: "claim.jktpst@bpjs-kesehatan.go.id",
      alamatKantor: "Jl. Letjen Suprapto No. 24, Cempaka Putih",
      kota: "Jakarta Pusat",
    },
    coverage: {
      rawatInap: true,  rawatJalan: true,  igd: true,
      laboratorium: true, radiologi: true, farmasi: true,
      tindakan: true, ambulans: true,
      catatan: "Sesuai formularium nasional (Fornas) dan paket INA-CBG.",
    },
    kontrak: {
      noPKS: "0123/PKS-BPJS/RS/2024",
      tanggalMulai: "2024-01-01",
      tanggalAkhir: "2026-12-31",
      totalPlafon: 0,
      skemaPembayaran: "INA_CBG",
      tarifGroup: "BPJS",
      termCondition: "Klaim dikirim H+15 bulan berjalan. Pending klaim diselesaikan H+30.",
    },
    bpjsConfig: {
      kodeFaskes: "0001R001",
      regional: 1,
      noPKS: "0123/PKS-BPJS/RS/2024",
      tipeFaskes: "FKRTL",
      tanggalKredensialing: "2024-01-15",
    },
  },

  // ── Umum / Pribadi ──
  {
    id: "pj-umum",
    kode: "UMUM",
    nama: "Umum / Pribadi",
    tipe: "Umum",
    status: "Aktif",
    kelas: [
      { id: "pjk-umum-vip",  kode: "VIP", nama: "Umum VIP",     deskripsi: "Pembayaran tunai / debit / kartu kredit, kamar VIP" },
      { id: "pjk-umum-reg",  kode: "REG", nama: "Umum Regular", deskripsi: "Pembayaran tunai untuk kamar standar" },
    ],
    kontak: {
      picNama: "—",
      picTelp: "—",
      picEmail: "—",
      alamatKantor: "—",
      kota: "—",
    },
    coverage: {
      rawatInap: true,  rawatJalan: true,  igd: true,
      laboratorium: true, radiologi: true, farmasi: true,
      tindakan: true, ambulans: true,
    },
  },

  // ── Allianz Life ──
  {
    id: "pj-allianz",
    kode: "ALN",
    nama: "Allianz Life Indonesia",
    tipe: "Asuransi_Swasta",
    status: "Aktif",
    kelas: [
      { id: "pjk-aln-bronze", kode: "BRZ",  nama: "Allianz Bronze",  deskripsi: "Plafon harian Rp 600.000" },
      { id: "pjk-aln-silver", kode: "SIL",  nama: "Allianz Silver",  deskripsi: "Plafon harian Rp 1.200.000" },
      { id: "pjk-aln-gold",   kode: "GLD",  nama: "Allianz Gold",    deskripsi: "Plafon harian Rp 2.500.000" },
      { id: "pjk-aln-plat",   kode: "PLT",  nama: "Allianz Platinum", deskripsi: "Plafon harian Rp 5.000.000" },
    ],
    kontak: {
      picNama: "Rini Setiawati",
      picJabatan: "Provider Relations",
      picTelp: "021-2926-8888",
      picEmail: "provider.id@allianz.co.id",
      alamatKantor: "Allianz Tower, Kuningan",
      kota: "Jakarta Selatan",
    },
    coverage: {
      rawatInap: true,  rawatJalan: true,  igd: true,
      laboratorium: true, radiologi: true, farmasi: true,
      tindakan: true, ambulans: false,
      catatan: "Cashless dengan kartu Allianz. Reimburse plafon sesuai plan.",
    },
    kontrak: {
      noPKS: "PKS-ALN-2024-018",
      tanggalMulai: "2024-03-01",
      tanggalAkhir: "2027-02-28",
      totalPlafon: 5_000_000_000,
      plafonPerKlaim: 50_000_000,
      skemaPembayaran: "Fee_For_Service",
      tarifGroup: "Asuransi",
      termCondition: "Pre-authorization wajib untuk tindakan > 10jt. Cashless 24 jam.",
    },
  },

  // ── AXA Mandiri ──
  {
    id: "pj-axa",
    kode: "AXA",
    nama: "AXA Mandiri",
    tipe: "Asuransi_Swasta",
    status: "Aktif",
    kelas: [
      { id: "pjk-axa-std",  kode: "STD",  nama: "AXA Standard",  deskripsi: "Kamar kelas 2" },
      { id: "pjk-axa-exec", kode: "EXEC", nama: "AXA Executive", deskripsi: "Kamar kelas 1 / VIP" },
    ],
    kontak: {
      picNama: "Hendro Putranto",
      picJabatan: "Network Manager",
      picTelp: "021-3000-1818",
      picEmail: "provider@axa-mandiri.co.id",
      alamatKantor: "AXA Tower, Kuningan",
      kota: "Jakarta Selatan",
    },
    coverage: {
      rawatInap: true,  rawatJalan: true,  igd: true,
      laboratorium: true, radiologi: true, farmasi: true,
      tindakan: true, ambulans: false,
    },
    kontrak: {
      noPKS: "PKS-AXA-2024-009",
      tanggalMulai: "2024-02-01",
      tanggalAkhir: "2026-01-31",
      totalPlafon: 2_500_000_000,
      plafonPerKlaim: 30_000_000,
      skemaPembayaran: "Fee_For_Service",
      tarifGroup: "Asuransi",
    },
  },

  // ── Mandiri Inhealth ──
  {
    id: "pj-inhealth",
    kode: "INH",
    nama: "Mandiri Inhealth",
    tipe: "Asuransi_Swasta",
    status: "Aktif",
    kelas: [
      { id: "pjk-inh-i",   kode: "I",   nama: "Inhealth Tipe I",   deskripsi: "Eselon atas" },
      { id: "pjk-inh-ii",  kode: "II",  nama: "Inhealth Tipe II",  deskripsi: "Karyawan tetap" },
      { id: "pjk-inh-iii", kode: "III", nama: "Inhealth Tipe III", deskripsi: "Karyawan kontrak" },
    ],
    kontak: {
      picNama: "Susi Maryani",
      picJabatan: "Provider Officer",
      picTelp: "021-2926-6900",
      picEmail: "provider@inhealth.co.id",
      alamatKantor: "Wisma Mandiri, Thamrin",
      kota: "Jakarta Pusat",
    },
    coverage: {
      rawatInap: true,  rawatJalan: true,  igd: true,
      laboratorium: true, radiologi: true, farmasi: true,
      tindakan: true, ambulans: true,
    },
    kontrak: {
      noPKS: "PKS-INH-2024-022",
      tanggalMulai: "2024-04-01",
      tanggalAkhir: "2026-03-31",
      totalPlafon: 1_500_000_000,
      skemaPembayaran: "Hybrid",
      tarifGroup: "Asuransi",
    },
  },

  // ── Jamkesda DKI ──
  {
    id: "pj-jkd",
    kode: "JKD",
    nama: "Jamkesda DKI Jakarta",
    tipe: "Jamkesda",
    status: "Aktif",
    kelas: [
      { id: "pjk-jkd-std", kode: "JKD", nama: "Jamkesda Standar", deskripsi: "KJS / Kartu Jakarta Sehat — kelas 3" },
    ],
    kontak: {
      picNama: "Budi Hartono",
      picJabatan: "Kabid Yankes",
      picTelp: "021-3441111",
      picEmail: "jamkesda@jakarta.go.id",
      alamatKantor: "Dinkes DKI Jakarta, Kebon Sirih",
      kota: "Jakarta Pusat",
    },
    coverage: {
      rawatInap: true,  rawatJalan: true,  igd: true,
      laboratorium: true, radiologi: true, farmasi: true,
      tindakan: true, ambulans: true,
      catatan: "Hanya untuk pemegang KJS dan KK Jakarta.",
    },
    kontrak: {
      noPKS: "PKS-JKD-2024-007",
      tanggalMulai: "2024-01-01",
      tanggalAkhir: "2025-12-31",
      totalPlafon: 800_000_000,
      skemaPembayaran: "Per_Diem",
      tarifGroup: "Umum",
    },
  },

  // ── Astra Life (Suspended) ──
  {
    id: "pj-astra",
    kode: "ASL",
    nama: "Astra Life",
    tipe: "Asuransi_Swasta",
    status: "Suspended",
    kelas: [
      { id: "pjk-asl-std", kode: "STD", nama: "Astra Standard", deskripsi: "Kelas 1-2" },
    ],
    kontak: {
      picNama: "Yulia Pratami",
      picTelp: "021-7918-8888",
      picEmail: "claim@astralife.co.id",
      alamatKantor: "Menara Astra, Sudirman",
      kota: "Jakarta Pusat",
    },
    coverage: {
      rawatInap: true,  rawatJalan: false, igd: true,
      laboratorium: true, radiologi: true, farmasi: false,
      tindakan: true, ambulans: false,
    },
    catatan: "Suspend sementara — pending verifikasi ulang dokumen PKS Mei 2026.",
  },
];

// ── Mock Data: Mapping Ruangan ────────────────────────────

export const MAPPING_INITIAL: MappingRuanganRecord[] = [
  // ── BPJS — kode SMF / Poli (BPJS V-Claim ruang code) ──
  // INT (Penyakit Dalam) → Bangsal Melati Kelas 1 (default RI Interna)
  { id: "map-001", penjaminId: "pj-bpjs", penjaminKelasId: "pjk-bpjs-int", ruanganId: "loc-ri-melati", status: "Aktif" },
  // ICU BPJS → Ruang ICU
  { id: "map-002", penjaminId: "pj-bpjs", penjaminKelasId: "pjk-bpjs-icu", ruanganId: "loc-ri-icu", status: "Aktif" },
  // IGD BPJS → Triase + Observasi IGD
  { id: "map-003", penjaminId: "pj-bpjs", penjaminKelasId: "pjk-bpjs-igd", ruanganId: "loc-igd-triase",     status: "Aktif" },
  { id: "map-004", penjaminId: "pj-bpjs", penjaminKelasId: "pjk-bpjs-igd", ruanganId: "loc-igd-observasi", status: "Aktif" },
  // JAN (Jantung) → Poli Jantung
  { id: "map-101", penjaminId: "pj-bpjs", penjaminKelasId: "pjk-bpjs-jan", ruanganId: "loc-poli-jantung", status: "Aktif" },
  // ANA (Anak) → Poli Umum (RS belum punya poli anak terpisah)
  { id: "map-102", penjaminId: "pj-bpjs", penjaminKelasId: "pjk-bpjs-ana", ruanganId: "loc-poli-umum",    status: "Aktif" },
  // INT (Penyakit Dalam) → Poli Umum (rawat jalan)
  { id: "map-103", penjaminId: "pj-bpjs", penjaminKelasId: "pjk-bpjs-int", ruanganId: "loc-poli-umum",    status: "Aktif" },
  // Umum VIP → Bangsal Mawar (VIP)
  { id: "map-005", penjaminId: "pj-umum", penjaminKelasId: "pjk-umum-vip", ruanganId: "loc-ri-mawar",  status: "Aktif" },
  { id: "map-006", penjaminId: "pj-umum", penjaminKelasId: "pjk-umum-reg", ruanganId: "loc-ri-melati", status: "Aktif" },
  // Allianz Gold → Bangsal Mawar VIP
  { id: "map-007", penjaminId: "pj-allianz", penjaminKelasId: "pjk-aln-gold",   ruanganId: "loc-ri-mawar", status: "Aktif" },
  { id: "map-008", penjaminId: "pj-allianz", penjaminKelasId: "pjk-aln-plat",   ruanganId: "loc-ri-mawar", status: "Aktif" },
  { id: "map-009", penjaminId: "pj-allianz", penjaminKelasId: "pjk-aln-silver", ruanganId: "loc-ri-melati", status: "Aktif" },
  // AXA Executive → Mawar
  { id: "map-010", penjaminId: "pj-axa", penjaminKelasId: "pjk-axa-exec", ruanganId: "loc-ri-mawar",  status: "Aktif" },
  { id: "map-011", penjaminId: "pj-axa", penjaminKelasId: "pjk-axa-std",  ruanganId: "loc-ri-melati", status: "Aktif" },
  // Inhealth I → Mawar (VIP), II → Melati
  { id: "map-012", penjaminId: "pj-inhealth", penjaminKelasId: "pjk-inh-i",  ruanganId: "loc-ri-mawar",  status: "Aktif" },
  { id: "map-013", penjaminId: "pj-inhealth", penjaminKelasId: "pjk-inh-ii", ruanganId: "loc-ri-melati", status: "Aktif" },
  // Jamkesda → Melati + ICU
  { id: "map-014", penjaminId: "pj-jkd", penjaminKelasId: "pjk-jkd-std", ruanganId: "loc-ri-melati", status: "Aktif" },
  { id: "map-015", penjaminId: "pj-jkd", penjaminKelasId: "pjk-jkd-std", ruanganId: "loc-ri-icu",    status: "Non_Aktif" },
];
