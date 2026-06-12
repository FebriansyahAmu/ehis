/**
 * Mock KFA (Kamus Farmasi & Alat Kesehatan) — SatuSehat / Kemenkes.
 *
 * Dipakai untuk fitur "Mapping ke KFA" di master Katalog Obat: petugas mencari
 * produk KFA berdasarkan nama obat, lalu memetakan POA/POV + Rute + Bentuk
 * Sediaan + BZA (zat aktif) & dosis. Hasil mapping ⇒ interoperabilitas FHIR
 * SatuSehat (resource `Medication`).
 *
 * Hierarki KFA:
 *  - BZA  (Bahan Zat Aktif)     → kode 91xxxxxx  (zat aktif + UCUM)
 *  - POV  (Produk Obat Virtual) → kode 92xxxxxx  (generik, tanpa merk — `product_template`)
 *  - POA  (Produk Obat Aktual)  → `kfa_code` produk ber-NIE BPOM (merk spesifik)
 *
 * Schema `KfaProduct` sengaja mirror response KFA v2 `GET /products/all`
 * (field di-camelCase) supaya saat backend siap cukup ganti body
 * `searchKfaProducts()` → fetch BFF proxy tanpa ubah konsumen UI.
 *
 * Sistem kode FHIR KFA: `http://sys-ids.kemkes.go.id/kfa`.
 */

export const KFA_SYSTEM_URL = "http://sys-ids.kemkes.go.id/kfa";

export type KfaFarmalkesType = "medicine" | "vaccine" | "device";

/** Bahan Zat Aktif (BZA) — kode KFA 91xxxxxx. */
export interface KfaActiveIngredient {
  /** Kode BZA (prefix 91xxxxxx) */
  kode: string;
  /** Nama zat aktif (display) */
  zatAktif: string;
  /** Kekuatan numerik per satuan (mis. 500) */
  kekuatan?: number;
  /** Satuan kekuatan / UCUM (mis. "mg", "mcg", "IU") */
  satuan?: string;
}

/** Produk KFA aktual (POA) — mirror response `/products` KFA v2. */
export interface KfaProduct {
  /** kfa_code produk aktual (POA), ber-NIE */
  kfaCode: string;
  /** Nama lengkap produk (KFA) */
  name: string;
  active: boolean;
  /** Nomor Izin Edar BPOM (NIE) */
  nie?: string;
  /** Nama dagang / merk */
  namaDagang?: string;
  /** Pabrik / produsen */
  manufacturer?: string;
  farmalkesType: KfaFarmalkesType;
  /** Bentuk sediaan (dosage_form) */
  dosageForm: { code: string; name: string };
  /** Rute pemberian */
  rutePemberian: { code: string; name: string };
  /** Satuan dasar / unit of measure */
  uom: { code: string; name: string };
  /** Dosis per satuan (mis. "500 mg / 1 tablet") */
  dosePerUnit?: string;
  /** Produk Obat Virtual (POV) — template 92xxxxxx */
  productTemplate: { code: string; name: string };
  /** Bahan zat aktif (BZA) */
  activeIngredients: KfaActiveIngredient[];
}

// ── Mock dataset ──────────────────────────────────────────
// Kode KFA di bawah ILUSTRATIF (mirip pola resmi) untuk demo mapping.

