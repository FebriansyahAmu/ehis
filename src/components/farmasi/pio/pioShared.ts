// PIO — Pelayanan Informasi Obat · PMK 72/2016 Ps. 27-29

export type KategoriPIO      = "Dosis" | "Interaksi Obat" | "Efek Samping" | "Kontraindikasi" | "Cara Pakai" | "Farmakokinetik" | "Ketersediaan" | "Lainnya";
export type SumberPertanyaan = "Dokter" | "Perawat" | "Pasien" | "Keluarga" | "Apoteker";
export type StatusPIO        = "Terjawab" | "Pending" | "Dirujuk";
export type UrgensipIO       = "Urgent" | "Reguler";

export interface LogPIO {
  id:               string;
  tanggal:          string;
  jam:              string;
  urgensi:          UrgensipIO;
  sumber:           SumberPertanyaan;
  namaPenanya:      string;
  unitAsal?:        string;
  kategori:         KategoriPIO;
  pertanyaan:       string;
  jawaban?:         string;
  referensi?:       string[];
  waktuResponsMenit?: number;
  apoteker:         string;
  status:           StatusPIO;
}

// ── Config ────────────────────────────────────────────────

export const KATEGORI_CFG: Record<KategoriPIO, { badge: string; dot: string }> = {
  "Dosis":           { badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",         dot: "bg-sky-400"     },
  "Interaksi Obat":  { badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",       dot: "bg-rose-500"    },
  "Efek Samping":    { badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",    dot: "bg-amber-400"   },
  "Kontraindikasi":  { badge: "bg-orange-50 text-orange-700 ring-1 ring-orange-200", dot: "bg-orange-400"  },
  "Cara Pakai":      { badge: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",       dot: "bg-teal-400"    },
  "Farmakokinetik":  { badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-200", dot: "bg-violet-400"  },
  "Ketersediaan":    { badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",   dot: "bg-slate-400"   },
  "Lainnya":         { badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",   dot: "bg-slate-300"   },
};

export const STATUS_PIO_CFG: Record<StatusPIO, { badge: string; dot: string }> = {
  Terjawab: { badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-400" },
  Pending:  { badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",       dot: "bg-amber-400"   },
  Dirujuk:  { badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",      dot: "bg-slate-400"   },
};

export const URGENSI_CFG: Record<UrgensipIO, { badge: string }> = {
  Urgent:  { badge: "bg-rose-500 text-white"       },
  Reguler: { badge: "bg-slate-100 text-slate-600"  },
};

export const SUMBER_CFG: Record<SumberPertanyaan, string> = {
  Dokter:    "bg-sky-100 text-sky-700",
  Perawat:   "bg-teal-100 text-teal-700",
  Pasien:    "bg-emerald-100 text-emerald-700",
  Keluarga:  "bg-slate-100 text-slate-600",
  Apoteker:  "bg-violet-100 text-violet-700",
};

export const KATEGORI_LIST: KategoriPIO[] = [
  "Dosis", "Interaksi Obat", "Efek Samping", "Kontraindikasi",
  "Cara Pakai", "Farmakokinetik", "Ketersediaan", "Lainnya",
];

export const SUMBER_LIST: SumberPertanyaan[] = ["Dokter", "Perawat", "Pasien", "Keluarga", "Apoteker"];

// ── Mock data ─────────────────────────────────────────────

export const PIO_MOCK: LogPIO[] = [
  {
    id: "pio-1",
    tanggal: "2026-05-18", jam: "08:10",
    urgensi: "Urgent", sumber: "Dokter",
    namaPenanya: "dr. Budi Santoso, Sp.JP", unitAsal: "Rawat Inap – Jantung",
    kategori: "Interaksi Obat",
    pertanyaan: "Apakah kombinasi Captopril + Spironolakton aman untuk pasien GJK NYHA III dengan K⁺ borderline 3.9 mEq/L?",
    jawaban: "Kombinasi ini meningkatkan risiko hiperkalemia. Pada K⁺ 3.9 mEq/L, kombinasi masih dapat dilanjutkan dengan monitoring K⁺ ketat setiap 3 hari. Target K⁺ 3.5–5.0 mEq/L. Hentikan jika K⁺ > 5.5 mEq/L. Referensi: ESC HF Guidelines 2021 Sec. 7.2.",
    referensi: ["ESC HF Guidelines 2021", "BNF 84", "MIMS Indonesia 2025"],
    waktuResponsMenit: 12,
    apoteker: "Apt. Rina S.Farm.", status: "Terjawab",
  },
  {
    id: "pio-2",
    tanggal: "2026-05-18", jam: "09:45",
    urgensi: "Reguler", sumber: "Perawat",
    namaPenanya: "Ns. Ratna", unitAsal: "Bangsal Jantung Kelas 1",
    kategori: "Cara Pakai",
    pertanyaan: "Bagaimana cara pemberian KCl addmix yang benar? Bolehkah diberikan cepat melalui IV perifer?",
    jawaban: "KCl addmix termasuk HAM. Pemberian IV perifer tidak boleh lebih dari 10 mEq/jam dan konsentrasi maksimal 40 mEq/L. DILARANG diberikan IV push/bolus. Gunakan infusion pump, monitor irama jantung dan K⁺ serial setiap 2 jam selama infus. Tandai botol infus dengan label HAM.",
    referensi: ["ASHP Guidelines on IV Admixtures 2020", "PMK 72/2016 SKP 3"],
    waktuResponsMenit: 8,
    apoteker: "Apt. Rina S.Farm.", status: "Terjawab",
  },
  {
    id: "pio-3",
    tanggal: "2026-05-17", jam: "14:20",
    urgensi: "Reguler", sumber: "Pasien",
    namaPenanya: "Ny. Sri Wahyuni (RM-2025-003)", unitAsal: "Rawat Inap",
    kategori: "Efek Samping",
    pertanyaan: "Pasien mengeluh batuk kering sejak mulai Captopril 2 hari lalu. Apakah ini berbahaya dan haruskah obat dihentikan?",
    jawaban: "Batuk kering adalah efek samping umum ACE inhibitor (incl. Captopril), terjadi pada 5–35% pasien. Tidak berbahaya dan bukan tanda toksisitas. Obat tidak perlu dihentikan kecuali sangat mengganggu. Jika tidak tertoleransi, diskusi dengan dokter untuk ganti ke ARB (mis. Valsartan). Minum air putih yang cukup dan hindari posisi berbaring langsung setelah minum.",
    referensi: ["ISO Indonesia Vol. 49", "UpToDate: ACE inhibitor-induced cough 2025"],
    waktuResponsMenit: 15,
    apoteker: "Apt. Dewi S.Farm.", status: "Terjawab",
  },
  {
    id: "pio-4",
    tanggal: "2026-05-17", jam: "16:55",
    urgensi: "Urgent", sumber: "Dokter",
    namaPenanya: "dr. Hendra Wijaya, Sp.EM", unitAsal: "ICU",
    kategori: "Dosis",
    pertanyaan: "Penyesuaian dosis Meropenem untuk pasien sepsis dengan GFR estimasi <30 mL/mnt (kreatinin 2.8 mg/dL, BB 70 kg)?",
    jawaban: "Untuk GFR 10–25 mL/mnt: Meropenem 500 mg q12h atau 1 g q12h (bukan q8h). Dosis 1 g q12h direkomendasikan untuk infeksi berat/Gram-negatif resisten. Monitor kreatinin tiap 24 jam. Jika GFR <10 mL/mnt atau CRRT: 500 mg q24h (sesuaikan ulang). Extended infusion (3 jam) dapat dipertimbangkan untuk PD/PK optimal pada infeksi berat.",
    referensi: ["Sanford Guide 2025", "Lexicomp Renal Dosing", "Surviving Sepsis Campaign 2021"],
    waktuResponsMenit: 7,
    apoteker: "Apt. Sari S.Farm.", status: "Terjawab",
  },
  {
    id: "pio-5",
    tanggal: "2026-05-16", jam: "11:30",
    urgensi: "Reguler", sumber: "Perawat",
    namaPenanya: "Ns. Dewi ICU", unitAsal: "ICU",
    kategori: "Farmakokinetik",
    pertanyaan: "Mengapa Midazolam efeknya sangat lama pada pasien ICU ini? Pasien RASS -4 padahal dosis sudah rendah.",
    jawaban: "Midazolam mengalami akumulasi signifikan pada sepsis berat + AKI karena: (1) penurunan metabolisme hepar akibat hipoperfusi pada sepsis, (2) penurunan klirens ginjal dari metabolit aktif 1-OH-midazolam pada AKI, (3) hipoalbuminemia meningkatkan fraksi bebas. Pertimbangkan beralih ke Propofol (metabolisme lebih dapat diprediksi, titrasi lebih mudah). Lakukan daily sedation interruption (SAT) per protokol A-B-C-D-E-F bundle.",
    referensi: ["Critical Care Medicine 2023 – Sedation Review", "SCCM PAD Guidelines 2018"],
    waktuResponsMenit: 22,
    apoteker: "Apt. Sari S.Farm.", status: "Terjawab",
  },
  {
    id: "pio-6",
    tanggal: "2026-05-18", jam: "11:00",
    urgensi: "Reguler", sumber: "Keluarga",
    namaPenanya: "Tn. Budi (keluarga Tn. Hasan Basri)", unitAsal: "ICU",
    kategori: "Ketersediaan",
    pertanyaan: "Apakah Norepinephrine tersedia di apotek RS? Apakah bisa dibeli di luar?",
    jawaban: "",
    waktuResponsMenit: undefined,
    apoteker: "Apt. Sari S.Farm.", status: "Pending",
  },
];
