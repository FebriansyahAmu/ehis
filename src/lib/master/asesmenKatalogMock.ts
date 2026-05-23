/**
 * Master Asesmen Katalog — types + mock data.
 *
 * Konsumen: AllergyPane · RiwayatPane · AsesmenMedisTab (IGD + RI shared)
 * Replace: `shared/asesmen/asesmenShared.ts` (QUICK_PICKS, REACTIONS, PENYAKIT_*, ANGGOTA_KELUARGA, METODE_KB, JENIS_PERSALINAN)
 *
 * Strategi: 11 kategori distinct dengan struktur uniform (kode, nama, kategori, opsi metadata).
 * SNOMED CT untuk allergen yang sudah punya pemetaan internasional.
 */

// ── Types ────────────────────────────────────────────────

export type AsesmenKategori =
  | "AllergenObat"
  | "AllergenMakanan"
  | "AllergenLainnya"
  | "ReaksiAlergi"
  | "PenyakitDahulu"
  | "PenyakitBeresiko"
  | "PenyakitKeluarga"
  | "PerilakuBeresiko"
  | "AnggotaKeluarga"
  | "MetodeKB"
  | "JenisPersalinan";

export type AsesmenStatus = "Aktif" | "Non_Aktif";

/** Severity hanya berlaku untuk reaksi alergi. */
export type AsesmenSeverity = "Ringan" | "Sedang" | "Berat";

export interface AsesmenItem {
  id: string;
  kode: string;            // mis. "PEN-001" / SNOMED CT 764146007
  nama: string;
  kategori: AsesmenKategori;
  deskripsi?: string;
  snomedCode?: string;     // optional, untuk allergen tervalidasi
  /** Hanya untuk ReaksiAlergi. */
  severityDefault?: AsesmenSeverity;
  status: AsesmenStatus;
}

// ── Empty factory ────────────────────────────────────────

export function emptyAsesmenItem(): AsesmenItem {
  return {
    id: `ask-${Date.now().toString(36)}`,
    kode: "",
    nama: "",
    kategori: "AllergenObat",
    deskripsi: "",
    status: "Aktif",
  };
}

// ── Mock data ────────────────────────────────────────────

function mk(
  id: string,
  kode: string,
  nama: string,
  kategori: AsesmenKategori,
  extra: Partial<Pick<AsesmenItem, "snomedCode" | "deskripsi" | "severityDefault">> = {},
): AsesmenItem {
  return { id, kode, nama, kategori, status: "Aktif", ...extra };
}

const ALLERGEN_OBAT: AsesmenItem[] = [
  mk("ask-ao-1",  "ALG-OB-001", "Penisilin",          "AllergenObat", { snomedCode: "764146007",  deskripsi: "Beta-laktam. Reaksi silang dengan amoksisilin & ampisilin." }),
  mk("ask-ao-2",  "ALG-OB-002", "Amoksisilin",        "AllergenObat", { snomedCode: "372687004",  deskripsi: "Beta-laktam turunan penisilin." }),
  mk("ask-ao-3",  "ALG-OB-003", "Aspirin",            "AllergenObat", { snomedCode: "7947003",    deskripsi: "AERD risiko bronkospasme + reaksi silang NSAID lain." }),
  mk("ask-ao-4",  "ALG-OB-004", "Ibuprofen",          "AllergenObat", { snomedCode: "387207008",  deskripsi: "NSAID. Hindari pada AERD/asma berat." }),
  mk("ask-ao-5",  "ALG-OB-005", "Sulfa (Sulfonamida)","AllergenObat", { deskripsi: "Termasuk kotrimoksazol, sulfadiazin." }),
  mk("ask-ao-6",  "ALG-OB-006", "Kodein",             "AllergenObat", { snomedCode: "260421004",  deskripsi: "Opioid lemah. Reaksi silang dengan morfin." }),
  mk("ask-ao-7",  "ALG-OB-007", "Tetrasiklin",        "AllergenObat" ),
  mk("ask-ao-8",  "ALG-OB-008", "Ciprofloxacin",      "AllergenObat", { deskripsi: "Fluorokuinolon." }),
  mk("ask-ao-9",  "ALG-OB-009", "Kontras Radiologi (Iodinasi)", "AllergenObat", { deskripsi: "Premedikasi steroid bila harus pakai kontras." }),
  mk("ask-ao-10", "ALG-OB-010", "Metronidazol",       "AllergenObat" ),
  mk("ask-ao-11", "ALG-OB-011", "Tramadol",           "AllergenObat" ),
  mk("ask-ao-12", "ALG-OB-012", "Morfin",             "AllergenObat", { deskripsi: "Opioid kuat. Reaksi silang dengan kodein." }),
  mk("ask-ao-13", "ALG-OB-013", "Eritromisin",        "AllergenObat" ),
  mk("ask-ao-14", "ALG-OB-014", "Vankomisin",         "AllergenObat", { deskripsi: "Red man syndrome (bukan alergi sejati)." }),
  mk("ask-ao-15", "ALG-OB-015", "Sefalosporin",       "AllergenObat", { deskripsi: "Reaksi silang ringan dengan penisilin." }),
];

