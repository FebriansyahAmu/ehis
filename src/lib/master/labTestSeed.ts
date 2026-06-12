// ════════════════════════════════════════════════════════════════════════════
//  SEED Katalog Laboratorium — data riset standar nasional/internasional.
//  Sumber tunggal untuk: (1) skrip seed DB (prisma/scripts/seed-lab.mts) &
//  (2) fallback FE bila SSR gagal. @/-IMPORT-FREE (impor relatif dari ./labTestCatalog).
//
//  Acuan rentang & cutoff:
//   • Hematologi/indeks — PMK 43/2013 (Pranata Lab) + nilai konsensus lab klinik ID.
//   • Lipid — NCEP ATP III.  • Glukosa/HbA1c — WHO / ADA.
//   • Enzim hati (AST/ALT/GGT/ALP) — IFCC 37 °C.  • Koagulasi — Westergren/Lee-White/Ivy.
//   • NAPZA (urin) — cutoff SAMHSA.  • Widal — titer bermakna ≥1/320 / kenaikan 4×.
// ════════════════════════════════════════════════════════════════════════════

import type {
  LabTestRecord, LabKategori,
} from "./labTestCatalog";

// ── Builder ringkas ───────────────────────────────────────
type Gender = "L" | "P" | "LP";
interface RangeInput { g: Gender; lo: number; hi: number; ket?: string }
interface ParamInput {
  nama: string;
  satuan?: string;
  ranges?: RangeInput[];
  normal?: string;   // ADA → parameter Kualitatif (satuan dikosongkan)
  critLow?: number;
  critHigh?: number;
  dAbs?: number;
  dPct?: number;
  metode?: string;
}
interface TestInput {
  kode: string;
  nama: string;
  kategori: LabKategori;
  spesimen?: string;
  metode?: string;
  tat?: string;
  ket?: string;
  params: ParamInput[];
}

function buildTest(t: TestInput): LabTestRecord {
  return {
    id: t.kode,
    kode: t.kode,
    nama: t.nama,
    kategori: t.kategori,
    spesimen: t.spesimen,
    metode: t.metode,
    waktuTunggu: t.tat,
    keterangan: t.ket,
    status: "Aktif",
    parameters: t.params.map((p, i) => {
      const kualitatif = p.normal !== undefined;
      return {
        id: `${t.kode}-p${i + 1}`,
        nama: p.nama,
        satuan: kualitatif ? "" : (p.satuan ?? ""),
        tipeHasil: kualitatif ? ("Kualitatif" as const) : ("Numerik" as const),
        nilaiNormalText: p.normal,
        rujukan: (p.ranges ?? []).map((r, j) => ({
          id: `${t.kode}-p${i + 1}-r${j + 1}`,
          gender: r.g,
          usiaMin: undefined,
          usiaMax: undefined,
          low: r.lo,
          high: r.hi,
          keterangan: r.ket,
        })),
        criticalLow: p.critLow,
        criticalHigh: p.critHigh,
        deltaAbsolute: p.dAbs,
        deltaPercent: p.dPct,
        metode: p.metode,
        urutan: i,
      };
    }),
  };
}

const r = (g: Gender, lo: number, hi: number, ket?: string): RangeInput => ({ g, lo, hi, ket });

