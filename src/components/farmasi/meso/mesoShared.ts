// MESO — Monitoring Efek Samping Obat · PMK 72/2016 Ps. 33 · WHO-UMC Causality

export type SeveritasESO    = "Ringan" | "Sedang" | "Berat" | "Fatal";
export type KausalitasWHO   = "Pasti" | "Kemungkinan Besar" | "Kemungkinan" | "Meragukan" | "Tidak Dapat Dinilai";
export type OutcomeESO      = "Sembuh" | "Sembuh dgn Gejala Sisa" | "Belum Sembuh" | "Fatal" | "Tidak Diketahui";
export type TindakanDiambil = "Obat dihentikan" | "Dosis dikurangi" | "Obat dilanjutkan" | "Terapi simtomatik" | "Lainnya";

export interface LaporanMESO {
  id:              string;
  noRM:            string;
  namaObatTerduga: string;
  tanggalMulai:    string;
  tanggalLaporan:  string;
  deskripsiESO:    string;
  severitas:       SeveritasESO;
  kausalitas:      KausalitasWHO;
  outcome:         OutcomeESO;
  tindakan:        TindakanDiambil;
  tindakanLain?:   string;
  apoteker:        string;
  dikirimBPOM:     boolean;
}

// ── Severity config ────────────────────────────────────────

export const SEVERITAS_CFG: Record<SeveritasESO, { label: string; badge: string; dot: string; desc: string }> = {
  Ringan: {
    label: "Ringan", dot: "bg-emerald-400",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    desc:  "Gejala ringan, tidak perlu penanganan khusus",
  },
  Sedang: {
    label: "Sedang", dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    desc:  "Perlu terapi simtomatik atau perubahan dosis",
  },
  Berat:  {
    label: "Berat", dot: "bg-rose-500",
    badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    desc:  "Mengancam jiwa, perlu perawatan intensif",
  },
  Fatal:  {
    label: "Fatal", dot: "bg-slate-900",
    badge: "bg-slate-800 text-white ring-1 ring-slate-700",
    desc:  "Berkontribusi pada kematian pasien",
  },
};

// ── Causality config ──────────────────────────────────────

export const KAUSALITAS_CFG: Record<KausalitasWHO, { label: string; cls: string; desc: string }> = {
  "Pasti":                  { label: "Pasti",                  cls: "text-rose-700 bg-rose-50",    desc: "Sekuens waktu jelas, berhenti bila obat stop, kambuh bila rechallenge" },
  "Kemungkinan Besar":      { label: "Kemungkinan Besar",      cls: "text-orange-700 bg-orange-50", desc: "Sekuens masuk akal, tidak ada penjelasan lain yang lebih mungkin"       },
  "Kemungkinan":            { label: "Kemungkinan",            cls: "text-amber-700 bg-amber-50",   desc: "Sekuens masuk akal, tapi bisa ada penjelasan alternatif"                 },
  "Meragukan":              { label: "Meragukan",              cls: "text-slate-700 bg-slate-100",  desc: "Laporan dengan kemungkinan hubungan yang lemah"                          },
  "Tidak Dapat Dinilai":    { label: "Tidak Dapat Dinilai",    cls: "text-slate-500 bg-slate-50",   desc: "Informasi tidak cukup untuk penilaian"                                   },
};

// ── Mock data ─────────────────────────────────────────────

