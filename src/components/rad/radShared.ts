// Radiologi Module — Types, Config, Mock Data, Workflow Store
// Standard: SNARS AP 6 · PMK 1014/2008 · PMK 24/2020 · Perka BAPETEN No. 2/2018 · JCI AOP.6

// ── Types ─────────────────────────────────────────────────

export type RadStatus =
  | "Menunggu"          // Order placed, awaiting scheduling
  | "Dijadwalkan"       // Appointment set
  | "Verifikasi"        // Patient at radiology, SKP 1 identity check
  | "Persiapan"         // Patient prep (contrast, fasting, etc.)
  | "Akuisisi"          // Imaging in progress
  | "Expertise"         // Radiologist reading
  | "Verifikasi_Hasil"  // SpRad sign-off pending
  | "Selesai"           // Report released to medical record
  | "Ditolak";          // Exam cancelled / rejected

export type Modalitas =
  | "Konvensional"  // X-Ray / conventional radiography
  | "USG"           // Ultrasonography
  | "CT"            // CT Scan
  | "MRI"           // Magnetic Resonance Imaging
  | "Fluoroskopi"   // Fluoroscopy (HSG, Colon in Loop, etc.)
  | "Mammografi"    // Mammography
  | "DEXA";         // Bone Densitometry

export type UrgensisRad   = "CITO" | "Semi_Cito" | "Rutin";
export type UnitAsalRad   = "IGD" | "Rawat Inap" | "Rawat Jalan";
export type KontrasJenis  = "Iodinasi_IV" | "Iodinasi_Oral" | "Iodinasi_Rektal" | "Gadolinium" | "Tidak";
export type ReaksiGrade   = "Tidak Ada" | "Ringan" | "Sedang" | "Berat";
export type AlasanTolak   =
  | "Pasien Tidak Kooperatif" | "Kontraindikasi Medis"
  | "Alat Rusak" | "Pasien Menolak"
  | "Persiapan Tidak Memadai" | "Lainnya";

export type CriticalKategori =
  | "Pneumothorax Masif"       | "Perdarahan Intrakranial Akut"
  | "Diseksi Aorta"            | "PE Masif"
  | "Tension Pneumothorax"     | "Fraktur Servikal Instabil"
  | "Hemoperitoneum Masif"     | "Infark Miokard Akut";

// ── Interfaces ────────────────────────────────────────────

export interface RadOrderItem {
  id:          string;
  kode:        string;
  nama:        string;
  modalitas:   Modalitas;
  region:      string;
  withKontras: boolean;
}

export interface KontrasInfo {
  jenis:         KontrasJenis;
  dosis?:        string;
  kecepatan?:    string;
  premedikasi:   boolean;
  konsentSigned: boolean;
  reaksiIntra:   ReaksiGrade;
  catatan?:      string;
}

export interface DosisLog {
  ctdiVol?:      number;   // mGy — CT volume CT dose index
  dlp?:          number;   // mGy·cm — Dose-Length Product
  drlCtdiVol?:   number;   // DRL reference CTDIvol (PMK 1014/2008)
  drlDlp?:       number;   // DRL reference DLP
  dap?:          number;   // mGy·cm² — Dose-Area Product (fluoroscopy)
  waktuFluoro?:  number;   // seconds — fluoroscopy time
  doseEntrance?: number;   // mGy — entrance surface dose (conventional)
  drlEntrance?:  number;   // DRL reference entrance dose
}

export interface ProteksiChecklist {
  apron:           boolean;
  collar:          boolean;
  gonadShield:     boolean;
  thyroidShield?:  boolean;
}

export interface CriticalFinding {
  id:          string;
  kategori:    CriticalKategori;
  deskripsi:   string;
  metode?:     "Telepon" | "SMS" | "WhatsApp" | "Langsung";
  namaDokter?: string;
  jamLapor?:   string;
  pelapor?:    string;
  confirmed:   boolean;
}

export interface RadTimestamps {
  order?:           string;
  dijadwalkan?:     string;
  verifikasi?:      string;
  persiapan?:       string;
  akuisisiMulai?:   string;
  akuisisiSelesai?: string;
  expertise?:       string;
  verifikasiHasil?: string;
  rilis?:           string;
}

export interface PersiapanData {
  jadwal?:   string;
  protap:    string[];
  kontras?:  KontrasInfo;
  catatan?:  string;
  verified:  boolean;
}

