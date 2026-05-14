import type { KategoriObat, StatusMAR, DecisionRekonsiliasi } from "@/lib/data";

// ── Obat catalog ─────────────────────────────────────────

export interface ObatCatalog {
  kode:     string;
  nama:     string;
  dosis:    string;
  satuan:   string;
  stok:     number;
  kategori: KategoriObat;
  isHAM?:   boolean;
}

export const OBAT_CATALOG: ObatCatalog[] = [
  { kode: "FAR-001", nama: "Aspirin 100mg",         dosis: "100",  satuan: "mg",     stok: 150, kategori: "Reguler"      },
  { kode: "FAR-002", nama: "Aspirin 500mg",          dosis: "500",  satuan: "mg",     stok: 80,  kategori: "Reguler"      },
  { kode: "FAR-003", nama: "Amoxicillin 500mg",      dosis: "500",  satuan: "mg",     stok: 200, kategori: "Reguler"      },
  { kode: "FAR-004", nama: "Clopidogrel 75mg",       dosis: "75",   satuan: "mg",     stok: 60,  kategori: "Reguler"      },
  { kode: "FAR-005", nama: "Atorvastatin 20mg",      dosis: "20",   satuan: "mg",     stok: 120, kategori: "Reguler"      },
  { kode: "FAR-006", nama: "Atorvastatin 40mg",      dosis: "40",   satuan: "mg",     stok: 75,  kategori: "Reguler"      },
  { kode: "FAR-007", nama: "Metformin 500mg",        dosis: "500",  satuan: "mg",     stok: 300, kategori: "Reguler"      },
  { kode: "FAR-008", nama: "Amlodipine 5mg",         dosis: "5",    satuan: "mg",     stok: 90,  kategori: "Reguler"      },
  { kode: "FAR-009", nama: "Omeprazole 20mg",        dosis: "20",   satuan: "mg",     stok: 250, kategori: "Reguler"      },
  { kode: "FAR-010", nama: "Paracetamol 500mg",      dosis: "500",  satuan: "mg",     stok: 500, kategori: "Reguler"      },
  { kode: "FAR-011", nama: "Ibuprofen 400mg",        dosis: "400",  satuan: "mg",     stok: 180, kategori: "Reguler"      },
  { kode: "FAR-012", nama: "Furosemide 40mg",        dosis: "40",   satuan: "mg",     stok: 100, kategori: "Reguler"      },
  { kode: "FAR-013", nama: "NaCl 0.9% 500mL",        dosis: "500",  satuan: "mL",     stok: 80,  kategori: "Reguler"      },
  { kode: "FAR-014", nama: "Dextrose 5% 500mL",      dosis: "500",  satuan: "mL",     stok: 60,  kategori: "Reguler"      },
  { kode: "FAR-015", nama: "Dopamin 200mg/5mL",      dosis: "200",  satuan: "mg/5mL", stok: 25,  kategori: "Reguler",      isHAM: true },
  { kode: "FAR-016", nama: "Morfin 10mg/mL Inj",     dosis: "10",   satuan: "mg/mL",  stok: 20,  kategori: "Narkotika",    isHAM: true },
  { kode: "FAR-017", nama: "Fentanyl 100mcg Inj",    dosis: "100",  satuan: "mcg",    stok: 15,  kategori: "Narkotika",    isHAM: true },
  { kode: "FAR-018", nama: "Codein 10mg",             dosis: "10",   satuan: "mg",     stok: 40,  kategori: "Narkotika",    isHAM: true },
  { kode: "FAR-019", nama: "Midazolam 5mg/5mL",      dosis: "5",    satuan: "mg/5mL", stok: 30,  kategori: "Psikotropika", isHAM: true },
  { kode: "FAR-020", nama: "Diazepam 5mg",            dosis: "5",    satuan: "mg",     stok: 50,  kategori: "Psikotropika", isHAM: true },
  { kode: "FAR-021", nama: "Alprazolam 0.5mg",        dosis: "0.5",  satuan: "mg",     stok: 35,  kategori: "Psikotropika", isHAM: true },
];

