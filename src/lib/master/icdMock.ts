/**
 * Master ICD-10 & ICD-9-CM — mock data (representative sample).
 *
 * Konsumen: DiagnosaTab (semua modul) · Resume Medik · INA-CBG mapping
 * Replace: `shared/medical-records/diagnosaShared.ts` (ICD10 + ICD9 catalog hardcoded)
 *
 * Strategi: ~80 ICD-10 representatif lintas 22 chapter WHO + ~30 ICD-9-CM lintas kategori prosedur.
 * Bukan full dataset (real ICD-10: 15.000+ kode; ICD-9-CM: 4.000+).
 * Saat backend siap, import CSV resmi WHO/Kemkes via UI "Import CSV" (tahap 2).
 *
 * Standar: WHO ICD-10 (2019) · ICD-9-CM (CDC NCHS) · INA-CBG mapping Kemkes
 */

// ── Types ────────────────────────────────────────────────

export type IcdJenis = "ICD-10" | "ICD-9";

export type IcdStatus = "Aktif" | "Non_Aktif";

export interface IcdItem {
  id: string;
  jenis: IcdJenis;
  kode: string;
  nama: string;
  namaInggris?: string;
  chapter: string;       // chapter/group label (mis. "IX. Penyakit Sirkulasi" atau "Diagnostik")
  blok?: string;         // sub-blok dalam chapter
  inaCbg?: string;       // INA-CBG group code (untuk ICD-10)
  status: IcdStatus;
}

// ── Empty factory ────────────────────────────────────────

export function emptyIcdItem(jenis: IcdJenis = "ICD-10"): IcdItem {
  return {
    id: `icd-${Date.now().toString(36)}`,
    jenis,
    kode: "",
    nama: "",
    namaInggris: "",
    chapter: "",
    blok: "",
    inaCbg: "",
    status: "Aktif",
  };
}

// ── Helpers ──────────────────────────────────────────────

function mk10(
  id: string, kode: string, nama: string, namaInggris: string, chapter: string,
  blok?: string, inaCbg?: string,
): IcdItem {
  return { id, jenis: "ICD-10", kode, nama, namaInggris, chapter, blok, inaCbg, status: "Aktif" };
}

function mk9(
  id: string, kode: string, nama: string, kategori: string,
): IcdItem {
  return { id, jenis: "ICD-9", kode, nama, chapter: kategori, status: "Aktif" };
}

// ── ICD-10 mock (~80 entries lintas chapter WHO) ─────────