const ALLERGEN_MAKANAN: AsesmenItem[] = [
  mk("ask-am-1", "ALG-MK-001", "Kacang Tanah",       "AllergenMakanan", { snomedCode: "419199007",  deskripsi: "Anafilaksis sering berat." }),
  mk("ask-am-2", "ALG-MK-002", "Kacang Pohon",       "AllergenMakanan", { snomedCode: "227493005" }),
  mk("ask-am-3", "ALG-MK-003", "Seafood (Udang/Lobster/Kerang)", "AllergenMakanan" ),
  mk("ask-am-4", "ALG-MK-004", "Ikan Laut",          "AllergenMakanan" ),
  mk("ask-am-5", "ALG-MK-005", "Susu Sapi",          "AllergenMakanan", { snomedCode: "735029006" }),
  mk("ask-am-6", "ALG-MK-006", "Telur",              "AllergenMakanan", { snomedCode: "102263004" }),
  mk("ask-am-7", "ALG-MK-007", "Gandum / Gluten",    "AllergenMakanan", { deskripsi: "Hati-hati pada penyakit Celiac." }),
  mk("ask-am-8", "ALG-MK-008", "Kedelai",            "AllergenMakanan" ),
  mk("ask-am-9", "ALG-MK-009", "MSG (Monosodium Glutamat)", "AllergenMakanan", { deskripsi: "Lebih sering intoleransi, bukan alergi sejati." }),
  mk("ask-am-10","ALG-MK-010", "Wijen",              "AllergenMakanan" ),
];

const ALLERGEN_LAINNYA: AsesmenItem[] = [
  mk("ask-al-1", "ALG-LN-001", "Lateks",             "AllergenLainnya", { snomedCode: "1003755004", deskripsi: "Hindari sarung tangan lateks; gunakan nitril." }),
  mk("ask-al-2", "ALG-LN-002", "Serbuk Sari",        "AllergenLainnya" ),
  mk("ask-al-3", "ALG-LN-003", "Debu Rumah",         "AllergenLainnya" ),
  mk("ask-al-4", "ALG-LN-004", "Bulu Hewan",         "AllergenLainnya" ),
  mk("ask-al-5", "ALG-LN-005", "Nikel",              "AllergenLainnya", { deskripsi: "Dermatitis kontak alergi." }),
  mk("ask-al-6", "ALG-LN-006", "Sengatan Lebah",     "AllergenLainnya", { deskripsi: "Risiko anafilaksis." }),
  mk("ask-al-7", "ALG-LN-007", "Parfum / Pewangi",   "AllergenLainnya" ),
  mk("ask-al-8", "ALG-LN-008", "Plester / Adhesive", "AllergenLainnya" ),
];

const REAKSI_ALERGI: AsesmenItem[] = [
  mk("ask-rx-1",  "RX-001", "Anafilaksis",         "ReaksiAlergi", { severityDefault: "Berat",  deskripsi: "Reaksi sistemik berat — life-threatening." }),
  mk("ask-rx-2",  "RX-002", "Angioedema",          "ReaksiAlergi", { severityDefault: "Berat" }),
  mk("ask-rx-3",  "RX-003", "Bronkospasme",        "ReaksiAlergi", { severityDefault: "Berat" }),
  mk("ask-rx-4",  "RX-004", "Urtikaria (Biduran)", "ReaksiAlergi", { severityDefault: "Sedang" }),
  mk("ask-rx-5",  "RX-005", "Ruam / Eritema",      "ReaksiAlergi", { severityDefault: "Ringan" }),
  mk("ask-rx-6",  "RX-006", "Pruritus (Gatal)",    "ReaksiAlergi", { severityDefault: "Ringan" }),
  mk("ask-rx-7",  "RX-007", "Mual / Muntah",       "ReaksiAlergi", { severityDefault: "Ringan" }),
  mk("ask-rx-8",  "RX-008", "Diare",               "ReaksiAlergi", { severityDefault: "Ringan" }),
  mk("ask-rx-9",  "RX-009", "Rinitis / Bersin",    "ReaksiAlergi", { severityDefault: "Ringan" }),
  mk("ask-rx-10", "RX-010", "Sesak Napas / Dispnea", "ReaksiAlergi", { severityDefault: "Berat" }),
  mk("ask-rx-11", "RX-011", "Hipotensi",           "ReaksiAlergi", { severityDefault: "Berat" }),
  mk("ask-rx-12", "RX-012", "Konjungtivitis Alergi", "ReaksiAlergi", { severityDefault: "Ringan" }),
];

