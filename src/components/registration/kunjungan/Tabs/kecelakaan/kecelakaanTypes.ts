// ─── Types ────────────────────────────────────────────────────

export type JenisKecelakaan = "kll" | "kerja" | "lainnya";

export type StatusKlaim       = "belum" | "proses" | "selesai" | "ditolak";
export type StatusLP          = "belum" | "proses" | "ada";
export type StatusKoordinasiJR = "belum" | "dijadwalkan" | "verifikasi";

export interface KendaraanItem {
  jenis: string;
  noPol: string;
  peran: "Korban" | "Pelaku" | "Keterlibatan";
}

export interface KecelakaanDraft {
  jenis:            JenisKecelakaan;
  tanggal:          string;
  waktu:            string;
  provinsi:         string;
  lokasi:           string;
  kronologi:        string;
  mekanismeTrauma:  string;
  // KLL
  statusLP:           StatusLP;
  noLapPol:           string;
  satuanPolisi:       string;
  kendaraan:          KendaraanItem[];
  penjaminLanjutan:   string;
  statusKoordinasiJR: StatusKoordinasiJR;
  // KK
  namaPerusahaan:   string;
  noKpj:            string;
  jenisPekerjaan:   string;
  lokasiKerja:      string;
  // Status klaim
  statusKlaim:      StatusKlaim;
  nomorKlaim:       string;
}

export const BLANK_DRAFT: KecelakaanDraft = {
  jenis:           "kll",
  tanggal:         "",
  waktu:           "",
  provinsi:        "",
  lokasi:          "",
  kronologi:       "",
  mekanismeTrauma: "",
  statusLP:           "belum",
  noLapPol:           "",
  satuanPolisi:       "",
  kendaraan:          [],
  penjaminLanjutan:   "",
  statusKoordinasiJR: "belum",
  namaPerusahaan:  "",
  noKpj:           "",
  jenisPekerjaan:  "",
  lokasiKerja:     "",
  statusKlaim:     "belum",
  nomorKlaim:      "",
};

// ─── KLL constants ────────────────────────────────────────────

export const JENIS_KENDARAAN = [
  "Sepeda Motor",
  "Mobil / MPV / SUV",
  "Truk / Pickup",
  "Bus / Angkutan Umum",
  "Sepeda",
  "Kendaraan Berat",
  "Pejalan Kaki",
  "Lainnya",
] as const;

export const MEKANISME_KLL = [
  "Tabrakan depan",
  "Tabrakan belakang",
  "Tabrakan samping",
  "Terserempet",
  "Terlempar dari kendaraan",
  "Terjatuh dari kendaraan",
  "Tertabrak (pejalan kaki)",
  "Lainnya",
] as const;

// ─── KK constants ─────────────────────────────────────────────

export const JENIS_PEKERJAAN = [
  "Teknisi / Mekanik",
  "Operator Mesin",
  "Buruh Pabrik",
  "Konstruksi / Bangunan",
  "Pengemudi / Sopir",
  "Pertanian / Perkebunan",
  "Pertambangan",
  "Perikanan / Kelautan",
  "Keamanan / Security",
  "Kesehatan / Medis",
  "Lainnya",
] as const;

export const MEKANISME_KK = [
  "Terjatuh dari ketinggian",
  "Tertimpa / terjepit benda",
  "Kontak bahan kimia berbahaya",
  "Kontak arus listrik",
  "Luka sayat / tusuk alat kerja",
  "Kebakaran / paparan panas",
  "Ledakan",
  "Penyakit akibat kerja (PAK)",
  "Lainnya",
] as const;

// ─── Shared constants ─────────────────────────────────────────

export const PROVINSI_LIST = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau",
  "Jambi", "Sumatera Selatan", "Kepulauan Bangka Belitung", "Bengkulu", "Lampung",
  "DKI Jakarta", "Jawa Barat", "Banten", "Jawa Tengah", "DI Yogyakarta",
  "Jawa Timur", "Bali", "Nusa Tenggara Barat", "Nusa Tenggara Timur",
  "Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan",
  "Kalimantan Timur", "Kalimantan Utara",
  "Sulawesi Utara", "Gorontalo", "Sulawesi Tengah", "Sulawesi Barat",
  "Sulawesi Selatan", "Sulawesi Tenggara",
  "Maluku", "Maluku Utara", "Papua Barat", "Papua",
] as const;

// ─── Status config ────────────────────────────────────────────

export type StatusConfig = {
  label: string;
  chipCls: string;
  dot: string;
};

export type LPConfig = { label: string; chipCls: string; dot: string };

export const STATUS_LP_CONFIG: Record<StatusLP, LPConfig> = {
  belum:  { label: "Belum Ada",        chipCls: "border-slate-200 bg-slate-50 text-slate-600",        dot: "bg-slate-400"   },
  proses: { label: "Sedang Diproses",  chipCls: "border-amber-200 bg-amber-50 text-amber-700",        dot: "bg-amber-400"   },
  ada:    { label: "Sudah Ada",        chipCls: "border-emerald-200 bg-emerald-50 text-emerald-700",  dot: "bg-emerald-500" },
};

export type JRConfig = { label: string; chipCls: string; dot: string };

export const STATUS_JR_CONFIG: Record<StatusKoordinasiJR, JRConfig> = {
  belum:       { label: "Belum Dihubungi",     chipCls: "border-slate-200 bg-slate-50 text-slate-600",        dot: "bg-slate-400"   },
  dijadwalkan: { label: "Surveyor Dijadwalkan", chipCls: "border-amber-200 bg-amber-50 text-amber-700",        dot: "bg-amber-400"   },
  verifikasi:  { label: "Sudah Diverifikasi",   chipCls: "border-emerald-200 bg-emerald-50 text-emerald-700",  dot: "bg-emerald-500" },
};

export const STATUS_CONFIG: Record<StatusKlaim, StatusConfig> = {
  belum:   { label: "Belum Dilaporkan", chipCls: "border-slate-200 bg-slate-50 text-slate-600",       dot: "bg-slate-400"    },
  proses:  { label: "Dalam Proses",     chipCls: "border-amber-200 bg-amber-50 text-amber-700",       dot: "bg-amber-400"    },
  selesai: { label: "Klaim Selesai",    chipCls: "border-emerald-200 bg-emerald-50 text-emerald-700", dot: "bg-emerald-400"  },
  ditolak: { label: "Klaim Ditolak",    chipCls: "border-rose-200 bg-rose-50 text-rose-700",           dot: "bg-rose-400"     },
};