const ICD10_MOCK: IcdItem[] = [
  // I. Infeksi & Parasit (A00–B99)
  mk10("i10-a09",  "A09",   "Diare dan gastroenteritis dengan asal infeksi", "Diarrhoea and gastroenteritis of presumed infectious origin", "I. Infeksi & Parasit", "A00–A09", "A-4-13"),
  mk10("i10-a15",  "A15.0", "Tuberkulosis paru, tes bakteri positif",        "Tuberculosis of lung, confirmed by sputum microscopy", "I. Infeksi & Parasit", "A15–A19", "A-4-15"),
  mk10("i10-a41",  "A41.9", "Sepsis, organisme tidak spesifik",              "Sepsis, unspecified organism",                         "I. Infeksi & Parasit", "A30–A49", "A-4-14"),
  mk10("i10-b18",  "B18.1", "Hepatitis B kronis tanpa agen delta",           "Chronic viral hepatitis B without delta agent",       "I. Infeksi & Parasit", "B15–B19"),
  mk10("i10-b20",  "B20",   "Penyakit HIV",                                  "Human immunodeficiency virus disease",                "I. Infeksi & Parasit", "B20–B24"),
  mk10("i10-b34",  "B34.9", "Infeksi viral, tidak spesifik",                 "Viral infection, unspecified",                        "I. Infeksi & Parasit", "B25–B34"),

  // II. Neoplasma (C00–D48)
  mk10("i10-c34",  "C34.9", "Neoplasma ganas bronkus & paru, tidak spesifik",  "Malignant neoplasm of bronchus and lung, unspecified", "II. Neoplasma", "C30–C39", "C-4-15"),
  mk10("i10-c50",  "C50.9", "Neoplasma ganas payudara, tidak spesifik",      "Malignant neoplasm of breast, unspecified",          "II. Neoplasma", "C50",     "C-4-13"),
  mk10("i10-c18",  "C18.9", "Neoplasma ganas kolon, tidak spesifik",         "Malignant neoplasm of colon, unspecified",           "II. Neoplasma", "C15–C26"),
  mk10("i10-d05",  "D05.7", "Karsinoma in situ payudara, lainnya",           "Other carcinoma in situ of breast",                  "II. Neoplasma", "D05"),

  // III. Darah & Imun (D50–D89)
  mk10("i10-d50",  "D50.9", "Anemia defisiensi besi, tidak spesifik",        "Iron deficiency anaemia, unspecified",               "III. Darah & Imun", "D50–D53"),
  mk10("i10-d64",  "D64.9", "Anemia, tidak spesifik",                        "Anaemia, unspecified",                               "III. Darah & Imun", "D60–D64"),

  // IV. Endokrin, Nutrisi & Metabolik (E00–E90)
  mk10("i10-e11",  "E11.9", "Diabetes Melitus tipe 2 tanpa komplikasi",      "Type 2 diabetes mellitus without complications",     "IV. Endokrin", "E10–E14", "E-4-10"),
  mk10("i10-e116", "E11.65","Diabetes Melitus tipe 2 dengan hiperglikemia",  "Type 2 diabetes mellitus with hyperglycemia",        "IV. Endokrin", "E10–E14", "E-4-10"),
  mk10("i10-e160", "E16.0", "Hipoglikemia akibat obat tanpa koma",           "Drug-induced hypoglycaemia without coma",            "IV. Endokrin", "E15–E16"),
  mk10("i10-e785", "E78.5", "Hiperlipidemia, tidak spesifik",                "Hyperlipidaemia, unspecified",                       "IV. Endokrin", "E70–E90"),
  mk10("i10-e871", "E87.1", "Hipo-osmolalitas dan hiponatremia",             "Hypo-osmolality and hyponatraemia",                  "IV. Endokrin", "E70–E90"),
  mk10("i10-e860", "E86.0", "Dehidrasi",                                     "Dehydration",                                        "IV. Endokrin", "E70–E90"),
  mk10("i10-e039", "E03.9", "Hipotiroidisme, tidak spesifik",                "Hypothyroidism, unspecified",                        "IV. Endokrin", "E00–E07"),

  // V. Mental & Perilaku (F00–F99)
  mk10("i10-f03",  "F03",   "Demensia, tidak spesifik",                      "Unspecified dementia",                               "V. Mental",    "F00–F09"),
  mk10("i10-f329", "F32.9", "Depresi episode, tidak spesifik",               "Major depressive disorder, single episode, unspecified", "V. Mental", "F30–F39"),
  mk10("i10-f419", "F41.9", "Gangguan kecemasan, tidak spesifik",            "Anxiety disorder, unspecified",                      "V. Mental",    "F40–F48"),

  // VI. Sistem Saraf (G00–G99)
  mk10("i10-g409", "G40.9", "Epilepsi, tidak spesifik",                      "Epilepsy, unspecified",                              "VI. Saraf",    "G40–G47"),
  mk10("i10-g439", "G43.9", "Migrain, tidak spesifik",                       "Migraine, unspecified",                              "VI. Saraf",    "G40–G47"),
  mk10("i10-g819", "G81.9", "Hemiplegia, tidak spesifik",                    "Hemiplegia, unspecified",                            "VI. Saraf",    "G80–G83"),

  // VII. Mata (H00–H59)
  mk10("i10-h259", "H25.9", "Katarak senilis, tidak spesifik",               "Senile cataract, unspecified",                       "VII. Mata",    "H25–H28", "H-1-40"),

  // VIII. Telinga (H60–H95)
  mk10("i10-h669", "H66.9", "Otitis media, tidak spesifik",                  "Otitis media, unspecified",                          "VIII. Telinga", "H65–H75"),

  // IX. Sistem Sirkulasi (I00–I99) — high volume
  mk10("i10-i10",  "I10",   "Hipertensi esensial (primer)",                   "Essential (primary) hypertension",                   "IX. Sirkulasi", "I10–I15", "I-4-12"),
  mk10("i10-i200", "I20.0", "Angina pektoris tidak stabil",                  "Unstable angina",                                    "IX. Sirkulasi", "I20–I25", "I-4-13"),
  mk10("i10-i210", "I21.0", "Infark miokard akut transmural anterior",       "Acute transmural MI of anterior wall",               "IX. Sirkulasi", "I20–I25", "I-4-14"),
  mk10("i10-i214", "I21.4", "NSTEMI",                                        "Non-ST elevation myocardial infarction",             "IX. Sirkulasi", "I20–I25", "I-4-14"),
  mk10("i10-i48",  "I48",   "Atrial fibrilasi dan flutter",                  "Atrial fibrillation and flutter",                    "IX. Sirkulasi", "I44–I49"),
  mk10("i10-i500", "I50.0", "Gagal jantung kongestif",                       "Congestive heart failure",                           "IX. Sirkulasi", "I50",     "I-4-12"),
  mk10("i10-i639", "I63.9", "Infark serebral, tidak spesifik",               "Cerebral infarction, unspecified",                   "IX. Sirkulasi", "I60–I69", "G-4-10"),
  mk10("i10-r570", "R57.0", "Syok kardiogenik",                              "Cardiogenic shock",                                  "IX. Sirkulasi", "R57"),
  mk10("i10-i839", "I83.9", "Varises vena ekstremitas bawah",                "Varicose veins of lower extremities",                "IX. Sirkulasi", "I80–I89"),

  // X. Sistem Pernapasan (J00–J99)
  mk10("i10-j189", "J18.9", "Pneumonia, organisme tidak spesifik",           "Pneumonia, unspecified organism",                    "X. Pernapasan", "J09–J18", "J-4-12"),
  mk10("i10-j441", "J44.1", "PPOK dengan eksaserbasi akut",                  "COPD with acute exacerbation",                       "X. Pernapasan", "J40–J47", "J-4-13"),
  mk10("i10-j459", "J45.9", "Asma, tidak spesifik",                          "Asthma, unspecified",                                "X. Pernapasan", "J40–J47"),
  mk10("i10-j960", "J96.0", "Gagal napas akut",                              "Acute respiratory failure",                          "X. Pernapasan", "J95–J99"),
  mk10("i10-j22",  "J22",   "Infeksi saluran napas bawah akut tidak spesifik","Unspecified acute lower respiratory infection",      "X. Pernapasan", "J20–J22"),
  mk10("i10-j06",  "J06.9", "ISPA atas akut, tidak spesifik",                "Acute upper respiratory infection, unspecified",     "X. Pernapasan", "J00–J06"),

  // XI. Sistem Pencernaan (K00–K93)
  mk10("i10-k250", "K25.0", "Tukak gaster akut dengan perdarahan",           "Gastric ulcer, acute with haemorrhage",              "XI. Pencernaan", "K20–K31"),
  mk10("i10-k297", "K29.7", "Gastritis, tidak spesifik",                     "Gastritis, unspecified",                             "XI. Pencernaan", "K20–K31"),
  mk10("i10-k352", "K35.2", "Apendisitis akut dengan peritonitis general",   "Acute appendicitis with generalized peritonitis",    "XI. Pencernaan", "K35–K38", "K-1-15"),
  mk10("i10-k921", "K92.1", "Melena",                                        "Melaena",                                            "XI. Pencernaan", "K90–K93"),
  mk10("i10-k740", "K74.0", "Fibrosis hati",                                 "Hepatic fibrosis",                                   "XI. Pencernaan", "K70–K77"),

  // XII. Kulit & Subkutan (L00–L99)
  mk10("i10-l03",  "L03.9", "Selulitis, tidak spesifik",                     "Cellulitis, unspecified",                            "XII. Kulit",     "L00–L08"),
  mk10("i10-l90",  "L98.4", "Ulkus dekubitus",                               "Pressure ulcer",                                     "XII. Kulit",     "L98"),

  // XIII. Muskuloskeletal (M00–M99)
  mk10("i10-m069", "M06.9", "Rheumatoid arthritis, tidak spesifik",          "Rheumatoid arthritis, unspecified",                  "XIII. Muskuloskeletal", "M05–M14"),
  mk10("i10-m545", "M54.5", "Nyeri punggung bawah",                          "Low back pain",                                      "XIII. Muskuloskeletal", "M50–M54"),

  // XIV. Genitourinari (N00–N99)
  mk10("i10-n179", "N17.9", "Gagal ginjal akut, tidak spesifik",             "Acute kidney failure, unspecified",                  "XIV. Genitourinari", "N17–N19", "N-4-10"),
  mk10("i10-n183", "N18.3", "Penyakit ginjal kronis, stadium 3",             "Chronic kidney disease, stage 3",                    "XIV. Genitourinari", "N17–N19", "N-4-12"),
  mk10("i10-n300", "N30.0", "Sistitis akut",                                 "Acute cystitis",                                     "XIV. Genitourinari", "N30"),
  mk10("i10-n10",  "N10",   "Pielonefritis akut",                            "Acute pyelonephritis",                               "XIV. Genitourinari", "N10–N16"),
  mk10("i10-n200", "N20.0", "Batu ginjal",                                   "Calculus of kidney",                                 "XIV. Genitourinari", "N20–N23"),

  // XV. Kehamilan & Persalinan (O00–O99)
  mk10("i10-o14",  "O14.9", "Pre-eklampsia, tidak spesifik",                  "Unspecified pre-eclampsia",                          "XV. Kehamilan", "O10–O16", "O-1-12"),
  mk10("i10-o80",  "O80",   "Persalinan tunggal spontan",                    "Single spontaneous delivery",                        "XV. Kehamilan", "O80–O84", "O-6-10"),
  mk10("i10-o829", "O82.9", "Persalinan dengan sectio caesarea, tidak spesifik", "Delivery by caesarean section, unspecified",       "XV. Kehamilan", "O80–O84", "O-6-12"),

  // XVI. Perinatal (P00–P96)
  mk10("i10-p079", "P07.9", "Berat lahir rendah, tidak spesifik",             "Low birth weight, unspecified",                      "XVI. Perinatal", "P05–P08", "P-8-15"),
  mk10("i10-p23",  "P23.9", "Pneumonia kongenital, tidak spesifik",          "Congenital pneumonia, unspecified",                  "XVI. Perinatal", "P20–P29"),

  // XVII. Kongenital (Q00–Q99)
  mk10("i10-q21",  "Q21.0", "Defek septum ventrikel",                        "Ventricular septal defect",                          "XVII. Kongenital", "Q20–Q28"),

  // XVIII. Gejala & Tanda (R00–R99)
  mk10("i10-r05",  "R05",   "Batuk",                                         "Cough",                                              "XVIII. Gejala", "R00–R09"),
  mk10("i10-r509", "R50.9", "Demam, tidak spesifik",                         "Fever, unspecified",                                 "XVIII. Gejala", "R50–R69"),
  mk10("i10-r55",  "R55",   "Sinkop dan kolaps",                             "Syncope and collapse",                               "XVIII. Gejala", "R55"),
  mk10("i10-r104", "R10.4", "Nyeri abdomen lainnya dan tidak spesifik",      "Other and unspecified abdominal pain",               "XVIII. Gejala", "R10–R19"),

  // XIX. Cedera & Keracunan (S00–T98)
  mk10("i10-s060", "S06.0", "Konkusi",                                       "Concussion",                                         "XIX. Cedera", "S00–S09"),
  mk10("i10-s525", "S52.5", "Fraktur ujung bawah radius",                    "Fracture of lower end of radius",                    "XIX. Cedera", "S50–S59"),
  mk10("i10-s720", "S72.0", "Fraktur kolum femur",                           "Fracture of neck of femur",                          "XIX. Cedera", "S70–S79"),
  mk10("i10-s220", "S22.0", "Fraktur vertebra torakal",                      "Fracture of thoracic vertebra",                      "XIX. Cedera", "S20–S29"),
  mk10("i10-t141", "T14.1", "Luka terbuka regio tubuh tidak spesifik",       "Open wound of unspecified body region",              "XIX. Cedera", "T08–T14"),
  mk10("i10-t36",  "T36.9", "Keracunan antibiotik sistemik, tidak spesifik",  "Poisoning by systemic antibiotic, unspecified",     "XIX. Cedera", "T36–T50"),

  // XX. Sebab Luar (V01–Y98) — subset
  mk10("i10-v49",  "V49.9", "Cedera lalu lintas mobil, tidak spesifik",      "Car traffic accident, unspecified",                  "XX. Sebab Luar", "V40–V49"),

  // XXI. Faktor Status Kesehatan (Z00–Z99)
  mk10("i10-z00",  "Z00.0", "Pemeriksaan medis umum",                        "General medical examination",                        "XXI. Status Kesehatan", "Z00–Z13"),
  mk10("i10-z51",  "Z51.1", "Sesi kemoterapi neoplasma",                     "Encounter for antineoplastic chemotherapy",          "XXI. Status Kesehatan", "Z40–Z54"),
];

