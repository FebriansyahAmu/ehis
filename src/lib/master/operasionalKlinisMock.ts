/**
 * Master Operasional Klinis — katalog kebijakan/parameter operasional Rawat Inap & IGD.
 *
 * 4 sub-koleksi (semua flat list dengan discriminator field):
 *   1. Sumber Cairan & Output → Intake (Oral/IV/NGT/Transfusi/Lainnya) + Output (Urine/Drainase/Feses/Muntah/Perdarahan/Lainnya)
 *   2. Tipe Diet & Tekstur    → 12 diet + 4 tekstur (tone per tekstur)
 *   3. Bundle HAI             → VAP 5 / CAUTI 3 / CLABSI 4 items
 *   4. Penyakit Wajib Isolasi → Contact / Droplet / Airborne
 *
 * Konsumen: IntakeOutputTab + GiziNutrisiTab + KeperawatanTab (PPI) + PatientHeader (isolasi flag).
 * Replace target:
 *   - ioShared.ts:42–112 (INTAKE_CATS + OUTPUT_CATS + INTAKE_CHIP + OUTPUT_CHIP)
 *   - giziNutrisiShared.ts:50–70 (TIPE_DIET_OPTIONS + TEKSTUR_CFG)
 *   - ppiIsolasiShared.ts:35–140 (ISOLASI_CFG + VAP/CAUTI/CLABSI_ITEMS + BUNDLE_CFG)
 */

import {
  Droplets, UtensilsCrossed, ShieldCheck, ShieldAlert,
  type LucideIcon,
} from "lucide-react";

// ── Sub-collection keys ──────────────────────────────────

export type OperasionalSubKey =
  | "sumber-cairan"
  | "diet-tekstur"
  | "bundle-hai"
  | "penyakit-isolasi";

export interface OperasionalSubDescriptor {
  key: OperasionalSubKey;
  label: string;
  shortLabel: string;
  deskripsi: string;
  konsumen: string[];
  icon: LucideIcon;
}

export const OPERASIONAL_SUBS: OperasionalSubDescriptor[] = [
  {
    key: "sumber-cairan",
    label: "Sumber Cairan & Output",
    shortLabel: "Sumber cairan",
    deskripsi: "Katalog kategori intake (Oral/IV/NGT/Transfusi) dan output (Urine/Drainase/Feses/Muntah/Perdarahan) untuk pencatatan I/O harian.",
    konsumen: ["IntakeOutputTab (RI)"],
    icon: Droplets,
  },
  {
    key: "diet-tekstur",
    label: "Tipe Diet & Tekstur",
    shortLabel: "Diet & tekstur",
    deskripsi: "Pilihan tipe diet (Jantung, DM, Ginjal, dll) dan tekstur makanan (Biasa/Lunak/Saring/Cair) untuk order diet pasien.",
    konsumen: ["GiziNutrisiTab (RI)"],
    icon: UtensilsCrossed,
  },
  {
    key: "bundle-hai",
    label: "Bundle HAI Items",
    shortLabel: "Bundle HAI",
    deskripsi: "Item checklist bundle pencegahan Healthcare-Associated Infection — VAP (ventilator), CAUTI (kateter urin), CLABSI (CVC).",
    konsumen: ["KeperawatanTab (PPI)"],
    icon: ShieldCheck,
  },
  {
    key: "penyakit-isolasi",
    label: "Penyakit Wajib Isolasi",
    shortLabel: "Penyakit isolasi",
    deskripsi: "Daftar penyakit / patogen dengan kewajiban precaution Contact / Droplet / Airborne (CDC Isolation Guidelines 2007).",
    konsumen: ["PatientHeader (isolasi)", "KeperawatanTab (PPI)"],
    icon: ShieldAlert,
  },
];

export function getOperasionalSub(key: OperasionalSubKey): OperasionalSubDescriptor {
  return OPERASIONAL_SUBS.find((s) => s.key === key)!;
}

// ════════════════════════════════════════════════════════
// Shape 1 — Sumber Cairan & Output
// ════════════════════════════════════════════════════════

export type CairanTipe = "Intake" | "Output";

export interface CairanEntry {
  id: string;
  kode: string;
  label: string;
  tipe: CairanTipe;
  kategori: string;        // "Oral" | "IV" | "NGT" | "Transfusi" | "Urine" | "Drainase" | "Feses" | "Muntah" | "Perdarahan" | "Lainnya"
  deskripsi?: string;
  urutan: number;
  status: "Aktif" | "NonAktif";
}

