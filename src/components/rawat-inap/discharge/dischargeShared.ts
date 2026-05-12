export type KondisiPulang =
  | "Sembuh"
  | "Membaik"
  | "Belum Sembuh"
  | "APS"
  | "Rujuk"
  | "Meninggal";

export type HubunganCaregiver =
  | "Suami"
  | "Istri"
  | "Anak"
  | "Orang Tua"
  | "Saudara"
  | "Lainnya";

export type KemampuanCaregiver = "Mampu" | "Perlu Pendampingan" | "Tidak Mampu";
export type MetodeEdukasi      = "Lisan" | "Demonstrasi" | "Leaflet" | "Video";
export type PenerimaEdukasi    = "Pasien" | "Keluarga" | "Keduanya";
export type PemahamanEdukasi   = "Paham" | "Perlu Ulang" | "Tidak Paham";
export type ProfesiEdukasi     = "Perawat" | "Dokter" | "Apoteker" | "Ahli Gizi" | "Fisioterapis";

export type DukunganKeluarga = "Ada & Mampu" | "Ada tapi Terbatas" | "Tidak Ada";
export type KepatuhanObat    = "Patuh" | "Kadang" | "Tidak Patuh";
export type RiwayatReadmisi  = "Tidak" | "1x" | ">1x";
export type RisikoReadmisi   = "RENDAH" | "SEDANG" | "TINGGI";

export const PROFESI_EDUKASI_OPTIONS: ProfesiEdukasi[] = [
  "Perawat", "Dokter", "Apoteker", "Ahli Gizi", "Fisioterapis",
];

// ── Core interfaces ───────────────────────────────────────

export interface JadwalKontrol {
  id:       string;
  tanggal:  string;
  poli:     string;
  dokter:   string;
  catatan:  string;
}

export interface JadwalPemeriksaan {
  id:       string;
  jenis:    "Lab" | "Radiologi";
  nama:     string;
  tanggal:  string;
  catatan:  string;
}

export interface DischargeFollowUp {
  jadwalKontrol:     JadwalKontrol[];
  jadwalPemeriksaan: JadwalPemeriksaan[];
  adaRujukanFKTP:    boolean;
  fktpNama:          string;
  fktpTujuan:        string;
  instruksiKhusus:   string;
}

export interface ObatPulangItem {
  id:        string;
  namaObat:  string;
  dosis:     string;
  frekuensi: string;
  durasi:    string;
  instruksi: string;
  isHAM:     boolean;
  fromResep: boolean;
}

export interface DischargeAsesmen {
  tanggalRencanaKRS:       string;
  kondisiPulang:           KondisiPulang | "";
  caregiverNama:           string;
  caregiverHubungan:       HubunganCaregiver | "";
  caregiverKemampuan:      KemampuanCaregiver | "";
  kebutuhanHomecare:       boolean;
  jenisHomecare:           string[];
  kebutuhanAlatBantu:      boolean;
  alatBantu:               string[];
  dukunganKeluarga:        DukunganKeluarga | "";
  kepatuhanObatSebelumnya: KepatuhanObat | "";
  riwayatReadmisi:         RiwayatReadmisi | "";
  catatan:                 string;
}

export interface EdukasiLog {
  id:        string;
  tanggal:   string;
  petugas:   string;
  profesi:   ProfesiEdukasi;
  metode:    MetodeEdukasi;
  penerima:  PenerimaEdukasi;
  pemahaman: PemahamanEdukasi;
  catatan:   string;
}

export interface EdukasiItem {
  id:       string;
  topik:    string;
  kategori: string;
  logs:     EdukasiLog[];
}

export interface ChecklistItem {
  id:        string;
  label:     string;
  sublabel:  string;
  required:  boolean;
  confirmed: boolean;
  catatan:   string;
}

export interface DischargeChecklist {
  items:         ChecklistItem[];
  catatanKhusus: string;
  confirmedBy:   string;
  confirmedAt:   string;
}

