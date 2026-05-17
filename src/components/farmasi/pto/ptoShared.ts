// PTO — Pemantauan Terapi Obat · PMK 72/2016 Ps. 30–32 · SNARS PKPO 7

export type PTOStatus      = "Normal" | "Rendah" | "Tinggi" | "Kritis";
export type MonitoringTipe = "Lab" | "Tanda Vital" | "Klinis";

export interface PTOParameter {
  id:         string;
  nama:       string;
  satuan:     string;
  targetMin?: number;
  targetMax?: number;
  frekuensi:  string;
  tipe:       MonitoringTipe;
}

export interface PTOObservasi {
  id:           string;
  paramId:      string;
  tanggal:      string;
  nilai:        number;
  status:       PTOStatus;
  catatan?:     string;
  rekomendasi?: string;
  apoteker:     string;
}

export interface PTOEntry {
  id:           string;
  resepItemId:  string;
  namaObat:     string;
  isHAM:        boolean;
  parameter:    PTOParameter[];
  observasi:    PTOObservasi[];
}

// ── Drug → parameter templates ────────────────────────────

type ParamTpl = Omit<PTOParameter, "id">;

const TEMPLATES: { kw: string[]; params: ParamTpl[] }[] = [
  {
    kw: ["heparin"],
    params: [{ nama: "aPTT", satuan: "detik", targetMin: 60, targetMax: 100, frekuensi: "Setiap 4–6 jam", tipe: "Lab" }],
  },
  {
    kw: ["warfarin"],
    params: [{ nama: "INR", satuan: "ratio", targetMin: 2.0, targetMax: 3.0, frekuensi: "Setiap 3 hari", tipe: "Lab" }],
  },
  {
    kw: ["furosemide", "furosemid"],
    params: [
      { nama: "Kalium (K⁺)", satuan: "mEq/L", targetMin: 3.5, targetMax: 5.0, frekuensi: "Setiap 2–3 hari", tipe: "Lab" },
      { nama: "Kreatinin",   satuan: "mg/dL",  targetMin: 0.6, targetMax: 1.3, frekuensi: "Setiap minggu",   tipe: "Lab" },
    ],
  },
  {
    kw: ["ksr", "kcl", "kalium klorid"],
    params: [{ nama: "Kalium (K⁺)", satuan: "mEq/L", targetMin: 3.5, targetMax: 5.0, frekuensi: "Setiap 2–3 hari", tipe: "Lab" }],
  },
  {
    kw: ["spironolakton", "spironolactone"],
    params: [
      { nama: "Kalium (K⁺)", satuan: "mEq/L", targetMin: 3.5, targetMax: 5.0, frekuensi: "Setiap minggu", tipe: "Lab" },
      { nama: "Kreatinin",   satuan: "mg/dL",  targetMin: 0.6, targetMax: 1.3, frekuensi: "Setiap minggu", tipe: "Lab" },
    ],
  },
  {
    kw: ["bisoprolol", "carvedilol", "metoprolol", "atenolol"],
    params: [
      { nama: "Nadi",      satuan: "bpm",  targetMin: 60,  targetMax: 100, frekuensi: "Harian", tipe: "Tanda Vital" },
      { nama: "TD Sistol", satuan: "mmHg", targetMin: 90,  targetMax: 130, frekuensi: "Harian", tipe: "Tanda Vital" },
    ],
  },
  {
    kw: ["captopril", "lisinopril", "enalapril", "ramipril"],
    params: [
      { nama: "Kreatinin",   satuan: "mg/dL",  targetMin: 0.6, targetMax: 1.3, frekuensi: "2× seminggu",   tipe: "Lab" },
      { nama: "Kalium (K⁺)", satuan: "mEq/L",  targetMin: 3.5, targetMax: 5.0, frekuensi: "Setiap minggu", tipe: "Lab" },
    ],
  },
  {
    kw: ["digoksin", "digoxin"],
    params: [
      { nama: "Kadar Digoksin", satuan: "ng/mL", targetMin: 0.5, targetMax: 2.0, frekuensi: "Setiap minggu", tipe: "Lab"        },
      { nama: "Nadi",           satuan: "bpm",    targetMin: 60,  targetMax: 100, frekuensi: "Harian",        tipe: "Tanda Vital" },
    ],
  },
  {
    kw: ["gentamisin", "gentamicin", "amikasin", "amikacin"],
    params: [
      { nama: "Kreatinin",    satuan: "mg/dL",   targetMin: 0.6, targetMax: 1.3, frekuensi: "2× seminggu",        tipe: "Lab" },
      { nama: "Trough Level", satuan: "mcg/mL",  targetMin: 0.5, targetMax: 2.0, frekuensi: "Setelah dosis ke-3", tipe: "Lab" },
    ],
  },
  {
    kw: ["vancomycin", "vankomisin"],
    params: [
      { nama: "Kreatinin",    satuan: "mg/dL",  targetMin: 0.6, targetMax: 1.3, frekuensi: "Setiap 48 jam",      tipe: "Lab" },
      { nama: "Trough Level", satuan: "mcg/mL", targetMin: 15,  targetMax: 20,  frekuensi: "Setelah dosis ke-4", tipe: "Lab" },
    ],
  },
  {
    kw: ["meropenem", "imipenem", "ertapenem"],
    params: [
      { nama: "Kreatinin", satuan: "mg/dL", targetMin: 0.6, targetMax: 1.3, frekuensi: "Setiap 24 jam (AKI aktif)", tipe: "Lab" },
    ],
  },
  {
    kw: ["norepinefrin", "norepinephrine", "dobutamin", "dobutamine", "dopamin", "dopamine", "epinefrin", "epinephrine"],
    params: [
      { nama: "MAP",  satuan: "mmHg", targetMin: 65, targetMax: 90,  frekuensi: "Setiap 1 jam (ICU)", tipe: "Tanda Vital" },
      { nama: "Nadi", satuan: "bpm",  targetMin: 60, targetMax: 100, frekuensi: "Setiap jam",          tipe: "Tanda Vital" },
    ],
  },
  {
    kw: ["midazolam", "propofol", "fentanil", "fentanyl"],
    params: [
      { nama: "RASS Score", satuan: "skor", targetMin: -3, targetMax: -1, frekuensi: "Setiap 4 jam", tipe: "Klinis" },
    ],
  },
];