const PENYAKIT_DAHULU: AsesmenItem[] = [
  mk("ask-pd-1",  "PD-001", "Hipertensi",                "PenyakitDahulu"),
  mk("ask-pd-2",  "PD-002", "Diabetes Melitus",          "PenyakitDahulu"),
  mk("ask-pd-3",  "PD-003", "Penyakit Jantung Koroner",  "PenyakitDahulu"),
  mk("ask-pd-4",  "PD-004", "Gagal Jantung Kongestif",   "PenyakitDahulu"),
  mk("ask-pd-5",  "PD-005", "Stroke / TIA",              "PenyakitDahulu"),
  mk("ask-pd-6",  "PD-006", "Asma Bronkial",             "PenyakitDahulu"),
  mk("ask-pd-7",  "PD-007", "PPOK",                      "PenyakitDahulu"),
  mk("ask-pd-8",  "PD-008", "Tuberkulosis Paru",         "PenyakitDahulu"),
  mk("ask-pd-9",  "PD-009", "Hepatitis B",               "PenyakitDahulu"),
  mk("ask-pd-10", "PD-010", "Hepatitis C",               "PenyakitDahulu"),
  mk("ask-pd-11", "PD-011", "HIV / AIDS",                "PenyakitDahulu"),
  mk("ask-pd-12", "PD-012", "Gagal Ginjal Kronis",       "PenyakitDahulu"),
  mk("ask-pd-13", "PD-013", "Batu Saluran Kemih",        "PenyakitDahulu"),
  mk("ask-pd-14", "PD-014", "Kanker / Keganasan",        "PenyakitDahulu"),
  mk("ask-pd-15", "PD-015", "Epilepsi",                  "PenyakitDahulu"),
  mk("ask-pd-16", "PD-016", "Gangguan Jiwa",             "PenyakitDahulu"),
  mk("ask-pd-17", "PD-017", "Penyakit Tiroid",           "PenyakitDahulu"),
  mk("ask-pd-18", "PD-018", "Rheumatoid Arthritis",      "PenyakitDahulu"),
  mk("ask-pd-19", "PD-019", "Lupus (SLE)",               "PenyakitDahulu"),
  mk("ask-pd-20", "PD-020", "Thalassemia",               "PenyakitDahulu"),
];

const PENYAKIT_BERESIKO: AsesmenItem[] = [
  mk("ask-pb-1",  "PB-001", "Hipertensi",                "PenyakitBeresiko"),
  mk("ask-pb-2",  "PB-002", "Diabetes Melitus",          "PenyakitBeresiko"),
  mk("ask-pb-3",  "PB-003", "Obesitas",                  "PenyakitBeresiko"),
  mk("ask-pb-4",  "PB-004", "Dislipidemia",              "PenyakitBeresiko"),
  mk("ask-pb-5",  "PB-005", "Gagal Ginjal",              "PenyakitBeresiko"),
  mk("ask-pb-6",  "PB-006", "Penyakit Jantung",          "PenyakitBeresiko"),
  mk("ask-pb-7",  "PB-007", "Stroke",                    "PenyakitBeresiko"),
  mk("ask-pb-8",  "PB-008", "Asma / PPOK",               "PenyakitBeresiko"),
  mk("ask-pb-9",  "PB-009", "Kanker",                    "PenyakitBeresiko"),
  mk("ask-pb-10", "PB-010", "Gangguan Tiroid",           "PenyakitBeresiko"),
  mk("ask-pb-11", "PB-011", "Anemia Kronis",             "PenyakitBeresiko"),
  mk("ask-pb-12", "PB-012", "Hepatitis Kronis",          "PenyakitBeresiko"),
];

const PENYAKIT_KELUARGA: AsesmenItem[] = [
  mk("ask-pk-1",  "PK-001", "Hipertensi",                "PenyakitKeluarga"),
  mk("ask-pk-2",  "PK-002", "Diabetes Melitus",          "PenyakitKeluarga"),
  mk("ask-pk-3",  "PK-003", "Penyakit Jantung",          "PenyakitKeluarga"),
  mk("ask-pk-4",  "PK-004", "Stroke",                    "PenyakitKeluarga"),
  mk("ask-pk-5",  "PK-005", "Kanker",                    "PenyakitKeluarga"),
  mk("ask-pk-6",  "PK-006", "Tuberkulosis",              "PenyakitKeluarga"),
  mk("ask-pk-7",  "PK-007", "Asma",                      "PenyakitKeluarga"),
  mk("ask-pk-8",  "PK-008", "Thalassemia",               "PenyakitKeluarga"),
  mk("ask-pk-9",  "PK-009", "Gangguan Jiwa",             "PenyakitKeluarga"),
  mk("ask-pk-10", "PK-010", "HIV/AIDS",                  "PenyakitKeluarga"),
];

