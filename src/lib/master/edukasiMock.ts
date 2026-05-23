/**
 * Master Workflow Edukasi — katalog katalog kecil untuk workflow edukasi pasien & keluarga.
 *
 * Multi-collection (7 sub) dalam satu page (sidebar nav per koleksi). Tiap koleksi
 * punya struktur dasar identik (kode + label + deskripsi + urutan + status) plus
 * field opsional per koleksi:
 *   - Topik Edukasi   → kategori (Medis/Farmasi/Nutrisi/...)
 *   - Pemahaman       → tone (emerald/amber/rose) — visualisasi tingkat
 *   - Tanda Bahaya    → kondisi (Umum/Kardio/Respirasi/...)
 *
 * Tujuan: ganti hardcoded constants TOPIK_EDUKASI / MEDIA_EDUKASI / METODE_EDUKASI /
 * HAMBATAN_KOMUNIKASI / PEMAHAMAN / TANDA_BAHAYA / TIPE_INSTRUKSI di EdukasiPane (IGD)
 * dan dischargeShared (RI) dengan single source.
 *
 * Konsumen: EdukasiPane (IGD), DischargePlanTab (RI), PasienPulangTab (RI).
 */

import {
  BookOpen, GraduationCap, MessageCircleQuestion, MessageCircleWarning,
  CheckCheck, AlertTriangle, ClipboardList,
  type LucideIcon,
} from "lucide-react";

// ── Collection keys ──────────────────────────────────────

export type EdukasiCollectionKey =
  | "topik-edukasi"
  | "media-edukasi"
  | "metode-edukasi"
  | "hambatan-komunikasi"
  | "tingkat-pemahaman"
  | "tanda-bahaya"
  | "tipe-instruksi";

// ── Field types ──────────────────────────────────────────

export type TopikKategori =
  | "Medis"
  | "Farmasi"
  | "Nutrisi"
  | "Rehabilitasi"
  | "Keperawatan"
  | "Administratif"
  | "Preventif";

export type PemahamanTone = "emerald" | "amber" | "rose";

export type TandaBahayaKondisi =
  | "Umum"
  | "Kardiovaskular"
  | "Respirasi"
  | "Neurologi"
  | "Pencernaan"
  | "Bedah"
  | "Obstetri";

// ── Entry shape ──────────────────────────────────────────

export interface EdukasiEntry {
  id: string;
  kode: string;
  label: string;
  deskripsi?: string;
  urutan: number;
  status: "Aktif" | "NonAktif";
  // Optional per collection:
  kategori?: TopikKategori;
  tone?: PemahamanTone;
  kondisi?: TandaBahayaKondisi;
}

export interface EdukasiCollection {
  key: EdukasiCollectionKey;
  label: string;
  shortLabel: string;
  deskripsi: string;
  icon: LucideIcon;
  konsumen: string[];
  hasKategori: boolean;
  hasTone: boolean;
  hasKondisi: boolean;
  entries: EdukasiEntry[];
}

// ── Color configs ────────────────────────────────────────

