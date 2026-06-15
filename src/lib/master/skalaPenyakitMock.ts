/**
 * Master Skala Penyakit — mock data.
 *
 * Konsumen: IGD `PenilaianTab` JantungPanel + KankerPanel
 * Replace: `igd/tabs/PenilaianTab.tsx` (Killip/NYHA/TIMI/ECOG/Stadium hardcoded)
 *
 * Standar:
 *   - Killip & Kimball 1967 (gagal jantung pasca-IMA)
 *   - NYHA Functional Classification (NYHA 1994)
 *   - Antman EM et al. JAMA 2000 (TIMI risk score)
 *   - Oken MM et al. Am J Clin Oncol 1982 (ECOG Performance Status)
 *   - WHO/AJCC histologic Grade (G1–G4)
 *   - AJCC Cancer Staging Manual 8th ed. 2017 (TNM Stadium)
 */

// NOTE: import TYPE-ONLY dari skalaCommon (di-strip Node native TS) agar file ini bisa di-load
// skrip seed `node --env-file` tanpa resolusi ekstensi runtime. Helper emptySkalaPenyakitRecord
// di-inline (tak lagi panggil runtime emptySkalaRecord). Selaras skalaRisikoMock.
import type { SkalaRecord } from "./skalaCommon";

export type {
  SkalaRecord, SkalaScoringMode, SkalaArah, SkalaModulKonsumen,
  SkalaTone, SkalaStatus, SkalaOption, SkalaItem, SkalaInterpretasi,
} from "./skalaCommon";

export type SkalaPenyakitRecord = SkalaRecord;

export function emptySkalaPenyakitRecord(): SkalaPenyakitRecord {
  return {
    id: `skp-${Date.now().toString(36)}`,
    kode: "",
    nama: "",
    singkat: "",
    deskripsi: "",
    scoringMode: "select_value",
    arah: "higher_is_worse",
    items: [],
    totalMax: 0,
    interpretasi: [],
    referensi: "",
    konsumenModul: ["RI", "RJ"],
    status: "Aktif",
  };
}

// ── Mock data ────────────────────────────────────────────

const KILLIP: SkalaPenyakitRecord = {
  id: "skp-killip",
  kode: "KILLIP",
  nama: "Killip Class",
  singkat: "Gagal Jantung post-IMA",
  deskripsi:
    "Klasifikasi gagal jantung pada pasien dengan infark miokard akut (IMA). Memprediksi mortalitas 30-hari.",
  scoringMode: "select_value",
  arah: "higher_is_worse",
  totalMax: 4,
  referensi: "Killip T, Kimball JT. Am J Cardiol 1967;20(4):457-464.",
  konsumenModul: ["IGD", "RI", "ICU"],
  status: "Aktif",
  items: [
    { id: "killip", label: "Killip Class", maxScore: 4, options: [
      { score: 1, label: "I — Tidak ada gagal jantung",  detail: "Tidak ada ronkhi, tidak ada S3. Mortalitas ~6%" },
      { score: 2, label: "II — Gagal jantung ringan",    detail: "Ronkhi <50% lapang paru, S3 gallop. Mortalitas ~17%" },
      { score: 3, label: "III — Edema paru",              detail: "Ronkhi >50% lapang paru. Mortalitas ~38%" },
      { score: 4, label: "IV — Syok kardiogenik",         detail: "TDS <90 mmHg + tanda hipoperfusi. Mortalitas ~81%" },
    ]},
  ],
  interpretasi: [
    { id: "kp-1", min: 1, max: 1, label: "Killip I (Risiko Rendah)",   tone: "emerald", action: "Monitor rutin. Lanjutkan tatalaksana IMA standar." },
    { id: "kp-2", min: 2, max: 2, label: "Killip II (Risiko Sedang)",  tone: "yellow",  action: "Tambah diuretik. Observasi tanda overload." },
    { id: "kp-3", min: 3, max: 3, label: "Killip III (Risiko Tinggi)", tone: "amber",   action: "Diuretik IV agresif. NIV pertimbangkan. Transfer ICU." },
    { id: "kp-4", min: 4, max: 4, label: "Killip IV (Kritis)",          tone: "rose",    action: "Resusitasi. Vasopressor/inotrop. IABP/ECMO pertimbangkan. ICU segera." },
  ],
};

