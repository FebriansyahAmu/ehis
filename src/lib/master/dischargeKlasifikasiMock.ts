/**
 * Master Discharge Klasifikasi — katalog komponen workflow discharge planning RI.
 *
 * 5 sub-koleksi dengan **shape berbeda**:
 *   1. Homecare Services    → flat list (kode + label + deskripsi)
 *   2. Alat Bantu Pulang    → flat list (kode + label + deskripsi)
 *   3. Checklist Template   → flat list + flag `required` (wajib di-checklist H-1 pulang)
 *   4. Phase Planning       → 3 fase fixed (sky/emerald/amber) × target items per fase
 *   5. Risiko Readmisi      → 3 parameter × value option × output level (RENDAH/SEDANG/TINGGI)
 *
 * Konsumen: DischargePlanTab + PasienPulangTab (Rawat Inap).
 * Replace target: dischargeShared.ts HOMECARE_OPTIONS / ALAT_BANTU_OPTIONS / CHECKLIST_TEMPLATE /
 * STEP_PHASES / calcRisikoReadmisi().
 */

import {
  HeartPulse, Wrench, ListChecks, Workflow, ShieldAlert,
  type LucideIcon,
} from "lucide-react";

// ── Sub-collection keys ──────────────────────────────────

export type DischargeSubKey =
  | "homecare"
  | "alat-bantu"
  | "checklist"
  | "phase-planning"
  | "risiko-readmisi";

// ── Shape 1: Flat entry (homecare, alat-bantu, checklist) ─

export interface DischargeListEntry {
  id: string;
  kode: string;
  label: string;
  deskripsi?: string;
  urutan: number;
  status: "Aktif" | "NonAktif";
  /** Hanya dipakai oleh Checklist Template */
  required?: boolean;
  /** Hanya dipakai oleh Checklist Template */
  sublabel?: string;
}

// ── Shape 2: Phase Planning ──────────────────────────────

export type PhaseColor = "sky" | "emerald" | "amber";

export interface PhaseTargetItem {
  id: string;
  label: string;
  deskripsi?: string;
}

export interface PhaseDefinition {
  id: string;
  fase: string;
  desc: string;
  standar: string;
  color: PhaseColor;
  urutan: number;
  targets: PhaseTargetItem[];
}

export const PHASE_COLOR_CFG: Record<PhaseColor, {
  label: string;
  stripe: string;
  softBg: string;
  softText: string;
  border: string;
  dot: string;
  ring: string;
}> = {
  sky: {
    label: "Sky",
    stripe: "bg-sky-500",
    softBg: "bg-sky-50",
    softText: "text-sky-700",
    border: "border-sky-200",
    dot: "bg-sky-500",
    ring: "ring-sky-200",
  },
  emerald: {
    label: "Emerald",
    stripe: "bg-emerald-500",
    softBg: "bg-emerald-50",
    softText: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    ring: "ring-emerald-200",
  },
  amber: {
    label: "Amber",
    stripe: "bg-amber-500",
    softBg: "bg-amber-50",
    softText: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    ring: "ring-amber-200",
  },
};

// ── Shape 3: Risiko Readmisi (rule engine) ───────────────

export type RisikoLevel = "RENDAH" | "SEDANG" | "TINGGI";

export type RisikoParameterKey =
  | "dukungan-keluarga"
  | "kepatuhan-obat"
  | "riwayat-readmisi";

export interface RisikoParameter {
  key: RisikoParameterKey;
  label: string;
  deskripsi: string;
  /** Value options yang bisa dipilih untuk parameter ini saat asesmen */
  options: string[];
}

export interface RisikoRule {
  id: string;
  parameter: RisikoParameterKey;
  /** Nilai parameter yang memicu rule ini (harus salah satu dari `options`) */
  value: string;
  /** Output level kalau rule terpicu */
  level: RisikoLevel;
}

export const RISIKO_LEVEL_CFG: Record<RisikoLevel, {
  label: string;
  softBg: string;
  softText: string;
  border: string;
  dot: string;
  ring: string;
  priority: number;
}> = {
  RENDAH: {
    label: "RENDAH",
    softBg: "bg-emerald-50",
    softText: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    ring: "ring-emerald-200",
    priority: 1,
  },
  SEDANG: {
    label: "SEDANG",
    softBg: "bg-amber-50",
    softText: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    ring: "ring-amber-200",
    priority: 2,
  },
  TINGGI: {
    label: "TINGGI",
    softBg: "bg-rose-50",
    softText: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
    ring: "ring-rose-200",
    priority: 3,
  },
};