export interface AkuisisiData {
  // CT
  kvp?:       number;
  mas?:       number;
  fov?:       string;
  slice?:     string;
  // USG
  probe?:     string;
  frekuensi?: string;
  // MRI
  sekuens?:   string[];
  // X-Ray / Konvensional
  kv?:        number;
  mAs?:       number;
  // Common
  radiografer: string;
  operator?:   string;
  proteksi:    ProteksiChecklist;
  dosis?:      DosisLog;
  penolakan?:  { alasan: AlasanTolak; catatan?: string };
  isDone:      boolean;
}

export interface EkspertasiData {
  indikasiKlinis:   string;
  teknik:           string;
  temuan:           string;
  kesan:            string;
  saran?:           string;
  spradNama:        string;
  spradSIP:         string;
  criticalFindings: CriticalFinding[];
  isDraft:          boolean;
  isDone:           boolean;
}

export interface ValidasiData {
  catatan?:     string;
  checkKlinis:  boolean;
  checkLengkap: boolean;
  validator:    string;
  waktu?:       string;
  isDone:       boolean;
}

export interface RadOrder {
  id:            string;
  noOrder:       string;
  noRM:          string;
  namaPasien:    string;
  tanggalLahir:  string;
  usia:          number;
  gender:        "L" | "P";
  tanggal:       string;
  jam:           string;
  dokter:        string;
  unitAsal:      UnitAsalRad;
  ruangan?:      string;
  noBed?:        string;
  prioritas:     UrgensisRad;
  status:        RadStatus;
  items:         RadOrderItem[];
  diterima_oleh?: string;
  persiapan?:    PersiapanData;
  akuisisi?:     AkuisisiData;
  ekspertasi?:   EkspertasiData;
  validasi?:     ValidasiData;
  catatan?:      string;
  timestamps:    RadTimestamps;
}

export interface RadWorkflowData {
  status?:        RadStatus;
  diterima_oleh?: string;
  persiapan?:     PersiapanData;
  akuisisi?:      AkuisisiData;
  ekspertasi?:    EkspertasiData;
  validasi?:      ValidasiData;
  timestamps?:    Partial<RadTimestamps>;
}

// ── Config Maps ───────────────────────────────────────────