let _seed = 0;
function pid() { return `pp-${++_seed}`; }

export function getParamsForDrug(namaObat: string): PTOParameter[] {
  const low = namaObat.toLowerCase();
  for (const t of TEMPLATES) {
    if (t.kw.some((kw) => low.includes(kw))) return t.params.map((p) => ({ ...p, id: pid() }));
  }
  return [];
}

export function calcPTOStatus(nilai: number, min?: number, max?: number): PTOStatus {
  if (min !== undefined && nilai < min * 0.8) return "Kritis";
  if (max !== undefined && nilai > max * 1.3) return "Kritis";
  if (min !== undefined && nilai < min)       return "Rendah";
  if (max !== undefined && nilai > max)       return "Tinggi";
  return "Normal";
}

export const PTO_STATUS_CFG: Record<PTOStatus, { label: string; dot: string; badge: string; row: string }> = {
  Normal: { label: "Normal", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", row: ""              },
  Rendah: { label: "Rendah", dot: "bg-amber-500",   badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",       row: "bg-amber-50/40"  },
  Tinggi: { label: "Tinggi", dot: "bg-orange-500",  badge: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",    row: "bg-orange-50/40" },
  Kritis: { label: "Kritis", dot: "bg-rose-500",    badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",          row: "bg-rose-50/50"   },
};

export const TIPE_CLS: Record<MonitoringTipe, string> = {
  Lab:           "text-violet-600",
  "Tanda Vital": "text-sky-600",
  Klinis:        "text-teal-600",
};

// ── Mock data ─────────────────────────────────────────────
// Item IDs match ORDERS_MOCK in daftarOrderShared.ts

export const PTO_MOCK: PTOEntry[] = [

  // ── RM-2025-003 · Ahmad Fauzi · GJK NYHA III ─────────────────

  // rr-1: Furosemide 80mg (ri-rx-h7a — eskalasi dosis)
  {
    id: "pto-1", resepItemId: "rr-1", namaObat: "Furosemide 80mg Injeksi", isHAM: false,
    parameter: [
      { id: "pp-f1", nama: "Kalium (K⁺)", satuan: "mEq/L", targetMin: 3.5, targetMax: 5.0, frekuensi: "Setiap 2–3 hari", tipe: "Lab" },
      { id: "pp-f2", nama: "Kreatinin",   satuan: "mg/dL",  targetMin: 0.6, targetMax: 1.3, frekuensi: "Setiap minggu",   tipe: "Lab" },
    ],
    observasi: [
      { id: "of1", paramId: "pp-f1", tanggal: "2026-05-08", nilai: 3.1, status: "Rendah", catatan: "Hipokalemia ringan — mulai Furosemide 40mg. Tambah KSR.", rekomendasi: "KSR 600mg 3×1; monitor K+ tiap 2 hari", apoteker: "Apt. Rina S.Farm." },
      { id: "of2", paramId: "pp-f1", tanggal: "2026-05-10", nilai: 3.4, status: "Rendah", rekomendasi: "Membaik; lanjutkan KSR dosis saat ini", apoteker: "Apt. Rina S.Farm." },
      { id: "of3", paramId: "pp-f1", tanggal: "2026-05-12", nilai: 3.6, status: "Normal", catatan: "K+ dalam rentang normal", apoteker: "Apt. Dewi S.Farm." },
      { id: "of4", paramId: "pp-f1", tanggal: "2026-05-14", nilai: 3.2, status: "Rendah", catatan: "Turun lagi setelah eskalasi ke 80mg", rekomendasi: "Tingkatkan KSR; pertimbangkan Spironolakton bila K+ <3.5 lagi", apoteker: "Apt. Dewi S.Farm." },
      { id: "of5", paramId: "pp-f2", tanggal: "2026-05-08", nilai: 1.1, status: "Normal", apoteker: "Apt. Rina S.Farm." },
      { id: "of6", paramId: "pp-f2", tanggal: "2026-05-12", nilai: 1.4, status: "Tinggi", catatan: "Mild AKI — eskalasi dosis memperburuk fungsi ginjal sedikit", rekomendasi: "Pantau ketat; hindari NSAID. Cek volume status", apoteker: "Apt. Dewi S.Farm." },
    ],
  },

  // rr-2: KCl 25 mEq Addmix (ri-rx-h7a — koreksi hipokalemia berat)
  {
    id: "pto-2", resepItemId: "rr-2", namaObat: "KCl 25 mEq (Addmix NaCl 0.9%)", isHAM: true,
    parameter: [
      { id: "pp-k2", nama: "Kalium (K⁺)", satuan: "mEq/L", targetMin: 3.5, targetMax: 5.0, frekuensi: "Setiap 6 jam selama koreksi IV", tipe: "Lab" },
    ],
    observasi: [
      { id: "ok1", paramId: "pp-k2", tanggal: "2026-05-14", nilai: 3.2, status: "Rendah", catatan: "Indikasi KCl IV: K+ 3.2 setelah eskalasi Furosemide 80mg", rekomendasi: "Koreksi KCl 25mEq/500mL NaCl 0.9%; target K+ ≥3.5 dalam 12 jam. Pantau EKG", apoteker: "Apt. Dewi S.Farm." },
    ],
  },

  // rr-4: Bisoprolol 2.5mg (ri-rx-h6a)
  {
    id: "pto-3", resepItemId: "rr-4", namaObat: "Bisoprolol 2,5mg", isHAM: false,
    parameter: [
      { id: "pp-b1", nama: "Nadi",      satuan: "bpm",  targetMin: 60, targetMax: 100, frekuensi: "Harian", tipe: "Tanda Vital" },
      { id: "pp-b2", nama: "TD Sistol", satuan: "mmHg", targetMin: 90, targetMax: 130, frekuensi: "Harian", tipe: "Tanda Vital" },
    ],
    observasi: [
      { id: "ob1", paramId: "pp-b1", tanggal: "2026-05-08", nilai: 96, status: "Normal", catatan: "Awal terapi Bisoprolol 2.5mg. Target HR <70 bpm untuk GJK", rekomendasi: "Masih di atas target HR <70 bpm; titrasi ke 5mg setelah 2 minggu bila TD memungkinkan", apoteker: "Apt. Rina S.Farm." },
      { id: "ob2", paramId: "pp-b1", tanggal: "2026-05-10", nilai: 88, status: "Normal", apoteker: "Apt. Rina S.Farm." },
      { id: "ob3", paramId: "pp-b1", tanggal: "2026-05-12", nilai: 82, status: "Normal", catatan: "Tren membaik, HR mendekati target", apoteker: "Apt. Dewi S.Farm." },
      { id: "ob4", paramId: "pp-b2", tanggal: "2026-05-08", nilai: 118, status: "Normal", apoteker: "Apt. Rina S.Farm." },
      { id: "ob5", paramId: "pp-b2", tanggal: "2026-05-12", nilai: 112, status: "Normal", apoteker: "Apt. Dewi S.Farm." },
    ],
  },

  // ── RM-2025-007 · Hasan Basri · Sepsis + ARDS (ICU) ─────────

  // icu-rr-1: Norepinephrine (icu-rx-h3a — lanjut hari ke-3)
  {
    id: "pto-4", resepItemId: "icu-rr-1", namaObat: "Norepinephrine 4mg/4mL", isHAM: true,
    parameter: [
      { id: "pp-m1", nama: "MAP",  satuan: "mmHg", targetMin: 65, targetMax: 90,  frekuensi: "Setiap 1 jam (ICU)", tipe: "Tanda Vital" },
      { id: "pp-m2", nama: "Nadi", satuan: "bpm",  targetMin: 60, targetMax: 100, frekuensi: "Setiap jam",          tipe: "Tanda Vital" },
    ],
    observasi: [
      { id: "om1", paramId: "pp-m1", tanggal: "2025-05-05", nilai: 52,  status: "Kritis", catatan: "Syok septik berat — NE 0.1 mcg/kgBB/mnt. MAP jauh di bawah target",         rekomendasi: "Titrasi NE naik; pastikan akses CVC berfungsi baik", apoteker: "Apt. Sari S.Farm." },
      { id: "om2", paramId: "pp-m1", tanggal: "2025-05-06", nilai: 62,  status: "Rendah", catatan: "NE dititrasi ke 0.15 mcg/kgBB/mnt",                                         rekomendasi: "Lanjut titrasi bertahap; cek laktat ulang tiap 6 jam", apoteker: "Apt. Sari S.Farm." },
      { id: "om3", paramId: "pp-m1", tanggal: "2025-05-07", nilai: 73,  status: "Normal", catatan: "MAP mencapai target — NE mulai weaning ke 0.1 mcg/kgBB/mnt",                 apoteker: "Apt. Sari S.Farm." },
      { id: "om4", paramId: "pp-m1", tanggal: "2025-05-08", nilai: 78,  status: "Normal", rekomendasi: "Pertahankan NE; pertimbangkan weaning bertahap bila MAP stabil >24 jam", apoteker: "Apt. Sari S.Farm." },
      { id: "om5", paramId: "pp-m2", tanggal: "2025-05-05", nilai: 128, status: "Tinggi", catatan: "Takikardia sinus kompensatorik (syok septik)", rekomendasi: "Monitor irama EKG kontinu; tidak ada indikasi antiaritmia saat ini", apoteker: "Apt. Sari S.Farm." },
      { id: "om6", paramId: "pp-m2", tanggal: "2025-05-06", nilai: 122, status: "Tinggi", apoteker: "Apt. Sari S.Farm." },
      { id: "om7", paramId: "pp-m2", tanggal: "2025-05-07", nilai: 112, status: "Tinggi", catatan: "Membaik seiring stabilisasi hemodinamik", apoteker: "Apt. Sari S.Farm." },
      { id: "om8", paramId: "pp-m2", tanggal: "2025-05-08", nilai: 98,  status: "Normal", rekomendasi: "HR dalam target; lanjut monitoring", apoteker: "Apt. Sari S.Farm." },
    ],
  },

  // icu-rr-2: Meropenem 1g (icu-rx-h3a — dosis disesuaikan AKI)
  {
    id: "pto-5", resepItemId: "icu-rr-2", namaObat: "Meropenem 1g Inj", isHAM: false,
    parameter: [
      { id: "pp-c1", nama: "Kreatinin", satuan: "mg/dL", targetMin: 0.6, targetMax: 1.3, frekuensi: "Setiap 24 jam (AKI aktif)", tipe: "Lab" },
    ],
    observasi: [
      { id: "oc1", paramId: "pp-c1", tanggal: "2025-05-05", nilai: 1.8, status: "Kritis", catatan: "AKI Stad. I saat masuk. Meropenem q8h→q12h disesuaikan",             rekomendasi: "Interval q12h (GFR est. 28 mL/mnt). Pantau diuresis ketat", apoteker: "Apt. Sari S.Farm." },
      { id: "oc2", paramId: "pp-c1", tanggal: "2025-05-06", nilai: 2.8, status: "Kritis", catatan: "Progresi ke AKI Stad. II — kombinasi Vancomycin + Meropenem dicurigai", rekomendasi: "Review nefrotoksin lain; pertimbangkan penghentian Vancomycin bila kultur sudah ada", apoteker: "Apt. Sari S.Farm." },
      { id: "oc3", paramId: "pp-c1", tanggal: "2025-05-07", nilai: 3.2, status: "Kritis", catatan: "AKI Stad. III — konsul nefrologi untuk kemungkinan CRRT",              rekomendasi: "Hentikan Vancomycin; lanjut Meropenem q12h; target UO ≥0.5 mL/kgBB/jam", apoteker: "Apt. Sari S.Farm." },
      { id: "oc4", paramId: "pp-c1", tanggal: "2025-05-08", nilai: 2.9, status: "Kritis", catatan: "Sedikit membaik setelah Vancomycin dihentikan",                          rekomendasi: "Lanjut Meropenem q12h; pantau kreatinin tiap 24 jam", apoteker: "Apt. Sari S.Farm." },
    ],
  },

  // icu-rr-7: Vancomycin (icu-rx-h1a — order awal, kultur pending)
  {
    id: "pto-6", resepItemId: "icu-rr-7", namaObat: "Vancomycin 1g Inj", isHAM: false,
    parameter: [
      { id: "pp-v1", nama: "Kreatinin",    satuan: "mg/dL",  targetMin: 0.6, targetMax: 1.3, frekuensi: "Setiap 48 jam",      tipe: "Lab" },
      { id: "pp-v2", nama: "Trough Level", satuan: "mcg/mL", targetMin: 15,  targetMax: 20,  frekuensi: "Setelah dosis ke-4", tipe: "Lab" },
    ],
    observasi: [
      { id: "ov1", paramId: "pp-v1", tanggal: "2025-05-05", nilai: 1.8, status: "Kritis", catatan: "AKI Stad. I saat Vancomycin dimulai",                                    rekomendasi: "Monitor kreatinin tiap 48 jam; cek trough setelah dosis ke-4", apoteker: "Apt. Sari S.Farm." },
      { id: "ov2", paramId: "pp-v1", tanggal: "2025-05-07", nilai: 3.2, status: "Kritis", catatan: "Progresi AKI — VMAN (Vancomycin-Meropenem Assoc. Nephrotoxicity) dicurigai", rekomendasi: "HENTIKAN Vancomycin. Kultur Klebsiella sensitif Meropenem → Vancomycin tidak diperlukan", apoteker: "Apt. Sari S.Farm." },
      { id: "ov3", paramId: "pp-v2", tanggal: "2025-05-07", nilai: 28.5, status: "Tinggi", catatan: "Trough >20 — akumulasi akibat AKI berat",                               rekomendasi: "Konfirmasi penghentian; tidak perlu re-dosing", apoteker: "Apt. Sari S.Farm." },
    ],
  },
];

export function getPTOForItems(itemIds: string[]): PTOEntry[] {
  return PTO_MOCK.filter((e) => itemIds.includes(e.resepItemId));
}
