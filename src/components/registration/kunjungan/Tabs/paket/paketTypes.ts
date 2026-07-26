// ─── Types ────────────────────────────────────────────────────

// Kelas kanonik = kunci master TarifKamar (master.TarifKamar / enum RIKelas). Kelas ranap yang
// dapat dipilih pindah kelas (VIP + Kelas 1–3). ICU/HCU/Isolasi = penempatan klinis, bukan pindah kelas.
export type KelasId          = "Kelas_3" | "Kelas_2" | "Kelas_1" | "VIP";
export type KategoriPaket    = "Semua" | "MCU" | "Persalinan" | "Bedah" | "Dialisis" | "Rehabilitasi";
export type SumberPembayaran = "pribadi" | "asuransi-tambahan" | "pemberi-kerja";
export type BadgePaket       = "Populer" | "Baru" | "Promo";

export interface KelasRawatData {
  id:              KelasId;
  label:           string;
  tarif:           number;
  bpjsEntitlement: string | null;
  amenities:       string[];
  kapasitas:       string;
}

export interface PaketLayananData {
  id:        string;
  nama:      string;
  /** Kategori bebas (dari master.PaketLayanan.kategori — mis. MCU/Persalinan/Lainnya). */
  kategori:  string;
  deskripsi: string;
  layanan:   string[];
  harga:     number;
  badge?:    BadgePaket;
  aktif?:    boolean;
}

// ─── Kelas rawat data ─────────────────────────────────────────
// `tarif` = FALLBACK (dipakai bila master TarifKamar belum meng-set kelas tsb); selaras konstanta
// AKOMODASI_RATE billing. Harga TAMPIL diambil dari master TarifKamar (Mapping Hub → Tarif → Ruang
// Rawat) via listTarifKamarTersedia + resolveKelasTarif. Urut kelas rendah → tinggi.

export const KELAS_RAWAT: KelasRawatData[] = [
  {
    id: "Kelas_3", label: "Kelas III", tarif: 450_000,
    bpjsEntitlement: "BPJS PBI / Non-PBI Kelas III",
    amenities: ["AC Sentral", "KM Bersama", "6 TT/Ruang"],
    kapasitas: "6 TT",
  },
  {
    id: "Kelas_2", label: "Kelas II", tarif: 800_000,
    bpjsEntitlement: "BPJS Non-PBI Kelas II",
    amenities: ["AC Ruangan", "KM Bersama", "3 TT/Ruang"],
    kapasitas: "3 TT",
  },
  {
    id: "Kelas_1", label: "Kelas I", tarif: 1_200_000,
    bpjsEntitlement: "BPJS Non-PBI Kelas I",
    amenities: ["AC Ruangan", "KM Dalam", "TV", "2 TT/Ruang"],
    kapasitas: "2 TT",
  },
  {
    id: "VIP", label: "VIP", tarif: 2_000_000,
    bpjsEntitlement: null,
    amenities: ["AC Inverter", "KM Dalam", "Smart TV", "Kulkas", "Sofa"],
    kapasitas: "1 TT",
  },
];

export const CURRENT_KELAS_DEFAULT: KelasId = "Kelas_2";

/** penjamin (string tampil kunjungan) → penjaminKode tarif (BPJS / UMUM). Selaras billing. */
export function penjaminKodeFromLabel(penjamin?: string): "BPJS" | "UMUM" {
  return /bpjs/i.test(penjamin ?? "") ? "BPJS" : "UMUM";
}

/**
 * Harga kamar/hari dari master TarifKamar. Map di-key `${kelas}:${penjaminKode}`.
 * Resolusi: (kelas, penjamin) → (kelas, UMUM) → fallback konstanta. Mirror resolveKamarRate billing.
 */
export function resolveKelasTarif(
  rates: Map<string, number> | null,
  kelasId: KelasId,
  penjaminKode: string,
  fallback: number,
): number {
  if (!rates) return fallback;
  return rates.get(`${kelasId}:${penjaminKode}`) ?? rates.get(`${kelasId}:UMUM`) ?? fallback;
}

export const SUMBER_BAYAR: { id: SumberPembayaran; label: string; desc: string }[] = [
  { id: "pribadi",           label: "Pribadi",           desc: "Pasien / keluarga menanggung selisih" },
  { id: "asuransi-tambahan", label: "Asuransi Tambahan", desc: "Asuransi swasta / perusahaan" },
  { id: "pemberi-kerja",     label: "Pemberi Kerja",     desc: "Instansi / perusahaan pasien" },
];

// ─── Paket layanan data ───────────────────────────────────────