export interface DischargePlanData {
  asesmen:   DischargeAsesmen;
  edukasi:   EdukasiItem[];
  checklist: DischargeChecklist;
}

// ── Step phase config ─────────────────────────────────────

export type PhaseColor = "sky" | "emerald" | "amber";

export const STEP_PHASES: Array<{
  phase: string;
  desc:  string;
  std:   string;
  color: PhaseColor;
}> = [
  {
    phase: "Hari 1–2 MRS",
    desc:  "Dilakukan saat pasien masuk, dalam 24–48 jam pertama",
    std:   "SNARS ARK 5",
    color: "sky",
  },
  {
    phase: "Sepanjang Rawat",
    desc:  "Diberikan bertahap setiap hari perawatan",
    std:   "SNARS HPK 2",
    color: "emerald",
  },
  {
    phase: "H-1 Pulang",
    desc:  "Konfirmasi kesiapan & checklist sehari sebelum kepulangan",
    std:   "SNARS ARK 3",
    color: "amber",
  },
];

// ── Display config ────────────────────────────────────────

export const KONDISI_PULANG_CONFIG: Record<
  KondisiPulang,
  { label: string; badge: string; ring: string; dot: string; sel: string }
> = {
  Sembuh:         { label: "Sembuh",       badge: "bg-emerald-100 text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-500", sel: "border-emerald-400 bg-emerald-50 text-emerald-700" },
  Membaik:        { label: "Membaik",      badge: "bg-sky-100 text-sky-700",         ring: "ring-sky-200",     dot: "bg-sky-500",     sel: "border-sky-400 bg-sky-50 text-sky-700"             },
  "Belum Sembuh": { label: "Belum Sembuh", badge: "bg-amber-100 text-amber-700",     ring: "ring-amber-200",   dot: "bg-amber-500",   sel: "border-amber-400 bg-amber-50 text-amber-700"       },
  APS:            { label: "APS",          badge: "bg-orange-100 text-orange-700",   ring: "ring-orange-200",  dot: "bg-orange-500",  sel: "border-orange-400 bg-orange-50 text-orange-700"     },
  Rujuk:          { label: "Dirujuk",      badge: "bg-violet-100 text-violet-700",   ring: "ring-violet-200",  dot: "bg-violet-500",  sel: "border-violet-400 bg-violet-50 text-violet-700"     },
  Meninggal:      { label: "Meninggal",    badge: "bg-red-100 text-red-700",         ring: "ring-red-200",     dot: "bg-red-500",     sel: "border-red-400 bg-red-50 text-red-700"              },
};

export const KONDISI_PULANG_LIST: KondisiPulang[] = [
  "Sembuh", "Membaik", "Belum Sembuh", "APS", "Rujuk", "Meninggal",
];

export const KEMAMPUAN_CONFIG: Record<KemampuanCaregiver, string> = {
  "Mampu":              "border-emerald-300 bg-emerald-50 text-emerald-700",
  "Perlu Pendampingan": "border-amber-300 bg-amber-50 text-amber-700",
  "Tidak Mampu":        "border-red-300 bg-red-50 text-red-700",
};

export const HOMECARE_OPTIONS = [
  "Perawatan Luka", "Injeksi / Infus", "Monitoring TTV", "Fisioterapi",
  "Nebulisasi", "Ganti Kateter", "NGT Care", "Stoma Care",
];

export const ALAT_BANTU_OPTIONS = [
  "Kursi Roda", "Kruk / Tongkat", "Walker", "Oksigen Konsentrator",
  "Nebulizer", "Tensimeter", "Pulse Oximeter", "Kateter Urine",
];