export const RISIKO_LEVEL_ORDER: RisikoLevel[] = ["RENDAH", "SEDANG", "TINGGI"];

// ── State container ──────────────────────────────────────

export interface DischargeState {
  homecare: DischargeListEntry[];
  alatBantu: DischargeListEntry[];
  checklist: DischargeListEntry[];
  phases: PhaseDefinition[];
  risikoParameters: RisikoParameter[];
  risikoRules: RisikoRule[];
}

// ── Sub-collection descriptors ───────────────────────────

export interface DischargeSubDescriptor {
  key: DischargeSubKey;
  label: string;
  shortLabel: string;
  deskripsi: string;
  icon: LucideIcon;
  /** Lokasi/komponen yang konsumsi data ini */
  konsumen: string[];
}

export const DISCHARGE_SUBS: DischargeSubDescriptor[] = [
  {
    key: "homecare",
    label: "Homecare Services",
    shortLabel: "Homecare",
    deskripsi: "Jenis layanan perawatan rumah pasca-discharge — perawatan luka, injeksi, fisioterapi, dll.",
    icon: HeartPulse,
    konsumen: ["DischargePlanTab (RI)", "PasienPulangTab (RI)"],
  },
  {
    key: "alat-bantu",
    label: "Alat Bantu Pulang",
    shortLabel: "Alat Bantu",
    deskripsi: "Alat medis yang dibutuhkan pasien di rumah — kursi roda, oksigen konsentrator, nebulizer, dll.",
    icon: Wrench,
    konsumen: ["DischargePlanTab (RI)"],
  },
  {
    key: "checklist",
    label: "Checklist Template",
    shortLabel: "Checklist",
    deskripsi: "Daftar item yang harus dikonfirmasi sebelum pasien pulang — edukasi, obat, jaminan, transportasi.",
    icon: ListChecks,
    konsumen: ["DischargePlanTab (RI) — Step 4 Checklist"],
  },
  {
    key: "phase-planning",
    label: "Phase Discharge Planning",
    shortLabel: "Fase Planning",
    deskripsi: "Tahapan discharge planning sesuai SNARS — Hari 1-2 MRS, Sepanjang Rawat, H-1 Pulang.",
    icon: Workflow,
    konsumen: ["DischargePlanTab (RI) — Workflow Steps"],
  },
  {
    key: "risiko-readmisi",
    label: "Risiko Readmisi",
    shortLabel: "Risiko",
    deskripsi: "Rule engine perhitungan risiko readmisi — parameter dukungan keluarga, kepatuhan obat, riwayat.",
    icon: ShieldAlert,
    konsumen: ["DischargePlanTab (RI) — calcRisikoReadmisi()"],
  },
];

export function getSubByKey(key: DischargeSubKey): DischargeSubDescriptor {
  return DISCHARGE_SUBS.find((s) => s.key === key) ?? DISCHARGE_SUBS[0];
}

// ── Helpers ──────────────────────────────────────────────

export function emptyListEntry(maxUrutan: number, defaults?: Partial<DischargeListEntry>): DischargeListEntry {
  return {
    id: `dl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kode: "",
    label: "",
    deskripsi: "",
    urutan: maxUrutan + 1,
    status: "Aktif",
    ...defaults,
  };
}

export function isListEntryValid(e: DischargeListEntry): boolean {
  return e.kode.trim().length > 0 && e.label.trim().length > 0;
}

export function emptyTargetItem(): PhaseTargetItem {
  return {
    id: `pt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: "",
    deskripsi: "",
  };
}

