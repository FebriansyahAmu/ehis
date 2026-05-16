// ─── BPJS API shapes ──────────────────────────────────────────

export interface BpjsRujukanItem {
  idrujukan: string;
  norujukan: string;
  nokapst: string;
  nmpst: string;
  diagppk: string;
  tglrujukan_awal: string;
  tglrujukan_berakhir: string;
}

export type RujukanStatus = "Aktif" | "Kadaluarsa" | "Belum Berlaku";
export type FetchState    = "idle" | "loading" | "success" | "empty" | "error";

// ─── Shared types ─────────────────────────────────────────────

export interface IcdOption { code: string; name: string }

export interface PenerimaanDraft {
  noSurat:  string;
  namaPPK:  string;
  nomorPPK: string;
  smf:      string;
  diagnosa: IcdOption | null;
}

export interface KontrolDraft {
  noSEPRanap: string;
  diagnosa:   string;
  catatan:    string;
}

// ─── Hospital config ──────────────────────────────────────────

export const KODE_RS = "0301U033";
export const NAMA_RS = "RSUD Dr. Soetomo";

// ─── SMF catalog ─────────────────────────────────────────────

export const SMF_LIST: string[] = [
  "Penyakit Dalam",
  "Jantung & Pembuluh Darah",
  "Syaraf (Neurologi)",
  "Bedah Umum",
  "Bedah Ortopedi & Traumatologi",
  "Paru",
  "Urologi",
  "Mata",
  "THT-KL",
  "Kulit & Kelamin",
  "Obstetri & Ginekologi",
  "Anak (Pediatri)",
  "Ginjal (Nefrologi)",
  "Endokrinologi & Metabolik",
  "Onkologi Medik",
  "Rehabilitasi Medik",
  "Psikiatri",
];

// ─── ICD-10 mini-catalog ──────────────────────────────────────

export const ICD10_MAP: Record<string, string> = {
  N18: "Chronic kidney disease",
  I10: "Hypertension (essential)",
  E11: "Type 2 diabetes mellitus",
  J18: "Pneumonia, unspecified",
  I21: "Acute myocardial infarction",
  K29: "Gastritis and duodenitis",
  A09: "Gastroenteritis and colitis",
  J06: "Acute upper respiratory tract infection",
  N39: "Urinary tract infection",
  M54: "Dorsalgia (back pain)",
  I50: "Heart failure",
  J44: "Chronic obstructive pulmonary disease",
  K92: "Gastrointestinal haemorrhage",
  B20: "HIV disease",
  E14: "Unspecified diabetes mellitus",
  I25: "Chronic ischaemic heart disease",
  J45: "Asthma",
  K35: "Acute appendicitis",
  N40: "Benign prostatic hyperplasia",
  Z51: "Encounter for other medical care",
  I63: "Cerebral infarction (stroke)",
  G40: "Epilepsy",
  K80: "Cholelithiasis (gallstones)",
  L20: "Atopic dermatitis",
  M06: "Rheumatoid arthritis",
};

export const ICD10_CATALOG = Object.entries(ICD10_MAP).map(([code, name]) => ({ code, name }));

export function getIcdName(code: string): string {
  return ICD10_MAP[code] ?? code;
}

// ─── Status & date helpers ────────────────────────────────────

export function getRujukanStatus(awal: string, berakhir: string): RujukanStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(awal);
  const end   = new Date(berakhir);
  if (today < start) return "Belum Berlaku";
  if (today > end)   return "Kadaluarsa";
  return "Aktif";
}

export function getDaysRemaining(berakhir: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(berakhir).getTime() - today.getTime()) / 86_400_000);
}

export function getValidityProgress(awal: string, berakhir: string): number {
  const start = new Date(awal).getTime();
  const end   = new Date(berakhir).getTime();
  const now   = Date.now();
  if (now <= start) return 0;
  if (now >= end)   return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function generateNoSurat(kodeRS: string): string {
  const d   = new Date();
  const dd  = String(d.getDate()).padStart(2, "0");
  const mm  = String(d.getMonth() + 1).padStart(2, "0");
  const yy  = d.getFullYear();
  const seq = String(Math.floor(Date.now() / 1000) % 10000).padStart(4, "0");
  return `${kodeRS}/RUJ/${dd}${mm}${yy}/${seq}`;
}

// ─── Mock data ────────────────────────────────────────────────

export const MOCK_RUJUKAN: BpjsRujukanItem[] = [
  {
    idrujukan:           "98866",
    norujukan:           "0301U0331019P003283",
    nokapst:             "0000016553957",
    nmpst:               "MUZNI MUKHTAR",
    diagppk:             "N18",
    tglrujukan_awal:     "2026-04-10",
    tglrujukan_berakhir: "2026-07-08",
  },
  {
    idrujukan:           "87234",
    norujukan:           "0301U0330823P001154",
    nokapst:             "0000016553957",
    nmpst:               "MUZNI MUKHTAR",
    diagppk:             "I10",
    tglrujukan_awal:     "2025-08-01",
    tglrujukan_berakhir: "2025-10-29",
  },
];

export const MOCK_SEP_RANAP = {
  noSEP:     "0301R0010125P000001",
  diagnosa:  "I50",
  tglKeluar: "10 Maret 2026",
  kelas:     "Kelas II",
  dokter:    "dr. Budi Santoso, Sp.JP",
};
