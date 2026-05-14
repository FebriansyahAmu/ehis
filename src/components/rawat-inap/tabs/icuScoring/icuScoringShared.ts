// ── Base types ─────────────────────────────────────────────

export type Score04       = 0 | 1 | 2 | 3 | 4;
export type AgePoints     = 0 | 2 | 3 | 5 | 6;
export type ChronicPoints = 0 | 2 | 5;
export type VasopressorType = "none" | "dobutamine" | "dopamine" | "epinephrine" | "norepinephrine";

// ── SOFA types ─────────────────────────────────────────────

export interface SOFAScores {
  respirasi:      Score04;
  koagulasi:      Score04;
  liver:          Score04;
  kardiovaskular: Score04;
  neurologi:      Score04;
  renal:          Score04;
}

export interface SOFAActualValues {
  pao2:            number | "";   // mmHg
  fio2:            number | "";   // % (21–100)
  onVentilator:    boolean;
  platelet:        number | "";   // ×10³/µL
  bilirubin:       number | "";   // mg/dL
  map:             number | "";   // mmHg
  vasopressor:     VasopressorType;
  vasopressorDose: number | "";   // µg/kg/min (dopamin/epi/NE)
  gcs:             number | "";   // 3–15
  creatinine:      number | "";   // mg/dL
  urineOutput:     number | "";   // mL/24h (opsional)
}

export interface SOFAEntry {
  tanggal:  string;       // YYYY-MM-DD
  scores:   SOFAScores;
  actual?:  SOFAActualValues;
  total:    number;
  inputBy:  string;
  catatan?: string;
}

// ── APACHE II types ────────────────────────────────────────

export interface APACHEActualValues {
  temperature:  number | "";   // °C (rektal diutamakan)
  map:          number | "";   // mmHg
  heartRate:    number | "";   // bpm
  rr:           number | "";   // x/mnt
  pao2:         number | "";   // mmHg
  fio2:         number | "";   // % (21–100)
  paco2:        number | "";   // mmHg (untuk A-aDO₂, default 40)
  ph:           number | "";
  sodium:       number | "";   // mEq/L
  potassium:    number | "";   // mEq/L
  creatinine:   number | "";   // mg/dL
  akiPresent:   boolean;
  hematocrit:   number | "";   // %
  wbc:          number | "";   // ×10³/µL
  gcs:          number | "";   // 3–15
  age:          number | "";   // tahun
  chronicType:  ChronicPoints; // 0 | 2 | 5
}

export interface APACHEEntry {
  tanggal:    string;
  actual?:    APACHEActualValues;
  aps:        number;
  total:      number;
  mortalitas: number;  // % estimated
  inputBy:    string;
}

export interface ICUScoringData {
  sofa:   SOFAEntry[];
  apache: APACHEEntry[];
}

// ── SOFA param definitions (display) ──────────────────────

export const SOFA_PARAMS = [
  { id: "respirasi"      as const, label: "Respirasi",      levels: ["≥400", "300–399", "200–299", "100–199 + vent", "<100 + vent"] },
  { id: "koagulasi"      as const, label: "Koagulasi",      levels: ["≥150", "100–149", "50–99", "20–49", "<20"] },
  { id: "liver"          as const, label: "Liver",          levels: ["<1.2", "1.2–1.9", "2.0–5.9", "6.0–11.9", "≥12.0"] },
  { id: "kardiovaskular" as const, label: "Kardiovaskular", levels: ["MAP ≥70", "MAP <70", "Dopamin ≤5/Dobu", "Dopamin >5/Epi ≤0.1", "Dopamin >15/Epi >0.1"] },
  { id: "neurologi"      as const, label: "Neurologi",      levels: ["GCS 15", "GCS 13–14", "GCS 10–12", "GCS 6–9", "GCS <6"] },
  { id: "renal"          as const, label: "Renal",          levels: ["<1.2 mg/dL", "1.2–1.9 mg/dL", "2.0–3.4 mg/dL", "3.5–4.9/UO<500", "≥5.0/UO<200"] },
] as const;