export const MESO_MOCK: LaporanMESO[] = [
  {
    id:              "meso-1",
    noRM:            "RM-2025-003",
    namaObatTerduga: "Captopril 12.5mg",
    tanggalMulai:    "2025-05-04",
    tanggalLaporan:  "2025-05-05",
    deskripsiESO:    "Batuk kering persisten tidak produktif, muncul 2 hari setelah mulai Captopril. Tidak ada gejala bronkospasme.",
    severitas:       "Ringan",
    kausalitas:      "Kemungkinan Besar",
    outcome:         "Belum Sembuh",
    tindakan:        "Obat dilanjutkan",
    apoteker:        "Apt. Rina S.Farm.",
    dikirimBPOM:     false,
  },
  {
    id:              "meso-2",
    noRM:            "RM-2025-003",
    namaObatTerduga: "Furosemide 40mg Inj",
    tanggalMulai:    "2026-05-08",
    tanggalLaporan:  "2026-05-10",
    deskripsiESO:    "Hipokalemia berulang (K+ 3.1 mEq/L) yang muncul kembali setiap kali dosis Furosemide ditingkatkan. Suplementasi KSR berhasil mengoreksi namun K+ turun kembali ke 3.2 mEq/L setelah eskalasi ke 80mg.",
    severitas:       "Sedang",
    kausalitas:      "Pasti",
    outcome:         "Belum Sembuh",
    tindakan:        "Terapi simtomatik",
    tindakanLain:    "Pantau K+ tiap 2 hari; tingkatkan KSR; pertimbangkan tambah Spironolakton",
    apoteker:        "Apt. Dewi S.Farm.",
    dikirimBPOM:     false,
  },

  // ── RM-2025-007 · Hasan Basri · Sepsis + ARDS (ICU) ─────────

  {
    id:              "meso-3",
    noRM:            "RM-2025-007",
    namaObatTerduga: "Norepinephrine 4mg/4mL",
    tanggalMulai:    "2025-05-05",
    tanggalLaporan:  "2025-05-06",
    deskripsiESO:    "Takikardia sinus persisten (HR 128 bpm) sejak pemberian Norepinephrine. Tidak ada aritmia aktif. Dicurigai efek simpatomimetik NE yang diperberat oleh respons stres septik.",
    severitas:       "Sedang",
    kausalitas:      "Kemungkinan",
    outcome:         "Sembuh",
    tindakan:        "Obat dilanjutkan",
    tindakanLain:    "Monitor irama EKG kontinu; weaning NE bertahap sesuai MAP target. HR membaik setelah 72 jam (98 bpm).",
    apoteker:        "Apt. Sari S.Farm.",
    dikirimBPOM:     false,
  },
  {
    id:              "meso-4",
    noRM:            "RM-2025-007",
    namaObatTerduga: "Vancomycin 1g Inj",
    tanggalMulai:    "2025-05-05",
    tanggalLaporan:  "2025-05-07",
    deskripsiESO:    "Peningkatan kreatinin progresif (1.8 → 3.2 mg/dL) dalam 48 jam pada kombinasi Vancomycin + Meropenem. Pola konsisten dengan Vancomycin-Meropenem-associated nephrotoxicity (VMAN). Trough level 28.5 mcg/mL (>20, toksik).",
    severitas:       "Berat",
    kausalitas:      "Kemungkinan Besar",
    outcome:         "Belum Sembuh",
    tindakan:        "Obat dihentikan",
    tindakanLain:    "Vancomycin dihentikan hari ke-3 setelah kultur Klebsiella sensitif Meropenem tersedia. Konsul Nefrologi untuk CRRT bila kreatinin tidak membaik. Laporan dikirim ke BPOM.",
    apoteker:        "Apt. Sari S.Farm.",
    dikirimBPOM:     true,
  },
  {
    id:              "meso-5",
    noRM:            "RM-2025-007",
    namaObatTerduga: "Midazolam 15mg/3mL",
    tanggalMulai:    "2025-05-06",
    tanggalLaporan:  "2025-05-07",
    deskripsiESO:    "Sedasi berlebihan (RASS -4 s/d -5 selama 18 jam, target RASS -2 s/d -3). Akumulasi Midazolam diduga akibat gangguan metabolisme hepar pada sepsis berat + AKI yang memperburuk klirens.",
    severitas:       "Sedang",
    kausalitas:      "Kemungkinan Besar",
    outcome:         "Sembuh dgn Gejala Sisa",
    tindakan:        "Dosis dikurangi",
    tindakanLain:    "Titrasi ulang ke 0.02 mg/kgBB/jam; lakukan daily sedation interruption (SAT); pertimbangkan beralih ke Propofol bila akumulasi berlanjut.",
    apoteker:        "Apt. Sari S.Farm.",
    dikirimBPOM:     false,
  },
];

export function getMESOForRM(noRM: string): LaporanMESO[] {
  return MESO_MOCK.filter((m) => m.noRM === noRM);
}
