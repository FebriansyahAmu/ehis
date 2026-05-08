import type { DiagnosaTipe, DiagnosaStatus } from "@/lib/data";

// ── Catalog types ─────────────────────────────────────────

export interface CatalogEntry { kode: string; nama: string; kategori: string }

export interface Icd9ProsedurEntry {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
  catatan: string;
}

// ── ICD-10 catalog ────────────────────────────────────────

export const ICD10: CatalogEntry[] = [
  { kode: "I10",    nama: "Essential (primary) hypertension",                kategori: "Kardiovaskular" },
  { kode: "I21.0",  nama: "Acute transmural MI of anterior wall",            kategori: "Kardiovaskular" },
  { kode: "I21.4",  nama: "Non-ST elevation myocardial infarction",          kategori: "Kardiovaskular" },
  { kode: "I50.0",  nama: "Congestive heart failure",                        kategori: "Kardiovaskular" },
  { kode: "I63.9",  nama: "Cerebral infarction, unspecified",                kategori: "Kardiovaskular" },
  { kode: "R57.0",  nama: "Cardiogenic shock",                               kategori: "Kardiovaskular" },
  { kode: "I48",    nama: "Atrial fibrillation and flutter",                 kategori: "Kardiovaskular" },
  { kode: "I20.0",  nama: "Unstable angina",                                 kategori: "Kardiovaskular" },
  { kode: "E11.9",  nama: "Type 2 diabetes mellitus without complications",  kategori: "Metabolik"      },
  { kode: "E11.65", nama: "Type 2 diabetes mellitus with hyperglycemia",     kategori: "Metabolik"      },
  { kode: "E16.0",  nama: "Drug-induced hypoglycaemia without coma",         kategori: "Metabolik"      },
  { kode: "E78.5",  nama: "Hyperlipidaemia, unspecified",                    kategori: "Metabolik"      },
  { kode: "E87.1",  nama: "Hypo-osmolality and hyponatraemia",               kategori: "Metabolik"      },
  { kode: "E86.0",  nama: "Dehydration",                                     kategori: "Metabolik"      },
  { kode: "J18.9",  nama: "Pneumonia, unspecified organism",                 kategori: "Pernapasan"     },
  { kode: "J44.1",  nama: "COPD with acute exacerbation",                    kategori: "Pernapasan"     },
  { kode: "J45.9",  nama: "Asthma, unspecified",                             kategori: "Pernapasan"     },
  { kode: "J96.0",  nama: "Acute respiratory failure",                       kategori: "Pernapasan"     },
  { kode: "J22",    nama: "Unspecified acute lower respiratory infection",    kategori: "Pernapasan"     },
  { kode: "K25.0",  nama: "Gastric ulcer, acute with haemorrhage",           kategori: "Pencernaan"     },
  { kode: "K29.7",  nama: "Gastritis, unspecified",                          kategori: "Pencernaan"     },
  { kode: "K35.2",  nama: "Acute appendicitis with generalized peritonitis", kategori: "Pencernaan"     },
  { kode: "K92.1",  nama: "Melaena",                                         kategori: "Pencernaan"     },
  { kode: "G40.9",  nama: "Epilepsy, unspecified",                           kategori: "Neurologi"      },
  { kode: "G43.9",  nama: "Migraine, unspecified",                           kategori: "Neurologi"      },
  { kode: "R55",    nama: "Syncope and collapse",                            kategori: "Neurologi"      },
  { kode: "S06.0",  nama: "Concussion",                                      kategori: "Neurologi"      },
  { kode: "S52.5",  nama: "Fracture of lower end of radius",                 kategori: "Trauma"         },
  { kode: "S72.0",  nama: "Fracture of neck of femur",                       kategori: "Trauma"         },
  { kode: "T14.1",  nama: "Open wound of unspecified body region",           kategori: "Trauma"         },
  { kode: "S22.0",  nama: "Fracture of thoracic vertebra",                   kategori: "Trauma"         },
  { kode: "A09",    nama: "Gastroenteritis and colitis of infectious origin", kategori: "Infeksi"        },
  { kode: "A41.9",  nama: "Sepsis, unspecified organism",                    kategori: "Infeksi"        },
  { kode: "N30.0",  nama: "Acute cystitis",                                  kategori: "Infeksi"        },
  { kode: "N10",    nama: "Acute pyelonephritis",                            kategori: "Infeksi"        },
  { kode: "B34.9",  nama: "Viral infection, unspecified",                    kategori: "Infeksi"        },
  { kode: "N17.9",  nama: "Acute kidney failure, unspecified",               kategori: "Ginjal"         },
  { kode: "N18.3",  nama: "Chronic kidney disease, stage 3",                 kategori: "Ginjal"         },
];

// ── ICD-9-CM catalog ──────────────────────────────────────