export const KFA_MOCK: KfaProduct[] = [
  // ── Parasetamol (3 varian merk) ──
  {
    kfaCode: "936210001", name: "Parasetamol 500 mg Tablet (Sanmol)", active: true,
    nie: "DBL7613500410A1", namaDagang: "Sanmol", manufacturer: "Sanbe Farma",
    farmalkesType: "medicine",
    dosageForm: { code: "BS001", name: "Tablet" },
    rutePemberian: { code: "RM001", name: "Oral" },
    uom: { code: "UM001", name: "Tablet" },
    dosePerUnit: "500 mg / 1 tablet",
    productTemplate: { code: "92000111", name: "Parasetamol 500 mg Tablet" },
    activeIngredients: [{ kode: "91000101", zatAktif: "Parasetamol", kekuatan: 500, satuan: "mg" }],
  },
  {
    kfaCode: "936210002", name: "Parasetamol 500 mg Tablet (Panadol)", active: true,
    nie: "DBL9209500410B1", namaDagang: "Panadol", manufacturer: "Sterling Products",
    farmalkesType: "medicine",
    dosageForm: { code: "BS001", name: "Tablet" },
    rutePemberian: { code: "RM001", name: "Oral" },
    uom: { code: "UM001", name: "Tablet" },
    dosePerUnit: "500 mg / 1 tablet",
    productTemplate: { code: "92000111", name: "Parasetamol 500 mg Tablet" },
    activeIngredients: [{ kode: "91000101", zatAktif: "Parasetamol", kekuatan: 500, satuan: "mg" }],
  },
  {
    kfaCode: "936210003", name: "Parasetamol 120 mg/5 mL Sirup (Sanmol Forte)", active: true,
    nie: "DBL7613500433A1", namaDagang: "Sanmol Forte", manufacturer: "Sanbe Farma",
    farmalkesType: "medicine",
    dosageForm: { code: "BS010", name: "Sirup" },
    rutePemberian: { code: "RM001", name: "Oral" },
    uom: { code: "UM010", name: "Botol" },
    dosePerUnit: "120 mg / 5 mL",
    productTemplate: { code: "92000115", name: "Parasetamol 120 mg/5 mL Sirup" },
    activeIngredients: [{ kode: "91000101", zatAktif: "Parasetamol", kekuatan: 120, satuan: "mg" }],
  },

  // ── Amoksisilin-Klavulanat ──
  {
    kfaCode: "936220010", name: "Amoksisilin 500 mg + Asam Klavulanat 125 mg Tablet Salut (Augmentin)", active: true,
    nie: "DKL9905012310A1", namaDagang: "Augmentin", manufacturer: "GlaxoSmithKline",
    farmalkesType: "medicine",
    dosageForm: { code: "BS003", name: "Tablet Salut Selaput" },
    rutePemberian: { code: "RM001", name: "Oral" },
    uom: { code: "UM001", name: "Tablet" },
    dosePerUnit: "625 mg / 1 tablet",
    productTemplate: { code: "92000420", name: "Amoksisilin 500 mg + Asam Klavulanat 125 mg Tablet" },
    activeIngredients: [
      { kode: "91000404", zatAktif: "Amoksisilin", kekuatan: 500, satuan: "mg" },
      { kode: "91000405", zatAktif: "Asam Klavulanat", kekuatan: 125, satuan: "mg" },
    ],
  },

  // ── Seftriakson ──
  {
    kfaCode: "936220020", name: "Seftriakson 1 g Serbuk Injeksi (Cefriex)", active: true,
    nie: "GKL1305012544A1", namaDagang: "Cefriex", manufacturer: "Sanbe Farma",
    farmalkesType: "medicine",
    dosageForm: { code: "BS040", name: "Serbuk Injeksi" },
    rutePemberian: { code: "RM010", name: "Intravena" },
    uom: { code: "UM020", name: "Vial" },
    dosePerUnit: "1 g / 1 vial",
    productTemplate: { code: "92000312", name: "Seftriakson 1 g Serbuk Injeksi" },
    activeIngredients: [{ kode: "91000312", zatAktif: "Seftriakson", kekuatan: 1, satuan: "g" }],
  },

  // ── Azitromisin ──
  {
    kfaCode: "936220030", name: "Azitromisin 500 mg Tablet Salut (Zithromax)", active: true,
    nie: "DKL9920412510A1", namaDagang: "Zithromax", manufacturer: "Pfizer",
    farmalkesType: "medicine",
    dosageForm: { code: "BS003", name: "Tablet Salut Selaput" },
    rutePemberian: { code: "RM001", name: "Oral" },
    uom: { code: "UM001", name: "Tablet" },
    dosePerUnit: "500 mg / 1 tablet",
    productTemplate: { code: "92000425", name: "Azitromisin 500 mg Tablet" },
    activeIngredients: [{ kode: "91000420", zatAktif: "Azitromisin", kekuatan: 500, satuan: "mg" }],
  },

  // ── Siprofloksasin ──
  {
    kfaCode: "936220040", name: "Siprofloksasin 500 mg Tablet Salut (Ciproxin)", active: true,
    nie: "DKL9013412410A1", namaDagang: "Ciproxin", manufacturer: "Bayer",
    farmalkesType: "medicine",
    dosageForm: { code: "BS003", name: "Tablet Salut Selaput" },
    rutePemberian: { code: "RM001", name: "Oral" },
    uom: { code: "UM001", name: "Tablet" },
    dosePerUnit: "500 mg / 1 tablet",
    productTemplate: { code: "92000430", name: "Siprofloksasin 500 mg Tablet" },
    activeIngredients: [{ kode: "91000430", zatAktif: "Siprofloksasin", kekuatan: 500, satuan: "mg" }],
  },

  // ── Ibuprofen ──
  {
    kfaCode: "936230010", name: "Ibuprofen 400 mg Tablet Salut (Proris)", active: true,
    nie: "DTL7822401510A1", namaDagang: "Proris", manufacturer: "Pharos",
    farmalkesType: "medicine",
    dosageForm: { code: "BS003", name: "Tablet Salut Selaput" },
    rutePemberian: { code: "RM001", name: "Oral" },
    uom: { code: "UM001", name: "Tablet" },
    dosePerUnit: "400 mg / 1 tablet",
    productTemplate: { code: "92000210", name: "Ibuprofen 400 mg Tablet" },
    activeIngredients: [{ kode: "91000110", zatAktif: "Ibuprofen", kekuatan: 400, satuan: "mg" }],
  },

  // ── Morfin Sulfat (injeksi) ──
  {
    kfaCode: "936230020", name: "Morfin Sulfat 10 mg/mL Injeksi", active: true,
    nie: "GKL8412300543A1", namaDagang: "MST", manufacturer: "Kimia Farma",
    farmalkesType: "medicine",
    dosageForm: { code: "BS030", name: "Larutan Injeksi" },
    rutePemberian: { code: "RM010", name: "Intravena" },
    uom: { code: "UM021", name: "Ampul" },
    dosePerUnit: "10 mg / 1 mL",
    productTemplate: { code: "92000901", name: "Morfin Sulfat 10 mg/mL Injeksi" },
    activeIngredients: [{ kode: "91000901", zatAktif: "Morfin Sulfat", kekuatan: 10, satuan: "mg" }],
  },

  // ── Amlodipin ──
  {
    kfaCode: "936240010", name: "Amlodipin 10 mg Tablet (Norvask)", active: true,
    nie: "DKL9311412310A1", namaDagang: "Norvask", manufacturer: "Pfizer",
    farmalkesType: "medicine",
    dosageForm: { code: "BS001", name: "Tablet" },
    rutePemberian: { code: "RM001", name: "Oral" },
    uom: { code: "UM001", name: "Tablet" },
    dosePerUnit: "10 mg / 1 tablet",
    productTemplate: { code: "92000820", name: "Amlodipin 10 mg Tablet" },
    activeIngredients: [{ kode: "91000820", zatAktif: "Amlodipin", kekuatan: 10, satuan: "mg" }],
  },
  {
    kfaCode: "936240011", name: "Amlodipin 5 mg Tablet (Generik)", active: true,
    nie: "GKL1811412305A1", namaDagang: "Amlodipine", manufacturer: "Kimia Farma",
    farmalkesType: "medicine",
    dosageForm: { code: "BS001", name: "Tablet" },
    rutePemberian: { code: "RM001", name: "Oral" },
    uom: { code: "UM001", name: "Tablet" },
    dosePerUnit: "5 mg / 1 tablet",
    productTemplate: { code: "92000821", name: "Amlodipin 5 mg Tablet" },
    activeIngredients: [{ kode: "91000820", zatAktif: "Amlodipin", kekuatan: 5, satuan: "mg" }],
  },

  // ── Kaptopril ──
  {
    kfaCode: "936240020", name: "Kaptopril 25 mg Tablet (Capoten)", active: true,
    nie: "DKL8302301110A1", namaDagang: "Capoten", manufacturer: "Indofarma",
    farmalkesType: "medicine",
    dosageForm: { code: "BS001", name: "Tablet" },
    rutePemberian: { code: "RM001", name: "Oral" },
    uom: { code: "UM001", name: "Tablet" },
    dosePerUnit: "25 mg / 1 tablet",
    productTemplate: { code: "92000810", name: "Kaptopril 25 mg Tablet" },
    activeIngredients: [{ kode: "91000810", zatAktif: "Kaptopril", kekuatan: 25, satuan: "mg" }],
  },

  // ── Metformin ──
  {
    kfaCode: "936250010", name: "Metformin HCl 500 mg Tablet (Glucophage)", active: true,
    nie: "DKL9411412410A1", namaDagang: "Glucophage", manufacturer: "Merck",
    farmalkesType: "medicine",
    dosageForm: { code: "BS001", name: "Tablet" },
    rutePemberian: { code: "RM001", name: "Oral" },
    uom: { code: "UM001", name: "Tablet" },
    dosePerUnit: "500 mg / 1 tablet",
    productTemplate: { code: "92001002", name: "Metformin HCl 500 mg Tablet" },
    activeIngredients: [{ kode: "91001002", zatAktif: "Metformin Hidroklorida", kekuatan: 500, satuan: "mg" }],
  },

  // ── Insulin Reguler ──
  {
    kfaCode: "936250020", name: "Insulin Human Reguler 100 IU/mL Injeksi (Actrapid)", active: true,
    nie: "DKI9612300544A1", namaDagang: "Actrapid", manufacturer: "Novo Nordisk",
    farmalkesType: "medicine",
    dosageForm: { code: "BS030", name: "Larutan Injeksi" },
    rutePemberian: { code: "RM012", name: "Subkutan" },
    uom: { code: "UM020", name: "Vial" },
    dosePerUnit: "100 IU / 1 mL",
    productTemplate: { code: "92001010", name: "Insulin Human Reguler 100 IU/mL Injeksi" },
    activeIngredients: [{ kode: "91001010", zatAktif: "Insulin Human", kekuatan: 100, satuan: "IU" }],
  },

  // ── Omeprazol ──
  {
    kfaCode: "936260010", name: "Omeprazol 20 mg Kapsul (Losec)", active: true,
    nie: "DKL9006701210A1", namaDagang: "Losec", manufacturer: "AstraZeneca",
    farmalkesType: "medicine",
    dosageForm: { code: "BS005", name: "Kapsul" },
    rutePemberian: { code: "RM001", name: "Oral" },
    uom: { code: "UM005", name: "Kapsul" },
    dosePerUnit: "20 mg / 1 kapsul",
    productTemplate: { code: "92000501", name: "Omeprazol 20 mg Kapsul" },
    activeIngredients: [{ kode: "91000501", zatAktif: "Omeprazol", kekuatan: 20, satuan: "mg" }],
  },

  // ── Ondansetron ──
  {
    kfaCode: "936260020", name: "Ondansetron 4 mg/2 mL Injeksi (Zofran)", active: true,
    nie: "DKL9211300544A1", namaDagang: "Zofran", manufacturer: "Novartis",
    farmalkesType: "medicine",
    dosageForm: { code: "BS030", name: "Larutan Injeksi" },
    rutePemberian: { code: "RM010", name: "Intravena" },
    uom: { code: "UM021", name: "Ampul" },
    dosePerUnit: "4 mg / 2 mL",
    productTemplate: { code: "92000510", name: "Ondansetron 4 mg/2 mL Injeksi" },
    activeIngredients: [{ kode: "91000510", zatAktif: "Ondansetron", kekuatan: 4, satuan: "mg" }],
  },

  // ── Salbutamol ──
  {
    kfaCode: "936270010", name: "Salbutamol 100 mcg/dosis Inhalasi (Ventolin)", active: true,
    nie: "DKL9213400744A1", namaDagang: "Ventolin", manufacturer: "GlaxoSmithKline",
    farmalkesType: "medicine",
    dosageForm: { code: "BS060", name: "Aerosol Inhalasi" },
    rutePemberian: { code: "RM020", name: "Inhalasi" },
    uom: { code: "UM030", name: "Pcs" },
    dosePerUnit: "100 mcg / 1 dosis",
    productTemplate: { code: "92000601", name: "Salbutamol 100 mcg/dosis Inhalasi" },
    activeIngredients: [{ kode: "91000601", zatAktif: "Salbutamol", kekuatan: 100, satuan: "mcg" }],
  },

  // ── Furosemid ──
  {
    kfaCode: "936270020", name: "Furosemid 40 mg Tablet (Lasix)", active: true,
    nie: "DKL7505412310A1", namaDagang: "Lasix", manufacturer: "Sanofi",
    farmalkesType: "medicine",
    dosageForm: { code: "BS001", name: "Tablet" },
    rutePemberian: { code: "RM001", name: "Oral" },
    uom: { code: "UM001", name: "Tablet" },
    dosePerUnit: "40 mg / 1 tablet",
    productTemplate: { code: "92000830", name: "Furosemid 40 mg Tablet" },
    activeIngredients: [{ kode: "91000830", zatAktif: "Furosemid", kekuatan: 40, satuan: "mg" }],
  },

  // ── Cairan infus ──
  {
    kfaCode: "936280010", name: "Natrium Klorida 0,9% 500 mL Infus (Otsu-NS)", active: true,
    nie: "DKL8801500749A1", namaDagang: "Otsu-NS", manufacturer: "Otsuka",
    farmalkesType: "medicine",
    dosageForm: { code: "BS070", name: "Larutan Infus" },
    rutePemberian: { code: "RM010", name: "Intravena" },
    uom: { code: "UM010", name: "Botol" },
    dosePerUnit: "0,9% / 500 mL",
    productTemplate: { code: "92001101", name: "Natrium Klorida 0,9% 500 mL Infus" },
    activeIngredients: [{ kode: "91001101", zatAktif: "Natrium Klorida", kekuatan: 9, satuan: "mg/mL" }],
  },
  {
    kfaCode: "936280011", name: "Ringer Laktat 500 mL Infus (Otsu-RL)", active: true,
    nie: "DKL8801500849A1", namaDagang: "Otsu-RL", manufacturer: "Otsuka",
    farmalkesType: "medicine",
    dosageForm: { code: "BS070", name: "Larutan Infus" },
    rutePemberian: { code: "RM010", name: "Intravena" },
    uom: { code: "UM010", name: "Botol" },
    dosePerUnit: "500 mL",
    productTemplate: { code: "92001102", name: "Ringer Laktat 500 mL Infus" },
    activeIngredients: [
      { kode: "91001102", zatAktif: "Natrium Laktat", kekuatan: 3.1, satuan: "g/L" },
      { kode: "91001101", zatAktif: "Natrium Klorida", kekuatan: 6, satuan: "g/L" },
    ],
  },
];