export interface CairanKategoriCfg {
  key: string;
  tipe: CairanTipe;
  label: string;
  tone: "emerald" | "sky" | "amber" | "rose" | "slate" | "violet" | "orange";
}

export const CAIRAN_KATEGORI: CairanKategoriCfg[] = [
  { key: "Oral",       tipe: "Intake", label: "Oral / Minum",     tone: "emerald" },
  { key: "IV",         tipe: "Intake", label: "Cairan IV",        tone: "sky"     },
  { key: "NGT",        tipe: "Intake", label: "NGT / Enteral",    tone: "amber"   },
  { key: "Transfusi",  tipe: "Intake", label: "Transfusi",        tone: "rose"    },
  { key: "Lainnya-In", tipe: "Intake", label: "Lainnya (Intake)", tone: "slate"   },
  { key: "Urine",      tipe: "Output", label: "Urine",            tone: "amber"   },
  { key: "Drainase",   tipe: "Output", label: "Drainase",         tone: "slate"   },
  { key: "Feses",      tipe: "Output", label: "BAB / Feses",      tone: "orange"  },
  { key: "Muntah",     tipe: "Output", label: "Muntah / Emesis",  tone: "violet"  },
  { key: "Perdarahan", tipe: "Output", label: "Perdarahan",       tone: "rose"    },
  { key: "Lainnya-Out",tipe: "Output", label: "Lainnya (Output)", tone: "slate"   },
];

