// DRP — Drug-Related Problems · PCNE V9 · PMK 72/2016

// ── Problem domain ────────────────────────────────────────

export type ProblemCode =
  | "P1.1" | "P1.2" | "P1.3"
  | "P2.1" | "P2.2" | "P2.3" | "P2.4"
  | "P3.1" | "P3.2";

export type CauseCode =
  | "C1.1" | "C1.2" | "C1.3" | "C1.4" | "C1.5"
  | "C2.1" | "C2.2" | "C2.3"
  | "C3.1" | "C3.2"
  | "C4.1" | "C4.2"
  | "C5.1";

export type IntervensiCode = "I0" | "I1.1" | "I1.2" | "I1.3" | "I2.1" | "I3.1";
export type OutcomeDRP     = "O0" | "O1" | "O2" | "O3";

export interface DRPEntry {
  id:              string;
  noRM:            string;
  resepItemId?:    string;
  tanggal:         string;
  problemCode:     ProblemCode;
  causeCode:       CauseCode;
  deskripsi:       string;
  intervensiCode:  IntervensiCode;
  intervensiDetail?: string;
  outcome:         OutcomeDRP;
  apoteker:        string;
  statusTertutup:  boolean;
}

// ── PCNE V9 katalog ────────────────────────────────────────

export const PROBLEM_CATALOG: Record<ProblemCode, { domain: "P1" | "P2" | "P3"; label: string; desc: string }> = {
  "P1.1": { domain: "P1", label: "Efek terapi tidak ada",        desc: "Pasien tidak mendapatkan efek terapi yang seharusnya"    },
  "P1.2": { domain: "P1", label: "Efek terapi tidak optimal",    desc: "Pasien mendapat efek terapi sebagian saja"               },
  "P1.3": { domain: "P1", label: "Efek terapi berlebihan",       desc: "Gejala toksisitas atau efek farmakologi berlebihan"      },
  "P2.1": { domain: "P2", label: "Efek samping obat",            desc: "Adverse drug reaction yang tidak diinginkan"            },
  "P2.2": { domain: "P2", label: "Toksisitas obat",              desc: "Reaksi toksik akibat dosis berlebihan atau akumulasi"    },
  "P2.3": { domain: "P2", label: "Interaksi obat (aktual)",      desc: "Interaksi obat-obat atau obat-makanan yang terjadi"      },
  "P2.4": { domain: "P2", label: "Kontraindikasi aktual",        desc: "Obat diberikan meski ada kontraindikasi"                },
  "P3.1": { domain: "P3", label: "Masalah ketersediaan/biaya",   desc: "Obat tidak tersedia atau tidak terjangkau pasien"       },
  "P3.2": { domain: "P3", label: "Ketidakpatuhan pasien",        desc: "Pasien tidak menggunakan obat sesuai instruksi"         },
};

export const CAUSE_CATALOG: Record<CauseCode, { domain: string; label: string }> = {
  "C1.1": { domain: "C1", label: "Indikasi tanpa obat"           },
  "C1.2": { domain: "C1", label: "Obat tanpa indikasi yang jelas" },
  "C1.3": { domain: "C1", label: "Interaksi tidak diantisipasi"  },
  "C1.4": { domain: "C1", label: "Kontraindikasi tidak diperhatikan" },
  "C1.5": { domain: "C1", label: "Duplikasi terapi"              },
  "C2.1": { domain: "C2", label: "Dosis terlalu rendah"          },
  "C2.2": { domain: "C2", label: "Dosis terlalu tinggi"          },
  "C2.3": { domain: "C2", label: "Frekuensi / durasi tidak tepat" },
  "C3.1": { domain: "C3", label: "Cara / rute penggunaan tidak tepat" },
  "C3.2": { domain: "C3", label: "Waktu pemberian tidak tepat"   },
  "C4.1": { domain: "C4", label: "Pemahaman pasien kurang"       },
  "C4.2": { domain: "C4", label: "Kepatuhan pasien rendah"       },
  "C5.1": { domain: "C5", label: "Informasi tidak ditransfer antar unit" },
};

export const INTERVENSI_CATALOG: Record<IntervensiCode, string> = {
  "I0":   "Tidak ada intervensi",
  "I1.1": "Rekomendasi ke dokter — ubah dosis",
  "I1.2": "Rekomendasi ke dokter — ganti obat",
  "I1.3": "Rekomendasi ke dokter — tambah monitoring",
  "I2.1": "Edukasi / konseling ke pasien",
  "I3.1": "Obat didispensasi berbeda (substitusi)",
};

export const OUTCOME_CATALOG: Record<OutcomeDRP, { label: string; cls: string }> = {
  O0: { label: "Belum ditindaklanjuti",    cls: "bg-slate-100 text-slate-600" },
  O1: { label: "Masalah teratasi",         cls: "bg-emerald-50 text-emerald-700" },
  O2: { label: "Masalah teratasi sebagian", cls: "bg-amber-50 text-amber-700"    },
  O3: { label: "Masalah tidak teratasi",   cls: "bg-rose-50 text-rose-700"       },
};

export const DOMAIN_CFG = {
  P1: { label: "Efektivitas",  cls: "text-amber-700",  bg: "bg-amber-50",  ring: "ring-amber-200"  },
  P2: { label: "Keamanan",     cls: "text-rose-700",   bg: "bg-rose-50",   ring: "ring-rose-200"   },
  P3: { label: "Lainnya",      cls: "text-slate-600",  bg: "bg-slate-100", ring: "ring-slate-200"  },
};