export function emptyRisikoRule(parameter: RisikoParameterKey, value: string, level: RisikoLevel = "SEDANG"): RisikoRule {
  return {
    id: `rr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    parameter,
    value,
    level,
  };
}

/**
 * Live calculator: hitung level risiko maksimum dari rules yang cocok dengan asesmen.
 * Higher priority wins (TINGGI > SEDANG > RENDAH).
 */
export function computeRisikoLevel(
  asesmen: Partial<Record<RisikoParameterKey, string>>,
  rules: RisikoRule[],
): RisikoLevel {
  let maxPriority = 1;
  let result: RisikoLevel = "RENDAH";

  for (const rule of rules) {
    const asValue = asesmen[rule.parameter];
    if (asValue !== rule.value) continue;
    const priority = RISIKO_LEVEL_CFG[rule.level].priority;
    if (priority > maxPriority) {
      maxPriority = priority;
      result = rule.level;
    }
  }

  return result;
}

// ── Mock data ────────────────────────────────────────────

const HOMECARE_INITIAL: DischargeListEntry[] = [
  { id: "hc-01", kode: "PERAWATAN_LUKA",   label: "Perawatan Luka",       deskripsi: "Ganti perban, debridemen ringan, evaluasi penyembuhan luka operasi/dekubitus.",                  urutan: 1, status: "Aktif" },
  { id: "hc-02", kode: "INJEKSI_INFUS",    label: "Injeksi / Infus",      deskripsi: "Pemberian obat injeksi IV/IM/SC di rumah — antibiotik, analgetik, terapi cairan rumatan.",     urutan: 2, status: "Aktif" },
  { id: "hc-03", kode: "MONITORING_TTV",   label: "Monitoring TTV",       deskripsi: "Pemantauan rutin tanda vital — TD, nadi, suhu, RR, SpO2, gula darah harian.",                  urutan: 3, status: "Aktif" },
  { id: "hc-04", kode: "FISIOTERAPI",      label: "Fisioterapi",          deskripsi: "Rehabilitasi pasca-stroke, ortopedi, atau imobilisasi lama — latihan ROM, mobilisasi.",         urutan: 4, status: "Aktif" },
  { id: "hc-05", kode: "NEBULISASI",       label: "Nebulisasi",           deskripsi: "Pemberian obat inhalasi via nebulizer untuk pasien PPOK/asma/bronkitis kronis.",                urutan: 5, status: "Aktif" },
  { id: "hc-06", kode: "GANTI_KATETER",    label: "Ganti Kateter",        deskripsi: "Perawatan & ganti kateter urin tetap, suprapubik, atau intermittent self-cath.",                urutan: 6, status: "Aktif" },
  { id: "hc-07", kode: "NGT_CARE",         label: "NGT Care",             deskripsi: "Perawatan & ganti selang NGT, pemberian nutrisi enteral, flushing rutin.",                       urutan: 7, status: "Aktif" },
  { id: "hc-08", kode: "STOMA_CARE",       label: "Stoma Care",           deskripsi: "Perawatan kolostomi, ileostomi, urostomi — ganti kantung, perawatan kulit peristoma.",          urutan: 8, status: "Aktif" },
  { id: "hc-09", kode: "EDUKASI_HOME",     label: "Edukasi Rumah",        deskripsi: "Sesi edukasi lanjutan di rumah — diet, mobilisasi, manajemen nyeri, deteksi tanda bahaya.",     urutan: 9, status: "Aktif" },
  { id: "hc-10", kode: "PALIATIF_RUMAH",   label: "Paliatif Rumah",       deskripsi: "Perawatan paliatif end-of-life di rumah — manajemen nyeri/sesak, support spiritual & psikologis.", urutan: 10, status: "Aktif" },
];

const ALAT_BANTU_INITIAL: DischargeListEntry[] = [
  { id: "ab-01", kode: "KURSI_RODA",       label: "Kursi Roda",                 deskripsi: "Pasien dengan mobilitas terbatas atau pasca-amputasi tungkai bawah.",                       urutan: 1, status: "Aktif" },
  { id: "ab-02", kode: "KRUK",             label: "Kruk / Tongkat",             deskripsi: "Pasien fraktur ekstremitas bawah atau ortopedi post-op yang masih bisa weight-bearing.",   urutan: 2, status: "Aktif" },
  { id: "ab-03", kode: "WALKER",           label: "Walker",                     deskripsi: "Pasien geriatri atau pasca-stroke dengan gangguan keseimbangan ringan.",                    urutan: 3, status: "Aktif" },
  { id: "ab-04", kode: "OKSIGEN_KONS",     label: "Oksigen Konsentrator",       deskripsi: "Pasien gagal nafas kronis, PPOK berat, hipoksemia berkepanjangan.",                         urutan: 4, status: "Aktif" },
  { id: "ab-05", kode: "NEBULIZER",        label: "Nebulizer",                  deskripsi: "Pasien asma/PPOK/bronkitis yang butuh inhalasi obat rutin di rumah.",                       urutan: 5, status: "Aktif" },
  { id: "ab-06", kode: "TENSIMETER",       label: "Tensimeter Digital",         deskripsi: "Pasien hipertensi atau kardiovaskular untuk monitoring TD harian.",                          urutan: 6, status: "Aktif" },
  { id: "ab-07", kode: "OXIMETER",         label: "Pulse Oximeter",             deskripsi: "Pasien pulmonary/post-COVID untuk monitoring saturasi oksigen.",                              urutan: 7, status: "Aktif" },
  { id: "ab-08", kode: "KATETER_URIN",     label: "Kateter Urine",              deskripsi: "Pasien retensi urin kronis atau gangguan neurogenic bladder.",                                urutan: 8, status: "Aktif" },
  { id: "ab-09", kode: "TEMPAT_TIDUR_RS",  label: "Tempat Tidur Pasien (Hospital Bed)", deskripsi: "Pasien terminal/bedridden — bed dengan posisi adjustable + side rail.",            urutan: 9, status: "Aktif" },
];

const CHECKLIST_INITIAL: DischargeListEntry[] = [
  { id: "ck-01", kode: "EDUKASI_DONE",     label: "Edukasi pasien & keluarga selesai",      sublabel: "Semua topik esensial sudah diberikan dan dipahami",                              urutan: 1,  status: "Aktif", required: true  },
  { id: "ck-02", kode: "REKON_OBAT",       label: "Rekonsiliasi obat final sudah dilakukan", sublabel: "Daftar obat pulang sudah diverifikasi oleh apoteker / DPJP",                  urutan: 2,  status: "Aktif", required: true  },
  { id: "ck-03", kode: "TANDA_BAHAYA",     label: "Pasien/keluarga memahami tanda bahaya",   sublabel: "Kondisi yang memerlukan kembali ke IGD sudah dijelaskan & dipahami",          urutan: 3,  status: "Aktif", required: true  },
  { id: "ck-04", kode: "BERKAS_JAMINAN",   label: "Berkas jaminan / BPJS / asuransi selesai", sublabel: "Administrasi kepulangan sudah diproses oleh tim kasir",                       urutan: 4,  status: "Aktif", required: true  },
  { id: "ck-05", kode: "TRANSPORTASI",     label: "Transportasi pulang sudah disiapkan",     sublabel: "Ambulans / kendaraan keluarga sudah dikonfirmasi dan siap",                    urutan: 5,  status: "Aktif", required: true  },
  { id: "ck-06", kode: "RESEP_SIAP",       label: "Resep obat pulang sudah disiapkan",       sublabel: "Resep sudah dikirim ke farmasi dan obat sudah dapat diambil keluarga",        urutan: 6,  status: "Aktif", required: true  },
  { id: "ck-07", kode: "KONTROL_JADWAL",   label: "Kontrol pertama sudah dijadwalkan",       sublabel: "Jadwal kontrol poliklinik sudah diberikan kepada pasien / keluarga",          urutan: 7,  status: "Aktif", required: true  },
  { id: "ck-08", kode: "ALAT_BANTU_READY", label: "Alat bantu / perlengkapan tersedia",      sublabel: "Alat bantu yang dibutuhkan di rumah sudah disiapkan keluarga",                urutan: 8,  status: "Aktif", required: false },
  { id: "ck-09", kode: "HOMECARE_ARRANGED",label: "Homecare sudah diarrange",                sublabel: "Perawatan luka / injeksi / fisioterapi rumah sudah dijadwalkan",              urutan: 9,  status: "Aktif", required: false },
  { id: "ck-10", kode: "FKTP_NOTIFIED",    label: "FKTP sudah dihubungi / dirujuk",          sublabel: "Puskesmas / faskes primer sudah mendapat informasi kepulangan pasien",        urutan: 10, status: "Aktif", required: false },
  { id: "ck-11", kode: "RESUME_MEDIS",     label: "Resume medis ditandatangani DPJP",        sublabel: "Resume medis sudah final dan ditandatangani DPJP untuk arsip pasien",        urutan: 11, status: "Aktif", required: true  },
];

const PHASES_INITIAL: PhaseDefinition[] = [
  {
    id: "ph-01",
    fase: "Hari 1–2 MRS",
    desc: "Dilakukan saat pasien masuk, dalam 24–48 jam pertama",
    standar: "SNARS ARK 5",
    color: "sky",
    urutan: 1,
    targets: [
      { id: "pt-1-1", label: "Asesmen awal kebutuhan discharge", deskripsi: "Identifikasi caregiver, kondisi rumah, dukungan keluarga." },
      { id: "pt-1-2", label: "Penilaian risiko readmisi awal",    deskripsi: "Skrining 3 parameter: dukungan, kepatuhan, riwayat." },
      { id: "pt-1-3", label: "Identifikasi DPJP & perawat PJ",    deskripsi: "Tetapkan tim yang bertanggung jawab atas planning." },
    ],
  },
  {
    id: "ph-02",
    fase: "Sepanjang Rawat",
    desc: "Diberikan bertahap setiap hari perawatan",
    standar: "SNARS HPK 2",
    color: "emerald",
    urutan: 2,
    targets: [
      { id: "pt-2-1", label: "Edukasi bertahap pasien & keluarga", deskripsi: "Topik per hari sesuai kondisi & kebutuhan." },
      { id: "pt-2-2", label: "Update rencana caregiver",            deskripsi: "Konfirmasi caregiver utama + kemampuannya." },
      { id: "pt-2-3", label: "Koordinasi tim multidisiplin",         deskripsi: "Dokter, perawat, apoteker, gizi, fisioterapi." },
      { id: "pt-2-4", label: "Persiapan administrasi & jaminan",     deskripsi: "Verifikasi BPJS/asuransi, kelengkapan dokumen." },
    ],
  },
  {
    id: "ph-03",
    fase: "H-1 Pulang",
    desc: "Konfirmasi kesiapan & checklist sehari sebelum kepulangan",
    standar: "SNARS ARK 3",
    color: "amber",
    urutan: 3,
    targets: [
      { id: "pt-3-1", label: "Rekonsiliasi obat final",          deskripsi: "Daftar obat pulang diverifikasi apoteker." },
      { id: "pt-3-2", label: "Checklist H-1 lengkap",            deskripsi: "Semua item required di Checklist Template terkonfirmasi." },
      { id: "pt-3-3", label: "Konfirmasi transportasi",          deskripsi: "Ambulans atau kendaraan keluarga siap." },
      { id: "pt-3-4", label: "Jadwal kontrol & rujukan FKTP",    deskripsi: "Tanggal kontrol + notifikasi puskesmas asal." },
    ],
  },
];

const RISIKO_PARAMETERS_INITIAL: RisikoParameter[] = [
  {
    key: "dukungan-keluarga",
    label: "Dukungan Keluarga",
    deskripsi: "Ketersediaan keluarga untuk mendampingi pasien pasca-pulang.",
    options: ["Ada & Mampu", "Ada tapi Terbatas", "Tidak Ada"],
  },
  {
    key: "kepatuhan-obat",
    label: "Kepatuhan Minum Obat (Riwayat)",
    deskripsi: "Riwayat kepatuhan pasien dalam minum obat pada perawatan sebelumnya.",
    options: ["Patuh", "Kadang", "Tidak Patuh"],
  },
  {
    key: "riwayat-readmisi",
    label: "Riwayat Readmisi",
    deskripsi: "Frekuensi readmisi (rawat inap ulang) dalam 6 bulan terakhir.",
    options: ["Tidak", "1x", ">1x"],
  },
];

const RISIKO_RULES_INITIAL: RisikoRule[] = [
  // TINGGI
  { id: "rr-1", parameter: "dukungan-keluarga", value: "Tidak Ada",         level: "TINGGI" },
  { id: "rr-2", parameter: "kepatuhan-obat",    value: "Tidak Patuh",       level: "TINGGI" },
  { id: "rr-3", parameter: "riwayat-readmisi",  value: ">1x",               level: "TINGGI" },
  // SEDANG
  { id: "rr-4", parameter: "dukungan-keluarga", value: "Ada tapi Terbatas", level: "SEDANG" },
  { id: "rr-5", parameter: "kepatuhan-obat",    value: "Kadang",            level: "SEDANG" },
  { id: "rr-6", parameter: "riwayat-readmisi",  value: "1x",                level: "SEDANG" },
  // RENDAH (default, optional eksplisit)
  { id: "rr-7", parameter: "dukungan-keluarga", value: "Ada & Mampu",       level: "RENDAH" },
  { id: "rr-8", parameter: "kepatuhan-obat",    value: "Patuh",             level: "RENDAH" },
  { id: "rr-9", parameter: "riwayat-readmisi",  value: "Tidak",             level: "RENDAH" },
];

export const DISCHARGE_INITIAL_STATE: DischargeState = {
  homecare:        HOMECARE_INITIAL,
  alatBantu:       ALAT_BANTU_INITIAL,
  checklist:       CHECKLIST_INITIAL,
  phases:          PHASES_INITIAL,
  risikoParameters: RISIKO_PARAMETERS_INITIAL,
  risikoRules:     RISIKO_RULES_INITIAL,
};