export const AGE_OPTIONS: { label: string; value: AgePoints }[] = [
  { label: "< 44 tahun",  value: 0 },
  { label: "45–54 tahun", value: 2 },
  { label: "55–64 tahun", value: 3 },
  { label: "65–74 tahun", value: 5 },
  { label: "≥ 75 tahun",  value: 6 },
];

export const CHRONIC_OPTIONS: { label: string; desc: string; value: ChronicPoints }[] = [
  { label: "Tidak Ada",              desc: "Tidak ada penyakit kronik organ berat",              value: 0 },
  { label: "Post-op Elektif",        desc: "Penyakit kronik + pembedahan terencana",             value: 2 },
  { label: "Post-op Darurat / Non-op", desc: "Penyakit kronik + pembedahan darurat atau non-op", value: 5 },
];

// ── Color maps ─────────────────────────────────────────────

export const SCORE_CLR: Record<Score04, { pill: string; bar: string }> = {
  0: { pill: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200", bar: "bg-emerald-400" },
  1: { pill: "bg-sky-100     text-sky-700     ring-1 ring-sky-200",     bar: "bg-sky-400"     },
  2: { pill: "bg-amber-100   text-amber-700   ring-1 ring-amber-200",   bar: "bg-amber-400"   },
  3: { pill: "bg-orange-100  text-orange-700  ring-1 ring-orange-200",  bar: "bg-orange-400"  },
  4: { pill: "bg-rose-100    text-rose-700    ring-1 ring-rose-200",    bar: "bg-rose-400"    },
};

export const SOFA_RISK = [
  { max:  6, label: "Rendah",        cls: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200", bar: "bg-emerald-400", mort: "<10%"  },
  { max:  9, label: "Sedang",        cls: "bg-amber-100   text-amber-700   ring-1 ring-amber-200",   bar: "bg-amber-400",   mort: "~20%"  },
  { max: 12, label: "Tinggi",        cls: "bg-orange-100  text-orange-700  ring-1 ring-orange-200",  bar: "bg-orange-400",  mort: "~40%"  },
  { max: 14, label: "Kritis",        cls: "bg-rose-100    text-rose-700    ring-1 ring-rose-200",    bar: "bg-rose-500",    mort: "~50%"  },
  { max: 24, label: "Sangat Kritis", cls: "bg-rose-200    text-rose-800    ring-1 ring-rose-300",    bar: "bg-rose-600",    mort: ">80%"  },
] as const;

export const APACHE_RISK = [
  { max:  9, label: "Ringan",       cls: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" },
  { max: 14, label: "Sedang",       cls: "bg-sky-100     text-sky-700     ring-1 ring-sky-200"     },
  { max: 19, label: "Berat",        cls: "bg-amber-100   text-amber-700   ring-1 ring-amber-200"   },
  { max: 24, label: "Sangat Berat", cls: "bg-orange-100  text-orange-700  ring-1 ring-orange-200"  },
  { max: 99, label: "Kritis",       cls: "bg-rose-100    text-rose-700    ring-1 ring-rose-200"    },
] as const;

// ── SOFA scoring from actual values (standar internasional) ─

export function scoreSOFAResirasi(pao2: number, fio2: number, onVent: boolean): Score04 {
  const ratio = pao2 / (fio2 / 100);
  if (ratio >= 400) return 0;
  if (ratio >= 300) return 1;
  if (ratio >= 200) return 2;
  if (ratio >= 100) return onVent ? 3 : 2;
  return onVent ? 4 : 2;
}

export function scoreSOFAKoagulasi(platelet: number): Score04 {
  if (platelet >= 150) return 0;
  if (platelet >= 100) return 1;
  if (platelet >= 50)  return 2;
  if (platelet >= 20)  return 3;
  return 4;
}

export function scoreSOFALiver(bilirubin: number): Score04 {
  if (bilirubin <  1.2)  return 0;
  if (bilirubin <  2.0)  return 1;
  if (bilirubin <  6.0)  return 2;
  if (bilirubin < 12.0)  return 3;
  return 4;
}

export function scoreSOFAKardiovaskular(
  map: number, vasopressor: VasopressorType, dose: number,
): Score04 {
  if (vasopressor === "none")      return map >= 70 ? 0 : 1;
  if (vasopressor === "dobutamine") return 2;
  if (vasopressor === "dopamine") {
    if (dose <= 5)  return 2;
    if (dose <= 15) return 3;
    return 4;
  }
  // epinephrine | norepinephrine (µg/kg/min)
  return dose <= 0.1 ? 3 : 4;
}

export function scoreSOFANeurologi(gcs: number): Score04 {
  if (gcs === 15) return 0;
  if (gcs >= 13)  return 1;
  if (gcs >= 10)  return 2;
  if (gcs >= 6)   return 3;
  return 4;
}

export function scoreSOFARenal(creatinine: number, urineOutput?: number): Score04 {
  let crScore: Score04 = 0;
  if      (creatinine >= 5.0) crScore = 4;
  else if (creatinine >= 3.5) crScore = 3;
  else if (creatinine >= 2.0) crScore = 2;
  else if (creatinine >= 1.2) crScore = 1;

  if (urineOutput === undefined || urineOutput === null) return crScore;
  const uoNum = Number(urineOutput);
  const uoScore: Score04 = uoNum < 200 ? 4 : uoNum < 500 ? 3 : 0;
  return Math.max(crScore, uoScore) as Score04;
}

export function calcSOFAFromActual(v: SOFAActualValues): SOFAScores {
  return {
    respirasi:      (v.pao2 !== "" && v.fio2 !== "") ? scoreSOFAResirasi(+v.pao2, +v.fio2, v.onVentilator) : 0,
    koagulasi:      v.platelet   !== "" ? scoreSOFAKoagulasi(+v.platelet)    : 0,
    liver:          v.bilirubin  !== "" ? scoreSOFALiver(+v.bilirubin)       : 0,
    kardiovaskular: (v.map !== "") ? scoreSOFAKardiovaskular(+v.map, v.vasopressor, v.vasopressorDose !== "" ? +v.vasopressorDose : 0) : 0,
    neurologi:      v.gcs        !== "" ? scoreSOFANeurologi(+v.gcs)         : 0,
    renal:          v.creatinine !== "" ? scoreSOFARenal(+v.creatinine, v.urineOutput !== "" ? +v.urineOutput : undefined) : 0,
  };
}

// ── APACHE II scoring from actual values (standar Knaus 1985) ─

type RD = { min: number; max: number; score: Score04 };

function fromRange(value: number, ranges: RD[]): Score04 {
  return ranges.find(r => value >= r.min && value <= r.max)?.score ?? 4;
}

const T_RNG: RD[] = [
  { min: -99, max: 29.9, score: 4 }, { min: 30, max: 31.9, score: 3 },
  { min: 32, max: 33.9, score: 2 }, { min: 34, max: 35.9, score: 1 },
  { min: 36, max: 38.4, score: 0 }, { min: 38.5, max: 38.9, score: 1 },
  { min: 39, max: 40.9, score: 3 }, { min: 41, max: 99, score: 4 },
];
const MAP_RNG: RD[] = [
  { min: 0, max: 49, score: 4 }, { min: 50, max: 69, score: 2 },
  { min: 70, max: 109, score: 0 }, { min: 110, max: 129, score: 2 },
  { min: 130, max: 159, score: 3 }, { min: 160, max: 999, score: 4 },
];
const HR_RNG: RD[] = [
  { min: 0, max: 39, score: 4 }, { min: 40, max: 54, score: 3 },
  { min: 55, max: 69, score: 2 }, { min: 70, max: 109, score: 0 },
  { min: 110, max: 139, score: 2 }, { min: 140, max: 179, score: 3 },
  { min: 180, max: 999, score: 4 },
];
const RR_RNG: RD[] = [
  { min: 0, max: 5, score: 4 }, { min: 6, max: 9, score: 2 },
  { min: 10, max: 11, score: 1 }, { min: 12, max: 24, score: 0 },
  { min: 25, max: 34, score: 1 }, { min: 35, max: 49, score: 3 },
  { min: 50, max: 99, score: 4 },
];
const PH_RNG: RD[] = [
  { min: 0, max: 7.149, score: 4 }, { min: 7.15, max: 7.249, score: 3 },
  { min: 7.25, max: 7.329, score: 2 }, { min: 7.33, max: 7.499, score: 0 },
  { min: 7.50, max: 7.599, score: 1 }, { min: 7.60, max: 7.699, score: 3 },
  { min: 7.70, max: 9.99, score: 4 },
];
const NA_RNG: RD[] = [
  { min: 0, max: 110, score: 4 }, { min: 111, max: 119, score: 3 },
  { min: 120, max: 129, score: 2 }, { min: 130, max: 149, score: 0 },
  { min: 150, max: 154, score: 1 }, { min: 155, max: 159, score: 2 },
  { min: 160, max: 179, score: 3 }, { min: 180, max: 999, score: 4 },
];
const K_RNG: RD[] = [
  { min: 0, max: 2.49, score: 4 }, { min: 2.5, max: 2.99, score: 2 },
  { min: 3.0, max: 3.49, score: 1 }, { min: 3.5, max: 5.49, score: 0 },
  { min: 5.5, max: 5.99, score: 1 }, { min: 6.0, max: 6.99, score: 3 },
  { min: 7.0, max: 99, score: 4 },
];
const CR_RNG: RD[] = [
  { min: 0, max: 0.599, score: 2 }, { min: 0.6, max: 1.499, score: 0 },
  { min: 1.5, max: 1.999, score: 2 }, { min: 2.0, max: 3.499, score: 3 },
  { min: 3.5, max: 99, score: 4 },
];
const HCT_RNG: RD[] = [
  { min: 0, max: 19.9, score: 4 }, { min: 20, max: 29.9, score: 2 },
  { min: 30, max: 45.9, score: 0 }, { min: 46, max: 49.9, score: 1 },
  { min: 50, max: 59.9, score: 2 }, { min: 60, max: 99, score: 4 },
];
const WBC_RNG: RD[] = [
  { min: 0, max: 0.999, score: 4 }, { min: 1, max: 2.999, score: 2 },
  { min: 3, max: 14.999, score: 0 }, { min: 15, max: 19.999, score: 1 },
  { min: 20, max: 39.999, score: 2 }, { min: 40, max: 999, score: 4 },
];

export function scoreAPACHETemp(t: number):  Score04 { return fromRange(t,   T_RNG);   }
export function scoreAPACHEMap(m: number):   Score04 { return fromRange(m,   MAP_RNG); }
export function scoreAPACHEHR(h: number):    Score04 { return fromRange(h,   HR_RNG);  }
export function scoreAPACHERR(r: number):    Score04 { return fromRange(r,   RR_RNG);  }
export function scoreAPACHEPH(p: number):    Score04 { return fromRange(p,   PH_RNG);  }
export function scoreAPACHENa(n: number):    Score04 { return fromRange(n,   NA_RNG);  }
export function scoreAPACHEK(k: number):     Score04 { return fromRange(k,   K_RNG);   }
export function scoreAPACHEHct(h: number):   Score04 { return fromRange(h,   HCT_RNG); }
export function scoreAPACHEWBC(w: number):   Score04 { return fromRange(w,   WBC_RNG); }

export function scoreAPACHEOxy(pao2: number, fio2: number, paco2: number): { score: Score04; aado2?: number; ratio?: number } {
  if (fio2 < 50) {
    // PaO₂ direct scoring
    const score: Score04 = pao2 > 70 ? 0 : pao2 >= 61 ? 1 : pao2 >= 55 ? 3 : 4;
    return { score, ratio: Math.round(pao2 / (fio2 / 100)) };
  }
  // A-aDO₂ = (713 × FiO₂/100) - (PaCO₂/0.8) - PaO₂
  const aado2 = Math.round((713 * fio2 / 100) - (paco2 / 0.8) - pao2);
  const score: Score04 = aado2 < 200 ? 0 : aado2 < 350 ? 2 : aado2 < 500 ? 3 : 4;
  return { score, aado2 };
}

export function scoreAPACHECr(cr: number, aki: boolean): number {
  const base = fromRange(cr, CR_RNG);
  return aki ? Math.min(base * 2, 8) : base;  // doubled for AKI, max 8 (Knaus 1985)
}

export function gcsContrib(gcs: number): number { return 15 - Math.max(3, Math.min(15, gcs)); }

export function ageToPoints(age: number): AgePoints {
  if (age < 45) return 0;
  if (age < 55) return 2;
  if (age < 65) return 3;
  if (age < 75) return 5;
  return 6;
}

export interface APACHECalcResult { aps: number; total: number; mortalitas: number; agePoints: AgePoints }

export function calcAPACHEFromActual(v: APACHEActualValues): APACHECalcResult {
  const n = (x: number | ""): number | null => x === "" ? null : +x;
  const t = n(v.temperature), m = n(v.map), h = n(v.heartRate), r = n(v.rr);
  const p2 = n(v.pao2), fi = n(v.fio2), pc = n(v.paco2) ?? 40;
  const ph = n(v.ph), na = n(v.sodium), k = n(v.potassium);
  const cr = n(v.creatinine), hct = n(v.hematocrit), wbc = n(v.wbc), gcs = n(v.gcs);

  const oxyResult = (p2 !== null && fi !== null) ? scoreAPACHEOxy(p2, fi, pc) : { score: 0 as Score04 };

  const aps = (t    !== null ? scoreAPACHETemp(t)   : 0)
            + (m    !== null ? scoreAPACHEMap(m)    : 0)
            + (h    !== null ? scoreAPACHEHR(h)     : 0)
            + (r    !== null ? scoreAPACHERR(r)     : 0)
            + oxyResult.score
            + (ph   !== null ? scoreAPACHEPH(ph)   : 0)
            + (na   !== null ? scoreAPACHENa(na)   : 0)
            + (k    !== null ? scoreAPACHEK(k)     : 0)
            + (cr   !== null ? scoreAPACHECr(cr, v.akiPresent) : 0)
            + (hct  !== null ? scoreAPACHEHct(hct) : 0)
            + (wbc  !== null ? scoreAPACHEWBC(wbc) : 0)
            + (gcs  !== null ? gcsContrib(gcs)     : 0);

  const age = n(v.age);
  const agePoints: AgePoints = age !== null ? ageToPoints(age) : 0;
  const total = aps + agePoints + v.chronicType;
  const lnOdds = -3.517 + total * 0.146;
  const mortalitas = Math.min(99, Math.max(1, Math.round(Math.exp(lnOdds) / (1 + Math.exp(lnOdds)) * 100)));

  return { aps, total, mortalitas, agePoints };
}

// ── Risk helpers ───────────────────────────────────────────

export function calcSOFATotal(s: SOFAScores): number {
  return s.respirasi + s.koagulasi + s.liver + s.kardiovaskular + s.neurologi + s.renal;
}
export function getSOFARisk(total: number) {
  return SOFA_RISK.find(r => total <= r.max) ?? SOFA_RISK[SOFA_RISK.length - 1];
}
export function getAPACHERisk(total: number) {
  return APACHE_RISK.find(r => total <= r.max) ?? APACHE_RISK[APACHE_RISK.length - 1];
}

// ── Factories ──────────────────────────────────────────────

export function emptySOFAActual(): SOFAActualValues {
  return { pao2: "", fio2: 21, onVentilator: false, platelet: "", bilirubin: "",
           map: "", vasopressor: "none", vasopressorDose: "", gcs: "", creatinine: "", urineOutput: "" };
}

export function emptyAPACHEActual(): APACHEActualValues {
  return { temperature: "", map: "", heartRate: "", rr: "", pao2: "", fio2: 21, paco2: 40,
           ph: "", sodium: "", potassium: "", creatinine: "", akiPresent: false,
           hematocrit: "", wbc: "", gcs: "", age: "", chronicType: 0 };
}

export function emptyICUScoring(): ICUScoringData { return { sofa: [], apache: [] }; }

// ── Mock data — ri-3 (RM-2025-007, Syok Sepsis, ICU) ──────
// Skor dihitung dari nilai aktual sesuai tabel standar

export const ICU_SCORING_MOCK: Record<string, ICUScoringData> = {
  "RM-2025-007": {
    sofa: [
      {
        tanggal: "2026-05-12", total: 14, inputBy: "dr. Hendra Wijaya Sp.EM",
        catatan: "Masuk ICU, intubasi, NE 0.2 µg/kg/min",
        scores: { respirasi: 3, koagulasi: 2, liver: 2, kardiovaskular: 3, neurologi: 2, renal: 2 },
        actual: { pao2: 58, fio2: 60, onVentilator: true, platelet: 72, bilirubin: 3.8, map: 58,
                  vasopressor: "norepinephrine", vasopressorDose: 0.20, gcs: 10, creatinine: 2.4, urineOutput: 380 },
      },
      {
        tanggal: "2026-05-13", total: 13, inputBy: "dr. Hendra Wijaya Sp.EM",
        scores: { respirasi: 3, koagulasi: 2, liver: 2, kardiovaskular: 2, neurologi: 2, renal: 2 },
        actual: { pao2: 62, fio2: 55, onVentilator: true, platelet: 86, bilirubin: 3.2, map: 68,
                  vasopressor: "norepinephrine", vasopressorDose: 0.08, gcs: 10, creatinine: 2.2, urineOutput: 420 },
      },
      {
        tanggal: "2026-05-14", total: 9, inputBy: "dr. Hendra Wijaya Sp.EM",
        catatan: "NE turun ke 0.06, weaning ventilator",
        scores: { respirasi: 2, koagulasi: 1, liver: 1, kardiovaskular: 2, neurologi: 1, renal: 2 },
        actual: { pao2: 80, fio2: 45, onVentilator: true, platelet: 120, bilirubin: 1.6, map: 68,
                  vasopressor: "norepinephrine", vasopressorDose: 0.06, gcs: 13, creatinine: 2.0, urineOutput: 520 },
      },
      {
        tanggal: "2026-05-15", total: 7, inputBy: "dr. Hendra Wijaya Sp.EM",
        catatan: "Vasopressor off, trial SBT berhasil",
        scores: { respirasi: 2, koagulasi: 1, liver: 1, kardiovaskular: 1, neurologi: 1, renal: 1 },
        actual: { pao2: 95, fio2: 40, onVentilator: false, platelet: 138, bilirubin: 1.5, map: 64,
                  vasopressor: "none", vasopressorDose: "", gcs: 14, creatinine: 1.7, urineOutput: 680 },
      },
    ],
    apache: [
      {
        tanggal: "2026-05-12", aps: 28, total: 36, mortalitas: 77, inputBy: "dr. Hendra Wijaya Sp.EM",
        actual: { temperature: 38.8, map: 58, heartRate: 128, rr: 28, pao2: 58, fio2: 60, paco2: 52,
                  ph: 7.28, sodium: 138, potassium: 3.8, creatinine: 2.4, akiPresent: true,
                  hematocrit: 32, wbc: 22, gcs: 10, age: 48, chronicType: 5 },
      },
      {
        tanggal: "2026-05-14", aps: 18, total: 26, mortalitas: 54, inputBy: "dr. Hendra Wijaya Sp.EM",
        actual: { temperature: 37.8, map: 68, heartRate: 108, rr: 22, pao2: 80, fio2: 45, paco2: 42,
                  ph: 7.36, sodium: 136, potassium: 3.9, creatinine: 2.0, akiPresent: true,
                  hematocrit: 34, wbc: 16, gcs: 13, age: 48, chronicType: 5 },
      },
    ],
  },
};
