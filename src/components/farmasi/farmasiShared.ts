import {
  ORDERS_MOCK,
  type Order,
} from "@/components/shared/medical-records/daftarOrder/daftarOrderShared";
import type { ResepOrderFarmasiDTO, ResepTelaahDTO, ResepDispensingDTO, TelaahAnswers } from "@/lib/schemas/resep/resep";

export type { TelaahAnswers };

// ── Types ─────────────────────────────────────────────────

// "Menunggu" = belum diterima Farmasi (non-Poli, reception). "Diterima" = sudah diterima, menunggu telaah (worklist).
export type FarmasiStatus  = "Menunggu" | "Diterima" | "Ditelaah" | "Siap Diserahkan" | "Selesai" | "Dikembalikan" | "Dibatalkan";
export type DepoTujuan     = "Depo IGD" | "Apotek RI" | "Apotek RJ";
export type UnitAsal       = "IGD" | "Rawat Inap" | "Rawat Jalan";
export type PrioritasOrder = "CITO" | "Segera" | "Rutin";
export type IntervensiType = "Dose_Adjustment" | "Substitusi" | "Interaksi" | "Efek_Samping" | "Rekomendasi";
export type TingkatAlergi  = "Ringan" | "Sedang" | "Berat";

export interface AllergiPasien {
  alergen: string;
  reaksi:  string;
  tingkat: TingkatAlergi;
}

export interface SubstitusiItem {
  itemId:      string;
  namaAsli:    string;
  namaGenerik: string;
  alasan?:     string;
}

export interface FarmasiOrderItem {
  id:             string;
  namaObat:       string;
  kodeObat:       string;
  dosis:          string;
  dosisSekali?:   string;
  signa:          string;
  jumlah:         number;
  rute:           string;
  aturanPakai?:   string;
  kategori:       "Reguler" | "Narkotika" | "Psikotropika";
  isHAM:          boolean;
  isLASA?:        boolean;
  isFormularium?: boolean;
  lotNo?:         string;
  expiredDate?:   string;
  labelDicetak?:  boolean;
  stokTersedia?:  number;
  hargaSatuan?:   number;
  satuanObat?:    string;
}

export interface TelaahCheck {
  administratif: boolean;
  farmasetis:    boolean;
  klinis:        boolean;
}

export interface TelaahData {
  checks:                     TelaahCheck;      // ringkasan lulus per-aspek (administratif/farmasetis/klinis)
  answers?:                   TelaahAnswers;    // jawaban per-item (linkId→bool) faithful QuestionnaireResponse
  catatan?:                   string;
  apoteker:                   string;
  waktu:                      string;
  result:                     "Disetujui" | "Dikembalikan";
  alasanKembali?:             string;
  substitusi?:                SubstitusiItem[];
  justifikasiNonFormularium?: Record<string, string>;
  lasaKonfirmasi?:            boolean;
}

export interface SerahTerima {
  waktu:             string;
  perawatPenerima:   string;
  apoteker:          string;
  catatan?:          string;
  petugas2NAR?:      string;
  verifikatorAkhir?: string;
  // detail dispensing (untuk persist → MedicationDispense)
  edukasi?:           string[];
  semuaLabelDicetak?: boolean;
  lasaKonfirmasi?:    boolean;
  narDoubleCheck?:    boolean;
}

export interface OrderTimestamps {
  masuk:        string;
  telaah?:      string;
  dispensing?:  string;
  serahTerima?: string;
}

export interface CatatanFarmasi {
  id:            string;
  tipe:          IntervensiType;
  isi:           string;
  rekomendasi?:  string;
  dokterDituju?: string;
  apoteker:      string;
  waktu:         string;
}