// ── Definisi tes ──────────────────────────────────────────
export const LAB_TEST_SEED: LabTestRecord[] = [
  // ════ HEMATOLOGI ════
  buildTest({
    kode: "DR", nama: "Darah Rutin (Hematologi Lengkap)", kategori: "Hematologi",
    spesimen: "Darah EDTA", metode: "Flowcytometry / impedansi otomatis", tat: "60 mnt",
    ket: "CBC lengkap + hitung jenis leukosit. Skrining anemia, infeksi, gangguan trombosit.",
    params: [
      { nama: "Hemoglobin", satuan: "g/dL", ranges: [r("L", 13.0, 17.0), r("P", 12.0, 15.0)], critLow: 7.0, critHigh: 20.0, dAbs: 2 },
      { nama: "Hematokrit", satuan: "%", ranges: [r("L", 40, 52), r("P", 37, 47)], critLow: 20, critHigh: 60, dAbs: 6 },
      { nama: "Eritrosit", satuan: "10⁶/µL", ranges: [r("L", 4.5, 5.9), r("P", 4.0, 5.1)], critLow: 2.0 },
      { nama: "Leukosit", satuan: "10³/µL", ranges: [r("LP", 4.0, 10.0)], critLow: 2.0, critHigh: 30.0, dPct: 50 },
      { nama: "Trombosit", satuan: "10³/µL", ranges: [r("LP", 150, 400)], critLow: 50, critHigh: 1000, dPct: 30 },
      { nama: "MCV", satuan: "fL", ranges: [r("LP", 80, 100)] },
      { nama: "MCH", satuan: "pg", ranges: [r("LP", 27, 32)] },
      { nama: "MCHC", satuan: "g/dL", ranges: [r("LP", 32, 36)] },
      { nama: "RDW-CV", satuan: "%", ranges: [r("LP", 11.5, 14.5)] },
      { nama: "Basofil", satuan: "%", ranges: [r("LP", 0, 1)] },
      { nama: "Eosinofil", satuan: "%", ranges: [r("LP", 1, 3)] },
      { nama: "Neutrofil Batang", satuan: "%", ranges: [r("LP", 2, 6)] },
      { nama: "Neutrofil Segmen", satuan: "%", ranges: [r("LP", 50, 70)] },
      { nama: "Limfosit", satuan: "%", ranges: [r("LP", 20, 40)] },
      { nama: "Monosit", satuan: "%", ranges: [r("LP", 2, 8)] },
    ],
  }),
  buildTest({
    kode: "LED", nama: "Laju Endap Darah (LED)", kategori: "Hematologi",
    spesimen: "Darah EDTA / sitrat", metode: "Westergren", tat: "60 mnt",
    ket: "Penanda inflamasi non-spesifik. Metode rujukan Westergren (mm/jam pertama).",
    params: [
      { nama: "Laju Endap Darah", satuan: "mm/jam", ranges: [r("L", 0, 15), r("P", 0, 20)], metode: "Westergren" },
    ],
  }),
  buildTest({
    kode: "MAL", nama: "Malaria", kategori: "Mikrobiologi",
    spesimen: "Darah kapiler / EDTA", metode: "Apusan tebal & tipis (Giemsa) / RDT antigen", tat: "60 mnt",
    ket: "Apusan darah = baku emas. RDT antigen (HRP-2/pLDH) untuk skrining cepat.",
    params: [
      { nama: "Plasmodium (mikroskopis)", normal: "Negatif (tidak ditemukan)" },
      { nama: "Spesies", normal: "Tidak ditemukan" },
      { nama: "Densitas Parasit", satuan: "/µL", ranges: [r("LP", 0, 0)], metode: "Hitung parasit pada apusan tebal" },
    ],
  }),

  // ════ KOAGULASI ════
  buildTest({
    kode: "BT", nama: "Bleeding Time (Masa Perdarahan)", kategori: "Koagulasi",
    spesimen: "Darah kapiler", metode: "Ivy / Duke", tat: "30 mnt",
    ket: "Skrining fungsi trombosit & integritas vaskular.",
    params: [
      { nama: "Bleeding Time", satuan: "menit", ranges: [r("LP", 1, 6, "Metode Ivy")], critHigh: 15 },
    ],
  }),
  buildTest({
    kode: "CT", nama: "Clotting Time (Masa Pembekuan)", kategori: "Koagulasi",
    spesimen: "Darah vena", metode: "Lee-White", tat: "30 mnt",
    ket: "Skrining jalur koagulasi intrinsik secara kasar.",
    params: [
      { nama: "Clotting Time", satuan: "menit", ranges: [r("LP", 5, 15, "Lee-White")], critHigh: 30 },
    ],
  }),
  buildTest({
    kode: "PT", nama: "Protrombin Time (PT/INR)", kategori: "Koagulasi",
    spesimen: "Plasma sitrat 3.2%", metode: "Koagulometer (tromboplastin)", tat: "90 mnt",
    ket: "Jalur ekstrinsik (faktor II, V, VII, X). Monitoring terapi warfarin via INR.",
    params: [
      { nama: "PT", satuan: "detik", ranges: [r("LP", 11, 14)], critHigh: 35 },
      { nama: "INR", satuan: "INR", ranges: [r("LP", 0.8, 1.2, "Target warfarin 2.0–3.0")] },
    ],
  }),
  buildTest({
    kode: "APTT", nama: "aPTT", kategori: "Koagulasi",
    spesimen: "Plasma sitrat 3.2%", metode: "Koagulometer", tat: "90 mnt",
    ket: "Jalur intrinsik. Monitoring terapi heparin (UFH).",
    params: [
      { nama: "aPTT", satuan: "detik", ranges: [r("LP", 25, 35)], critHigh: 70 },
    ],
  }),
  buildTest({
    kode: "DDIMER", nama: "D-Dimer", kategori: "Koagulasi",
    spesimen: "Plasma sitrat", metode: "Immunoturbidimetri", tat: "60 mnt",
    ket: "Peningkatan → DVT/PE/DIC. Cutoff age-adjusted = (usia/100) µg/mL FEU bila >50 th.",
    params: [
      { nama: "D-Dimer", satuan: "µg/mL FEU", ranges: [r("LP", 0, 0.5)], critHigh: 5.0 },
    ],
  }),

  // ════ KIMIA KLINIK ════
  buildTest({
    kode: "GDS", nama: "Glukosa Darah Sewaktu (GDS)", kategori: "Kimia Klinik",
    spesimen: "Plasma NaF / serum", metode: "Heksokinase / GOD-PAP", tat: "60 mnt",
    ket: "DM bila GDS ≥200 mg/dL disertai gejala klasik (WHO).",
    params: [
      { nama: "Glukosa Sewaktu", satuan: "mg/dL", ranges: [r("LP", 70, 140)], critLow: 50, critHigh: 500 },
    ],
  }),
  buildTest({
    kode: "GDP", nama: "Glukosa Darah Puasa (GDP)", kategori: "Kimia Klinik",
    spesimen: "Plasma NaF / serum", metode: "Heksokinase / GOD-PAP", tat: "60 mnt",
    ket: "Puasa 8 jam. Pra-DM 100–125; DM ≥126 mg/dL (ADA/WHO).",
    params: [
      { nama: "Glukosa Puasa", satuan: "mg/dL", ranges: [r("LP", 70, 100)], critLow: 50, critHigh: 400 },
    ],
  }),
  buildTest({
    kode: "HBA1C", nama: "HbA1c", kategori: "Kimia Klinik",
    spesimen: "Darah EDTA", metode: "HPLC / imunoturbidimetri (NGSP)", tat: "120 mnt",
    ket: "Kontrol glikemik ~3 bulan. Pra-DM 5.7–6.4%; DM ≥6.5% (ADA).",
    params: [
      { nama: "HbA1c", satuan: "%", ranges: [r("LP", 4.0, 5.6)] },
    ],
  }),
  buildTest({
    kode: "KOL", nama: "Kolesterol Total", kategori: "Kimia Klinik",
    spesimen: "Serum (puasa 9–12 jam)", metode: "CHOD-PAP", tat: "60 mnt",
    ket: "Optimal <200; Borderline 200–239; Tinggi ≥240 mg/dL (NCEP ATP III).",
    params: [
      { nama: "Kolesterol Total", satuan: "mg/dL", ranges: [r("LP", 0, 200)] },
    ],
  }),
  buildTest({
    kode: "HDL", nama: "HDL Kolesterol", kategori: "Kimia Klinik",
    spesimen: "Serum", metode: "Enzimatik langsung", tat: "60 mnt",
    ket: "AMBANG risiko (bukan rentang dua sisi): <40 (L)/<50 (P) = risiko KV; ≥60 = protektif (NCEP ATP III). Tak ada batas atas klinis — makin tinggi makin baik (batas atas seed = sentinel, bukan ambang H).",
    params: [
      { nama: "HDL Kolesterol", satuan: "mg/dL", ranges: [r("L", 40, 200, "Risiko bila <40; ≥60 protektif; tanpa batas atas klinis"), r("P", 50, 200, "Risiko bila <50; ≥60 protektif; tanpa batas atas klinis")] },
    ],
  }),
  buildTest({
    kode: "TG", nama: "Trigliserida", kategori: "Kimia Klinik",
    spesimen: "Serum (puasa 9–12 jam)", metode: "GPO-PAP", tat: "60 mnt",
    ket: "Normal <150; Borderline 150–199; Tinggi 200–499 mg/dL (NCEP).",
    params: [
      { nama: "Trigliserida", satuan: "mg/dL", ranges: [r("LP", 0, 150)], critHigh: 1000 },
    ],
  }),
  buildTest({
    kode: "UA", nama: "Asam Urat (Uric Acid)", kategori: "Kimia Klinik",
    spesimen: "Serum", metode: "Uricase-PAP", tat: "60 mnt",
    ket: "Peningkatan → gout, sindrom lisis tumor, gangguan ginjal.",
    params: [
      { nama: "Asam Urat", satuan: "mg/dL", ranges: [r("L", 3.4, 7.0), r("P", 2.4, 6.0)] },
    ],
  }),
  buildTest({
    kode: "UR", nama: "Ureum", kategori: "Kimia Klinik",
    spesimen: "Serum", metode: "Urease-GLDH", tat: "60 mnt",
    ket: "Penanda fungsi ginjal & status hidrasi. Catatan: Ureum (urea) ≠ BUN (BUN ≈ Ureum ÷ 2,14).",
    params: [
      { nama: "Ureum", satuan: "mg/dL", ranges: [r("LP", 10, 50)], critHigh: 200, dPct: 50 },
    ],
  }),
  buildTest({
    kode: "CR", nama: "Kreatinin", kategori: "Kimia Klinik",
    spesimen: "Serum", metode: "Jaffe / enzimatik", tat: "60 mnt",
    ket: "Penanda fungsi ginjal. Kenaikan ×2 dari baseline → AKI.",
    params: [
      { nama: "Kreatinin", satuan: "mg/dL", ranges: [r("L", 0.7, 1.2), r("P", 0.5, 1.0)], critHigh: 10, dPct: 50 },
    ],
  }),
  buildTest({
    kode: "SGOT", nama: "SGOT (AST)", kategori: "Kimia Klinik",
    spesimen: "Serum", metode: "IFCC 37 °C (tanpa P5P)", tat: "60 mnt",
    ket: "Enzim hati & otot. Peningkatan → hepatitis, infark miokard, miopati.",
    params: [
      { nama: "AST (SGOT)", satuan: "U/L", ranges: [r("L", 0, 37), r("P", 0, 31)], critHigh: 1000, dPct: 30 },
    ],
  }),
  buildTest({
    kode: "SGPT", nama: "SGPT (ALT)", kategori: "Kimia Klinik",
    spesimen: "Serum", metode: "IFCC 37 °C (tanpa P5P)", tat: "60 mnt",
    ket: "Lebih spesifik untuk hepatosit dibanding AST.",
    params: [
      { nama: "ALT (SGPT)", satuan: "U/L", ranges: [r("L", 0, 41), r("P", 0, 33)], critHigh: 1000, dPct: 30 },
    ],
  }),
  buildTest({
    kode: "GGT", nama: "Gamma GT (GGT)", kategori: "Kimia Klinik",
    spesimen: "Serum", metode: "IFCC / Szasz", tat: "60 mnt",
    ket: "Penanda kolestasis & induksi alkohol/obat.",
    params: [
      { nama: "Gamma-GT", satuan: "U/L", ranges: [r("L", 0, 55), r("P", 0, 38)] },
    ],
  }),
  buildTest({
    kode: "ALP", nama: "Alkali Fosfatase (ALP)", kategori: "Kimia Klinik",
    spesimen: "Serum", metode: "IFCC (p-NPP)", tat: "60 mnt",
    ket: "Peningkatan → kolestasis, penyakit tulang. Nilai anak lebih tinggi (pertumbuhan).",
    params: [
      { nama: "Alkali Fosfatase", satuan: "U/L", ranges: [r("L", 40, 129), r("P", 35, 104)] },
    ],
  }),
  buildTest({
    kode: "BIL", nama: "Bilirubin Total / Direk", kategori: "Kimia Klinik",
    spesimen: "Serum (terlindung cahaya)", metode: "Diazo (Jendrassik-Grof)", tat: "60 mnt",
    ket: "Indirek = Total − Direk. Pola membedakan ikterus pre/intra/post-hepatik.",
    params: [
      { nama: "Bilirubin Total", satuan: "mg/dL", ranges: [r("LP", 0.1, 1.2)], critHigh: 15 },
      { nama: "Bilirubin Direk", satuan: "mg/dL", ranges: [r("LP", 0, 0.3)] },
      { nama: "Bilirubin Indirek", satuan: "mg/dL", ranges: [r("LP", 0.1, 0.9, "Total − Direk")] },
    ],
  }),
  buildTest({
    kode: "TP", nama: "Total Protein", kategori: "Kimia Klinik",
    spesimen: "Serum", metode: "Biuret", tat: "60 mnt",
    ket: "Total Protein = Albumin + Globulin.",
    params: [
      { nama: "Total Protein", satuan: "g/dL", ranges: [r("LP", 6.4, 8.3)] },
    ],
  }),
  buildTest({
    kode: "ALB", nama: "Albumin", kategori: "Kimia Klinik",
    spesimen: "Serum", metode: "BCG (Bromcresol Green)", tat: "60 mnt",
    ket: "Penanda status nutrisi, fungsi sintesis hati, & tekanan onkotik.",
    params: [
      { nama: "Albumin", satuan: "g/dL", ranges: [r("LP", 3.5, 5.2)], critLow: 1.5 },
    ],
  }),
  buildTest({
    kode: "AMY", nama: "Amilase", kategori: "Kimia Klinik",
    spesimen: "Serum", metode: "Enzimatik (CNPG3)", tat: "60 mnt",
    ket: "Peningkatan → pankreatitis akut, gangguan kelenjar liur.",
    params: [
      { nama: "Amilase", satuan: "U/L", ranges: [r("LP", 25, 125)], critHigh: 600 },
    ],
  }),
  buildTest({
    kode: "LIP", nama: "Lipase", kategori: "Kimia Klinik",
    spesimen: "Serum", metode: "Enzimatik kolorimetri", tat: "60 mnt",
    ket: "Lebih spesifik & bertahan lebih lama dari amilase pada pankreatitis.",
    params: [
      { nama: "Lipase", satuan: "U/L", ranges: [r("LP", 13, 60)], critHigh: 600 },
    ],
  }),
  buildTest({
    kode: "ELE", nama: "Elektrolit (Na / K / Cl)", kategori: "Kimia Klinik",
    spesimen: "Serum", metode: "Ion Selective Electrode (ISE)", tat: "60 mnt",
    ket: "Gangguan kalium → aritmia fatal; monitoring ketat pada gagal ginjal & diuretik.",
    params: [
      { nama: "Natrium (Na)", satuan: "mEq/L", ranges: [r("LP", 135, 145)], critLow: 120, critHigh: 160, dAbs: 10 },
      { nama: "Kalium (K)", satuan: "mEq/L", ranges: [r("LP", 3.5, 5.0)], critLow: 2.5, critHigh: 6.5, dAbs: 1.0 },
      { nama: "Klorida (Cl)", satuan: "mEq/L", ranges: [r("LP", 96, 106)], critLow: 80, critHigh: 120 },
    ],
  }),
  buildTest({
    kode: "TROP", nama: "Troponin I", kategori: "Kimia Klinik",
    spesimen: "Serum / plasma heparin", metode: "CLIA", tat: "30 mnt",
    ket: "Penanda cedera miokard. Serial tiap 3–6 jam pada suspek ACS. Cutoff 99th percentile URL SPESIFIK per-assay — WAJIB disesuaikan ke analyzer (hs-cTn dilaporkan dalam ng/L).",
    params: [
      { nama: "Troponin I", satuan: "ng/mL", ranges: [r("LP", 0, 0.04, "99th percentile spesifik per-assay; sesuaikan analyzer")], critHigh: 0.5, dPct: 20 },
    ],
  }),
  buildTest({
    kode: "PCT", nama: "Prokalsitonin (PCT)", kategori: "Kimia Klinik",
    spesimen: "Serum / plasma", metode: "CLIA / ECLIA", tat: "120 mnt",
    ket: "PCT >2 ng/mL → risiko sepsis berat. Panduan inisiasi & de-eskalasi antibiotik.",
    params: [
      { nama: "Prokalsitonin", satuan: "ng/mL", ranges: [r("LP", 0, 0.5)], critHigh: 2.0 },
    ],
  }),

  // ════ URINALISIS ════
  buildTest({
    kode: "URN", nama: "Urine Rutin (Urinalisis Lengkap)", kategori: "Urinalisis",
    spesimen: "Urin sewaktu (pancar tengah)", metode: "Carik celup + mikroskopis sedimen", tat: "60 mnt",
    ket: "Makroskopis + kimia (10-parameter strip) + sedimen mikroskopis.",
    params: [
      { nama: "Warna", normal: "Kuning" },
      { nama: "Kejernihan", normal: "Jernih" },
      { nama: "Berat Jenis", satuan: "BJ", ranges: [r("LP", 1.003, 1.030)] },
      { nama: "pH", ranges: [r("LP", 4.5, 8.0)], satuan: "" },
      { nama: "Protein", normal: "Negatif" },
      { nama: "Glukosa", normal: "Negatif" },
      { nama: "Keton", normal: "Negatif" },
      { nama: "Bilirubin", normal: "Negatif" },
      { nama: "Urobilinogen", satuan: "mg/dL", ranges: [r("LP", 0.1, 1.0)] },
      { nama: "Nitrit", normal: "Negatif" },
      { nama: "Leukosit Esterase", normal: "Negatif" },
      { nama: "Darah / Eritrosit (Blood)", normal: "Negatif" },
      { nama: "Epitel", normal: "Positif (sedikit)" },
      { nama: "Leukosit Sedimen", satuan: "/LPB", ranges: [r("LP", 0, 5)] },
      { nama: "Eritrosit Sedimen", satuan: "/LPB", ranges: [r("LP", 0, 3)] },
      { nama: "Silinder (Cast)", normal: "Negatif" },
      { nama: "Kristal", normal: "Negatif" },
      { nama: "Bakteri", normal: "Negatif" },
    ],
  }),

  // ════ FESES ════
  buildTest({
    kode: "FR", nama: "Feses Rutin", kategori: "Feses",
    spesimen: "Feses sewaktu", metode: "Makroskopis + mikroskopis", tat: "60 mnt",
    ket: "Skrining perdarahan GI, infeksi/parasit, & gangguan pencernaan.",
    params: [
      { nama: "Warna", normal: "Kuning kecoklatan" },
      { nama: "Konsistensi", normal: "Lunak" },
      { nama: "Lendir", normal: "Negatif" },
      { nama: "Darah", normal: "Negatif" },
      { nama: "Eritrosit", satuan: "/LPB", ranges: [r("LP", 0, 1)] },
      { nama: "Leukosit", satuan: "/LPB", ranges: [r("LP", 0, 1)] },
      { nama: "Telur Cacing", normal: "Negatif" },
      { nama: "Amoeba / Kista", normal: "Negatif" },
      { nama: "Sisa Makanan", normal: "Negatif" },
    ],
  }),

  // ════ SEROLOGI ════
  buildTest({
    kode: "WIDAL", nama: "Widal Test", kategori: "Serologi",
    spesimen: "Serum", metode: "Aglutinasi (tube / slide)", tat: "90 mnt",
    ket: "Bermakna bila titer ≥1/320 atau kenaikan 4× pada sera berpasangan (interval 5–7 hari).",
    params: [
      { nama: "Salmonella Typhi O", normal: "Negatif (< 1/160)" },
      { nama: "Salmonella Typhi H", normal: "Negatif (< 1/160)" },
      { nama: "Salmonella Paratyphi A-O", normal: "Negatif (< 1/160)" },
      { nama: "Salmonella Paratyphi B-O", normal: "Negatif (< 1/160)" },
    ],
  }),

  // ════ IMUNOLOGI ════
  buildTest({
    kode: "GOLDA", nama: "Golongan Darah (ABO / Rhesus)", kategori: "Imunologi",
    spesimen: "Darah EDTA", metode: "Aglutinasi (forward & reverse)", tat: "30 mnt",
    ket: "Golongan ABO (cell & serum grouping) + faktor Rhesus D.",
    params: [
      { nama: "Golongan Darah (ABO)", normal: "A / B / AB / O" },
      { nama: "Rhesus (Rh D)", normal: "Positif" },
    ],
  }),
  buildTest({
    kode: "PLANO", nama: "Plano Test (Tes Kehamilan)", kategori: "Imunologi",
    spesimen: "Urin sewaktu (pagi)", metode: "Immunochromatography (β-hCG)", tat: "30 mnt",
    ket: "Positif bila hCG ≥25 mIU/mL. Akurasi optimal ≥1 minggu pasca terlambat haid.",
    params: [
      { nama: "β-hCG Urin", normal: "Negatif" },
    ],
  }),

  // ════ TOKSIKOLOGI (NAPZA, urin) ════
  buildTest({
    kode: "THC", nama: "THC (Cannabis)", kategori: "Toksikologi",
    spesimen: "Urin", metode: "Immunoassay (rapid strip)", tat: "30 mnt",
    ket: "Cutoff skrining 50 ng/mL (SAMHSA). Konfirmasi positif dengan GC-MS/LC-MS.",
    params: [
      { nama: "THC (Cannabis)", normal: "Negatif" },
    ],
  }),
  buildTest({
    kode: "COC", nama: "Cocaine (COC)", kategori: "Toksikologi",
    spesimen: "Urin", metode: "Immunoassay (rapid strip)", tat: "30 mnt",
    ket: "Cutoff skrining 300 ng/mL (benzoylecgonine, SAMHSA). Konfirmasi GC-MS/LC-MS.",
    params: [
      { nama: "Cocaine (COC)", normal: "Negatif" },
    ],
  }),
  buildTest({
    kode: "BZO", nama: "Benzodiazepin (BZO)", kategori: "Toksikologi",
    spesimen: "Urin", metode: "Immunoassay (rapid strip)", tat: "30 mnt",
    ket: "Cutoff skrining 300 ng/mL. Konfirmasi positif dengan GC-MS/LC-MS.",
    params: [
      { nama: "Benzodiazepin (BZO)", normal: "Negatif" },
    ],
  }),
  buildTest({
    kode: "MOP", nama: "Morfin / Opiat (MOP)", kategori: "Toksikologi",
    spesimen: "Urin", metode: "Immunoassay (rapid strip)", tat: "30 mnt",
    ket: "Cutoff rapid screen 300 ng/mL; cutoff konfirmasi/federal SAMHSA opiat 2000 ng/mL. Konfirmasi positif dengan GC-MS/LC-MS.",
    params: [
      { nama: "Morfin (MOP)", normal: "Negatif" },
    ],
  }),
];