// ── Mock data ─────────────────────────────────────────────

export const DRP_MOCK: DRPEntry[] = [
  {
    id: "drp-1", noRM: "RM-2025-003", resepItemId: "rx-ri1-3",
    tanggal: "2025-05-05",
    problemCode: "P2.1", causeCode: "C1.3",
    deskripsi: "Kombinasi Captopril + Spironolactone meningkatkan risiko hiperkalemia. K+ saat ini 3.9 mEq/L (borderline atas normal).",
    intervensiCode: "I1.3", intervensiDetail: "Rekomendasikan monitoring K+ setiap 3 hari selama kombinasi berlanjut.",
    outcome: "O1", apoteker: "Apt. Rina S.Farm.", statusTertutup: false,
  },
  {
    id: "drp-2", noRM: "RM-2025-003", resepItemId: "rr-4",
    tanggal: "2026-05-08",
    problemCode: "P1.2", causeCode: "C2.1",
    deskripsi: "Bisoprolol 2.5mg — dosis awal rendah untuk GJK NYHA III. HR masih 96 bpm (target <70 bpm per ESC HF Guidelines 2021). Titrasi lambat karena TD borderline.",
    intervensiCode: "I1.1", intervensiDetail: "Sarankan titrasi Bisoprolol bertahap ke 5mg setelah 2 minggu bila TD sistolik ≥90 mmHg dan pasien toleran.",
    outcome: "O2", apoteker: "Apt. Dewi S.Farm.", statusTertutup: false,
  },

  // ── RM-2025-007 · Hasan Basri · Sepsis + ARDS (ICU) ─────────

  {
    id: "drp-3", noRM: "RM-2025-007", resepItemId: "icu-rr-7",
    tanggal: "2025-05-07",
    problemCode: "P2.3", causeCode: "C1.3",
    deskripsi: "Kombinasi Vancomycin + Meropenem memberikan risiko nefrotoksisitas sinergistik (VMAN). Kreatinin naik 1.8 → 3.2 mg/dL dalam 48 jam. AKI Stad. III terjadi. Setelah kultur Klebsiella sensitif Meropenem tersedia, Vancomycin tidak diperlukan.",
    intervensiCode: "I1.2", intervensiDetail: "Rekomendasikan penghentian Vancomycin segera. Kultur menunjukkan Klebsiella sensitif Meropenem — Vancomycin tidak ada indikasi. De-eskalasi antibiotik mencegah progresi AKI.",
    outcome: "O1", apoteker: "Apt. Sari S.Farm.", statusTertutup: true,
  },
  {
    id: "drp-4", noRM: "RM-2025-007", resepItemId: "icu-rr-6",
    tanggal: "2025-05-06",
    problemCode: "P1.2", causeCode: "C2.3",
    deskripsi: "Meropenem 1g q8h tidak disesuaikan dengan penurunan fungsi ginjal. GFR estimasi <30 mL/mnt (kreatinin 2.8 mg/dL, BB ~70 kg). Menurut panduan, Meropenem pada GFR 10-25 mL/mnt: 500mg q12h atau 1g q12h. Risiko akumulasi dan toksisitas SSP.",
    intervensiCode: "I1.1", intervensiDetail: "Sarankan penyesuaian dosis Meropenem: 1g q12h sesuai GFR estimasi terbaru. Monitor kreatinin tiap 24 jam dan sesuaikan ulang bila GFR berubah.",
    outcome: "O1", apoteker: "Apt. Sari S.Farm.", statusTertutup: true,
  },
  {
    id: "drp-5", noRM: "RM-2025-007", resepItemId: "icu-rr-3",
    tanggal: "2025-05-07",
    problemCode: "P1.3", causeCode: "C2.2",
    deskripsi: "Midazolam 0.04 mg/kgBB/jam menyebabkan deep sedation (RASS -4/-5, target -2/-3) selama 18 jam. Akumulasi diperberat disfungsi hepar pada sepsis + AKI. Risiko ventilator-acquired complications meningkat bila sedasi terlalu dalam.",
    intervensiCode: "I1.1", intervensiDetail: "Titrasi Midazolam ke 0.02 mg/kgBB/jam; implementasi daily sedation interruption (SAT) + Spontaneous Breathing Trial (SBT). Pertimbangkan beralih ke Propofol bila akumulasi berlanjut.",
    outcome: "O2", apoteker: "Apt. Sari S.Farm.", statusTertutup: false,
  },
  {
    id: "drp-6", noRM: "RM-2025-007",
    tanggal: "2025-05-08",
    problemCode: "P1.1", causeCode: "C1.1",
    deskripsi: "Hiperglikemia stres (GDS 248 mg/dL di CPPT) tanpa order insulin terdokumentasi. Panduan Surviving Sepsis Campaign & SNARS merekomendasikan kontrol glikemik ketat di ICU dengan target GD 140–180 mg/dL menggunakan insulin infus.",
    intervensiCode: "I1.2", intervensiDetail: "Rekomendasikan penambahan protokol insulin ICU: Actrapid 50 IU/50mL NaCl 0.9% via syringe pump, target GD 140-180 mg/dL. Pantau GD tiap 1-2 jam saat titrasi awal.",
    outcome: "O0", apoteker: "Apt. Sari S.Farm.", statusTertutup: false,
  },
];

export function getDRPForRM(noRM: string): DRPEntry[] {
  return DRP_MOCK.filter((d) => d.noRM === noRM);
}
