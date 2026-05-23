/**
 * Master Status Enum — katalog enum kecil lintas modul.
 *
 * Multi-enum dalam satu page (sidebar nav per enum). Tiap enum punya
 * struktur identik: kode (unique key) + label + deskripsi + tone + urutan.
 * Tujuan: hapus hardcoded constants di pasienPulang/discharge/dst, jadi single source.
 */

import {
  Activity, Bed, Heart, ArrowRightCircle, ShieldAlert, HeartOff, Home,
  Stethoscope, AlertCircle, CheckCircle2, AlertTriangle, Skull,
  Eye, EyeOff, Brain, Moon, Sun, MoonStar,
  Users, User2, Crown, GitBranch,
  Building2, Hospital, Star, Sparkles,
  Pill, Syringe, Droplet, Wind, Hand,
  type LucideIcon,
} from "lucide-react";

// ── Enum keys ─────────────────────────────────────────────

export type StatusEnumKey =
  | "status-pulang"
  | "kondisi-umum"
  | "tingkat-kesadaran"
  | "kondisi-transfer"
  | "mode-transport"
  | "kelas-perawatan"
  | "hubungan-keluarga"
  | "profesi-edukator"
  | "rute-obat";

export type EnumTone =
  | "emerald" | "sky" | "teal" | "amber" | "orange"
  | "rose" | "violet" | "slate" | "indigo";

export interface EnumEntry {
  id: string;
  kode: string;
  label: string;
  deskripsi?: string;
  tone: EnumTone;
  urutan: number;
  status: "Aktif" | "NonAktif";
  icon?: string;
}

export interface EnumGroup {
  key: StatusEnumKey;
  label: string;
  deskripsi: string;
  icon: LucideIcon;
  konsumen: string[];
  entries: EnumEntry[];
}

// ── Tone config ───────────────────────────────────────────

