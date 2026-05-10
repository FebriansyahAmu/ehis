export type KondisiPulang =
  | "Sembuh" | "Membaik" | "Belum Sembuh" | "APS" | "Rujuk" | "Meninggal";

export type HubunganCaregiver =
  | "Suami" | "Istri" | "Anak" | "Orang Tua" | "Saudara" | "Lainnya";

export type KemampuanCaregiver = "Mampu" | "Perlu Pendampingan" | "Tidak Mampu";
export type MetodeEdukasi      = "Lisan" | "Demonstrasi" | "Leaflet" | "Video";
export type PenerimaEdukasi    = "Pasien" | "Keluarga" | "Keduanya";
export type PemahamanEdukasi   = "Paham" | "Perlu Ulang" | "Tidak Paham";

// Re-admisi risk screening (menggantikan Aksesibilitas & Sosial — SNARS ARK 5)
export type DukunganKeluarga = "Ada & Mampu" | "Ada tapi Terbatas" | "Tidak Ada";
export type KepatuhanObat    = "Patuh" | "Kadang" | "Tidak Patuh";
export type RiwayatReadmisi  = "Tidak" | "1x" | ">1x";
export type RisikoReadmisi   = "RENDAH" | "SEDANG" | "TINGGI";

// ── Core interfaces ───────────────────────────────────────

export interface DischargeAsesmen {
  tanggalRencanaKRS:        string;
  kondisiPulang:            KondisiPulang | "";
  caregiverNama:            string;
  caregiverHubungan:        HubunganCaregiver | "";
  caregiverKemampuan:       KemampuanCaregiver | "";
  kebutuhanHomecare:        boolean;
  jenisHomecare:            string[];
  kebutuhanAlatBantu:       boolean;
  alatBantu:                string[];
  dukunganKeluarga:         DukunganKeluarga | "";
  kepatuhanObatSebelumnya:  KepatuhanObat | "";
  riwayatReadmisi:          RiwayatReadmisi | "";
  catatan:                  string;
}