export const RISIKO_CONFIG: Record<RisikoReadmisi, { bg: string; border: string; text: string; dot: string }> = {
  RENDAH: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  SEDANG: { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   dot: "bg-amber-500"   },
  TINGGI: { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-700",     dot: "bg-red-500"     },
};

export const TOPIK_EDUKASI_TEMPLATE: Array<{ id: string; topik: string; kategori: string }> = [
  { id: "edu-01", topik: "Penjelasan Diagnosis & Perjalanan Penyakit",       kategori: "Medis"         },
  { id: "edu-02", topik: "Tanda Bahaya yang Harus Segera ke RS / IGD",       kategori: "Medis"         },
  { id: "edu-03", topik: "Cara Penggunaan Obat & Kepatuhan Minum Obat",      kategori: "Farmasi"       },
  { id: "edu-04", topik: "Efek Samping Obat yang Perlu Diwaspadai",          kategori: "Farmasi"       },
  { id: "edu-05", topik: "Diet & Nutrisi Sesuai Kondisi",                    kategori: "Nutrisi"       },
  { id: "edu-06", topik: "Restriksi Cairan & Monitoring Berat Badan Harian", kategori: "Nutrisi"       },
  { id: "edu-07", topik: "Aktivitas Fisik yang Aman & Bertahap",             kategori: "Rehabilitasi"  },
  { id: "edu-08", topik: "Perawatan di Rumah (Luka / Alat Bantu)",           kategori: "Keperawatan"   },
  { id: "edu-09", topik: "Jadwal Kontrol, Follow-up & Pemeriksaan",          kategori: "Administratif" },
  { id: "edu-10", topik: "Cara Pemantauan Kondisi di Rumah",                 kategori: "Keperawatan"   },
  { id: "edu-11", topik: "Edukasi Keluarga / Caregiver",                     kategori: "Keperawatan"   },
  { id: "edu-12", topik: "Modifikasi Gaya Hidup (Rokok, Alkohol, Stres)",    kategori: "Preventif"     },
];

export const KATEGORI_COLOR: Record<string, string> = {
  Medis:         "bg-red-100 text-red-700",
  Farmasi:       "bg-violet-100 text-violet-700",
  Nutrisi:       "bg-emerald-100 text-emerald-700",
  Rehabilitasi:  "bg-sky-100 text-sky-700",
  Keperawatan:   "bg-sky-100 text-sky-700",
  Administratif: "bg-amber-100 text-amber-700",
  Preventif:     "bg-teal-100 text-teal-700",
};

export const PEMAHAMAN_CONFIG: Record<PemahamanEdukasi, string> = {
  "Paham":       "bg-emerald-100 text-emerald-700",
  "Perlu Ulang": "bg-amber-100 text-amber-700",
  "Tidak Paham": "bg-red-100 text-red-700",
};

export const PROFESI_COLOR: Record<ProfesiEdukasi, string> = {
  "Perawat":      "bg-sky-100 text-sky-700",
  "Dokter":       "bg-violet-100 text-violet-700",
  "Apoteker":     "bg-emerald-100 text-emerald-700",
  "Ahli Gizi":    "bg-teal-100 text-teal-700",
  "Fisioterapis": "bg-orange-100 text-orange-700",
};

export const CHECKLIST_TEMPLATE: Array<Omit<ChecklistItem, "confirmed" | "catatan">> = [
  { id: "ck-01", label: "Edukasi pasien & keluarga selesai",          sublabel: "Semua topik esensial sudah diberikan dan dipahami",                          required: true  },
  { id: "ck-02", label: "Rekonsiliasi obat final sudah dilakukan",    sublabel: "Daftar obat pulang sudah diverifikasi oleh apoteker / DPJP",                 required: true  },
  { id: "ck-03", label: "Pasien/keluarga memahami tanda bahaya",      sublabel: "Kondisi yang memerlukan kembali ke IGD sudah dijelaskan & dipahami",         required: true  },
  { id: "ck-04", label: "Berkas jaminan / BPJS / asuransi selesai",   sublabel: "Administrasi kepulangan sudah diproses oleh tim kasir",                     required: true  },
  { id: "ck-05", label: "Transportasi pulang sudah disiapkan",        sublabel: "Ambulans / kendaraan keluarga sudah dikonfirmasi dan siap",                 required: true  },
  { id: "ck-06", label: "Resep obat pulang sudah disiapkan",          sublabel: "Resep sudah dikirim ke farmasi dan obat sudah dapat diambil keluarga",      required: true  },
  { id: "ck-07", label: "Kontrol pertama sudah dijadwalkan",          sublabel: "Jadwal kontrol poliklinik sudah diberikan kepada pasien / keluarga",        required: true  },
  { id: "ck-08", label: "Alat bantu / perlengkapan tersedia",         sublabel: "Alat bantu yang dibutuhkan di rumah sudah disiapkan keluarga",              required: false },
  { id: "ck-09", label: "Homecare sudah diarrange",                   sublabel: "Perawatan luka / injeksi / fisioterapi rumah sudah dijadwalkan",            required: false },
  { id: "ck-10", label: "FKTP sudah dihubungi / dirujuk",             sublabel: "Puskesmas / faskes primer sudah mendapat informasi kepulangan pasien",      required: false },
];

// ── Helpers ───────────────────────────────────────────────

export function makeInitialEdukasi(): EdukasiItem[] {
  return TOPIK_EDUKASI_TEMPLATE.map(t => ({ ...t, logs: [] }));
}

export function makeInitialChecklist(): DischargeChecklist {
  return {
    items:         CHECKLIST_TEMPLATE.map(t => ({ ...t, confirmed: false, catatan: "" })),
    catatanKhusus: "",
    confirmedBy:   "",
    confirmedAt:   "",
  };
}

export function getLatestLog(item: EdukasiItem): EdukasiLog | null {
  if (item.logs.length === 0) return null;
  return item.logs.reduce((a, b) => (a.tanggal >= b.tanggal ? a : b));
}

export function calcRisikoReadmisi(d: DischargeAsesmen): RisikoReadmisi | null {
  if (!d.dukunganKeluarga && !d.kepatuhanObatSebelumnya && !d.riwayatReadmisi) return null;
  if (
    d.dukunganKeluarga === "Tidak Ada" ||
    d.kepatuhanObatSebelumnya === "Tidak Patuh" ||
    d.riwayatReadmisi === ">1x"
  ) return "TINGGI";
  if (
    d.dukunganKeluarga === "Ada tapi Terbatas" ||
    d.kepatuhanObatSebelumnya === "Kadang" ||
    d.riwayatReadmisi === "1x"
  ) return "SEDANG";
  return "RENDAH";
}

export function isAsesmenComplete(a: DischargeAsesmen): boolean {
  return a.kondisiPulang !== "" && a.caregiverNama.trim() !== "";
}

export function isEdukasiComplete(items: EdukasiItem[]): boolean {
  return items.some(i => i.logs.length > 0);
}

export function isChecklistComplete(c: DischargeChecklist): boolean {
  return c.items.filter(i => i.required).every(i => i.confirmed);
}

export function calcDischargeReadiness(data: DischargePlanData): number {
  const covered  = data.edukasi.filter(i => i.logs.length > 0).length;
  const eduScore = data.edukasi.length > 0
    ? Math.round((covered / data.edukasi.length) * 34)
    : 0;
  return (
    (isAsesmenComplete(data.asesmen)       ? 33 : 0) +
    eduScore                                         +
    (isChecklistComplete(data.checklist)   ? 33 : 0)
  );
}

export function daysAdmitted(tglMasuk: string): number {
  const BULAN: Record<string, number> = {
    Januari: 0, Februari: 1, Maret: 2, April: 3, Mei: 4, Juni: 5,
    Juli: 6, Agustus: 7, September: 8, Oktober: 9, November: 10, Desember: 11,
  };
  const parts = tglMasuk.split(" ");
  if (parts.length < 3) return 0;
  const d = parseInt(parts[0]), m = BULAN[parts[1]], y = parseInt(parts[2]);
  if (isNaN(d) || m === undefined || isNaN(y)) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(y, m, d).getTime()) / 86400000));
}