const NYHA: SkalaPenyakitRecord = {
  id: "skp-nyha",
  kode: "NYHA",
  nama: "NYHA Functional Classification",
  singkat: "Fungsional Jantung",
  deskripsi:
    "Klasifikasi fungsional pasien gagal jantung berdasarkan keterbatasan aktivitas fisik dan gejala.",
  scoringMode: "select_value",
  arah: "higher_is_worse",
  totalMax: 4,
  referensi: "The Criteria Committee of the New York Heart Association. 9th ed. 1994.",
  konsumenModul: ["RI", "RJ", "ICU"],
  status: "Aktif",
  items: [
    { id: "nyha", label: "NYHA Class", maxScore: 4, options: [
      { score: 1, label: "I — Tidak ada keterbatasan",   detail: "Aktivitas fisik biasa tidak menimbulkan gejala" },
      { score: 2, label: "II — Keterbatasan ringan",      detail: "Nyaman saat istirahat. Gejala saat aktivitas sedang" },
      { score: 3, label: "III — Keterbatasan bermakna",   detail: "Nyaman saat istirahat. Gejala saat aktivitas ringan" },
      { score: 4, label: "IV — Tidak dapat beraktivitas", detail: "Gejala bahkan saat istirahat. Meningkat dengan aktivitas apapun" },
    ]},
  ],
  interpretasi: [
    { id: "nh-1", min: 1, max: 1, label: "NYHA I",   tone: "emerald", action: "Tatalaksana standar gagal jantung. Edukasi pola hidup." },
    { id: "nh-2", min: 2, max: 2, label: "NYHA II",  tone: "yellow",  action: "Optimasi terapi medikamentosa. Konsul jantung." },
    { id: "nh-3", min: 3, max: 3, label: "NYHA III", tone: "amber",   action: "Pertimbangkan device therapy (CRT/ICD). Cardiac rehab." },
    { id: "nh-4", min: 4, max: 4, label: "NYHA IV",  tone: "rose",    action: "End-stage HF. Pertimbangkan advanced therapy (LVAD/transplant) atau palliative care." },
  ],
};

const TIMI: SkalaPenyakitRecord = {
  id: "skp-timi",
  kode: "TIMI",
  nama: "TIMI Risk Score (UA/NSTEMI)",
  singkat: "Risiko Sindrom Koroner",
  deskripsi:
    "Skor risiko 14-hari mortalitas/IM/iskemia berulang pada pasien Unstable Angina/NSTEMI. 7 faktor risiko binerik.",
  scoringMode: "sum_items",
  arah: "higher_is_worse",
  totalMax: 7,
  referensi: "Antman EM, Cohen M, Bernink PJ, et al. JAMA 2000;284(7):835-842.",
  konsumenModul: ["IGD", "RI"],
  status: "Aktif",
  items: [
    { id: "usia",        label: "Usia ≥ 65 tahun",                       maxScore: 1, options: [{ score: 0, label: "Tidak" }, { score: 1, label: "Ya" }] },
    { id: "faktor3",     label: "≥ 3 faktor risiko CAD",                 maxScore: 1, options: [{ score: 0, label: "Tidak" }, { score: 1, label: "Ya" }] },
    { id: "stenosis",    label: "Stenosis arteri koroner ≥ 50%",         maxScore: 1, options: [{ score: 0, label: "Tidak" }, { score: 1, label: "Ya" }] },
    { id: "stDeviasi",   label: "Deviasi segmen ST pada EKG",            maxScore: 1, options: [{ score: 0, label: "Tidak" }, { score: 1, label: "Ya" }] },
    { id: "angina2",     label: "≥ 2 episode angina dalam 24 jam",       maxScore: 1, options: [{ score: 0, label: "Tidak" }, { score: 1, label: "Ya" }] },
    { id: "aspirin",     label: "Pemakaian aspirin dalam 7 hari terakhir", maxScore: 1, options: [{ score: 0, label: "Tidak" }, { score: 1, label: "Ya" }] },
    { id: "biomarker",   label: "Peningkatan biomarker (Troponin/CK-MB)", maxScore: 1, options: [{ score: 0, label: "Tidak" }, { score: 1, label: "Ya" }] },
  ],
  interpretasi: [
    { id: "t-1", min: 0, max: 2, label: "Risiko Rendah (4.7%)",      tone: "emerald", action: "Tatalaksana konservatif. Stress test, observasi 24 jam." },
    { id: "t-2", min: 3, max: 4, label: "Risiko Sedang (13.2%)",     tone: "amber",   action: "Strategi invasif awal (24–72 jam). Dual antiplatelet + antikoagulan." },
    { id: "t-3", min: 5, max: 7, label: "Risiko Tinggi (26.2%)",     tone: "rose",    action: "Strategi invasif segera (<24 jam). PCI urgent. ICCU." },
  ],
};