export const TONE_CFG: Record<EnumTone, { label: string; chip: string; dot: string; ring: string }> = {
  emerald: { label: "Emerald", chip: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  sky:     { label: "Sky",     chip: "bg-sky-100 text-sky-700",         dot: "bg-sky-500",     ring: "ring-sky-200" },
  teal:    { label: "Teal",    chip: "bg-teal-100 text-teal-700",       dot: "bg-teal-500",    ring: "ring-teal-200" },
  amber:   { label: "Amber",   chip: "bg-amber-100 text-amber-700",     dot: "bg-amber-500",   ring: "ring-amber-200" },
  orange:  { label: "Orange",  chip: "bg-orange-100 text-orange-700",   dot: "bg-orange-500",  ring: "ring-orange-200" },
  rose:    { label: "Rose",    chip: "bg-rose-100 text-rose-700",       dot: "bg-rose-500",    ring: "ring-rose-200" },
  violet:  { label: "Violet",  chip: "bg-violet-100 text-violet-700",   dot: "bg-violet-500",  ring: "ring-violet-200" },
  slate:   { label: "Slate",   chip: "bg-slate-100 text-slate-700",     dot: "bg-slate-500",   ring: "ring-slate-200" },
  indigo:  { label: "Indigo",  chip: "bg-indigo-100 text-indigo-700",   dot: "bg-indigo-500",  ring: "ring-indigo-200" },
};

export const TONE_LIST: EnumTone[] = [
  "emerald", "teal", "sky", "indigo", "violet", "rose", "orange", "amber", "slate",
];

// ── Icon registry (key → LucideIcon, dipakai render saja) ─

export const ICON_REGISTRY: Record<string, LucideIcon> = {
  Activity, Bed, Heart, ArrowRightCircle, ShieldAlert, HeartOff, Home,
  Stethoscope, AlertCircle, CheckCircle2, AlertTriangle, Skull,
  Eye, EyeOff, Brain, Moon, Sun, MoonStar,
  Users, User2, Crown, GitBranch,
  Building2, Hospital, Star, Sparkles,
  Pill, Syringe, Droplet, Wind, Hand,
};

export const ICON_KEYS = Object.keys(ICON_REGISTRY);

// ── Mock data — 9 enum groups ─────────────────────────────

export const STATUS_ENUM_GROUPS: EnumGroup[] = [
  {
    key: "status-pulang",
    label: "Status Pulang",
    deskripsi: "Status akhir kepulangan pasien (IGD + RI + RJ). Dipakai PasienPulangTab, Resume Medik, klaim BPJS.",
    icon: Home,
    konsumen: ["IGD pasien pulang", "RI pasien pulang", "Resume medik", "Klaim BPJS"],
    entries: [
      { id: "sp-1", kode: "SEMBUH",        label: "Sembuh",                    deskripsi: "Pulang dalam kondisi sembuh penuh",                     tone: "emerald", urutan: 1, status: "Aktif", icon: "CheckCircle2" },
      { id: "sp-2", kode: "MEMBAIK",       label: "Membaik",                   deskripsi: "Pulang dengan kondisi membaik, perlu kontrol lanjutan", tone: "teal",    urutan: 2, status: "Aktif", icon: "Activity" },
      { id: "sp-3", kode: "RAWAT_INAP",    label: "Rawat Inap",                deskripsi: "Transfer dari IGD ke bangsal via SBAR",                 tone: "violet",  urutan: 3, status: "Aktif", icon: "Bed" },
      { id: "sp-4", kode: "DIRUJUK",       label: "Dirujuk RS Lain",           deskripsi: "Memerlukan penanganan di fasilitas lebih tinggi",       tone: "sky",     urutan: 4, status: "Aktif", icon: "ArrowRightCircle" },
      { id: "sp-5", kode: "APS",           label: "APS",                       deskripsi: "Atas Permintaan Sendiri — sebelum izin dokter",         tone: "amber",   urutan: 5, status: "Aktif", icon: "ShieldAlert" },
      { id: "sp-6", kode: "BELUM_SEMBUH",  label: "Belum Sembuh",              deskripsi: "Pulang dengan kondisi belum sembuh atas alasan tertentu", tone: "orange",  urutan: 6, status: "Aktif", icon: "AlertTriangle" },
      { id: "sp-7", kode: "MENINGGAL",     label: "Meninggal",                 deskripsi: "Pasien meninggal selama perawatan",                     tone: "slate",   urutan: 7, status: "Aktif", icon: "HeartOff" },
    ],
  },
  {
    key: "kondisi-umum",
    label: "Kondisi Umum (KU)",
    deskripsi: "Kondisi umum pasien saat asesmen. Dipakai StatusFisikPane, anamnesis, resume.",
    icon: Stethoscope,
    konsumen: ["StatusFisikPane (IGD+RI+RJ)", "Asesmen awal", "TTV"],
    entries: [
      { id: "ku-1", kode: "BAIK",    label: "Baik",    deskripsi: "Tidak ada distress, vital sign stabil",      tone: "emerald", urutan: 1, status: "Aktif", icon: "CheckCircle2" },
      { id: "ku-2", kode: "SEDANG",  label: "Sedang",  deskripsi: "Tampak sakit ringan-sedang, perlu observasi", tone: "amber",   urutan: 2, status: "Aktif", icon: "AlertCircle" },
      { id: "ku-3", kode: "BURUK",   label: "Buruk",   deskripsi: "Tampak sakit berat, distress jelas",         tone: "orange",  urutan: 3, status: "Aktif", icon: "AlertTriangle" },
      { id: "ku-4", kode: "KRITIS",  label: "Kritis",  deskripsi: "Mengancam jiwa, perlu intervensi segera",    tone: "rose",    urutan: 4, status: "Aktif", icon: "Skull" },
    ],
  },
  {
    key: "tingkat-kesadaran",
    label: "Tingkat Kesadaran",
    deskripsi: "Skala kualitatif tingkat kesadaran. Komplementer dengan skala GCS (kuantitatif).",
    icon: Brain,
    konsumen: ["TTVTab", "StatusFisikPane", "Asesmen awal"],
    entries: [
      { id: "tk-1", kode: "COMPOS_MENTIS", label: "Compos Mentis", deskripsi: "Sadar penuh, orientasi waktu/tempat/orang baik",        tone: "emerald", urutan: 1, status: "Aktif", icon: "Eye" },
      { id: "tk-2", kode: "APATIS",        label: "Apatis",        deskripsi: "Acuh tak acuh terhadap rangsangan",                     tone: "sky",     urutan: 2, status: "Aktif", icon: "Eye" },
      { id: "tk-3", kode: "DELIRIUM",      label: "Delirium",      deskripsi: "Gelisah, disorientasi, halusinasi",                     tone: "amber",   urutan: 3, status: "Aktif", icon: "AlertCircle" },
      { id: "tk-4", kode: "SOMNOLEN",      label: "Somnolen",      deskripsi: "Mengantuk, masih dapat dibangunkan dengan rangsangan", tone: "orange",  urutan: 4, status: "Aktif", icon: "Moon" },
      { id: "tk-5", kode: "SOPOR",         label: "Sopor",         deskripsi: "Hanya respon dengan rangsangan nyeri kuat",             tone: "rose",    urutan: 5, status: "Aktif", icon: "MoonStar" },
      { id: "tk-6", kode: "KOMA",          label: "Koma",          deskripsi: "Tidak ada respon terhadap rangsangan apapun",           tone: "slate",   urutan: 6, status: "Aktif", icon: "EyeOff" },
    ],
  },
  {
    key: "kondisi-transfer",
    label: "Kondisi Transfer",
    deskripsi: "Status kondisi pasien saat transfer antar ruangan/RS.",
    icon: ArrowRightCircle,
    konsumen: ["SBAR Transfer IGD→RI", "Rujukan eksternal", "Handover"],
    entries: [
      { id: "kt-1", kode: "STABIL",       label: "Stabil",        deskripsi: "Vital sign stabil, transfer aman tanpa intervensi",     tone: "emerald", urutan: 1, status: "Aktif", icon: "CheckCircle2" },
      { id: "kt-2", kode: "TIDAK_STABIL", label: "Tidak Stabil",  deskripsi: "Memerlukan monitoring ketat selama transfer",           tone: "amber",   urutan: 2, status: "Aktif", icon: "AlertTriangle" },
      { id: "kt-3", kode: "KRITIS",       label: "Kritis",        deskripsi: "Memerlukan dokter pendamping + alat resusitasi",        tone: "rose",    urutan: 3, status: "Aktif", icon: "Skull" },
    ],
  },
  {
    key: "mode-transport",
    label: "Mode Transport",
    deskripsi: "Cara transportasi pasien antar lokasi (dalam/luar RS).",
    icon: Bed,
    konsumen: ["Disposisi", "PasienPulang", "Transfer", "Rujukan"],
    entries: [
      { id: "mt-1", kode: "JALAN_KAKI",        label: "Jalan Kaki",          deskripsi: "Pasien dapat berjalan tanpa bantuan",       tone: "emerald", urutan: 1, status: "Aktif", icon: "Activity" },
      { id: "mt-2", kode: "KURSI_RODA",        label: "Kursi Roda",          deskripsi: "Pasien duduk di kursi roda",                tone: "sky",     urutan: 2, status: "Aktif", icon: "User2" },
      { id: "mt-3", kode: "BRANKAR",           label: "Brankar",             deskripsi: "Pasien dibawa dengan brankar/tempat tidur", tone: "indigo",  urutan: 3, status: "Aktif", icon: "Bed" },
      { id: "mt-4", kode: "AMBULANCE_INT",     label: "Ambulance Internal",  deskripsi: "Ambulance RS untuk transfer internal",      tone: "violet",  urutan: 4, status: "Aktif", icon: "Hospital" },
      { id: "mt-5", kode: "AMBULANCE_EKS",     label: "Ambulance Eksternal", deskripsi: "Ambulance untuk rujukan keluar RS",         tone: "rose",    urutan: 5, status: "Aktif", icon: "Hospital" },
    ],
  },
  {
    key: "kelas-perawatan",
    label: "Kelas Perawatan",
    deskripsi: "Kelas kamar rawat inap. Source of truth untuk RIKelas type, billing tarif, asuransi coverage.",
    icon: Building2,
    konsumen: ["Registrasi RI", "Tarif matrix", "Penjamin coverage", "RIBoard"],
    entries: [
      { id: "kp-1", kode: "VIP",      label: "VIP",       deskripsi: "Kamar VIP single bed, fasilitas premium",       tone: "violet",  urutan: 1, status: "Aktif", icon: "Crown" },
      { id: "kp-2", kode: "KELAS_1",  label: "Kelas 1",   deskripsi: "Maks 2 bed/kamar",                              tone: "indigo",  urutan: 2, status: "Aktif", icon: "Star" },
      { id: "kp-3", kode: "KELAS_2",  label: "Kelas 2",   deskripsi: "3-4 bed/kamar",                                 tone: "sky",     urutan: 3, status: "Aktif", icon: "Building2" },
      { id: "kp-4", kode: "KELAS_3",  label: "Kelas 3",   deskripsi: "≥5 bed/kamar (bangsal umum)",                   tone: "teal",    urutan: 4, status: "Aktif", icon: "Building2" },
      { id: "kp-5", kode: "ICU",      label: "ICU",       deskripsi: "Intensive Care Unit — perawatan kritis",        tone: "rose",    urutan: 5, status: "Aktif", icon: "Heart" },
      { id: "kp-6", kode: "HCU",      label: "HCU",       deskripsi: "High Care Unit — antara ICU dan bangsal",       tone: "orange",  urutan: 6, status: "Aktif", icon: "Heart" },
      { id: "kp-7", kode: "ISOLASI",  label: "Isolasi",   deskripsi: "Kamar isolasi infeksius (TB, COVID, dll)",     tone: "amber",   urutan: 7, status: "Aktif", icon: "ShieldAlert" },
    ],
  },
  {
    key: "hubungan-keluarga",
    label: "Hubungan Keluarga / Caregiver",
    deskripsi: "Hubungan keluarga pasien dengan caregiver / penanggung jawab.",
    icon: Users,
    konsumen: ["Caregiver discharge", "Informed consent", "Penanggung jawab"],
    entries: [
      { id: "hk-1", kode: "SUAMI",      label: "Suami",      tone: "indigo",  urutan: 1, status: "Aktif", icon: "User2" },
      { id: "hk-2", kode: "ISTRI",      label: "Istri",      tone: "rose",    urutan: 2, status: "Aktif", icon: "User2" },
      { id: "hk-3", kode: "ANAK",       label: "Anak",       tone: "sky",     urutan: 3, status: "Aktif", icon: "Users" },
      { id: "hk-4", kode: "ORANG_TUA",  label: "Orang Tua",  tone: "violet",  urutan: 4, status: "Aktif", icon: "Users" },
      { id: "hk-5", kode: "SAUDARA",    label: "Saudara",    tone: "teal",    urutan: 5, status: "Aktif", icon: "GitBranch" },
      { id: "hk-6", kode: "WALI",       label: "Wali",       deskripsi: "Wali hukum yang bukan keluarga inti", tone: "amber", urutan: 6, status: "Aktif", icon: "ShieldAlert" },
      { id: "hk-7", kode: "LAINNYA",    label: "Lainnya",    tone: "slate",   urutan: 7, status: "Aktif", icon: "Users" },
    ],
  },
  {
    key: "profesi-edukator",
    label: "Profesi Edukator",
    deskripsi: "Profesi tenaga kesehatan yang memberikan edukasi pasien.",
    icon: User2,
    konsumen: ["EdukasiPane IGD", "DischargeEdukasi RI", "Konseling apoteker"],
    entries: [
      { id: "pe-1", kode: "DOKTER",       label: "Dokter",       tone: "violet",  urutan: 1, status: "Aktif", icon: "Stethoscope" },
      { id: "pe-2", kode: "PERAWAT",      label: "Perawat",      tone: "sky",     urutan: 2, status: "Aktif", icon: "Heart" },
      { id: "pe-3", kode: "APOTEKER",     label: "Apoteker",     tone: "emerald", urutan: 3, status: "Aktif", icon: "Pill" },
      { id: "pe-4", kode: "AHLI_GIZI",    label: "Ahli Gizi",    tone: "teal",    urutan: 4, status: "Aktif", icon: "Sparkles" },
      { id: "pe-5", kode: "FISIOTERAPIS", label: "Fisioterapis", tone: "orange",  urutan: 5, status: "Aktif", icon: "Activity" },
      { id: "pe-6", kode: "PSIKOLOG",     label: "Psikolog",     tone: "indigo",  urutan: 6, status: "Aktif", icon: "Brain" },
    ],
  },
  {
    key: "rute-obat",
    label: "Rute Pemberian Obat",
    deskripsi: "Cara pemberian obat. Catatan: master dasar ada di Katalog Obat. Disimpan di sini untuk kompatibilitas mock asesmen.",
    icon: Pill,
    konsumen: ["AsesmenMedis (rekonsiliasi)", "Resep order", "MAR"],
    entries: [
      { id: "ro-1",  kode: "ORAL",       label: "Oral / PO",         deskripsi: "Per oral / mulut",                tone: "emerald", urutan: 1, status: "Aktif", icon: "Pill" },
      { id: "ro-2",  kode: "IV",         label: "Intravena (IV)",    deskripsi: "Injeksi melalui vena",            tone: "rose",    urutan: 2, status: "Aktif", icon: "Syringe" },
      { id: "ro-3",  kode: "IM",         label: "Intramuskular (IM)", deskripsi: "Injeksi ke otot",                tone: "orange",  urutan: 3, status: "Aktif", icon: "Syringe" },
      { id: "ro-4",  kode: "SC",         label: "Subkutan (SC)",     deskripsi: "Injeksi bawah kulit",             tone: "amber",   urutan: 4, status: "Aktif", icon: "Syringe" },
      { id: "ro-5",  kode: "SUBLINGUAL", label: "Sublingual",        deskripsi: "Diletakkan di bawah lidah",       tone: "teal",    urutan: 5, status: "Aktif", icon: "Hand" },
      { id: "ro-6",  kode: "TOPIKAL",    label: "Topikal",           deskripsi: "Dioleskan di kulit",              tone: "sky",     urutan: 6, status: "Aktif", icon: "Hand" },
      { id: "ro-7",  kode: "INHALASI",   label: "Inhalasi",          deskripsi: "Dihirup melalui saluran nafas",   tone: "indigo",  urutan: 7, status: "Aktif", icon: "Wind" },
      { id: "ro-8",  kode: "REKTAL",     label: "Rektal",            deskripsi: "Melalui anus (suppositoria)",     tone: "violet",  urutan: 8, status: "Aktif", icon: "Droplet" },
      { id: "ro-9",  kode: "NASAL",      label: "Nasal",             deskripsi: "Melalui hidung (spray/tetes)",    tone: "sky",     urutan: 9, status: "Aktif", icon: "Wind" },
      { id: "ro-10", kode: "NGT",        label: "Per NGT",           deskripsi: "Melalui Nasogastric Tube",        tone: "slate",   urutan: 10, status: "Aktif", icon: "Droplet" },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────

export function getGroupByKey(key: StatusEnumKey): EnumGroup | undefined {
  return STATUS_ENUM_GROUPS.find((g) => g.key === key);
}

export function emptyEnumEntry(maxUrutan = 0): EnumEntry {
  return {
    id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    kode: "",
    label: "",
    deskripsi: "",
    tone: "slate",
    urutan: maxUrutan + 1,
    status: "Aktif",
  };
}

export function isEnumEntryValid(e: EnumEntry): boolean {
  return e.kode.trim() !== "" && e.label.trim() !== "";
}

export function countActiveEntries(group: EnumGroup): number {
  return group.entries.filter((e) => e.status === "Aktif").length;
}