// ── Mock data ─────────────────────────────────────────────

function makeMockEdukasiRM2025003(): EdukasiItem[] {
  const items = makeInitialEdukasi();
  const patch = (id: string, logs: EdukasiLog[]) => {
    const item = items.find(i => i.id === id);
    if (item) item.logs = logs;
  };

  patch("edu-01", [
    {
      id: "log-01a", tanggal: "2026-05-05", petugas: "dr. Budi Santoso Sp.JP", profesi: "Dokter",
      metode: "Lisan", penerima: "Pasien", pemahaman: "Perlu Ulang",
      catatan: "Penjelasan awal GJK. Pasien masih sesak, pemahaman terbatas.",
    },
    {
      id: "log-01b", tanggal: "2026-05-09", petugas: "dr. Budi Santoso Sp.JP", profesi: "Dokter",
      metode: "Lisan", penerima: "Keduanya", pemahaman: "Paham",
      catatan: "Penjelasan ulang lengkap kepada pasien dan anak (Budi Fauzi). Semua pertanyaan terjawab.",
    },
  ]);
  patch("edu-02", [
    {
      id: "log-02a", tanggal: "2026-05-10", petugas: "Ns. Dewi Rahayu, S.Kep", profesi: "Perawat",
      metode: "Leaflet", penerima: "Keduanya", pemahaman: "Paham",
      catatan: "Tanda bahaya: sesak mendadak, BB naik >2kg/3hari, kaki bengkak.",
    },
  ]);
  patch("edu-03", [
    {
      id: "log-03a", tanggal: "2026-05-07", petugas: "apt. Rina Sari, S.Farm", profesi: "Apoteker",
      metode: "Demonstrasi", penerima: "Keduanya", pemahaman: "Paham",
      catatan: "Penjelasan Bisoprolol (HAM), Candesartan, Furosemide, Spironolactone.",
    },
  ]);
  patch("edu-05", [
    {
      id: "log-05a", tanggal: "2026-05-08", petugas: "dr. Anisa Putri, Sp.GK", profesi: "Ahli Gizi",
      metode: "Leaflet", penerima: "Keduanya", pemahaman: "Paham",
      catatan: "Diet Jantung III 1.700 kkal, Na <2g/hari, restriksi cairan 1.500 ml/hari.",
    },
  ]);
  patch("edu-07", [
    {
      id: "log-07a", tanggal: "2026-05-10", petugas: "Bambang Setiawan, AMF", profesi: "Fisioterapis",
      metode: "Demonstrasi", penerima: "Pasien", pemahaman: "Perlu Ulang",
      catatan: "Cardiac Rehab Fase I: teknik napas, latihan duduk di bed.",
    },
  ]);

  return items;
}