export interface FarmasiOrder {
  id:             string;
  kunjunganId?:   string;           // UUID kunjungan (DB) → CPPT terintegrasi & rekam medis pasien
  noOrder:        string;
  noRM:           string;
  namaPasien:     string;
  unit:           UnitAsal;
  depo:           DepoTujuan;       // sintetis: penanda asal order per-unit (warna/filter)
  depoNama?:      string;           // depo Farmasi NYATA (dari DB) — tampil di field "Depo:"
  dokterPeminta:  string;
  tanggal:        string;
  jam:            string;
  status:         FarmasiStatus;
  prioritas:      PrioritasOrder;
  /** Obat pulang (discharge medication) dari tab Pasien Pulang — badge khusus worklist. */
  isObatPulang?:  boolean;
  hasHAM:         boolean;
  items:          FarmasiOrderItem[];
  telaah?:        TelaahData;
  serahTerima?:   SerahTerima;
  catatan?:       CatatanFarmasi[];
  alergiPasien?:  AllergiPasien[];
  timestamps?:    OrderTimestamps;
  // ── Konteks resep (untuk cetak) — terisi dari DB (mapDbResepOrder), kosong utk mock ──
  catatanResep?:     string;
  penulisKontak?:    string;
  kondisiGinjal?:    string;
  kondisiKehamilan?: string;
  kondisiMenyusui?:  string;
  tteToken?:         string;
  tteSignedBy?:      string;
  tteSignedAt?:      string; // ISO
}

// ── Config maps ───────────────────────────────────────────

