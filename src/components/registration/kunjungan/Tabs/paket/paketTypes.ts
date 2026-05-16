// ─── Types ────────────────────────────────────────────────────

export type KelasId          = "kelas-3" | "kelas-2" | "kelas-1" | "vip" | "vvip";
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
  kategori:  Exclude<KategoriPaket, "Semua">;
  deskripsi: string;
  layanan:   string[];
  harga:     number;
  badge?:    BadgePaket;
  aktif?:    boolean;
}

// ─── Kelas rawat data ─────────────────────────────────────────

export const KELAS_RAWAT: KelasRawatData[] = [
  {
    id: "kelas-3", label: "Kelas III", tarif: 250_000,
    bpjsEntitlement: "BPJS PBI / Non-PBI Kelas III",
    amenities: ["AC Sentral", "KM Bersama", "6 TT/Ruang"],
    kapasitas: "6 TT",
  },
  {
    id: "kelas-2", label: "Kelas II", tarif: 450_000,
    bpjsEntitlement: "BPJS Non-PBI Kelas II",
    amenities: ["AC Ruangan", "KM Bersama", "3 TT/Ruang"],
    kapasitas: "3 TT",
  },
  {
    id: "kelas-1", label: "Kelas I", tarif: 750_000,
    bpjsEntitlement: "BPJS Non-PBI Kelas I",
    amenities: ["AC Ruangan", "KM Dalam", "TV", "2 TT/Ruang"],
    kapasitas: "2 TT",
  },
  {
    id: "vip", label: "VIP", tarif: 1_500_000,
    bpjsEntitlement: null,
    amenities: ["AC Inverter", "KM Dalam", "Smart TV", "Kulkas", "Sofa"],
    kapasitas: "1 TT",
  },
  {
    id: "vvip", label: "VVIP", tarif: 3_000_000,
    bpjsEntitlement: null,
    amenities: ["AC Inverter", "KM Premium", "TV 55\"", "Kulkas", "Pantry"],
    kapasitas: "Suite",
  },
];

export const CURRENT_KELAS_DEFAULT: KelasId = "kelas-2";

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