const ECOG: SkalaPenyakitRecord = {
  id: "skp-ecog",
  kode: "ECOG",
  nama: "ECOG Performance Status",
  singkat: "Status Performa Onkologi",
  deskripsi:
    "Skala status performa pasien onkologi. Mengukur derajat keterbatasan fungsional pasien kanker.",
  scoringMode: "select_value",
  arah: "higher_is_worse",
  totalMax: 5,
  referensi: "Oken MM, Creech RH, Tormey DC, et al. Am J Clin Oncol 1982;5(6):649-655.",
  konsumenModul: ["RI", "RJ"],
  status: "Aktif",
  items: [
    { id: "ecog", label: "ECOG Score", maxScore: 5, options: [
      { score: 0, label: "0 — Aktif penuh",                detail: "Dapat melakukan semua aktivitas pra-sakit tanpa hambatan" },
      { score: 1, label: "1 — Terbatas aktivitas berat",    detail: "Ambulatori, dapat melakukan pekerjaan ringan-sedang" },
      { score: 2, label: "2 — Ambulatori, tidak bekerja",   detail: "Ambulatori >50% waktu bangun, tidak dapat bekerja" },
      { score: 3, label: "3 — Perawatan diri terbatas",     detail: "Mampu merawat diri, >50% waktu di tempat tidur" },
      { score: 4, label: "4 — Tidak dapat merawat diri",    detail: "Seluruhnya di tempat tidur atau kursi roda" },
      { score: 5, label: "5 — Meninggal",                   detail: "Pasien meninggal" },
    ]},
  ],
  interpretasi: [
    { id: "e-1", min: 0, max: 1, label: "Performa Baik",     tone: "emerald", action: "Eligible untuk kemoterapi standar / clinical trial." },
    { id: "e-2", min: 2, max: 2, label: "Performa Sedang",   tone: "amber",   action: "Pertimbangkan dose-reduced chemo. Monitor toksisitas." },
    { id: "e-3", min: 3, max: 3, label: "Performa Buruk",    tone: "orange",  action: "Best supportive care. Hindari kemoterapi agresif." },
    { id: "e-4", min: 4, max: 5, label: "Performa Sangat Buruk", tone: "rose", action: "Palliative care only. Comfort measures." },
  ],
};