export const PAKET_LIST: PaketLayananData[] = [
  {
    id: "mcu-basic", nama: "MCU Basic", kategori: "MCU",
    deskripsi: "Pemeriksaan kesehatan dasar untuk skrining awal",
    layanan: ["Darah Lengkap (14 parameter)", "Urin Rutin", "Foto Rontgen Thorax", "EKG 12 Lead"],
    harga: 450_000,
  },
  {
    id: "mcu-exec", nama: "MCU Executive", kategori: "MCU", badge: "Populer",
    deskripsi: "Pemeriksaan komprehensif dengan panel organ vital",
    layanan: ["Semua MCU Basic", "Fungsi Hati & Ginjal", "Profil Lipid & Gula Darah", "Hormon Tiroid (TSH/FT4)", "Konsultasi Dokter"],
    harga: 1_200_000,
  },
  {
    id: "mcu-premium", nama: "MCU Premium", kategori: "MCU", badge: "Baru",
    deskripsi: "Paket lengkap termasuk pencitraan dan marker kanker",
    layanan: ["Semua MCU Executive", "Tumor Marker (CEA/AFP/PSA)", "USG Abdomen", "CT Scan Kepala"],
    harga: 2_500_000,
  },
  {
    id: "partus-normal", nama: "Persalinan Normal", kategori: "Persalinan",
    deskripsi: "Persalinan normal dengan bidan dan dokter terlatih",
    layanan: ["Kamar Bersalin", "Tindakan Persalinan Normal", "Rawat Bayi 2 Hari", "Perawatan Nifas 2 Hari"],
    harga: 3_500_000,
  },
  {
    id: "partus-sc", nama: "Sectio Caesaria", kategori: "Persalinan", badge: "Populer",
    deskripsi: "Persalinan SC terencana maupun emergensi",
    layanan: ["Kamar Operasi SC", "Anestesi Spinal", "Rawat Bayi 3 Hari", "Perawatan Pasca SC 3 Hari"],
    harga: 12_000_000,
  },
  {
    id: "partus-wb", nama: "Waterbirth", kategori: "Persalinan", badge: "Baru",
    deskripsi: "Persalinan dalam air yang alami dan minim trauma",
    layanan: ["Kolam Waterbirth Steril", "Bidan & Dokter Terlatih", "Rawat Bayi 2 Hari", "Perawatan Nifas 2 Hari"],
    harga: 5_000_000,
  },
  {
    id: "bedah-minor", nama: "Bedah Minor", kategori: "Bedah",
    deskripsi: "Tindakan operasi kecil dengan anestesi lokal",
    layanan: ["Kamar Operasi Minor", "Anestesi Lokal", "Perawatan Luka", "Obat-obatan Standar"],
    harga: 2_000_000,
  },
  {
    id: "bedah-mayor", nama: "Bedah Mayor", kategori: "Bedah", badge: "Populer",
    deskripsi: "Operasi besar dengan anestesi umum atau spinal",
    layanan: ["Kamar Operasi Utama", "Anestesi Umum / Spinal", "ICU 1 Hari", "Perawatan Pasca Operasi 3 Hari"],
    harga: 8_000_000,
  },
  {
    id: "hd-reguler", nama: "HD Reguler", kategori: "Dialisis",
    deskripsi: "Hemodialisis standar per sesi",
    layanan: ["Mesin HD Standar", "Dializer Single Use", "Pemantauan Perawat", "Pemeriksaan Pre-HD"],
    harga: 850_000,
  },
  {
    id: "hd-premium", nama: "HD Premium", kategori: "Dialisis", badge: "Baru",
    deskripsi: "Hemodialisis high-flux dengan pemantauan intensif",
    layanan: ["Mesin HD High-Flux", "Dializer High-Flux", "Pemantauan Intensif", "Snack & Makan Siang"],
    harga: 1_200_000,
  },
  {
    id: "fisio-10x", nama: "Fisioterapi 10 Sesi", kategori: "Rehabilitasi",
    deskripsi: "Program fisioterapi intensif 10 pertemuan",
    layanan: ["Asesmen Awal Fisioterapi", "10 Sesi Terapi Fisik", "Latihan Mandiri Terpandu", "Evaluasi Akhir"],
    harga: 1_500_000,
  },
  {
    id: "rehab-kompreh", nama: "Rehabilitasi Komprehensif", kategori: "Rehabilitasi", badge: "Populer",
    deskripsi: "Paket rehab medik menyeluruh multi-disiplin",
    layanan: ["Fisioterapi 20 Sesi", "Terapi Okupasi 10 Sesi", "Terapi Wicara 5 Sesi", "Evaluasi Tim Rehabilitasi"],
    harga: 4_500_000,
  },
];

// ─── Helpers ──────────────────────────────────────────────────

export function fmtRp(v: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(v);
}