export interface EdukasiItem {
  id:        string;
  topik:     string;
  kategori:  string;
  diberikan: boolean;
  metode:    MetodeEdukasi | "";
  penerima:  PenerimaEdukasi | "";
  pemahaman: PemahamanEdukasi | "";
  catatan:   string;
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

export interface JadwalKontrol {
  id:      string;
  tanggal: string;
  poli:    string;
  dokter:  string;
  catatan: string;
}

export interface JadwalPemeriksaan {
  id:      string;
  jenis:   "Lab" | "Radiologi";
  nama:    string;
  tanggal: string;
  catatan: string;
}

export interface DischargeFollowUp {
  jadwalKontrol:      JadwalKontrol[];
  jadwalPemeriksaan:  JadwalPemeriksaan[];
  adaRujukanFKTP:     boolean;
  fktpNama:           string;
  fktpTujuan:         string;
  instruksiKhusus:    string;
}

export interface ResumeMedis {
  diagnosaMasuk:        string;
  diagnosaAkhir:        string;
  kodeIcd10Akhir:       string;    // PMK 24/2022: kode ICD-10 eksplisit
  prosedurUtama:        string;
  ringkasanPenyakit:    string;
  kondisiSaatPulang:    string;
  statusFungsional:     string;    // PMK 24/2022: status fungsional/ADL saat pulang
  terapiYangDiberikan:  string;
  instruksiPulang:      string;
  pembatasanAktivitas:  string;
  dietPulang:           string;
  tandaTanganPasien:    boolean;   // PMK 24/2022: TTD pasien/keluarga
  dpjpApproved:         boolean;
  dpjpApprovedAt:       string;
}

export interface DischargePlanData {
  asesmen:    DischargeAsesmen;
  edukasi:    EdukasiItem[];
  obatPulang: ObatPulangItem[];
  followUp:   DischargeFollowUp;
  resume:     ResumeMedis;
}

// ── Config / constants ────────────────────────────────────

export const KONDISI_PULANG_CONFIG: Record<KondisiPulang, {
  label: string; badge: string; ring: string; dot: string; sel: string;
}> = {
  Sembuh:         { label: "Sembuh",       badge: "bg-emerald-100 text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-500", sel: "border-emerald-400 bg-emerald-50 text-emerald-700" },
  Membaik:        { label: "Membaik",      badge: "bg-sky-100 text-sky-700",         ring: "ring-sky-200",     dot: "bg-sky-500",     sel: "border-sky-400 bg-sky-50 text-sky-700"             },
  "Belum Sembuh": { label: "Belum Sembuh", badge: "bg-amber-100 text-amber-700",     ring: "ring-amber-200",   dot: "bg-amber-500",   sel: "border-amber-400 bg-amber-50 text-amber-700"       },
  APS:            { label: "APS",          badge: "bg-orange-100 text-orange-700",   ring: "ring-orange-200",  dot: "bg-orange-500",  sel: "border-orange-400 bg-orange-50 text-orange-700"    },
  Rujuk:          { label: "Dirujuk",      badge: "bg-violet-100 text-violet-700",   ring: "ring-violet-200",  dot: "bg-violet-500",  sel: "border-violet-400 bg-violet-50 text-violet-700"    },
  Meninggal:      { label: "Meninggal",    badge: "bg-red-100 text-red-700",         ring: "ring-red-200",     dot: "bg-red-500",     sel: "border-red-400 bg-red-50 text-red-700"             },
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

export const RISIKO_CONFIG: Record<RisikoReadmisi, {
  bg: string; border: string; text: string; dot: string;
}> = {
  RENDAH: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  SEDANG: { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   dot: "bg-amber-500"  },
  TINGGI: { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-700",     dot: "bg-red-500"    },
};

export const TOPIK_EDUKASI_TEMPLATE: Array<{
  id: string; topik: string; kategori: string;
}> = [
  { id: "edu-01", topik: "Penjelasan Diagnosis & Perjalanan Penyakit",       kategori: "Medis"          },
  { id: "edu-02", topik: "Tanda Bahaya yang Harus Segera ke RS / IGD",       kategori: "Medis"          },
  { id: "edu-03", topik: "Cara Penggunaan Obat & Kepatuhan Minum Obat",      kategori: "Farmasi"        },
  { id: "edu-04", topik: "Efek Samping Obat yang Perlu Diwaspadai",          kategori: "Farmasi"        },
  { id: "edu-05", topik: "Diet & Nutrisi Sesuai Kondisi",                    kategori: "Nutrisi"        },
  { id: "edu-06", topik: "Restriksi Cairan & Monitoring Berat Badan Harian", kategori: "Nutrisi"        },
  { id: "edu-07", topik: "Aktivitas Fisik yang Aman & Bertahap",             kategori: "Rehabilitasi"   },
  { id: "edu-08", topik: "Perawatan di Rumah (Luka / Alat Bantu)",           kategori: "Keperawatan"    },
  { id: "edu-09", topik: "Jadwal Kontrol, Follow-up & Pemeriksaan",          kategori: "Administratif"  },
  { id: "edu-10", topik: "Cara Pemantauan Kondisi di Rumah",                 kategori: "Keperawatan"    },
  { id: "edu-11", topik: "Edukasi Keluarga / Caregiver",                     kategori: "Keperawatan"    },
  { id: "edu-12", topik: "Modifikasi Gaya Hidup (Rokok, Alkohol, Stres)",    kategori: "Preventif"      },
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
  "Paham":        "bg-emerald-100 text-emerald-700",
  "Perlu Ulang":  "bg-amber-100 text-amber-700",
  "Tidak Paham":  "bg-red-100 text-red-700",
};

// ── Helpers ───────────────────────────────────────────────

export function makeInitialEdukasi(): EdukasiItem[] {
  return TOPIK_EDUKASI_TEMPLATE.map(t => ({
    ...t,
    diberikan: false,
    metode: "",
    penerima: "",
    pemahaman: "",
    catatan: "",
  }));
}

export function calcRisikoReadmisi(d: DischargeAsesmen): RisikoReadmisi | null {
  if (!d.dukunganKeluarga && !d.kepatuhanObatSebelumnya && !d.riwayatReadmisi) return null;
  if (d.dukunganKeluarga === "Tidak Ada" || d.kepatuhanObatSebelumnya === "Tidak Patuh" || d.riwayatReadmisi === ">1x") return "TINGGI";
  if (d.dukunganKeluarga === "Ada tapi Terbatas" || d.kepatuhanObatSebelumnya === "Kadang" || d.riwayatReadmisi === "1x") return "SEDANG";
  return "RENDAH";
}

export function isAsesmenComplete(a: DischargeAsesmen): boolean {
  return a.kondisiPulang !== "" && a.caregiverNama.trim() !== "";
}

export function isEdukasiComplete(items: EdukasiItem[]): boolean {
  return items.some(i => i.diberikan);
}

export function isObatComplete(items: ObatPulangItem[]): boolean {
  return items.length > 0;
}

export function isFollowUpComplete(f: DischargeFollowUp): boolean {
  return f.jadwalKontrol.length > 0;
}

export function isResumeComplete(r: ResumeMedis): boolean {
  return r.ringkasanPenyakit.trim() !== "" && r.dpjpApproved;
}

// ── Mock data (keyed by noRM) ─────────────────────────────

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
      catatan: "Pasien tinggal di rumah 1 lantai. Anak (Budi Fauzi) mampu merawat secara mandiri dan memahami kondisi ayah.",
    },
    edukasi: makeInitialEdukasi(),
    obatPulang: [
      { id: "op-1", namaObat: "Bisoprolol 5 mg",      dosis: "5 mg",  frekuensi: "1×1 pagi",    durasi: "30 hari", instruksi: "JANGAN dihentikan mendadak. Pantau nadi — hubungi dokter jika nadi < 50×/mnt.", isHAM: true,  fromResep: true },
      { id: "op-2", namaObat: "Candesartan 8 mg",     dosis: "8 mg",  frekuensi: "1×1 pagi",    durasi: "30 hari", instruksi: "Pantau tekanan darah. Minum sebelum makan.", isHAM: false, fromResep: true },
      { id: "op-3", namaObat: "Furosemide 40 mg tab", dosis: "40 mg", frekuensi: "1×1 pagi",    durasi: "30 hari", instruksi: "Minum pagi hari. Pantau BAK — lapor jika < 400 ml/hari. Timbang BB tiap pagi.", isHAM: false, fromResep: true },
      { id: "op-4", namaObat: "Spironolactone 25 mg", dosis: "25 mg", frekuensi: "1×1 pagi",    durasi: "30 hari", instruksi: "Hindari konsumsi tinggi kalium berlebihan (pisang, kelapa muda).", isHAM: false, fromResep: true },
    ],
    followUp: {
      jadwalKontrol: [
        { id: "jk-1", tanggal: "2026-05-19", poli: "Poliklinik Jantung",     dokter: "dr. Dewi Kusuma, Sp.JP",  catatan: "Kontrol 1 minggu pasca pulang. Bawa semua obat yang dikonsumsi." },
        { id: "jk-2", tanggal: "2026-05-26", poli: "Poliklinik Gizi Klinik", dokter: "dr. Anisa Putri, Sp.GK",  catatan: "Evaluasi diet jantung & status nutrisi 2 minggu pasca pulang." },
      ],
      jadwalPemeriksaan: [
        { id: "jp-1", jenis: "Lab",       nama: "Elektrolit (Na, K, Mg)",          tanggal: "2026-05-26", catatan: "Monitoring efek diuretik." },
        { id: "jp-2", jenis: "Lab",       nama: "Fungsi Ginjal (Ureum, Kreatinin)", tanggal: "2026-05-26", catatan: "Monitoring ACE inhibitor (Candesartan)." },
        { id: "jp-3", jenis: "Lab",       nama: "BNP / NT-proBNP",                 tanggal: "2026-06-09", catatan: "Evaluasi marker gagal jantung 4 minggu pasca pulang." },
        { id: "jp-4", jenis: "Radiologi", nama: "Foto Thorax PA",                  tanggal: "2026-06-09", catatan: "Evaluasi kardiomegali dan efusi pleura." },
      ],
      adaRujukanFKTP: true,
      fktpNama:       "Puskesmas Kecamatan Menteng",
      fktpTujuan:     "Monitoring rutin TTV, BB harian, kepatuhan minum obat, dan edukasi berkelanjutan.",
      instruksiKhusus: "Timbang BB setiap pagi sebelum makan. Segera ke IGD RS jika: BB naik > 2 kg dalam 3 hari, sesak napas baru/memberat, kaki bengkak kembali, atau nyeri dada.",
    },
    resume: {
      diagnosaMasuk:       "Sesak napas memberat, edema tungkai bilateral",
      diagnosaAkhir:       "Gagal Jantung Kongestif Dekompensata NYHA III (EF 28%), Hipertensi tidak terkontrol, Diabetes Melitus Tipe 2",
      kodeIcd10Akhir:      "I50.0",
      prosedurUtama:       "Terapi medikamentosa GJK (diuretik IV → oral), Ekokardiografi (5 Mei 2026), Rehabilitasi Kardiak Fase I",
      ringkasanPenyakit:   "Pasien laki-laki 67 tahun masuk dengan keluhan sesak napas memberat sejak 3 hari dan kaki bengkak bilateral. Pemeriksaan: TD 150/95 mmHg, Nadi 98×/mnt, SpO₂ 92% room air, ronkhi basah bilateral, edema pretibial +2. Ekokardiografi: EF 28%. Terapi: Furosemide 40 mg IV bolus, O₂ 4 L/mnt, restriksi cairan 1.000 ml/hari. Transisi ke terapi oral: Furosemide + Candesartan + Bisoprolol + Spironolactone. Konsultasi gizi: Diet Jantung III 1.700 kkal/hari, Na < 2 g/hari. Konsultasi rehab medik: Cardiac Rehab Fase I dimulai hari ke-5. Kondisi membaik bertahap: edema berkurang, sesak berkurang, TD terkontrol.",
      kondisiSaatPulang:   "Kondisi umum membaik. TD 128/80 mmHg, Nadi 80×/mnt reguler, RR 17×/mnt, SpO₂ 97% room air. Edema tungkai minimal grade I. Sesak napas minimal saat aktivitas sedang. BB turun 3 kg dari saat masuk.",
      statusFungsional:    "ADL terbatas (Barthel 65/100). Masih memerlukan bantuan mandi dan berpakaian. Mobilisasi dengan pendampingan 1 orang. Dianjutkan Cardiac Rehab Fase II outpatient.",
      terapiYangDiberikan: "Furosemide 40 mg IV → oral, Candesartan 8 mg oral, Bisoprolol 5 mg oral, Spironolactone 25 mg oral, Pantoprazole 40 mg IV (dihentikan).",
      instruksiPulang:     "1. Minum obat teratur sesuai resep — jangan dihentikan tanpa konsultasi dokter\n2. Timbang berat badan setiap pagi sebelum makan, catat hasilnya\n3. Restriksi cairan: maks 1.500 ml/hari di rumah\n4. Diet rendah garam: Na < 2 g/hari\n5. Aktivitas bertahap sesuai program Cardiac Rehab\n6. Kontrol Poliklinik Jantung 19 Mei 2026",
      pembatasanAktivitas: "Aktivitas ringan-sedang. Hindari mengangkat beban berat. Lanjutkan Cardiac Rehab Fase II (outpatient).",
      dietPulang:          "Diet Jantung III 1.700 kkal/hari. Restriksi Na < 2 g/hari. Restriksi cairan 1.500 ml/hari. Diet DM: karbohidrat kompleks, hindari gula sederhana.",
      tandaTanganPasien:   false,
      dpjpApproved:        false,
      dpjpApprovedAt:      "",
    },
  },
};