export const ICD9: CatalogEntry[] = [
  { kode: "89.52",  nama: "Elektrokardiogram (EKG)",                               kategori: "Diagnostik"   },
  { kode: "89.61",  nama: "Pemeriksaan tekanan darah",                             kategori: "Diagnostik"   },
  { kode: "89.39",  nama: "Observasi dan evaluasi lainnya",                        kategori: "Diagnostik"   },
  { kode: "88.72",  nama: "CT Scan toraks",                                        kategori: "Radiologi"    },
  { kode: "88.71",  nama: "CT Scan kepala",                                        kategori: "Radiologi"    },
  { kode: "87.44",  nama: "Foto rontgen toraks",                                   kategori: "Radiologi"    },
  { kode: "88.76",  nama: "CT Scan abdomen",                                       kategori: "Radiologi"    },
  { kode: "88.79",  nama: "USG abdomen",                                           kategori: "Radiologi"    },
  { kode: "93.90",  nama: "Pemberian oksigen tambahan kontinyu (NRM/nasal kanul)", kategori: "Terapi"       },
  { kode: "99.15",  nama: "Infus dekstrosa",                                       kategori: "Terapi"       },
  { kode: "99.18",  nama: "Injeksi/infus elektrolit",                              kategori: "Terapi"       },
  { kode: "99.21",  nama: "Injeksi insulin",                                       kategori: "Terapi"       },
  { kode: "99.29",  nama: "Injeksi obat lainnya",                                  kategori: "Terapi"       },
  { kode: "38.93",  nama: "Pemasangan akses vena sentral",                         kategori: "Prosedur"     },
  { kode: "38.99",  nama: "Pemasangan IV line perifer",                            kategori: "Prosedur"     },
  { kode: "96.04",  nama: "Intubasi trakea",                                       kategori: "Prosedur"     },
  { kode: "96.71",  nama: "Ventilasi mekanik < 96 jam",                            kategori: "Prosedur"     },
  { kode: "57.94",  nama: "Pemasangan kateter urin",                               kategori: "Prosedur"     },
  { kode: "54.91",  nama: "Aspirasi peritoneal",                                   kategori: "Prosedur"     },
  { kode: "86.59",  nama: "Penutupan luka/hecting",                                kategori: "Prosedur"     },
  { kode: "79.39",  nama: "Reposisi fraktur tertutup",                             kategori: "Prosedur"     },
  { kode: "90.59",  nama: "Pemeriksaan laboratorium darah lengkap",                kategori: "Laboratorium" },
  { kode: "90.55",  nama: "Pemeriksaan kimia darah (enzim jantung/troponin)",      kategori: "Laboratorium" },
  { kode: "90.51",  nama: "Pemeriksaan gula darah sewaktu",                        kategori: "Laboratorium" },
  { kode: "90.09",  nama: "Pemeriksaan analisis gas darah (AGD)",                  kategori: "Laboratorium" },
];

// ── Tipe config ───────────────────────────────────────────

export const TIPE_CONFIG: Record<DiagnosaTipe, {
  bg: string; text: string; ring: string; dot: string; border: string;
}> = {
  Utama:      { bg: "bg-rose-50",   text: "text-rose-700",   ring: "ring-rose-200",   dot: "bg-rose-500",   border: "border-l-rose-400"  },
  Sekunder:   { bg: "bg-sky-50",    text: "text-sky-700",    ring: "ring-sky-200",    dot: "bg-sky-500",    border: "border-l-sky-400"   },
  Komplikasi: { bg: "bg-amber-50",  text: "text-amber-700",  ring: "ring-amber-200",  dot: "bg-amber-400",  border: "border-l-amber-400" },
  Komorbid:   { bg: "bg-slate-100", text: "text-slate-600",  ring: "ring-slate-200",  dot: "bg-slate-400",  border: "border-l-slate-300" },
};

export const TIPE_ORDER: DiagnosaTipe[] = ["Utama", "Sekunder", "Komplikasi", "Komorbid"];

// ── Status config ─────────────────────────────────────────

export const STATUS_CONFIG: Record<DiagnosaStatus, {
  bg: string; text: string; ring: string; dot: string;
}> = {
  Pasti:       { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-500" },
  Dicurigai:   { bg: "bg-amber-50",   text: "text-amber-600",   ring: "ring-amber-200",   dot: "bg-amber-400"  },
  Diferensial: { bg: "bg-slate-100",  text: "text-slate-500",   ring: "ring-slate-200",   dot: "bg-slate-400"  },
};

export const STATUS_ORDER: DiagnosaStatus[] = ["Pasti", "Dicurigai", "Diferensial"];

// ── INA-CBG mapping (estimasi berdasarkan kategori ICD-10) ─

export const INA_CBG_MAP: Record<string, string> = {
  Kardiovaskular: "Penyakit Jantung & Pembuluh Darah",
  Metabolik:      "Endokrin, Nutrisi & Metabolisme",
  Pernapasan:     "Penyakit Saluran Napas",
  Pencernaan:     "Penyakit Saluran Cerna",
  Neurologi:      "Penyakit Saraf & Otak",
  Trauma:         "Cedera, Keracunan & Sebab Eksternal",
  Infeksi:        "Penyakit Infeksi & Parasit",
  Ginjal:         "Penyakit Ginjal & Saluran Kemih",
};