export const DISCHARGE_MOCK: Record<string, DischargePlanData> = {
  "RM-2025-003": {
    asesmen: {
      tanggalRencanaKRS:       "2026-05-12",
      kondisiPulang:           "Membaik",
      caregiverNama:           "Budi Fauzi",
      caregiverHubungan:       "Anak",
      caregiverKemampuan:      "Mampu",
      kebutuhanHomecare:       false,
      jenisHomecare:           [],
      kebutuhanAlatBantu:      true,
      alatBantu:               ["Tensimeter", "Pulse Oximeter"],
      dukunganKeluarga:        "Ada & Mampu",
      kepatuhanObatSebelumnya: "Kadang",
      riwayatReadmisi:         "1x",
      catatan:                 "Pasien tinggal di rumah 1 lantai. Anak (Budi Fauzi) mampu merawat secara mandiri.",
    },
    edukasi: makeMockEdukasiRM2025003(),
    checklist: {
      items: CHECKLIST_TEMPLATE.map(t => ({
        ...t,
        confirmed: ["ck-01", "ck-02", "ck-03"].includes(t.id),
        catatan:   "",
      })),
      catatanKhusus: "Pasien dan keluarga sudah memahami kondisi dan rencana pulang.",
      confirmedBy:   "",
      confirmedAt:   "",
    },
  },
};