const PERILAKU_BERESIKO: AsesmenItem[] = [
  mk("ask-pr-1", "PR-001", "Merokok Aktif",                "PerilakuBeresiko"),
  mk("ask-pr-2", "PR-002", "Konsumsi Alkohol",             "PerilakuBeresiko"),
  mk("ask-pr-3", "PR-003", "Penggunaan NAPZA",             "PerilakuBeresiko"),
  mk("ask-pr-4", "PR-004", "Seks Berisiko Tinggi",         "PerilakuBeresiko"),
  mk("ask-pr-5", "PR-005", "Tidak Rutin Berolahraga",      "PerilakuBeresiko"),
  mk("ask-pr-6", "PR-006", "Pola Makan Tidak Sehat",       "PerilakuBeresiko"),
  mk("ask-pr-7", "PR-007", "Kurang Tidur (<6 jam/hari)",   "PerilakuBeresiko"),
  mk("ask-pr-8", "PR-008", "Stres Berat / Kronis",         "PerilakuBeresiko"),
];

const ANGGOTA_KELUARGA: AsesmenItem[] = [
  mk("ask-ak-1", "AK-001", "Ayah",              "AnggotaKeluarga"),
  mk("ask-ak-2", "AK-002", "Ibu",               "AnggotaKeluarga"),
  mk("ask-ak-3", "AK-003", "Kakak / Adik",      "AnggotaKeluarga"),
  mk("ask-ak-4", "AK-004", "Kakek (Paternal)",  "AnggotaKeluarga"),
  mk("ask-ak-5", "AK-005", "Nenek (Paternal)",  "AnggotaKeluarga"),
  mk("ask-ak-6", "AK-006", "Kakek (Maternal)",  "AnggotaKeluarga"),
  mk("ask-ak-7", "AK-007", "Nenek (Maternal)",  "AnggotaKeluarga"),
  mk("ask-ak-8", "AK-008", "Anak Kandung",      "AnggotaKeluarga"),
];

const METODE_KB: AsesmenItem[] = [
  mk("ask-kb-1", "KB-001", "IUD / Spiral",       "MetodeKB"),
  mk("ask-kb-2", "KB-002", "Pil KB",             "MetodeKB"),
  mk("ask-kb-3", "KB-003", "Suntik KB",          "MetodeKB"),
  mk("ask-kb-4", "KB-004", "Implan / Susuk",     "MetodeKB"),
  mk("ask-kb-5", "KB-005", "Kondom",             "MetodeKB"),
  mk("ask-kb-6", "KB-006", "Tubektomi / MOW",    "MetodeKB"),
  mk("ask-kb-7", "KB-007", "Vasektomi / MOP",    "MetodeKB"),
  mk("ask-kb-8", "KB-008", "Kalender / Alami",   "MetodeKB"),
  mk("ask-kb-9", "KB-009", "Tidak Menggunakan KB", "MetodeKB"),
];

const JENIS_PERSALINAN: AsesmenItem[] = [
  mk("ask-jp-1", "JP-001", "Spontan / Normal",          "JenisPersalinan"),
  mk("ask-jp-2", "JP-002", "Seksio Sesaria (SC)",       "JenisPersalinan"),
  mk("ask-jp-3", "JP-003", "Vakum / Forseps",           "JenisPersalinan"),
  mk("ask-jp-4", "JP-004", "Persalinan Prematur",       "JenisPersalinan"),
  mk("ask-jp-5", "JP-005", "Sungsang",                  "JenisPersalinan"),
];

export const ASESMEN_KATALOG_MOCK: AsesmenItem[] = [
  ...ALLERGEN_OBAT,
  ...ALLERGEN_MAKANAN,
  ...ALLERGEN_LAINNYA,
  ...REAKSI_ALERGI,
  ...PENYAKIT_DAHULU,
  ...PENYAKIT_BERESIKO,
  ...PENYAKIT_KELUARGA,
  ...PERILAKU_BERESIKO,
  ...ANGGOTA_KELUARGA,
  ...METODE_KB,
  ...JENIS_PERSALINAN,
];

// ── Validators ───────────────────────────────────────────

export function isAsesmenValid(item: AsesmenItem, isNew = false): boolean {
  if (isNew) return !!item.nama.trim();
  return !!(item.nama.trim() && item.kode.trim() && item.kategori);
}

// ── UI helpers ───────────────────────────────────────────

export function asesmenInitials(item: AsesmenItem): string {
  const src = item.nama || item.kode;
  const parts = src.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function getAsesmenStatusCfg(status: AsesmenStatus) {
  if (status === "Non_Aktif") {
    return { label: "Non-Aktif", bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" };
  }
  return { label: "Aktif", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" };
}