export const STATUS_CFG: Record<FarmasiStatus, {
  label:     string;
  badge:     string;
  dot:       string;
  step:      number;
  action:    string;
  actionCls: string;
}> = {
  Menunggu:          { label: "Belum Diterima",   badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",        dot: "bg-slate-400",   step: 0, action: "Terima",     actionCls: "bg-sky-600 hover:bg-sky-700 text-white"           },
  Diterima:          { label: "Menunggu Telaah",  badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",         dot: "bg-amber-400",   step: 0, action: "Telaah",     actionCls: "bg-sky-600 hover:bg-sky-700 text-white"           },
  Ditelaah:          { label: "Siap Dispensasi",  badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",               dot: "bg-sky-500",     step: 1, action: "Dispensasi", actionCls: "bg-sky-600 hover:bg-sky-700 text-white"           },
  "Siap Diserahkan": { label: "Siap Diserahkan",  badge: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",            dot: "bg-cyan-500",    step: 2, action: "Serahkan",   actionCls: "bg-emerald-600 hover:bg-emerald-700 text-white"   },
  Selesai:           { label: "Diserahkan",        badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",   dot: "bg-emerald-500", step: 3, action: "Detail",     actionCls: "bg-slate-100 hover:bg-slate-200 text-slate-700"   },
  Dikembalikan:      { label: "Dikembalikan",      badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",            dot: "bg-rose-500",    step:-1, action: "Detail",     actionCls: "bg-slate-100 hover:bg-slate-200 text-slate-700"   },
  Dibatalkan:        { label: "Dibatalkan",        badge: "bg-rose-100 text-rose-700 ring-1 ring-rose-300",           dot: "bg-rose-500",    step:-1, action: "Detail",     actionCls: "bg-slate-100 hover:bg-slate-200 text-slate-700"   },
};

export const DEPO_CFG: Record<DepoTujuan, { badge: string; unit: UnitAsal }> = {
  "Depo IGD":  { badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",       unit: "IGD"         },
  "Apotek RI": { badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-200", unit: "Rawat Inap"  },
  "Apotek RJ": { badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",          unit: "Rawat Jalan" },
};

// `depo` sintetis per-unit hanya penanda ASAL order — tak ada depo per-unit; depo nyata = Depo
// Farmasi (`depoNama` dari DB). Untuk tampilan asal, pakai nama unit (bukan "Depo IGD"). SKP.
export const DEPO_LABEL: Record<DepoTujuan, string> = {
  "Depo IGD":  "IGD",
  "Apotek RI": "Rawat Inap",
  "Apotek RJ": "Rawat Jalan",
};

export const PRIORITAS_CFG: Record<PrioritasOrder, { badge: string }> = {
  CITO:   { badge: "bg-rose-500 text-white"      },
  Segera: { badge: "bg-amber-500 text-white"     },
  Rutin:  { badge: "bg-slate-100 text-slate-600" },
};

export const INTERVENSI_CFG: Record<IntervensiType, { label: string; badge: string }> = {
  Dose_Adjustment: { label: "Penyesuaian Dosis", badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200"     },
  Substitusi:      { label: "Substitusi Obat",   badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200"           },
  Interaksi:       { label: "Interaksi Obat",    badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200"        },
  Efek_Samping:    { label: "Efek Samping",       badge: "bg-orange-50 text-orange-700 ring-1 ring-orange-200" },
  Rekomendasi:     { label: "Rekomendasi",        badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200"          },
};

// ── Pengkajian Resep (PMK 72/2016 · SatuSehat QuestionnaireResponse) ──────────────
//  3 aspek baku: administratif · farmasetis · klinis. Tiap item punya `linkId` stabil →
//  jawaban (linkId→boolean) jadi payload QuestionnaireResponse. `prefill` = item yang pada
//  e-resep terstruktur sudah dijamin terisi (mis. identitas/tgl/dokter dari ResepOrder) →
//  dicentang awal, apoteker tetap dapat membatalkan. linkId final dipetakan ke canonical
//  Questionnaire SatuSehat saat membangun adapter FHIR (/ehis-fhir).

export type TelaahGroupKey = "administrasi" | "farmasetik" | "klinis";
export interface TelaahItem { linkId: string; text: string; prefill?: boolean }
export interface TelaahGroup { key: TelaahGroupKey; label: string; items: TelaahItem[] }

export const TELAAH_GROUPS: TelaahGroup[] = [
  {
    key: "administrasi",
    label: "Administratif",
    items: [
      { linkId: "adm-identitas", text: "Nama & No. RM pasien sesuai (2 penanda identitas)", prefill: true },
      { linkId: "adm-umur-jk",   text: "Umur & jenis kelamin pasien",                        prefill: true },
      { linkId: "adm-dokter",    text: "Nama, no. SIP & paraf dokter penulis",               prefill: true },
      { linkId: "adm-tanggal",   text: "Tanggal penulisan resep",                            prefill: true },
      { linkId: "adm-unit",      text: "Ruangan / unit asal resep",                          prefill: true },
    ],
  },
  {
    key: "farmasetik",
    label: "Farmasetis",
    items: [
      { linkId: "farm-nama-kekuatan", text: "Nama obat, bentuk & kekuatan sediaan jelas" },
      { linkId: "farm-dosis-jumlah",  text: "Dosis & jumlah obat tertulis jelas" },
      { linkId: "farm-stabilitas",    text: "Stabilitas sediaan (penyimpanan / BUD) terjaga" },
      { linkId: "farm-aturan",        text: "Aturan & cara penggunaan jelas" },
      { linkId: "farm-kompatibilitas",text: "Kompatibilitas / tidak ada inkompatibilitas campuran" },
    ],
  },
  {
    key: "klinis",
    label: "Klinis",
    items: [
      { linkId: "klin-indikasi",       text: "Ketepatan indikasi sesuai diagnosa" },
      { linkId: "klin-dosis",          text: "Ketepatan dosis (sesuai BB / usia / fungsi organ)" },
      { linkId: "klin-aturan-lama",    text: "Ketepatan aturan, cara & lama penggunaan" },
      { linkId: "klin-duplikasi",      text: "Tidak ada duplikasi / polifarmasi" },
      { linkId: "klin-rotd",           text: "Tidak ada ROTD / alergi terkait" },
      { linkId: "klin-kontraindikasi", text: "Tidak ada kontraindikasi" },
      { linkId: "klin-interaksi",      text: "Tidak ada interaksi obat signifikan" },
    ],
  },
];

export const TELAAH_GROUP_BY_KEY: Record<TelaahGroupKey, TelaahGroup> =
  Object.fromEntries(TELAAH_GROUPS.map((g) => [g.key, g])) as Record<TelaahGroupKey, TelaahGroup>;

/** Default jawaban grup (prefill item e-resep tercentang). */
export function initTelaahGroup(key: TelaahGroupKey): Record<string, boolean> {
  return Object.fromEntries(TELAAH_GROUP_BY_KEY[key].items.map((it) => [it.linkId, !!it.prefill]));
}

/** Lulus aspek = semua item grup tercentang. */
export function telaahGroupLulus(key: TelaahGroupKey, answers: Record<string, boolean>): boolean {
  return TELAAH_GROUP_BY_KEY[key].items.every((it) => !!answers[it.linkId]);
}

// Backward-compat (string[]) — dipakai komponen modal legacy (TelaahModal/DispensasiModal).
export const TELAAH_ADM_ITEMS  = TELAAH_GROUP_BY_KEY.administrasi.items.map((i) => i.text);
export const TELAAH_FARM_ITEMS = TELAAH_GROUP_BY_KEY.farmasetik.items.map((i) => i.text);
export const TELAAH_KLIN_ITEMS = TELAAH_GROUP_BY_KEY.klinis.items.map((i) => i.text);

// ── LASA (Look-Alike Sound-Alike) — PMK 72/2016 Ps.8 · SKP 3 ───

export const LASA_PAIRS: [string, string][] = [
  ["dobutamin",        "dopamin"],
  ["norepinefrin",     "epinefrin"],
  ["morfin",           "hidromorfon"],
  ["heparin",          "insulin"],
  ["warfarin",         "vitamin k"],
  ["furosemide",       "torsemide"],
  ["kcl",              "nacl 3%"],
  ["midazolam",        "lorazepam"],
  ["diazepam",         "alprazolam"],
  ["isdn",             "isosorbid mononitrat"],
  ["azithromycin",     "amoxicillin"],
  ["kalsium glukonat", "kalsium klorida"],
];

export function getLASAPair(name: string): string | null {
  const low = name.toLowerCase();
  for (const [a, b] of LASA_PAIRS) {
    if (low.includes(a)) return b;
    if (low.includes(b)) return a;
  }
  return null;
}

// ── Formularium RS — SNARS PKPO 2 · PMK 72/2016 Ps.5-7 ──────────

export const FORMULARIUM_LIST: string[] = [
  "paracetamol", "amoxicillin",  "ambroxol",       "omeprazole",      "metformin",
  "amlodipine",  "bisoprolol",   "atorvastatin",   "aspirin",         "furosemide",
  "spironolakton","ramipril",    "clopidogrel",    "azithromycin",    "ciprofloxacin",
  "nacl",        "ringer",       "glukosa",
  "insulin",     "oksitosin",    "magnesium sulfat",
  "heparin",     "warfarin",
  "norepinefrin","epinefrin",    "dobutamin",      "nitrogliserin",   "isdn",
  "morfin",      "fentanil",     "midazolam",      "diazepam",
  "kcl",         "vitamin k",    "ondansetron",    "dexamethasone",   "methylprednisolon",
];

// ── TAT Tracking — SNARS PKPO 6 · Indikator Mutu RS ─────────────

export const TAT_TARGET_UNIT: Record<UnitAsal, number> = {
  "IGD":         30,
  "Rawat Inap":  60,
  "Rawat Jalan": 30,
};

export function calcTATMenit(ts: OrderTimestamps): number | null {
  if (!ts.serahTerima) return null;
  const parse = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const diff = parse(ts.serahTerima) - parse(ts.masuk);
  return diff >= 0 ? diff : null;
}

export type TATStatus = "ok" | "warning" | "over" | "pending";

export function getTATStatus(menit: number | null, unit: UnitAsal): TATStatus {
  if (menit === null) return "pending";
  const target = TAT_TARGET_UNIT[unit];
  if (menit <= Math.round(target * 0.8)) return "ok";
  if (menit <= target)                    return "warning";
  return "over";
}

// ── Patient allergies ─────────────────────────────────────

const PATIENT_ALLERGIES: Record<string, AllergiPasien[]> = {
  "RM-2025-005": [
    { alergen: "Penisilin",  reaksi: "Urtikaria & angioedema", tingkat: "Berat"  },
    { alergen: "Aspirin",    reaksi: "Bronkospasme",            tingkat: "Berat"  },
  ],
  "RM-2025-003": [
    { alergen: "Sulfonamida", reaksi: "Ruam makulopapular",    tingkat: "Ringan" },
    { alergen: "Codein",      reaksi: "Mual muntah berat",     tingkat: "Sedang" },
  ],
  "RM-2025-007": [
    { alergen: "Morfin",      reaksi: "Depresi napas & mual",  tingkat: "Berat"  },
  ],
};

export function getPatientAllergies(noRM: string): AllergiPasien[] {
  return PATIENT_ALLERGIES[noRM] ?? [];
}

// ── Patient lookup ────────────────────────────────────────

export interface PatientInfoEntry {
  namaPasien:    string;
  unit:          UnitAsal;
  usia?:         string;
  jenisKelamin?: "L" | "P";
  ruangan?:      string;
  noBed?:        string;
}

const PATIENT_INFO: Record<string, PatientInfoEntry> = {
  "RM-2025-005": { namaPasien: "Joko Prasetyo",   unit: "IGD",         usia: "55 thn", jenisKelamin: "L", ruangan: "Triase A",    noBed: "T-03"   },
  "RM-2025-012": { namaPasien: "Siti Rahayu",     unit: "IGD",         usia: "32 thn", jenisKelamin: "P", ruangan: "Triase B",    noBed: "T-07"   },
  "RM-2025-003": { namaPasien: "Ahmad Fauzi",     unit: "Rawat Inap",  usia: "62 thn", jenisKelamin: "L", ruangan: "Mawar",       noBed: "3B-02"  },
  "RM-2025-007": { namaPasien: "Hasan Basri",     unit: "Rawat Inap",  usia: "45 thn", jenisKelamin: "L", ruangan: "ICU",         noBed: "ICU-01" },
  "RM-2025-021": { namaPasien: "Budiman Santoso", unit: "Rawat Jalan", usia: "58 thn", jenisKelamin: "L", ruangan: "Poli Jantung"                  },
  "RM-2025-034": { namaPasien: "Dewi Rahmawati",  unit: "Rawat Jalan", usia: "38 thn", jenisKelamin: "P", ruangan: "Poli Umum"                     },
};

export function getPatientInfo(noRM: string): PatientInfoEntry | undefined {
  return PATIENT_INFO[noRM];
}

// ── Tujuan → Depo mapping ─────────────────────────────────

const TUJUAN_TO_DEPO: Partial<Record<string, DepoTujuan>> = {
  "Depo IGD":  "Depo IGD",
  "Apotek RI": "Apotek RI",
  "Apotek RJ": "Apotek RJ",
};

// ── Drug classification helpers ───────────────────────────

const HAM_KEYWORDS = [
  "morfin", "heparin", "warfarin", "norepinefrin", "epinefrin", "dobutamin",
  "isdn", "nitrogliserin", "kcl", "kalium klorid", "insulin", "oksitosin",
  "magnesium sulfat",
];
const NARKOTIKA_KW    = ["morfin", "petidin", "fentanil", "kodein", "tramadol"];
const PSIKOTROPIKA_KW = ["diazepam", "alprazolam", "midazolam", "lorazepam"];

function isHAMDrug(name: string): boolean {
  const low = name.toLowerCase();
  return HAM_KEYWORDS.some((kw) => low.includes(kw));
}

function isLASADrug(name: string): boolean {
  const low = name.toLowerCase();
  return LASA_PAIRS.some(([a, b]) => low.includes(a) || low.includes(b));
}

function isFormulariumDrug(name: string): boolean {
  const low = name.toLowerCase();
  return FORMULARIUM_LIST.some((f) => low.includes(f));
}

function kategoriObat(name: string): FarmasiOrderItem["kategori"] {
  const low = name.toLowerCase();
  if (NARKOTIKA_KW.some((kw)    => low.includes(kw))) return "Narkotika";
  if (PSIKOTROPIKA_KW.some((kw) => low.includes(kw))) return "Psikotropika";
  return "Reguler";
}

// ── Pricing / stock helpers ───────────────────────────────

const DRUG_PRICE_KW: [string, number][] = [
  ["morfin",          45000], ["dobutamine",  185000], ["nitrogliserin",  3500],
  ["isdn",            22000], ["kcl",          15000], ["heparin",       65000],
  ["warfarin",        25000], ["insulin",      85000], ["oksitosin",     12000],
  ["magnesium",       18000], ["furosemide 80",12000], ["furosemide",     8500],
  ["bisoprolol",       3500], ["ramipril",      4200], ["spironolakton",  2800],
  ["atorvastatin",     5200], ["amlodipine",    2800], ["clopidogrel",    8500],
  ["aspirin",            500], ["amoxicillin",  7500], ["azithromycin",  12000],
  ["paracetamol",        500], ["ambroxol",     1200], ["metformin",        800],
  ["omeprazole",        3200], ["nacl",          2500], ["ringer",          3500],
];

const DRUG_STOCK_KW: [string, number][] = [
  ["morfin",     20], ["dobutamine",  12], ["nitrogliserin", 35],
  ["kcl",        55], ["isdn",        42], ["insulin",       48],
  ["heparin",    18], ["warfarin",    30], ["furosemide",    75],
  ["bisoprolol", 110], ["aspirin",   180], ["paracetamol",  320],
  ["amoxicillin",140], ["azithromycin", 85],
];

function lookupPrice(nama: string): number {
  const low = nama.toLowerCase();
  for (const [kw, p] of DRUG_PRICE_KW) if (low.includes(kw)) return p;
  return 3000;
}

function lookupStock(nama: string): number {
  const low = nama.toLowerCase();
  for (const [kw, s] of DRUG_STOCK_KW) if (low.includes(kw)) return s;
  return 100;
}

function parseSatuan(nama: string): string {
  const low = nama.toLowerCase();
  if (low.includes("inj") || low.includes("/ml"))                         return "Ampul";
  if (low.includes("infus") || low.includes("500ml") || low.includes("ringer")) return "Botol";
  if (low.includes("kapsul") || low.includes("cap"))                      return "Kap";
  return "Tab";
}

function parseJumlah(detail?: string): number {
  if (!detail) return 1;
  const all = [...detail.matchAll(/×(\d+)/g)];
  return all.length > 0 ? (parseInt(all[all.length - 1][1], 10) || 1) : 1;
}

function parseRute(detail?: string): string {
  if (!detail) return "PO";
  if (/IV drip/i.test(detail))  return "IV drip";
  if (/IV bolus/i.test(detail)) return "IV bolus";
  if (/\bIV\b/.test(detail))   return "IV";
  if (/\bSC\b/.test(detail))   return "SC";
  if (/\bIM\b/.test(detail))   return "IM";
  if (/\bSL\b/.test(detail))   return "SL";
  if (/oral/i.test(detail))    return "PO";
  return "PO";
}

// ── Workflow store (in-memory, per session) ───────────────

interface WorkflowData {
  status?:      FarmasiStatus;
  items?:       FarmasiOrderItem[];
  telaah?:      TelaahData;
  serahTerima?: SerahTerima;
  catatan?:     CatatanFarmasi[];
  timestamps?:  Partial<OrderTimestamps>;
}

const workflowStore = new Map<string, WorkflowData>();

export function updateFarmasiWorkflow(orderId: string, data: Partial<WorkflowData>): void {
  const current = workflowStore.get(orderId) ?? {};
  workflowStore.set(orderId, {
    ...current,
    ...data,
    timestamps: { ...current.timestamps, ...data.timestamps },
  });
}

// ── Order derivation ──────────────────────────────────────

function addMin(jam: string, n: number): string {
  const [h, m] = jam.split(":").map(Number);
  const t = h * 60 + m + n;
  return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

function deriveMockTimestamps(jam: string, status: FarmasiStatus, unit: UnitAsal): OrderTimestamps {
  const igd  = unit === "IGD";
  const masuk = jam;
  if (status === "Menunggu")        return { masuk };
  const telaah = addMin(jam, igd ? 7 : 11);
  if (status === "Ditelaah")        return { masuk, telaah };
  const dispensing = addMin(jam, igd ? 16 : 24);
  if (status === "Siap Diserahkan") return { masuk, telaah, dispensing };
  return { masuk, telaah, dispensing, serahTerima: addMin(jam, igd ? 24 : 37) };
}

function mapOrderStatus(s: string): FarmasiStatus {
  if (s === "Selesai")  return "Selesai";
  if (s === "Diproses") return "Ditelaah";
  return "Menunggu";
}

function deriveItems(order: Order, wf?: WorkflowData): FarmasiOrderItem[] {
  if (wf?.items) return wf.items;
  return order.items.map((item): FarmasiOrderItem => ({
    id:            item.id,
    namaObat:      item.nama,
    kodeObat:      `RX-${item.id}`,
    dosis:         item.detail ?? "",
    signa:         item.keterangan ?? "",
    jumlah:        parseJumlah(item.detail),
    rute:          parseRute(item.detail),
    kategori:      kategoriObat(item.nama),
    isHAM:         isHAMDrug(item.nama),
    isLASA:        isLASADrug(item.nama),
    isFormularium: isFormulariumDrug(item.nama),
    stokTersedia:  lookupStock(item.nama),
    hargaSatuan:   lookupPrice(item.nama),
    satuanObat:    parseSatuan(item.nama),
  }));
}

export function deriveResepOrders(noRM?: string): FarmasiOrder[] {
  const entries = noRM
    ? ([[noRM, ORDERS_MOCK[noRM] ?? []]] as [string, Order[]][])
    : (Object.entries(ORDERS_MOCK) as [string, Order[]][]);

  return entries.flatMap(([rm, orders]) =>
    orders
      .filter((o) => o.type === "Resep")
      .map((o): FarmasiOrder => {
        const wf      = workflowStore.get(o.id);
        const depo    = TUJUAN_TO_DEPO[o.tujuan ?? ""] ?? "Apotek RJ";
        const patient = PATIENT_INFO[rm];
        const items   = deriveItems(o, wf);
        const status  = wf?.status ?? mapOrderStatus(o.status);
        const unit    = patient?.unit ?? DEPO_CFG[depo].unit;
        return {
          id:            o.id,
          noOrder:       o.noOrder,
          noRM:          rm,
          namaPasien:    patient?.namaPasien ?? "Pasien",
          unit,
          depo,
          dokterPeminta: o.dokter,
          tanggal:       o.tanggal,
          jam:           o.jam,
          status,
          prioritas:     o.catatan?.includes("CITO") ? "CITO" : "Rutin",
          hasHAM:        items.some((i) => i.isHAM),
          items,
          telaah:        wf?.telaah,
          serahTerima:   wf?.serahTerima,
          catatan:       wf?.catatan,
          alergiPasien:  getPatientAllergies(rm),
          timestamps:    { ...deriveMockTimestamps(o.jam, status, unit), ...wf?.timestamps } as OrderTimestamps,
        };
      }),
  );
}

export function getOrderById(id: string): FarmasiOrder | undefined {
  return deriveResepOrders().find((o) => o.id === id);
}

// ── DB resep order → FarmasiOrder (worklist) ──────────────
// Map ResepOrderFarmasiDTO (medicalrecord.ResepOrder) ke kartu worklist. Atribut keamanan
// obat (HAM/LASA/formularium/harga/stok) diturunkan dari nama via helper lokal.

function unitToDepo(unit: string): DepoTujuan {
  if (unit === "IGD") return "Depo IGD";
  if (unit === "Rawat Inap") return "Apotek RI";
  return "Apotek RJ";
}

function coerceStatus(s: string): FarmasiStatus {
  return (s in STATUS_CFG ? (s as FarmasiStatus) : "Menunggu");
}

/** ResepDispensingDTO (DB) → SerahTerima (FE) — pulihkan dispensing tersimpan saat reopen. */
function serahFromDispensing(d: ResepDispensingDTO): SerahTerima {
  return {
    waktu:             new Date(d.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    perawatPenerima:   "",
    apoteker:          d.apoteker,
    petugas2NAR:       d.petugas2Nar ?? undefined,
    verifikatorAkhir:  d.apoteker,
    edukasi:           d.edukasi,
    semuaLabelDicetak: d.semuaLabelDicetak,
    lasaKonfirmasi:    d.lasaKonfirmasi ?? undefined,
    narDoubleCheck:    d.narDoubleCheck ?? undefined,
  };
}

/** ResepTelaahDTO (DB) → TelaahData (FE) — pulihkan telaah tersimpan saat reopen detail. */
function telaahFromDTO(t: ResepTelaahDTO): TelaahData {
  return {
    checks: { administratif: t.lulusAdministrasi, farmasetis: t.lulusFarmasetik, klinis: t.lulusKlinis },
    answers: t.answers,
    catatan: t.catatan ?? undefined,
    apoteker: t.apoteker,
    waktu: new Date(t.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    result: t.hasil === "Disetujui" ? "Disetujui" : "Dikembalikan",
    alasanKembali: t.alasanKembali ?? undefined,
    substitusi: t.substitusi ?? undefined,
    justifikasiNonFormularium: t.justifikasiNonFormularium ?? undefined,
    lasaKonfirmasi: t.lasaKonfirmasi ?? undefined,
  };
}

export function mapDbResepOrder(o: ResepOrderFarmasiDTO): FarmasiOrder {
  const items: FarmasiOrderItem[] = o.items.map((it) => ({
    id:            it.id,
    namaObat:      it.namaObat,
    kodeObat:      it.kodeObat || `RX-${it.id}`,
    dosis:         it.dosis ?? "",
    dosisSekali:   it.dosisSekali ?? undefined,
    signa:         it.signa ?? "",
    jumlah:        it.jumlah,
    rute:          it.rute ?? "",
    aturanPakai:   it.aturanPakai ?? undefined,
    kategori:      (it.kategori as FarmasiOrderItem["kategori"]) || kategoriObat(it.namaObat),
    isHAM:         it.isHAM || isHAMDrug(it.namaObat),
    isLASA:        isLASADrug(it.namaObat),
    isFormularium: isFormulariumDrug(it.namaObat),
    stokTersedia:  lookupStock(it.namaObat),
    hargaSatuan:   lookupPrice(it.namaObat),
    satuanObat:    parseSatuan(it.namaObat),
  }));
  return {
    id:            o.id,
    kunjunganId:   o.kunjunganId,
    noOrder:       o.noOrder,
    noRM:          o.noRM,
    namaPasien:    o.namaPasien,
    unit:          o.unit as UnitAsal,
    depo:          unitToDepo(o.unit),
    depoNama:      o.depoNama,
    dokterPeminta: o.penulis,
    tanggal:       o.createdAt.slice(0, 10),
    jam:           new Date(o.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    status:        coerceStatus(o.status),
    prioritas:     (o.prioritas as PrioritasOrder) || "Rutin",
    isObatPulang:  o.isObatPulang,
    hasHAM:        items.some((i) => i.isHAM),
    items,
    telaah:        o.telaah ? telaahFromDTO(o.telaah) : undefined,
    serahTerima:   o.dispensing ? serahFromDispensing(o.dispensing) : undefined,
    alergiPasien:  getPatientAllergies(o.noRM),
    catatanResep:     o.catatan ?? undefined,
    penulisKontak:    o.penulisKontak ?? undefined,
    kondisiGinjal:    o.kondisiGinjal ?? undefined,
    kondisiKehamilan: o.kondisiKehamilan ?? undefined,
    kondisiMenyusui:  o.kondisiMenyusui ?? undefined,
    tteToken:         o.tteToken ?? undefined,
    tteSignedBy:      o.tteSignedBy ?? undefined,
    tteSignedAt:      o.tteSignedAt ?? undefined,
  };
}
