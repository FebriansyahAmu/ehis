/**
 * RS Profil Store — extended type + mutable initial state.
 *
 * Source-of-truth untuk identitas, shift config, dan KOP surat RS.
 * Extends rsConfig.ts (yang tetap dipakai ruanganShared sebagai RS root seed).
 *
 * Shift config di sini adalah sumber resmi — SHIFT_CFG di ppiIsolasiShared.ts
 * dan marShared.ts masih hardcode (migrasi ke sini: future task).
 *
 * Saat DB ready: ganti RS_PROFIL_INITIAL dengan Prisma query + Server Action.
 */

export type KelasRS       = "A" | "B" | "C" | "D" | "D Pratama";
export type TipeRS        = "RSUD" | "RSU" | "RS Khusus" | "RSIA" | "Klinik";
export type KepemilikanRS = "Pemerintah Pusat" | "Pemerintah Daerah" | "TNI/Polri" | "Swasta Nasional" | "BUMN";
export type LembagaAkred  = "KARS" | "JCI" | "Proses" | "Belum";
export type ShiftKey      = "Pagi" | "Siang" | "Malam";

export const SHIFT_KEYS: ShiftKey[] = ["Pagi", "Siang", "Malam"];

export interface ShiftJam {
  mulai:   string; // "HH:mm"
  selesai: string; // "HH:mm"
}

export interface RSAlamat {
  jalan:       string;
  kelurahan:   string;
  kecamatan:   string;
  kota:        string;
  provinsi:    string;
  kodePos:     string;
  kodeWilayah: string;
}

export interface RSAkreditasi {
  lembaga:          LembagaAkred;
  sertifikatNo?:    string;
  tanggalMulai?:    string;
  tanggalBerakhir?: string;
  paripurna:        boolean;
  nomorIzin:        string;
  tanggalIzin?:     string;
}

export interface RSKop {
  subtitle?:   string;
  alamatKop?:  string;
  namaKepala?: string;
  nipKepala?:  string;
}

export interface RSProfil {
  nama:         string;
  namaInggris?: string;
  kode:         string;
  kelas:        KelasRS;
  tipe:         TipeRS;
  kepemilikan:  KepemilikanRS;
  telp:         string;
  fax?:         string;
  email:        string;
  website?:     string;
  alamat:       RSAlamat;
  akreditasi:   RSAkreditasi;
  shift:        Record<ShiftKey, ShiftJam>;
  kop:          RSKop;
}

// ── Shift helpers (single source of truth) ───────────────
//
// Berbasis `RS_PROFIL.shift` (jam mulai/selesai per shift). Dipakai oleh
// ppiIsolasiShared.currentShift() dan ioShared.detectShift() — bukan
// hardcoded di tiap file.

/** Parse "HH:mm" ke menit-dari-tengah-malam. */
function parseHHmm(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Tentukan shift berdasarkan menit-dari-tengah-malam (0–1439).
 * Shift malam bisa wrap (mis. 22:00–06:59) — di-handle dengan kondisi melintas
 * tengah malam.
 */
export function detectShiftFromMinute(minute: number, shifts: Record<ShiftKey, ShiftJam>): ShiftKey {
  for (const key of SHIFT_KEYS) {
    const s = shifts[key];
    const start = parseHHmm(s.mulai);
    const end   = parseHHmm(s.selesai);
    if (start <= end) {
      if (minute >= start && minute <= end) return key;
    } else {
      // Wrap (mis. 22:00–06:59)
      if (minute >= start || minute <= end) return key;
    }
  }
  return "Pagi"; // safe fallback
}

/** Tentukan shift sekarang dari sistem clock + jam RS profil. */
export function getCurrentShift(shifts: Record<ShiftKey, ShiftJam> = RS_PROFIL_INITIAL.shift): ShiftKey {
  const now = new Date();
  return detectShiftFromMinute(now.getHours() * 60 + now.getMinutes(), shifts);
}

/** Tentukan shift dari string jam "HH:mm". */
export function detectShiftFromJam(jam: string, shifts: Record<ShiftKey, ShiftJam> = RS_PROFIL_INITIAL.shift): ShiftKey {
  return detectShiftFromMinute(parseHHmm(jam), shifts);
}

export const RS_PROFIL_INITIAL: RSProfil = {
  nama:        "RS Harapan Sehat",
  namaInggris: "Harapan Sehat Hospital",
  kode:        "RSHS",
  kelas:       "B",
  tipe:        "RSUD",
  kepemilikan: "Pemerintah Daerah",
  telp:        "021-555-0000",
  fax:         "021-555-0001",
  email:       "info@rsharapansehat.id",
  website:     "www.rsharapansehat.id",
  alamat: {
    jalan:       "Jl. Harapan Sehat No. 1",
    kelurahan:   "Kebon Sirih",
    kecamatan:   "Menteng",
    kota:        "Jakarta Pusat",
    provinsi:    "DKI Jakarta",
    kodePos:     "10340",
    kodeWilayah: "3171010001",
  },
  akreditasi: {
    lembaga:         "KARS",
    sertifikatNo:    "KARS-SERT/687/VI/2024",
    tanggalMulai:    "2024-06-01",
    tanggalBerakhir: "2027-06-01",
    paripurna:       true,
    nomorIzin:       "HK.02.03/I/0734/2020",
    tanggalIzin:     "2020-03-15",
  },
  shift: {
    Pagi:  { mulai: "07:00", selesai: "14:59" },
    Siang: { mulai: "15:00", selesai: "21:59" },
    Malam: { mulai: "22:00", selesai: "06:59" },
  },
  kop: {
    subtitle:   "TERAKREDITASI PARIPURNA",
    alamatKop:  "Jl. Harapan Sehat No. 1, Menteng, Jakarta Pusat 10340",
    namaKepala: "dr. Siti Aminah, MARS",
    nipKepala:  "197605152003122001",
  },
};