export const CAIRAN_TONE_CFG: Record<CairanKategoriCfg["tone"], { chip: string; dot: string; ring: string }> = {
  emerald: { chip: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  sky:     { chip: "bg-sky-50 text-sky-700 ring-sky-200",             dot: "bg-sky-500",     ring: "ring-sky-200"     },
  amber:   { chip: "bg-amber-50 text-amber-700 ring-amber-200",       dot: "bg-amber-500",   ring: "ring-amber-200"   },
  rose:    { chip: "bg-rose-50 text-rose-700 ring-rose-200",          dot: "bg-rose-500",    ring: "ring-rose-200"    },
  slate:   { chip: "bg-slate-100 text-slate-600 ring-slate-200",      dot: "bg-slate-400",   ring: "ring-slate-200"   },
  violet:  { chip: "bg-violet-50 text-violet-700 ring-violet-200",    dot: "bg-violet-500",  ring: "ring-violet-200"  },
  orange:  { chip: "bg-orange-50 text-orange-700 ring-orange-200",    dot: "bg-orange-500",  ring: "ring-orange-200"  },
};

export const CAIRAN_TIPE_CFG: Record<CairanTipe, { label: string; chip: string; icon: string }> = {
  Intake:  { label: "Intake",  chip: "bg-emerald-100 text-emerald-700 ring-emerald-200", icon: "↓" },
  Output:  { label: "Output",  chip: "bg-rose-100 text-rose-700 ring-rose-200",          icon: "↑" },
};

export const CAIRAN_INITIAL: CairanEntry[] = [
  // Intake
  { id: "c1",  kode: "INT-ORAL-MIN",   label: "Minum",             tipe: "Intake", kategori: "Oral",       deskripsi: "Air putih, teh, jus, susu",    urutan: 1,  status: "Aktif" },
  { id: "c2",  kode: "INT-ORAL-CAIR",  label: "Makan Cair",        tipe: "Intake", kategori: "Oral",       deskripsi: "Sup, kuah, jelly",             urutan: 2,  status: "Aktif" },
  { id: "c3",  kode: "INT-ORAL-FRM",   label: "Susu / Formula",    tipe: "Intake", kategori: "Oral",       deskripsi: "Susu formula, susu sapi",      urutan: 3,  status: "Aktif" },
  { id: "c4",  kode: "INT-IV-NACL",    label: "NaCl 0.9%",         tipe: "Intake", kategori: "IV",         deskripsi: "Saline isotonik",              urutan: 4,  status: "Aktif" },
  { id: "c5",  kode: "INT-IV-RL",      label: "Ringer Laktat (RL)",tipe: "Intake", kategori: "IV",         deskripsi: "Cairan kristaloid seimbang",   urutan: 5,  status: "Aktif" },
  { id: "c6",  kode: "INT-IV-D5",      label: "Dextrose 5%",       tipe: "Intake", kategori: "IV",         deskripsi: "Dextrose isotonik",            urutan: 6,  status: "Aktif" },
  { id: "c7",  kode: "INT-IV-D10",     label: "Dextrose 10%",      tipe: "Intake", kategori: "IV",         deskripsi: "Dextrose hipertonik",          urutan: 7,  status: "Aktif" },
  { id: "c8",  kode: "INT-IV-ALB",     label: "Albumin 20%",       tipe: "Intake", kategori: "IV",         deskripsi: "Koloid",                       urutan: 8,  status: "Aktif" },
  { id: "c9",  kode: "INT-IV-NORE",    label: "Norepinephrine",    tipe: "Intake", kategori: "IV",         deskripsi: "Vasopressor (drip)",           urutan: 9,  status: "Aktif" },
  { id: "c10", kode: "INT-IV-DOBU",    label: "Dobutamin",         tipe: "Intake", kategori: "IV",         deskripsi: "Inotropik (drip)",             urutan: 10, status: "Aktif" },
  { id: "c11", kode: "INT-IV-AB",      label: "Antibiotik IV",     tipe: "Intake", kategori: "IV",         deskripsi: "Volume per dosis bervariasi",  urutan: 11, status: "Aktif" },
  { id: "c12", kode: "INT-NGT-FRM",    label: "Formula Enteral",   tipe: "Intake", kategori: "NGT",        deskripsi: "Susu formula via NGT",         urutan: 12, status: "Aktif" },
  { id: "c13", kode: "INT-NGT-ORS",    label: "Air / ORS",         tipe: "Intake", kategori: "NGT",        deskripsi: "Rehidrasi enteral",            urutan: 13, status: "Aktif" },
  { id: "c14", kode: "INT-NGT-OBT",    label: "Obat via NGT",      tipe: "Intake", kategori: "NGT",        deskripsi: "Larutan obat oral",            urutan: 14, status: "Aktif" },
  { id: "c15", kode: "INT-TRF-PRC",    label: "PRC",               tipe: "Intake", kategori: "Transfusi",  deskripsi: "Packed Red Cells",             urutan: 15, status: "Aktif" },
  { id: "c16", kode: "INT-TRF-FFP",    label: "FFP (Plasma Segar)",tipe: "Intake", kategori: "Transfusi",  deskripsi: "Fresh Frozen Plasma",          urutan: 16, status: "Aktif" },
  { id: "c17", kode: "INT-TRF-TC",     label: "Trombosit (TC)",    tipe: "Intake", kategori: "Transfusi",  deskripsi: "Thrombocyte Concentrate",      urutan: 17, status: "Aktif" },
  { id: "c18", kode: "INT-TRF-WB",     label: "Whole Blood",       tipe: "Intake", kategori: "Transfusi",  deskripsi: "Darah lengkap",                urutan: 18, status: "Aktif" },
  // Output
  { id: "c19", kode: "OUT-URN-FOL",    label: "Kateter Foley",     tipe: "Output", kategori: "Urine",      deskripsi: "Urine via kateter menetap",    urutan: 19, status: "Aktif" },
  { id: "c20", kode: "OUT-URN-SPN",    label: "Void Spontan",      tipe: "Output", kategori: "Urine",      deskripsi: "BAK spontan",                  urutan: 20, status: "Aktif" },
  { id: "c21", kode: "OUT-DRN-NGT",    label: "NGT Drainage",      tipe: "Output", kategori: "Drainase",   deskripsi: "Cairan lambung via NGT",       urutan: 21, status: "Aktif" },
  { id: "c22", kode: "OUT-DRN-WSD",    label: "WSD (Water Seal)",  tipe: "Output", kategori: "Drainase",   deskripsi: "Drainase pleura",              urutan: 22, status: "Aktif" },
  { id: "c23", kode: "OUT-DRN-BDH",    label: "Drain Bedah",       tipe: "Output", kategori: "Drainase",   deskripsi: "Drain pasca operasi",          urutan: 23, status: "Aktif" },
  { id: "c24", kode: "OUT-FES-SPN",    label: "Spontan",           tipe: "Output", kategori: "Feses",      deskripsi: "BAB spontan",                  urutan: 24, status: "Aktif" },
  { id: "c25", kode: "OUT-FES-EN",     label: "Enema",             tipe: "Output", kategori: "Feses",      deskripsi: "Pasca enema",                  urutan: 25, status: "Aktif" },
  { id: "c26", kode: "OUT-FES-KOL",    label: "Kolostomi",         tipe: "Output", kategori: "Feses",      deskripsi: "Output via stoma",             urutan: 26, status: "Aktif" },
  { id: "c27", kode: "OUT-MTH-SPN",    label: "Emesis Spontan",    tipe: "Output", kategori: "Muntah",     deskripsi: "Muntah spontan",               urutan: 27, status: "Aktif" },
  { id: "c28", kode: "OUT-MTH-NGT",    label: "Aspirasi NGT",      tipe: "Output", kategori: "Muntah",     deskripsi: "Cairan teraspirasi",           urutan: 28, status: "Aktif" },
  { id: "c29", kode: "OUT-PRD-AKT",    label: "Perdarahan Aktif",  tipe: "Output", kategori: "Perdarahan", deskripsi: "Estimasi volume",              urutan: 29, status: "Aktif" },
  { id: "c30", kode: "OUT-PRD-OP",     label: "Luka Operasi",      tipe: "Output", kategori: "Perdarahan", deskripsi: "Rembesan luka post-op",        urutan: 30, status: "Aktif" },
  { id: "c31", kode: "OUT-PRD-HEM",    label: "Hematuria",         tipe: "Output", kategori: "Perdarahan", deskripsi: "Darah di urine",               urutan: 31, status: "Aktif" },
];

export function emptyCairanEntry(maxUrutan: number, tipe: CairanTipe = "Intake"): CairanEntry {
  return {
    id: `c-${Date.now()}`,
    kode: "",
    label: "",
    tipe,
    kategori: tipe === "Intake" ? "Oral" : "Urine",
    deskripsi: "",
    urutan: maxUrutan + 1,
    status: "Aktif",
  };
}

// ════════════════════════════════════════════════════════
// Shape 2 — Diet & Tekstur
// ════════════════════════════════════════════════════════

export type DietJenis = "Diet" | "Tekstur";
export type TeksturTone = "slate" | "sky" | "amber" | "indigo";

export interface DietTeksturEntry {
  id: string;
  kode: string;
  label: string;
  jenis: DietJenis;
  /** Hanya untuk jenis Diet — saran kalori default (kcal/hari). */
  kaloriDefault?: number;
  /** Hanya untuk jenis Diet — batasan default (Na, cairan, protein, dll). */
  batasanDefault?: string;
  /** Hanya untuk jenis Tekstur — palette warna chip. */
  tone?: TeksturTone;
  deskripsi?: string;
  urutan: number;
  status: "Aktif" | "NonAktif";
}

export const DIET_JENIS_CFG: Record<DietJenis, { label: string; chip: string; dot: string }> = {
  Diet:    { label: "Diet",    chip: "bg-emerald-100 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  Tekstur: { label: "Tekstur", chip: "bg-indigo-100 text-indigo-700 ring-indigo-200",    dot: "bg-indigo-500"  },
};

export const TEKSTUR_TONE_CFG: Record<TeksturTone, { label: string; chip: string; ring: string }> = {
  slate:  { label: "Netral",  chip: "bg-slate-100 text-slate-700 ring-slate-200",     ring: "ring-slate-300"  },
  sky:    { label: "Sky",     chip: "bg-sky-100 text-sky-700 ring-sky-200",           ring: "ring-sky-300"    },
  amber:  { label: "Amber",   chip: "bg-amber-100 text-amber-700 ring-amber-200",     ring: "ring-amber-300"  },
  indigo: { label: "Indigo",  chip: "bg-indigo-100 text-indigo-700 ring-indigo-200",  ring: "ring-indigo-300" },
};

export const DIET_TEKSTUR_INITIAL: DietTeksturEntry[] = [
  // 12 Diet
  { id: "d1",  kode: "DJR-1", label: "Diet Jantung Rendah Garam I",   jenis: "Diet", kaloriDefault: 1300, batasanDefault: "Na < 1g/hari · cairan ≤ 1000 mL", urutan: 1,  status: "Aktif" },
  { id: "d2",  kode: "DJR-2", label: "Diet Jantung Rendah Garam II",  jenis: "Diet", kaloriDefault: 1700, batasanDefault: "Na < 2g/hari · cairan ≤ 1500 mL", urutan: 2,  status: "Aktif" },
  { id: "d3",  kode: "DJR-3", label: "Diet Jantung Rendah Garam III", jenis: "Diet", kaloriDefault: 2000, batasanDefault: "Na < 3g/hari",                    urutan: 3,  status: "Aktif" },
  { id: "d4",  kode: "DM",    label: "Diet Diabetes Melitus",         jenis: "Diet", kaloriDefault: 1700, batasanDefault: "Karbohidrat kompleks · hindari gula sederhana", urutan: 4, status: "Aktif" },
  { id: "d5",  kode: "RP",    label: "Diet Rendah Protein",           jenis: "Diet", kaloriDefault: 1800, batasanDefault: "Protein 0.6 g/kgBB/hari",       urutan: 5,  status: "Aktif" },
  { id: "d6",  kode: "RL",    label: "Diet Rendah Lemak",             jenis: "Diet", kaloriDefault: 1700, batasanDefault: "Lemak < 25% total kalori",      urutan: 6,  status: "Aktif" },
  { id: "d7",  kode: "TP",    label: "Diet Tinggi Protein",           jenis: "Diet", kaloriDefault: 2200, batasanDefault: "Protein 1.5 g/kgBB/hari",       urutan: 7,  status: "Aktif" },
  { id: "d8",  kode: "DGK",   label: "Diet Ginjal Kronik",            jenis: "Diet", kaloriDefault: 1800, batasanDefault: "Protein 0.6-0.8 g/kgBB · K & Na rendah", urutan: 8, status: "Aktif" },
  { id: "d9",  kode: "DH",    label: "Diet Hati",                     jenis: "Diet", kaloriDefault: 2000, batasanDefault: "Protein 1.0 g/kgBB · rendah lemak", urutan: 9, status: "Aktif" },
  { id: "d10", kode: "DPO",   label: "Diet Pasca Operasi",            jenis: "Diet", kaloriDefault: 2000, batasanDefault: "Bertahap: cair → lunak → biasa", urutan: 10, status: "Aktif" },
  { id: "d11", kode: "MB",    label: "Diet Biasa (MB)",               jenis: "Diet", kaloriDefault: 2100, batasanDefault: "Tanpa batasan khusus",          urutan: 11, status: "Aktif" },
  { id: "d12", kode: "DLN",   label: "Lainnya",                       jenis: "Diet", batasanDefault: "Per advice dokter / ahli gizi",                       urutan: 12, status: "Aktif" },
  // 4 Tekstur
  { id: "t1",  kode: "TX-BSA", label: "Biasa",  jenis: "Tekstur", tone: "slate",  deskripsi: "Makanan utuh tanpa modifikasi tekstur",         urutan: 13, status: "Aktif" },
  { id: "t2",  kode: "TX-LNK", label: "Lunak",  jenis: "Tekstur", tone: "sky",    deskripsi: "Makanan lunak — mudah dikunyah",                urutan: 14, status: "Aktif" },
  { id: "t3",  kode: "TX-SRG", label: "Saring", jenis: "Tekstur", tone: "amber",  deskripsi: "Bubur saring — minimal kunyah",                 urutan: 15, status: "Aktif" },
  { id: "t4",  kode: "TX-CIR", label: "Cair",   jenis: "Tekstur", tone: "indigo", deskripsi: "Diet cair — full liquid via gelas atau sedotan", urutan: 16, status: "Aktif" },
];

export function emptyDietTeksturEntry(maxUrutan: number, jenis: DietJenis = "Diet"): DietTeksturEntry {
  return {
    id: `d-${Date.now()}`,
    kode: "",
    label: "",
    jenis,
    kaloriDefault: jenis === "Diet" ? 1800 : undefined,
    batasanDefault: jenis === "Diet" ? "" : undefined,
    tone: jenis === "Tekstur" ? "slate" : undefined,
    deskripsi: "",
    urutan: maxUrutan + 1,
    status: "Aktif",
  };
}

// ════════════════════════════════════════════════════════
// Shape 3 — Bundle HAI
// ════════════════════════════════════════════════════════

export type BundleTipe = "VAP" | "CAUTI" | "CLABSI";

export interface BundleHAIEntry {
  id: string;
  kode: string;
  label: string;
  bundle: BundleTipe;
  detail: string;
  urutan: number;
  status: "Aktif" | "NonAktif";
}

export const BUNDLE_CFG_MASTER: Record<BundleTipe, {
  label: string;
  fullName: string;
  trigger: string;
  chip: string;
  softBg: string;
  border: string;
  dot: string;
  text: string;
}> = {
  VAP: {
    label:    "VAP",
    fullName: "Ventilator-Associated Pneumonia",
    trigger:  "Pasien terpasang ventilator mekanik",
    chip:     "bg-rose-100 text-rose-700 ring-rose-200",
    softBg:   "bg-rose-50",
    border:   "border-rose-200",
    dot:      "bg-rose-500",
    text:     "text-rose-700",
  },
  CAUTI: {
    label:    "CAUTI",
    fullName: "Catheter-Associated Urinary Tract Infection",
    trigger:  "Pasien terpasang kateter urin (Foley)",
    chip:     "bg-amber-100 text-amber-700 ring-amber-200",
    softBg:   "bg-amber-50",
    border:   "border-amber-200",
    dot:      "bg-amber-500",
    text:     "text-amber-700",
  },
  CLABSI: {
    label:    "CLABSI",
    fullName: "Central Line-Associated Bloodstream Infection",
    trigger:  "Pasien terpasang CVC / akses sentral",
    chip:     "bg-indigo-100 text-indigo-700 ring-indigo-200",
    softBg:   "bg-indigo-50",
    border:   "border-indigo-200",
    dot:      "bg-indigo-500",
    text:     "text-indigo-700",
  },
};

export const BUNDLE_HAI_INITIAL: BundleHAIEntry[] = [
  // VAP — 5 items
  { id: "b1",  kode: "VAP-HOB",  label: "Elevasi kepala 30–45°",               bundle: "VAP",    detail: "Head-of-Bed terpantau setiap shift",                          urutan: 1,  status: "Aktif" },
  { id: "b2",  kode: "VAP-OHC",  label: "Oral hygiene chlorhexidine 0.12%",    bundle: "VAP",    detail: "Dilakukan minimal 2× sehari",                                 urutan: 2,  status: "Aktif" },
  { id: "b3",  kode: "VAP-SVBT", label: "Sedation vacation & breathing trial", bundle: "VAP",    detail: "Penilaian SBT harian terdokumentasi",                         urutan: 3,  status: "Aktif" },
  { id: "b4",  kode: "VAP-DVT",  label: "DVT prophylaxis terlaksana",          bundle: "VAP",    detail: "Antikoagulan / stoking kompresi sesuai order",                urutan: 4,  status: "Aktif" },
  { id: "b5",  kode: "VAP-PUD",  label: "PUD prophylaxis terlaksana",          bundle: "VAP",    detail: "PPI / H2-blocker sesuai protokol",                            urutan: 5,  status: "Aktif" },
  // CAUTI — 3 items
  { id: "b6",  kode: "CTI-IND",  label: "Indikasi kateter terdokumentasi",     bundle: "CAUTI",  detail: "Alasan klinis tercatat dalam rekam medis",                    urutan: 6,  status: "Aktif" },
  { id: "b7",  kode: "CTI-CARE", label: "Perawatan kateter harian",            bundle: "CAUTI",  detail: "Kebersihan meatus uretra teknik aseptik",                     urutan: 7,  status: "Aktif" },
  { id: "b8",  kode: "CTI-REV",  label: "Review kebutuhan kateter",            bundle: "CAUTI",  detail: "Pertimbangkan pelepasan kateter hari ini",                    urutan: 8,  status: "Aktif" },
  // CLABSI — 4 items
  { id: "b9",  kode: "CLB-HH",   label: "Hand hygiene sebelum akses CVC",      bundle: "CLABSI", detail: "5 momen kebersihan tangan terlaksana",                        urutan: 9,  status: "Aktif" },
  { id: "b10", kode: "CLB-ANTI", label: "Antiseptik chlorhexidine port/lumen", bundle: "CLABSI", detail: "Scrub port ≥15 detik sebelum setiap akses",                   urutan: 10, status: "Aktif" },
  { id: "b11", kode: "CLB-DRS",  label: "Dressing CVC bersih dan utuh",        bundle: "CLABSI", detail: "Ganti jika basah, kotor, atau terlepas",                      urutan: 11, status: "Aktif" },
  { id: "b12", kode: "CLB-REV",  label: "Review kebutuhan CVC",                bundle: "CLABSI", detail: "Pertimbangkan pelepasan akses sentral",                       urutan: 12, status: "Aktif" },
];

export function emptyBundleHAIEntry(maxUrutan: number, bundle: BundleTipe = "VAP"): BundleHAIEntry {
  return {
    id: `b-${Date.now()}`,
    kode: "",
    label: "",
    bundle,
    detail: "",
    urutan: maxUrutan + 1,
    status: "Aktif",
  };
}

// ════════════════════════════════════════════════════════
// Shape 4 — Penyakit Wajib Isolasi
// ════════════════════════════════════════════════════════

export type IsolasiMode = "Contact" | "Droplet" | "Airborne";

export interface PenyakitIsolasiEntry {
  id: string;
  kode: string;
  label: string;
  mode: IsolasiMode;
  patogen: string;
  durasiHariMin?: number;
  durasiHariMax?: number;
  catatan?: string;
  urutan: number;
  status: "Aktif" | "NonAktif";
}

export const ISOLASI_MODE_CFG: Record<IsolasiMode, {
  label: string;
  desc: string;
  chip: string;
  softBg: string;
  border: string;
  dot: string;
  text: string;
}> = {
  Contact: {
    label:  "Contact",
    desc:   "Kontak langsung / tidak langsung — MRSA, VRE, C.diff, luka terbuka",
    chip:   "bg-amber-100 text-amber-800 ring-amber-300",
    softBg: "bg-amber-50",
    border: "border-amber-200",
    dot:    "bg-amber-500",
    text:   "text-amber-800",
  },
  Droplet: {
    label:  "Droplet",
    desc:   "Tetesan respirasi >5μm jarak ≤1m — Influenza, Meningitis, Pertussis",
    chip:   "bg-orange-100 text-orange-800 ring-orange-300",
    softBg: "bg-orange-50",
    border: "border-orange-200",
    dot:    "bg-orange-500",
    text:   "text-orange-800",
  },
  Airborne: {
    label:  "Airborne",
    desc:   "Aerosol <5μm tetap di udara — TB, Campak, Varicella, aerosol COVID",
    chip:   "bg-red-100 text-red-800 ring-red-300",
    softBg: "bg-red-50",
    border: "border-red-200",
    dot:    "bg-red-500",
    text:   "text-red-800",
  },
};

export const PENYAKIT_ISOLASI_INITIAL: PenyakitIsolasiEntry[] = [
  // Contact
  { id: "i1",  kode: "MRSA",      label: "MRSA",                                   mode: "Contact",  patogen: "Methicillin-Resistant Staphylococcus aureus", durasiHariMin: 7,  catatan: "Sampai 3× kultur negatif berturut", urutan: 1,  status: "Aktif" },
  { id: "i2",  kode: "VRE",       label: "VRE",                                    mode: "Contact",  patogen: "Vancomycin-Resistant Enterococcus",           durasiHariMin: 7,  catatan: "Sampai kultur negatif",              urutan: 2,  status: "Aktif" },
  { id: "i3",  kode: "CDIFF",     label: "Clostridium difficile",                  mode: "Contact",  patogen: "C. difficile (toxin +)",                      durasiHariMin: 2,  catatan: "Sampai bebas diare 48 jam · sabun + air (alkohol tidak efektif)", urutan: 3, status: "Aktif" },
  { id: "i4",  kode: "ESBL",      label: "ESBL Enterobacteriaceae",                mode: "Contact",  patogen: "ESBL-producing gram-negatif",                 durasiHariMin: 7,  catatan: "Sampai kultur negatif",              urutan: 4,  status: "Aktif" },
  { id: "i5",  kode: "SCABIES",   label: "Scabies",                                mode: "Contact",  patogen: "Sarcoptes scabiei",                           durasiHariMin: 1,  durasiHariMax: 2,  catatan: "24 jam pasca tatalaksana skabisid efektif", urutan: 5, status: "Aktif" },
  { id: "i6",  kode: "LUKA-INF",  label: "Luka Terbuka Terinfeksi",                mode: "Contact",  patogen: "Bervariasi (Staph / Strep / lainnya)",        catatan: "Selama drainase aktif tidak terkontrol",       urutan: 6,  status: "Aktif" },
  // Droplet
  { id: "i7",  kode: "INF",       label: "Influenza",                              mode: "Droplet",  patogen: "Influenza A / B virus",                       durasiHariMin: 5,  catatan: "5 hari setelah onset gejala",        urutan: 7,  status: "Aktif" },
  { id: "i8",  kode: "MEN-BAKT",  label: "Meningitis Bakteri",                     mode: "Droplet",  patogen: "N. meningitidis / H. influenzae",             durasiHariMin: 1,  catatan: "24 jam pasca antibiotik efektif",    urutan: 8,  status: "Aktif" },
  { id: "i9",  kode: "PERTUSIS",  label: "Pertussis (Batuk Rejan)",                mode: "Droplet",  patogen: "Bordetella pertussis",                        durasiHariMin: 5,  catatan: "5 hari pasca antibiotik efektif",    urutan: 9,  status: "Aktif" },
  { id: "i10", kode: "MUMPS",     label: "Mumps (Gondongan)",                      mode: "Droplet",  patogen: "Mumps virus",                                 durasiHariMin: 5,  catatan: "5 hari pasca onset parotitis",       urutan: 10, status: "Aktif" },
  { id: "i11", kode: "RUBELLA",   label: "Rubella",                                mode: "Droplet",  patogen: "Rubella virus",                               durasiHariMin: 7,  catatan: "7 hari pasca onset ruam",            urutan: 11, status: "Aktif" },
  { id: "i12", kode: "DIFTERI",   label: "Difteri (Faring)",                       mode: "Droplet",  patogen: "Corynebacterium diphtheriae",                 durasiHariMin: 2,  catatan: "Sampai 2× kultur negatif",           urutan: 12, status: "Aktif" },
  // Airborne
  { id: "i13", kode: "TB-PARU",   label: "TB Paru Aktif",                          mode: "Airborne", patogen: "Mycobacterium tuberculosis",                  durasiHariMin: 14, catatan: "Sampai BTA negatif 3× + perbaikan klinis", urutan: 13, status: "Aktif" },
  { id: "i14", kode: "MDR-TB",    label: "MDR-TB",                                 mode: "Airborne", patogen: "M. tuberculosis (multi-drug resistant)",      durasiHariMin: 30, catatan: "Per advice spesialis paru",                urutan: 14, status: "Aktif" },
  { id: "i15", kode: "CAMPAK",    label: "Campak (Measles)",                       mode: "Airborne", patogen: "Measles virus",                               durasiHariMin: 4,  catatan: "4 hari pasca onset ruam",            urutan: 15, status: "Aktif" },
  { id: "i16", kode: "VARICELLA", label: "Varicella (Cacar Air) / Herpes Zoster Disseminata", mode: "Airborne", patogen: "VZV", catatan: "Sampai semua lesi krusta",       urutan: 16, status: "Aktif" },
  { id: "i17", kode: "COVID-AER", label: "COVID-19 (prosedur aerosol)",            mode: "Airborne", patogen: "SARS-CoV-2",                                  durasiHariMin: 10, catatan: "Selama prosedur aerosol-generating",       urutan: 17, status: "Aktif" },
  { id: "i18", kode: "SARS",      label: "SARS",                                   mode: "Airborne", patogen: "SARS-CoV",                                    catatan: "Sampai bebas demam + perbaikan klinis ≥10 hari", urutan: 18, status: "Aktif" },
];

export function emptyPenyakitIsolasiEntry(maxUrutan: number, mode: IsolasiMode = "Contact"): PenyakitIsolasiEntry {
  return {
    id: `i-${Date.now()}`,
    kode: "",
    label: "",
    mode,
    patogen: "",
    durasiHariMin: undefined,
    durasiHariMax: undefined,
    catatan: "",
    urutan: maxUrutan + 1,
    status: "Aktif",
  };
}

// ════════════════════════════════════════════════════════
// Aggregate state
// ════════════════════════════════════════════════════════

export interface OperasionalState {
  cairan: CairanEntry[];
  dietTekstur: DietTeksturEntry[];
  bundleHAI: BundleHAIEntry[];
  penyakitIsolasi: PenyakitIsolasiEntry[];
}

export const OPERASIONAL_INITIAL_STATE: OperasionalState = {
  cairan:          CAIRAN_INITIAL,
  dietTekstur:     DIET_TEKSTUR_INITIAL,
  bundleHAI:       BUNDLE_HAI_INITIAL,
  penyakitIsolasi: PENYAKIT_ISOLASI_INITIAL,
};