// ── ICD-9-CM mock (~30 prosedur umum) ────────────────────

const ICD9_MOCK: IcdItem[] = [
  // Diagnostik
  mk9("i9-89.52", "89.52", "Elektrokardiogram (EKG)",                    "Diagnostik"),
  mk9("i9-89.61", "89.61", "Pemeriksaan tekanan darah",                  "Diagnostik"),
  mk9("i9-89.39", "89.39", "Observasi dan evaluasi lainnya",             "Diagnostik"),
  mk9("i9-89.65", "89.65", "Sampling darah arteri",                      "Diagnostik"),
  mk9("i9-89.7",  "89.7",  "Pemeriksaan fisik umum",                     "Diagnostik"),

  // Radiologi
  mk9("i9-88.72", "88.72", "CT Scan toraks",                              "Radiologi"),
  mk9("i9-88.71", "88.71", "CT Scan kepala",                              "Radiologi"),
  mk9("i9-87.44", "87.44", "Foto rontgen toraks",                         "Radiologi"),
  mk9("i9-88.76", "88.76", "CT Scan abdomen",                             "Radiologi"),
  mk9("i9-88.79", "88.79", "USG abdomen",                                 "Radiologi"),
  mk9("i9-88.91", "88.91", "MRI kepala",                                  "Radiologi"),

  // Laboratorium
  mk9("i9-90.59", "90.59", "Pemeriksaan laboratorium darah lengkap",      "Laboratorium"),
  mk9("i9-90.55", "90.55", "Pemeriksaan enzim jantung / troponin",        "Laboratorium"),
  mk9("i9-90.51", "90.51", "Pemeriksaan gula darah sewaktu",              "Laboratorium"),
  mk9("i9-90.09", "90.09", "Analisis gas darah (AGD)",                    "Laboratorium"),
  mk9("i9-91.31", "91.31", "Pemeriksaan urin lengkap",                    "Laboratorium"),

  // Terapi / Pengobatan
  mk9("i9-93.90", "93.90", "Pemberian oksigen kontinu (NRM/nasal kanul)", "Terapi"),
  mk9("i9-99.15", "99.15", "Infus dekstrosa",                             "Terapi"),
  mk9("i9-99.18", "99.18", "Injeksi/infus elektrolit",                    "Terapi"),
  mk9("i9-99.21", "99.21", "Injeksi insulin",                             "Terapi"),
  mk9("i9-99.29", "99.29", "Injeksi obat lainnya",                        "Terapi"),
  mk9("i9-99.04", "99.04", "Transfusi packed red cells",                  "Terapi"),

  // Prosedur Bedah & Intervensi
  mk9("i9-38.93", "38.93", "Pemasangan akses vena sentral",                "Prosedur Bedah"),
  mk9("i9-38.99", "38.99", "Pemasangan IV line perifer",                   "Prosedur Bedah"),
  mk9("i9-96.04", "96.04", "Intubasi trakea",                              "Prosedur Bedah"),
  mk9("i9-96.71", "96.71", "Ventilasi mekanik <96 jam",                    "Prosedur Bedah"),
  mk9("i9-57.94", "57.94", "Pemasangan kateter urin",                      "Prosedur Bedah"),
  mk9("i9-54.91", "54.91", "Aspirasi peritoneal",                          "Prosedur Bedah"),
  mk9("i9-86.59", "86.59", "Penutupan luka / hecting",                     "Prosedur Bedah"),
  mk9("i9-79.39", "79.39", "Reposisi fraktur tertutup",                    "Prosedur Bedah"),
  mk9("i9-47.09", "47.09", "Apendektomi",                                  "Prosedur Bedah"),
  mk9("i9-74.1",  "74.1",  "Sectio caesarea klasik",                       "Prosedur Bedah"),
];

export const ICD_MOCK: IcdItem[] = [...ICD10_MOCK, ...ICD9_MOCK];

// ── Validators ───────────────────────────────────────────

export function isIcdValid(item: IcdItem, isNew = false): boolean {
  if (isNew) return !!item.nama.trim();
  return !!(item.kode.trim() && item.nama.trim() && item.chapter.trim());
}

// ── UI helpers ───────────────────────────────────────────

export function icdInitials(item: IcdItem): string {
  return item.kode.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() || "??";
}

export function getIcdStatusCfg(status: IcdStatus) {
  if (status === "Non_Aktif") {
    return { label: "Non-Aktif", bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" };
  }
  return { label: "Aktif", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" };
}

/** Daftar chapter unik per jenis (untuk filter dropdown). */
export function getChaptersByJenis(items: IcdItem[], jenis: IcdJenis): string[] {
  const set = new Set<string>();
  items.forEach((i) => { if (i.jenis === jenis) set.add(i.chapter); });
  return Array.from(set).sort();
}