export const RAD_STATUS_CFG: Record<RadStatus, {
  label: string; badge: string; dot: string; step: number;
}> = {
  Menunggu:         { label: "Menunggu",          badge: "bg-slate-100 text-slate-600",     dot: "bg-slate-400",   step: 0 },
  Dijadwalkan:      { label: "Dijadwalkan",        badge: "bg-sky-100 text-sky-700",         dot: "bg-sky-500",     step: 1 },
  Verifikasi:       { label: "Verifikasi",         badge: "bg-violet-100 text-violet-700",   dot: "bg-violet-500",  step: 2 },
  Persiapan:        { label: "Persiapan Pasien",   badge: "bg-amber-100 text-amber-700",     dot: "bg-amber-500",   step: 3 },
  Akuisisi:         { label: "Akuisisi",           badge: "bg-orange-100 text-orange-700",   dot: "bg-orange-500",  step: 4 },
  Expertise:        { label: "Expertise SpRad",    badge: "bg-teal-100 text-teal-700",       dot: "bg-teal-500",    step: 5 },
  Verifikasi_Hasil: { label: "Verifikasi Hasil",   badge: "bg-cyan-100 text-cyan-700",       dot: "bg-cyan-500",    step: 6 },
  Selesai:          { label: "Selesai",            badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", step: 7 },
  Ditolak:          { label: "Ditolak",            badge: "bg-rose-100 text-rose-700",       dot: "bg-rose-500",    step: -1 },
};

export const MODALITAS_CFG: Record<Modalitas, { label: string; textColor: string; bgColor: string }> = {
  Konvensional: { label: "X-Ray",        textColor: "text-slate-700",  bgColor: "bg-slate-100"  },
  USG:          { label: "USG",          textColor: "text-sky-700",    bgColor: "bg-sky-100"    },
  CT:           { label: "CT Scan",      textColor: "text-teal-700",   bgColor: "bg-teal-100"   },
  MRI:          { label: "MRI",          textColor: "text-violet-700", bgColor: "bg-violet-100" },
  Fluoroskopi:  { label: "Fluoroskopi",  textColor: "text-amber-700",  bgColor: "bg-amber-100"  },
  Mammografi:   { label: "Mammografi",   textColor: "text-rose-700",   bgColor: "bg-rose-100"   },
  DEXA:         { label: "Densitometri", textColor: "text-orange-700", bgColor: "bg-orange-100" },
};

export const URGENSI_CFG: Record<UrgensisRad, { label: string; badge: string; stripe: string; border: string }> = {
  CITO:      { label: "CITO",      badge: "bg-rose-500 text-white",      stripe: "bg-rose-500",  border: "border-rose-200"  },
  Semi_Cito: { label: "Semi-Cito", badge: "bg-amber-500 text-white",     stripe: "bg-amber-500", border: "border-amber-200" },
  Rutin:     { label: "Rutin",     badge: "bg-slate-200 text-slate-700", stripe: "bg-teal-500",  border: "border-slate-200" },
};

export const TAT_TARGET_MENIT: Record<UrgensisRad, number> = {
  CITO:      60,
  Semi_Cito: 180,
  Rutin:     360,
};

export const PROTAP_MAP: Record<Modalitas, string[]> = {
  Konvensional: ["Lepas aksesori logam di area pemeriksaan", "Posisikan sesuai proyeksi yang diminta"],
  USG:          ["Puasa 4–6 jam (abdomen)", "Kandung kemih penuh (pelvis/obstetri)", "Tidak ada persiapan untuk USG tiroid/payudara"],
  CT:           ["Puasa minimal 4 jam", "Lepas aksesori logam", "Cek fungsi ginjal (GFR) jika pakai kontras", "Informed consent kontras"],
  MRI:          ["Lepas semua logam/aksesori ferromagnetik", "Skrining implan/pacemaker/IUD logam", "Puasa 4 jam (abdomen/pelvis)", "Informed consent kontras gadolinium jika perlu"],
  Fluoroskopi:  ["Persiapan sesuai jenis prosedur (puasa/klisma)", "Informed consent tindakan invasif"],
  Mammografi:   ["Jangan pakai deodoran/lotion area aksila", "Lepas bra dan aksesori atas"],
  DEXA:         ["Tidak ada persiapan khusus", "Informasikan jika ada implan logam"],
};

export const CRITICAL_KATEGORI_LIST: CriticalKategori[] = [
  "Pneumothorax Masif", "Tension Pneumothorax", "Perdarahan Intrakranial Akut",
  "Diseksi Aorta", "PE Masif", "Fraktur Servikal Instabil",
  "Hemoperitoneum Masif", "Infark Miokard Akut",
];

// ── Mock Data ─────────────────────────────────────────────

const ORDERS_BASE: RadOrder[] = [
  {
    id: "rad-001",
    noOrder: "RAD/2026/05/0451",
    noRM: "RM-2025-005",
    namaPasien: "Joko Prasetyo",
    tanggalLahir: "1971-03-12",
    usia: 55,
    gender: "L",
    tanggal: "2026-05-18",
    jam: "08:30",
    dokter: "dr. Fitri Handayani Sp.EM",
    unitAsal: "IGD",
    ruangan: "IGD",
    noBed: "2A",
    prioritas: "CITO",
    status: "Akuisisi",
    diterima_oleh: "Doni Kurniawan, AMR",
    items: [{
      id: "ri-001a", kode: "RAD001", nama: "Foto Thorax AP",
      modalitas: "Konvensional", region: "Thorax", withKontras: false,
    }],
    persiapan: {
      jadwal: "2026-05-18T08:45:00",
      protap: ["Lepas aksesori logam di area pemeriksaan", "Posisikan sesuai proyeksi yang diminta"],
      verified: true,
    },
    catatan: "Sesak napas berat — curiga pneumonia / pneumothorax",
    timestamps: {
      order: "2026-05-18T08:30:00",
      dijadwalkan: "2026-05-18T08:35:00",
      verifikasi: "2026-05-18T08:42:00",
      persiapan: "2026-05-18T08:45:00",
      akuisisiMulai: "2026-05-18T08:48:00",
    },
  },
  {
    id: "rad-002",
    noOrder: "RAD/2026/05/0449",
    noRM: "RM-2025-012",
    namaPasien: "Siti Rahayu",
    tanggalLahir: "1994-07-22",
    usia: 32,
    gender: "P",
    tanggal: "2026-05-18",
    jam: "08:15",
    dokter: "dr. Ahmad Yusuf Sp.EM",
    unitAsal: "IGD",
    ruangan: "IGD",
    noBed: "5C",
    prioritas: "Semi_Cito",
    status: "Verifikasi",
    items: [{
      id: "ri-002a", kode: "RAD015", nama: "USG Abdomen",
      modalitas: "USG", region: "Abdomen", withKontras: false,
    }],
    catatan: "Nyeri perut kanan bawah akut — dd/ appendicitis",
    timestamps: {
      order: "2026-05-18T08:15:00",
      dijadwalkan: "2026-05-18T08:25:00",
      verifikasi: "2026-05-18T09:10:00",
    },
  },
  {
    id: "rad-003",
    noOrder: "RAD/2026/05/0445",
    noRM: "RM-2025-003",
    namaPasien: "Ahmad Fauzi",
    tanggalLahir: "1963-09-14",
    usia: 63,
    gender: "L",
    tanggal: "2026-05-18",
    jam: "07:00",
    dokter: "dr. Budi Santoso Sp.JP",
    unitAsal: "Rawat Inap",
    ruangan: "Jantung",
    noBed: "3B",
    prioritas: "Rutin",
    status: "Expertise",
    diterima_oleh: "Rina Wulandari, AMR",
    items: [{
      id: "ri-003a", kode: "RAD031", nama: "CT Scan Thorax dengan Kontras",
      modalitas: "CT", region: "Thorax", withKontras: true,
    }],
    persiapan: {
      jadwal: "2026-05-18T09:00:00",
      protap: ["Puasa minimal 4 jam", "Lepas aksesori logam", "Cek fungsi ginjal (GFR) jika pakai kontras", "Informed consent kontras"],
      kontras: {
        jenis: "Iodinasi_IV",
        dosis: "80 mL",
        kecepatan: "2.5 mL/s",
        premedikasi: false,
        konsentSigned: true,
        reaksiIntra: "Tidak Ada",
      },
      verified: true,
    },
    akuisisi: {
      kvp: 120, mas: 250, fov: "36 cm", slice: "1.25 mm",
      radiografer: "Rina Wulandari, AMR",
      proteksi: { apron: false, collar: false, gonadShield: false },
      dosis: { ctdiVol: 18.4, dlp: 620, drlCtdiVol: 30, drlDlp: 900 },
      isDone: true,
    },
    catatan: "GJK NYHA III — evaluasi efusi pleura dan kardiomegali",
    timestamps: {
      order: "2026-05-18T07:00:00",
      dijadwalkan: "2026-05-18T08:00:00",
      verifikasi: "2026-05-18T08:55:00",
      persiapan: "2026-05-18T09:00:00",
      akuisisiMulai: "2026-05-18T09:20:00",
      akuisisiSelesai: "2026-05-18T09:35:00",
      expertise: "2026-05-18T10:00:00",
    },
  },
  {
    id: "rad-004",
    noOrder: "RAD/2026/05/0452",
    noRM: "RM-2025-007",
    namaPasien: "Bambang Supriyanto",
    tanggalLahir: "1978-11-30",
    usia: 48,
    gender: "L",
    tanggal: "2026-05-18",
    jam: "09:00",
    dokter: "dr. Hendra Wijaya Sp.EM",
    unitAsal: "Rawat Inap",
    ruangan: "ICU",
    noBed: "ICU-2",
    prioritas: "Rutin",
    status: "Menunggu",
    items: [{
      id: "ri-004a", kode: "RAD003", nama: "Foto BNO 3 Posisi",
      modalitas: "Konvensional", region: "Abdomen", withKontras: false,
    }],
    catatan: "Syok sepsis — evaluasi ileus / perforasi",
    timestamps: {
      order: "2026-05-18T09:00:00",
    },
  },
  {
    id: "rad-005",
    noOrder: "RAD/2026/05/0440",
    noRM: "RM-2026-041",
    namaPasien: "Dewi Anggraini",
    tanggalLahir: "1981-04-05",
    usia: 45,
    gender: "P",
    tanggal: "2026-05-18",
    jam: "06:30",
    dokter: "dr. Sari Dewi Sp.PD",
    unitAsal: "Rawat Jalan",
    ruangan: "Poli Interna",
    prioritas: "Rutin",
    status: "Selesai",
    diterima_oleh: "Agus Prabowo, AMR",
    items: [{
      id: "ri-005a", kode: "RAD022", nama: "USG Tiroid",
      modalitas: "USG", region: "Leher", withKontras: false,
    }],
    persiapan: {
      jadwal: "2026-05-18T07:00:00",
      protap: ["Tidak ada persiapan khusus", "Lepas aksesori leher"],
      verified: true,
    },
    akuisisi: {
      probe: "Linear 7.5 MHz",
      frekuensi: "7.5 MHz",
      radiografer: "Agus Prabowo, AMR",
      proteksi: { apron: false, collar: false, gonadShield: false },
      isDone: true,
    },
    ekspertasi: {
      indikasiKlinis: "Evaluasi nodul tiroid, TSH ↑",
      teknik: "USG tiroid B-mode dan power Doppler menggunakan probe linear 7.5 MHz",
      temuan: "Lobus kanan: ukuran 4.8×2.3×2.1 cm, tampak nodul hipoekogenik 1.2 cm di pole inferior, tepi tidak rata, vaskularisasi sentral. Lobus kiri: ukuran normal 3.8×1.8×1.6 cm, echotexture homogen. Isthmus 0.4 cm. Tidak tampak limfadenopati servikal.",
      kesan: "Nodul tiroid lobus kanan suspek maligna (TI-RADS 4A). Saran FNAB terpandu USG.",
      saran: "FNAB terpandu USG tiroid lobus kanan",
      spradNama: "dr. Wirawan Kusuma Sp.Rad",
      spradSIP: "SIP/RAD/2024/0892",
      criticalFindings: [],
      isDraft: false,
      isDone: true,
    },
    validasi: {
      catatan: "Laporan divalidasi. Hasil dirilis ke rekam medis.",
      checkKlinis: true,
      checkLengkap: true,
      validator: "dr. Wirawan Kusuma Sp.Rad",
      waktu: "2026-05-18T08:15:00",
      isDone: true,
    },
    catatan: "Kontrol rutin evaluasi nodul tiroid — riwayat TSH ↑ 3 bulan lalu",
    timestamps: {
      order: "2026-05-18T06:30:00",
      dijadwalkan: "2026-05-18T06:45:00",
      verifikasi: "2026-05-18T07:00:00",
      persiapan: "2026-05-18T07:05:00",
      akuisisiMulai: "2026-05-18T07:10:00",
      akuisisiSelesai: "2026-05-18T07:35:00",
      expertise: "2026-05-18T07:45:00",
      verifikasiHasil: "2026-05-18T08:10:00",
      rilis: "2026-05-18T08:15:00",
    },
  },
];

// ── Workflow Store ─────────────────────────────────────────

const workflowStore = new Map<string, RadWorkflowData>();

export function updateRadWorkflow(id: string, data: RadWorkflowData) {
  const existing = workflowStore.get(id) ?? {};
  workflowStore.set(id, {
    ...existing,
    ...data,
    timestamps: { ...existing.timestamps, ...data.timestamps },
  });
}

function mergeOrder(base: RadOrder): RadOrder {
  const overlay = workflowStore.get(base.id);
  if (!overlay) return base;
  return {
    ...base,
    ...overlay,
    timestamps: { ...base.timestamps, ...overlay.timestamps },
  };
}

// ── Public API ────────────────────────────────────────────

export function deriveRadOrders(): RadOrder[] {
  return ORDERS_BASE.map(mergeOrder);
}

export function getRadOrderById(id: string): RadOrder | undefined {
  const base = ORDERS_BASE.find((o) => o.id === id);
  return base ? mergeOrder(base) : undefined;
}

// ── Utilities ─────────────────────────────────────────────

export function calcTATMenit(order: RadOrder): number | null {
  const start = order.timestamps.order;
  if (!start) return null;
  const end = order.timestamps.rilis ?? new Date().toISOString();
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000);
}

export function getTATStatus(order: RadOrder): "ok" | "warning" | "over" {
  const elapsed = calcTATMenit(order);
  if (elapsed === null) return "ok";
  const target = TAT_TARGET_MENIT[order.prioritas];
  if (elapsed <= target * 0.75) return "ok";
  if (elapsed <= target) return "warning";
  return "over";
}

export function hasCriticalFinding(order: RadOrder): boolean {
  return (order.ekspertasi?.criticalFindings ?? []).some((f) => !f.confirmed);
}

export function getStatusStep(status: RadStatus): number {
  return RAD_STATUS_CFG[status].step;
}

export function fmtTimestamp(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function fmtDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