export const KATEGORI_CFG: Record<TopikKategori, { chip: string; dot: string }> = {
  Medis:         { chip: "bg-rose-100 text-rose-700",       dot: "bg-rose-500"    },
  Farmasi:       { chip: "bg-violet-100 text-violet-700",   dot: "bg-violet-500"  },
  Nutrisi:       { chip: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  Rehabilitasi:  { chip: "bg-sky-100 text-sky-700",         dot: "bg-sky-500"     },
  Keperawatan:   { chip: "bg-indigo-100 text-indigo-700",   dot: "bg-indigo-500"  },
  Administratif: { chip: "bg-amber-100 text-amber-700",     dot: "bg-amber-500"   },
  Preventif:     { chip: "bg-teal-100 text-teal-700",       dot: "bg-teal-500"    },
};

export const KATEGORI_LIST: TopikKategori[] = [
  "Medis", "Farmasi", "Nutrisi", "Rehabilitasi", "Keperawatan", "Administratif", "Preventif",
];

export const TONE_CFG: Record<PemahamanTone, { label: string; chip: string; dot: string; ring: string }> = {
  emerald: { label: "Paham",       chip: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  amber:   { label: "Perlu Ulang", chip: "bg-amber-100 text-amber-700",     dot: "bg-amber-500",   ring: "ring-amber-200"   },
  rose:    { label: "Tidak Paham", chip: "bg-rose-100 text-rose-700",       dot: "bg-rose-500",    ring: "ring-rose-200"    },
};

export const TONE_LIST: PemahamanTone[] = ["emerald", "amber", "rose"];

export const KONDISI_CFG: Record<TandaBahayaKondisi, { chip: string; dot: string }> = {
  Umum:           { chip: "bg-slate-100 text-slate-700",   dot: "bg-slate-500"   },
  Kardiovaskular: { chip: "bg-rose-100 text-rose-700",     dot: "bg-rose-500"    },
  Respirasi:      { chip: "bg-sky-100 text-sky-700",       dot: "bg-sky-500"     },
  Neurologi:      { chip: "bg-violet-100 text-violet-700", dot: "bg-violet-500"  },
  Pencernaan:     { chip: "bg-amber-100 text-amber-700",   dot: "bg-amber-500"   },
  Bedah:          { chip: "bg-teal-100 text-teal-700",     dot: "bg-teal-500"    },
  Obstetri:       { chip: "bg-pink-100 text-pink-700",     dot: "bg-pink-500"    },
};

export const KONDISI_LIST: TandaBahayaKondisi[] = [
  "Umum", "Kardiovaskular", "Respirasi", "Neurologi", "Pencernaan", "Bedah", "Obstetri",
];

// ── Helpers (entry-level) ────────────────────────────────

export function emptyEdukasiEntry(maxUrutan: number, defaults?: Partial<EdukasiEntry>): EdukasiEntry {
  return {
    id: `edu-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kode: "",
    label: "",
    deskripsi: "",
    urutan: maxUrutan + 1,
    status: "Aktif",
    ...defaults,
  };
}

export function isEdukasiEntryValid(e: EdukasiEntry): boolean {
  return e.kode.trim().length > 0 && e.label.trim().length > 0;
}

export function countActiveEntries(c: EdukasiCollection): number {
  return c.entries.filter((e) => e.status === "Aktif").length;
}

export function getCollectionByKey(
  groups: EdukasiCollection[],
  key: EdukasiCollectionKey,
): EdukasiCollection | undefined {
  return groups.find((g) => g.key === key);
}

// ── Mock collections ─────────────────────────────────────

const TOPIK_ENTRIES: EdukasiEntry[] = [
  { id: "tpk-01", kode: "DIAGNOSIS",      label: "Penjelasan Diagnosis & Perjalanan Penyakit",       deskripsi: "Penjelasan kondisi klinis saat ini, etiologi, dan prognosis kepada pasien/keluarga.", urutan: 1,  status: "Aktif",    kategori: "Medis"         },
  { id: "tpk-02", kode: "TANDA_BAHAYA",   label: "Tanda Bahaya yang Harus Segera ke RS / IGD",       deskripsi: "Identifikasi kondisi memburuk yang memerlukan kembali ke layanan IGD.",              urutan: 2,  status: "Aktif",    kategori: "Medis"         },
  { id: "tpk-03", kode: "OBAT_PENGGUNAAN",label: "Cara Penggunaan Obat & Kepatuhan Minum Obat",      deskripsi: "Dosis, waktu minum, durasi terapi, dan teknik administrasi (oral/injeksi).",        urutan: 3,  status: "Aktif",    kategori: "Farmasi"       },
  { id: "tpk-04", kode: "ESO",            label: "Efek Samping Obat yang Perlu Diwaspadai",          deskripsi: "ESO ringan vs berat, kapan harus hentikan obat, kapan harus lapor dokter.",         urutan: 4,  status: "Aktif",    kategori: "Farmasi"       },
  { id: "tpk-05", kode: "DIET",           label: "Diet & Nutrisi Sesuai Kondisi",                    deskripsi: "Pantangan makanan, anjuran kalori/protein, jadwal makan, diet khusus per penyakit.", urutan: 5,  status: "Aktif",    kategori: "Nutrisi"       },
  { id: "tpk-06", kode: "RESTRIKSI",      label: "Restriksi Cairan & Monitoring Berat Badan Harian", deskripsi: "Pasien GJK/CKD: batas asupan cairan + timbang BB harian + lapor jika naik >2 kg/hari.", urutan: 6,  status: "Aktif",    kategori: "Nutrisi"       },
  { id: "tpk-07", kode: "AKTIVITAS",      label: "Aktivitas Fisik yang Aman & Bertahap",             deskripsi: "Latihan ringan, mobilisasi bertahap, batasan beban, latihan pernapasan.",            urutan: 7,  status: "Aktif",    kategori: "Rehabilitasi"  },
  { id: "tpk-08", kode: "PERAWATAN_RMH",  label: "Perawatan di Rumah (Luka / Alat Bantu)",           deskripsi: "Perawatan luka operasi, ganti perban, perawatan stoma/kateter/NGT di rumah.",       urutan: 8,  status: "Aktif",    kategori: "Keperawatan"   },
  { id: "tpk-09", kode: "KONTROL",        label: "Jadwal Kontrol, Follow-up & Pemeriksaan",          deskripsi: "Tanggal & lokasi kontrol berikutnya, jadwal lab lanjutan, jadwal kemoterapi/HD.",   urutan: 9,  status: "Aktif",    kategori: "Administratif" },
  { id: "tpk-10", kode: "MONITORING",     label: "Cara Pemantauan Kondisi di Rumah",                 deskripsi: "Cara ukur TD, gula darah, suhu di rumah + cara mencatat & melaporkan.",             urutan: 10, status: "Aktif",    kategori: "Keperawatan"   },
  { id: "tpk-11", kode: "CAREGIVER",      label: "Edukasi Keluarga / Caregiver",                     deskripsi: "Peran caregiver utama, jadwal bergantian, kapan minta bantuan tenaga kesehatan.",   urutan: 11, status: "Aktif",    kategori: "Keperawatan"   },
  { id: "tpk-12", kode: "GAYA_HIDUP",     label: "Modifikasi Gaya Hidup (Rokok, Alkohol, Stres)",    deskripsi: "Berhenti merokok/alkohol, manajemen stres, tidur cukup, olahraga teratur.",         urutan: 12, status: "Aktif",    kategori: "Preventif"     },
  { id: "tpk-13", kode: "HAK_KEWAJIBAN",  label: "Hak & Kewajiban Pasien",                           deskripsi: "Hak atas informasi, persetujuan tindakan, kerahasiaan, second opinion.",            urutan: 13, status: "NonAktif", kategori: "Administratif" },
  { id: "tpk-14", kode: "PHBS",           label: "Pencegahan Infeksi & PHBS",                        deskripsi: "Cuci tangan, etika batuk, kebersihan personal, sanitasi rumah.",                    urutan: 14, status: "Aktif",    kategori: "Preventif"     },
];

const MEDIA_ENTRIES: EdukasiEntry[] = [
  { id: "med-01", kode: "VERBAL",   label: "Verbal / Lisan",          deskripsi: "Penjelasan langsung dua arah, paling fleksibel untuk pasien literasi rendah.",       urutan: 1, status: "Aktif"    },
  { id: "med-02", kode: "LEAFLET",  label: "Leaflet / Brosur",        deskripsi: "Lembar lipat sederhana, 1–2 halaman, untuk dibawa pulang.",                          urutan: 2, status: "Aktif"    },
  { id: "med-03", kode: "BOOKLET",  label: "Booklet",                 deskripsi: "Buku panduan lengkap untuk pasien kronis (GJK, DM, CKD, dll).",                      urutan: 3, status: "Aktif"    },
  { id: "med-04", kode: "DEMO",     label: "Demonstrasi Langsung",    deskripsi: "Peragaan langsung — injeksi insulin, ganti perban, pakai inhaler.",                  urutan: 4, status: "Aktif"    },
  { id: "med-05", kode: "VIDEO",    label: "Video Edukasi",           deskripsi: "Video 3–8 menit, efektif untuk prosedur kompleks atau diet visual.",                 urutan: 5, status: "Aktif"    },
  { id: "med-06", kode: "POSTER",   label: "Poster / Gambar",         deskripsi: "Poster dinding ruang tunggu / kamar untuk topik umum.",                              urutan: 6, status: "Aktif"    },
  { id: "med-07", kode: "DIGITAL",  label: "Aplikasi Digital",        deskripsi: "Aplikasi RS / SatuSehat untuk reminder obat, jadwal kontrol, info penyakit.",        urutan: 7, status: "Aktif"    },
];

const METODE_ENTRIES: EdukasiEntry[] = [
  { id: "mtd-01", kode: "CERAMAH",   label: "Ceramah",                deskripsi: "Penyampaian satu arah, cocok untuk topik baru atau kelompok pasien.",               urutan: 1, status: "Aktif" },
  { id: "mtd-02", kode: "DISKUSI",   label: "Diskusi Dua Arah",       deskripsi: "Tanya jawab interaktif, paling efektif untuk konfirmasi pemahaman.",                urutan: 2, status: "Aktif" },
  { id: "mtd-03", kode: "DEMO",      label: "Demonstrasi",            deskripsi: "Petugas memperagakan, pasien/keluarga mengamati lalu coba sendiri.",                urutan: 3, status: "Aktif" },
  { id: "mtd-04", kode: "SIMULASI",  label: "Simulasi / Roleplay",    deskripsi: "Pasien/keluarga praktik dengan supervisi, untuk skill yang harus dilakukan rutin.",  urutan: 4, status: "Aktif" },
  { id: "mtd-05", kode: "TANYA",     label: "Tanya Jawab",            deskripsi: "Sesi pertanyaan terstruktur untuk klarifikasi materi yang sudah diberikan.",         urutan: 5, status: "Aktif" },
];

const HAMBATAN_ENTRIES: EdukasiEntry[] = [
  { id: "hmb-01", kode: "TIDAK_ADA",       label: "Tidak Ada",                deskripsi: "Pasien/keluarga kooperatif dan tidak memiliki hambatan komunikasi.",            urutan: 1, status: "Aktif" },
  { id: "hmb-02", kode: "BAHASA",          label: "Bahasa / Komunikasi",      deskripsi: "Bahasa daerah, dialek, atau bahasa asing — perlu penerjemah.",                  urutan: 2, status: "Aktif" },
  { id: "hmb-03", kode: "PENDENGARAN",     label: "Gangguan Pendengaran",     deskripsi: "Tuli sebagian/total — gunakan bahasa isyarat, tulisan, atau visual.",          urutan: 3, status: "Aktif" },
  { id: "hmb-04", kode: "PENGLIHATAN",     label: "Gangguan Penglihatan",     deskripsi: "Low vision atau buta — gunakan audio, demo taktil, font besar untuk leaflet.", urutan: 4, status: "Aktif" },
  { id: "hmb-05", kode: "KOGNITIF",        label: "Gangguan Kognitif",        deskripsi: "Demensia, retardasi mental — libatkan keluarga sebagai penerima utama.",       urutan: 5, status: "Aktif" },
  { id: "hmb-06", kode: "EMOSIONAL",       label: "Emosional / Psikologis",   deskripsi: "Cemas, depresi, marah, denial — tunda materi sensitif, libatkan psikolog.",    urutan: 6, status: "Aktif" },
  { id: "hmb-07", kode: "FISIK",           label: "Fisik / Kelemahan Umum",   deskripsi: "Nyeri, lemas, sesak — materi singkat & terjadwal saat kondisi optimal.",        urutan: 7, status: "Aktif" },
  { id: "hmb-08", kode: "PENDIDIKAN",      label: "Tingkat Pendidikan",       deskripsi: "Literasi rendah — gunakan bahasa awam, contoh sehari-hari, banyak visual.",     urutan: 8, status: "Aktif" },
];

const PEMAHAMAN_ENTRIES: EdukasiEntry[] = [
  { id: "phm-01", kode: "PAHAM",       label: "Paham / Mengerti",       deskripsi: "Pasien/keluarga mampu mengulang & menjelaskan kembali materi dengan benar.",        urutan: 1, status: "Aktif", tone: "emerald" },
  { id: "phm-02", kode: "PERLU_ULANG", label: "Perlu Pengulangan",      deskripsi: "Pemahaman sebagian — perlu sesi tambahan dengan media atau metode berbeda.",         urutan: 2, status: "Aktif", tone: "amber"   },
  { id: "phm-03", kode: "TIDAK_PAHAM", label: "Tidak / Belum Paham",    deskripsi: "Tidak mampu mengulang materi — eskalasi ke tim, libatkan caregiver alternatif.",   urutan: 3, status: "Aktif", tone: "rose"    },
];

const TANDA_BAHAYA_ENTRIES: EdukasiEntry[] = [
  { id: "tdb-01", kode: "NYERI_DADA",    label: "Nyeri Dada Hebat / Sesak Mendadak", deskripsi: "Bisa indikasi STEMI, emboli paru, atau pneumotoraks — perlu IGD <15 menit.",    urutan: 1,  status: "Aktif", kondisi: "Kardiovaskular" },
  { id: "tdb-02", kode: "PINGSAN",       label: "Penurunan Kesadaran / Pingsan",     deskripsi: "Sinkop, stroke, hipoglikemia berat — segera IGD walau sadar kembali.",          urutan: 2,  status: "Aktif", kondisi: "Neurologi"      },
  { id: "tdb-03", kode: "PERDARAHAN",    label: "Perdarahan Tidak Terkontrol",       deskripsi: "Perdarahan luka operasi, hematemesis, melena, epistaksis masif.",                urutan: 3,  status: "Aktif", kondisi: "Umum"           },
  { id: "tdb-04", kode: "DEMAM_TINGGI",  label: "Demam Tinggi > 38.5°C",             deskripsi: "Persisten >24 jam atau disertai menggigil/kebingungan — curiga sepsis.",         urutan: 4,  status: "Aktif", kondisi: "Umum"           },
  { id: "tdb-05", kode: "MUNTAH",        label: "Mual / Muntah Persisten",           deskripsi: "Muntah >5×/hari, tidak bisa minum, dehidrasi — perlu rehidrasi IV.",             urutan: 5,  status: "Aktif", kondisi: "Pencernaan"     },
  { id: "tdb-06", kode: "KEJANG",        label: "Kejang",                            deskripsi: "Kejang baru, durasi >5 menit, atau kejang berulang — status epileptikus.",       urutan: 6,  status: "Aktif", kondisi: "Neurologi"      },
  { id: "tdb-07", kode: "SIANOSIS",      label: "Kulit Pucat / Sianosis",            deskripsi: "Pucat hebat, kebiruan bibir/ujung jari — hipoksia atau syok.",                   urutan: 7,  status: "Aktif", kondisi: "Kardiovaskular" },
  { id: "tdb-08", kode: "LUKA_INFEKSI",  label: "Luka Tidak Sembuh / Infeksi",       deskripsi: "Luka bernanah, kemerahan meluas, bau busuk, demam — infeksi luka operasi.",      urutan: 8,  status: "Aktif", kondisi: "Bedah"          },
  { id: "tdb-09", kode: "NYERI_HEBAT",   label: "Nyeri Tidak Tertahankan",           deskripsi: "Nyeri tidak respons analgetik oral, skala >7 — perlu evaluasi ulang.",           urutan: 9,  status: "Aktif", kondisi: "Umum"           },
  { id: "tdb-10", kode: "SESAK_ISTRHT",  label: "Sesak saat Istirahat",              deskripsi: "Dispnea baru, ortopnea, PND — dekompensasi GJK atau eksaserbasi PPOK.",          urutan: 10, status: "Aktif", kondisi: "Respirasi"      },
  { id: "tdb-11", kode: "BENGKAK",       label: "Bengkak Mendadak",                  deskripsi: "Edema tungkai unilateral akut (DVT) atau angioedema (alergi berat).",            urutan: 11, status: "Aktif", kondisi: "Umum"           },
  { id: "tdb-12", kode: "PUSING",        label: "Pusing / Kehilangan Keseimbangan",  deskripsi: "Vertigo hebat, ataksia baru — kemungkinan stroke serebelar.",                    urutan: 12, status: "Aktif", kondisi: "Neurologi"      },
  { id: "tdb-13", kode: "GERAK_JANIN",   label: "Gerak Janin Berkurang / Hilang",    deskripsi: "Bumil trimester 3: gerak <10×/12 jam — perlu CTG segera.",                       urutan: 13, status: "Aktif", kondisi: "Obstetri"       },
  { id: "tdb-14", kode: "KETUBAN_PECAH", label: "Ketuban Pecah Dini / Perdarahan",   deskripsi: "Bumil: cairan keluar dari vagina atau perdarahan — risiko infeksi/persalinan.",  urutan: 14, status: "Aktif", kondisi: "Obstetri"       },
];

const TIPE_INSTRUKSI_ENTRIES: EdukasiEntry[] = [
  { id: "tip-01", kode: "DISCHARGE",  label: "Instruksi Discharge",       deskripsi: "Instruksi standar pulang — obat, diet, aktivitas, kontrol.",                       urutan: 1, status: "Aktif" },
  { id: "tip-02", kode: "FOLLOWUP",   label: "Follow-up / Kontrol",       deskripsi: "Instruksi kontrol berkala — jadwal, poli tujuan, persiapan pemeriksaan.",          urutan: 2, status: "Aktif" },
  { id: "tip-03", kode: "EMERGENCY",  label: "Emergency Response",        deskripsi: "Respon tanda bahaya — kapan ke IGD, hotline RS, kontak dokter.",                  urutan: 3, status: "Aktif" },
  { id: "tip-04", kode: "PRA_TIND",   label: "Edukasi Pra-Tindakan",      deskripsi: "Persiapan tindakan elektif — puasa, obat yang dihentikan, transportasi pulang.",  urutan: 4, status: "Aktif" },
  { id: "tip-05", kode: "ADMISI_RI",  label: "Tindak Lanjut Rawat Inap",  deskripsi: "Instruksi admisi RI — persiapan barang, jam masuk, ruangan, jaminan.",             urutan: 5, status: "Aktif" },
  { id: "tip-06", kode: "RUJUKAN",    label: "Instruksi Rujukan",         deskripsi: "Rujukan eksternal — RS tujuan, alasan, dokumen yang dibawa, ambulans.",           urutan: 6, status: "Aktif" },
];

// ── Master collection list ───────────────────────────────

export const EDUKASI_COLLECTIONS: EdukasiCollection[] = [
  {
    key:        "topik-edukasi",
    label:      "Topik Edukasi",
    shortLabel: "Topik",
    deskripsi:  "Daftar materi edukasi yang bisa dipilih saat dokumentasi edukasi pasien & keluarga.",
    icon:       BookOpen,
    konsumen:   ["EdukasiPane (IGD)", "DischargePlanTab (RI)"],
    hasKategori: true,
    hasTone:     false,
    hasKondisi:  false,
    entries:     TOPIK_ENTRIES,
  },
  {
    key:        "media-edukasi",
    label:      "Media Edukasi",
    shortLabel: "Media",
    deskripsi:  "Format alat bantu untuk penyampaian materi edukasi (verbal, cetak, digital, audio-visual).",
    icon:       GraduationCap,
    konsumen:   ["EdukasiPane (IGD)", "DischargePlanTab (RI)"],
    hasKategori: false, hasTone: false, hasKondisi: false,
    entries:    MEDIA_ENTRIES,
  },
  {
    key:        "metode-edukasi",
    label:      "Metode Edukasi",
    shortLabel: "Metode",
    deskripsi:  "Pendekatan/teknik penyampaian — ceramah, diskusi, demonstrasi, simulasi, tanya jawab.",
    icon:       MessageCircleQuestion,
    konsumen:   ["EdukasiPane (IGD)"],
    hasKategori: false, hasTone: false, hasKondisi: false,
    entries:    METODE_ENTRIES,
  },
  {
    key:        "hambatan-komunikasi",
    label:      "Hambatan Komunikasi",
    shortLabel: "Hambatan",
    deskripsi:  "Faktor yang menghambat penerimaan materi edukasi — bahasa, sensorik, kognitif, emosional.",
    icon:       MessageCircleWarning,
    konsumen:   ["EdukasiPane (IGD)", "Asesmen Awal"],
    hasKategori: false, hasTone: false, hasKondisi: false,
    entries:    HAMBATAN_ENTRIES,
  },
  {
    key:        "tingkat-pemahaman",
    label:      "Tingkat Pemahaman",
    shortLabel: "Pemahaman",
    deskripsi:  "Skala evaluasi pemahaman setelah edukasi diberikan — Paham, Perlu Pengulangan, Tidak Paham.",
    icon:       CheckCheck,
    konsumen:   ["EdukasiPane (IGD)", "DischargePlanTab (RI)"],
    hasKategori: false, hasTone: true, hasKondisi: false,
    entries:    PEMAHAMAN_ENTRIES,
  },
  {
    key:        "tanda-bahaya",
    label:      "Tanda Bahaya",
    shortLabel: "Tanda Bahaya",
    deskripsi:  "Daftar tanda bahaya yang harus segera dibawa ke IGD — dikelompokkan per kondisi/spesialisasi.",
    icon:       AlertTriangle,
    konsumen:   ["EdukasiPane Emergency (IGD)", "PasienPulangTab (RI)"],
    hasKategori: false, hasTone: false, hasKondisi: true,
    entries:    TANDA_BAHAYA_ENTRIES,
  },
  {
    key:        "tipe-instruksi",
    label:      "Tipe Instruksi Pulang",
    shortLabel: "Tipe Instruksi",
    deskripsi:  "Klasifikasi jenis instruksi yang diberikan saat pasien pulang/disposisi.",
    icon:       ClipboardList,
    konsumen:   ["EdukasiPane Emergency (IGD)", "DischargePlanTab (RI)"],
    hasKategori: false, hasTone: false, hasKondisi: false,
    entries:    TIPE_INSTRUKSI_ENTRIES,
  },
];