// ── Form options ─────────────────────────────────────────

export const SIGNA_OPTIONS = [
  { val: "1×1",    label: "Sekali sehari satu"      },
  { val: "2×1",    label: "Dua kali sehari satu"    },
  { val: "3×1",    label: "Tiga kali sehari satu"   },
  { val: "4×1",    label: "Empat kali sehari satu"  },
  { val: "1×2",    label: "Sekali sehari dua"       },
  { val: "2×2",    label: "Dua kali sehari dua"     },
  { val: "3×2",    label: "Tiga kali sehari dua"    },
  { val: "PRN",    label: "Jika perlu (PRN)"        },
  { val: "Titrasi",label: "Sesuai titrasi"          },
] as const;

export const ATURAN_WAKTU = [
  "AC (Sebelum Makan)",
  "PC (Sesudah Makan)",
  "Bersama Makan",
  "Terlepas dari Makan",
  "Malam Hari",
] as const;

export const RUTE_OPTIONS = [
  "Oral", "Sublingual", "IV Bolus", "IV Drip",
  "IM", "SC", "Inhalasi", "Topikal", "Rektal", "NGT",
] as const;

export const DEPO_OPTIONS = [
  "Depo Rawat Inap",
  "Depo IGD",
  "Apotek Rawat Jalan",
  "Apotek 24 Jam",
] as const;

export const ATURAN_PANDUAN = [
  "Peresepan maksimal 7 hari untuk obat reguler (BPJS).",
  "Narkotika / Psikotropika wajib tanda tangan dokter dan stempel resmi.",
  "Dosis tidak boleh melebihi dosis maksimal harian yang direkomendasikan.",
  "Pastikan tidak ada interaksi dengan obat yang sedang dikonsumsi pasien.",
  "Obat di luar formularium wajib dilampiri SKM (Surat Keterangan Medis).",
  "Resep harus lengkap: nama, dosis, signa, jumlah, rute.",
] as const;

// ── Badge / style configs ────────────────────────────────

export const KATEGORI_BADGE: Record<KategoriObat, string> = {
  Reguler:     "bg-slate-100 text-slate-600",
  Narkotika:   "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
  Psikotropika:"bg-amber-100 text-amber-700 ring-1 ring-amber-200",
};

export const HAM_BADGE = "bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded";

export const MAR_CONFIG: Record<StatusMAR, { label: string; cls: string; dot: string }> = {
  Diberikan:     { label: "✓",  cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-400" },
  Ditunda:       { label: "!",  cls: "bg-amber-50  text-amber-700  ring-1 ring-amber-200",    dot: "bg-amber-400"   },
  Ditolak:       { label: "✗",  cls: "bg-rose-50   text-rose-700   ring-1 ring-rose-200",     dot: "bg-rose-400"    },
  TidakTersedia: { label: "N/S",cls: "bg-slate-100 text-slate-500  ring-1 ring-slate-200",    dot: "bg-slate-300"   },
  NA:            { label: "—",  cls: "bg-slate-50  text-slate-300",                           dot: "bg-slate-200"   },
};

export const DECISION_CONFIG: Record<DecisionRekonsiliasi, { cls: string; dot: string }> = {
  Lanjutkan: { cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-400" },
  Hentikan:  { cls: "bg-rose-50   text-rose-700   ring-1 ring-rose-200",     dot: "bg-rose-400"    },
  Ganti:     { cls: "bg-sky-50    text-sky-700    ring-1 ring-sky-200",       dot: "bg-sky-400"     },
  Tunda:     { cls: "bg-amber-50  text-amber-700  ring-1 ring-amber-200",    dot: "bg-amber-400"   },
};

// ── Helpers ──────────────────────────────────────────────

export function genResepId(): string {
  return `rx-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function fmtTanggalRI(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "short", day: "numeric", month: "short",
  });
}