const STADIUM_KANKER: SkalaPenyakitRecord = {
  id: "skp-stadium",
  kode: "STADIUM-CA",
  nama: "Stadium Kanker (AJCC)",
  singkat: "Staging Onkologi",
  deskripsi:
    "Klasifikasi stadium kanker berdasarkan TNM (Tumor-Node-Metastasis). Memandu pilihan terapi dan prognosis.",
  scoringMode: "select_value",
  arah: "higher_is_worse",
  totalMax: 16,
  referensi: "AJCC Cancer Staging Manual. 8th ed. Springer 2017.",
  konsumenModul: ["RI", "RJ"],
  status: "Aktif",
  items: [
    { id: "stadium", label: "Stadium AJCC", maxScore: 16, options: [
      { score: 1,  label: "0 (in situ)",      detail: "Karsinoma in situ, belum invasi" },
      { score: 2,  label: "I",                detail: "Tumor terlokalisir, ukuran kecil" },
      { score: 3,  label: "IA" },
      { score: 4,  label: "IB" },
      { score: 5,  label: "IC" },
      { score: 6,  label: "II",               detail: "Tumor lokal lebih besar atau invasi lokal terbatas" },
      { score: 7,  label: "IIA" },
      { score: 8,  label: "IIB" },
      { score: 9,  label: "IIC" },
      { score: 10, label: "III",              detail: "Penyebaran regional ke kelenjar getah bening" },
      { score: 11, label: "IIIA" },
      { score: 12, label: "IIIB" },
      { score: 13, label: "IIIC" },
      { score: 14, label: "IV",               detail: "Metastasis jauh" },
      { score: 15, label: "IVA" },
      { score: 16, label: "IVB" },
    ]},
  ],
  interpretasi: [
    { id: "s-1", min: 1, max: 1,  label: "Stadium 0 (In Situ)",  tone: "emerald", action: "Reseksi lokal. 5-year survival mendekati 100%." },
    { id: "s-2", min: 2, max: 5,  label: "Stadium I",            tone: "yellow",  action: "Operasi kuratif. Pertimbangkan adjuvant. 5-YS 80–95%." },
    { id: "s-3", min: 6, max: 9,  label: "Stadium II",           tone: "amber",   action: "Operasi + adjuvant therapy. 5-YS 60–80%." },
    { id: "s-4", min: 10, max: 13, label: "Stadium III",         tone: "orange",  action: "Multimodal therapy (operasi + kemo + radiasi). 5-YS 30–60%." },
    { id: "s-5", min: 14, max: 16, label: "Stadium IV",          tone: "rose",    action: "Palliative therapy. Sistemik. 5-YS <20%. Komunikasi prognosis." },
  ],
};

const GRADE: SkalaPenyakitRecord = {
  id: "skp-grade",
  kode: "GRADE-HISTO",
  nama: "Grade Histologi",
  singkat: "Derajat Diferensiasi",
  deskripsi:
    "Derajat diferensiasi histologik tumor (seberapa abnormal sel tumor dibanding sel normal). Memandu agresivitas & prognosis.",
  scoringMode: "select_value",
  arah: "higher_is_worse",
  totalMax: 4,
  referensi: "WHO Classification of Tumours / AJCC histologic grade (G1–G4).",
  konsumenModul: ["RI", "RJ"],
  status: "Aktif",
  items: [
    { id: "grade", label: "Grade", maxScore: 4, options: [
      { score: 0, label: "GX — Tidak dapat dinilai" },
      { score: 1, label: "G1 — Berdiferensiasi baik",    detail: "Low grade — mirip jaringan normal" },
      { score: 2, label: "G2 — Berdiferensiasi sedang",  detail: "Intermediate grade" },
      { score: 3, label: "G3 — Berdiferensiasi buruk",   detail: "High grade — sangat abnormal" },
      { score: 4, label: "G4 — Tidak berdiferensiasi",   detail: "Anaplastik / undifferentiated" },
    ]},
  ],
  interpretasi: [
    { id: "g-0", min: 0, max: 0, label: "Grade Tidak Dinilai", tone: "sky",     action: "Lengkapi pemeriksaan histopatologi untuk grading." },
    { id: "g-1", min: 1, max: 1, label: "Low Grade (G1)",       tone: "emerald", action: "Prognosis relatif baik. Sesuaikan tatalaksana per stadium." },
    { id: "g-2", min: 2, max: 2, label: "Intermediate (G2)",    tone: "amber",   action: "Pertimbangkan adjuvant sesuai stadium & faktor risiko." },
    { id: "g-3", min: 3, max: 4, label: "High Grade (G3–G4)",   tone: "rose",    action: "Agresif. Multimodal therapy. Monitor rekurensi ketat." },
  ],
};

export const SKALA_PENYAKIT_MOCK: SkalaPenyakitRecord[] = [
  KILLIP, NYHA, TIMI, ECOG, GRADE, STADIUM_KANKER,
];
