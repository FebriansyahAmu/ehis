// Shared types · konfigurasi visual · helper untuk tab Order Lab (IGD/RI/RJ).
// Diekstrak dari OrderLabTab.tsx (file >800 baris) — dipakai bersama main tab + OrderLabHistory.
// Katalog = tes lab TER-ASSIGN dari master (GET /master/lab-test-tersedia) → harga dari Tarif Matrix.

import {
  FlaskConical, Activity, Microscope, Radiation, HeartPulse,
  Syringe, BarChart3, Droplets, ShieldCheck, Biohazard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LabTestTersediaDTO } from "@/lib/api/master/labTestTersedia";

// ── Vocab ─────────────────────────────────────────────────
// Selaras master.LabKategoriEnum (10 nilai) — katalog DB boleh kirim semuanya.
export type KategoriLab =
  | "Hematologi" | "Kimia Klinik" | "Koagulasi" | "Urinalisis" | "Feses"
  | "Serologi" | "Imunologi" | "Mikrobiologi" | "Toksikologi" | "Analisa Gas Darah";

export type StatusOrder = "Menunggu" | "Diterima" | "Diproses" | "Selesai" | "Dibatalkan";
export type StatusHasil = "Normal" | "Abnormal Rendah" | "Abnormal Tinggi" | "Kritis";

// ── Types ─────────────────────────────────────────────────

export interface LabTest {
  id: string;          // catalog id (UUID master.LabTest)
  kode: string;
  nama: string;
  kategori: KategoriLab;
  waktuTunggu: string;
  /** Harga (rupiah) dari Tarif Matrix; null = belum bertarif. */
  harga: number | null;
}

export interface OrderItem {
  id: string;
  /** Catalog id — dedup draft order. Absen untuk baris seed mock (riwayat/aktif). */
  testId?: string;
  kode: string;
  nama: string;
  kategori: KategoriLab;
  waktuTunggu: string;
  harga?: number | null;
}

export interface HasilItem {
  nama: string;
  nilai: string;
  satuan: string;
  nilaiNormal: string;
  status: StatusHasil;
}

export interface RiwayatOrder {
  id: string;
  noOrder: string;
  tanggal: string;
  jam: string;
  dokter: string;
  unit: string;
  status: StatusOrder;
  catatan?: string;
  items: OrderItem[];
  hasil?: HasilItem[];
}

export interface ActiveOrder {
  id: string;
  noOrder: string;
  tanggal: string;
  jam: string;
  dokter: string;
  status: StatusOrder;
  catatan?: string;
  items: OrderItem[];
}

// ── Default TAT per kategori (untuk item master tanpa `waktuTunggu`) ──
export const DEFAULT_WAKTU_TUNGGU: Record<KategoriLab, string> = {
  Hematologi:          "30 mnt",
  "Kimia Klinik":      "1 jam",
  Koagulasi:           "1 jam",
  Urinalisis:          "30 mnt",
  Feses:               "1 jam",
  Serologi:            "2 jam",
  Imunologi:           "1 jam",
  Mikrobiologi:        "2–3 hari",
  Toksikologi:         "30 mnt",
  "Analisa Gas Darah": "30 mnt",
};

// ── Badge configs ─────────────────────────────────────────

export const KATEGORI_ICON: Record<KategoriLab, IconComponent> = {
  Hematologi:          HeartPulse,
  "Kimia Klinik":      FlaskConical,
  Koagulasi:           BarChart3,
  Urinalisis:          Syringe,
  Feses:               Droplets,
  Serologi:            Activity,
  Imunologi:           ShieldCheck,
  Mikrobiologi:        Microscope,
  Toksikologi:         Biohazard,
  "Analisa Gas Darah": Radiation,
};

export const KATEGORI_COLOR: Record<KategoriLab, { bg: string; text: string; ring: string; icon: string }> = {
  Hematologi:          { bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-200",    icon: "text-rose-500"    },
  "Kimia Klinik":      { bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-200",     icon: "text-sky-500"     },
  Koagulasi:           { bg: "bg-orange-50",  text: "text-orange-700",  ring: "ring-orange-200",  icon: "text-orange-500"  },
  Urinalisis:          { bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200",   icon: "text-amber-500"   },
  Feses:               { bg: "bg-stone-100",  text: "text-stone-700",   ring: "ring-stone-200",   icon: "text-stone-500"   },
  Serologi:            { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", icon: "text-emerald-500" },
  Imunologi:           { bg: "bg-teal-50",    text: "text-teal-700",    ring: "ring-teal-200",    icon: "text-teal-500"    },
  Mikrobiologi:        { bg: "bg-violet-50",  text: "text-violet-700",  ring: "ring-violet-200",  icon: "text-violet-500"  },
  Toksikologi:         { bg: "bg-lime-50",    text: "text-lime-700",    ring: "ring-lime-200",    icon: "text-lime-600"    },
  "Analisa Gas Darah": { bg: "bg-indigo-50",  text: "text-indigo-700",  ring: "ring-indigo-200",  icon: "text-indigo-500"  },
};

export const STATUS_ORDER_BADGE: Record<StatusOrder, string> = {
  Menunggu:    "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  Diterima:    "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  Diproses:    "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  Selesai:     "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  Dibatalkan:  "bg-rose-50 text-rose-500 ring-1 ring-rose-200",
};

export const HASIL_STATUS_CLS: Record<StatusHasil, { badge: string; val: string }> = {
  Normal:            { badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", val: "text-emerald-700" },
  "Abnormal Rendah": { badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",             val: "text-sky-700"     },
  "Abnormal Tinggi": { badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",       val: "text-amber-700"   },
  Kritis:            { badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",          val: "text-rose-700 font-bold" },
};

// ── KategoriChip ──────────────────────────────────────────

export function KategoriChip({ kategori }: { kategori: KategoriLab }) {
  const color = KATEGORI_COLOR[kategori];
  const Icon  = KATEGORI_ICON[kategori];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1", color.bg, color.text, color.ring)}>
      <Icon size={9} />
      {kategori}
    </span>
  );
}

// ── Tarif context ─────────────────────────────────────────
// Lab di-tagih flat lintas tier (penjamin UMUM) → tier hanya untuk match baris Tarif Matrix.
export const TARIF_PENJAMIN_KODE = "UMUM";

/** Map unit pengirim → tier "Jenis Ruangan" Tarif Matrix. Fallback IGD (lab flat → harga standar tetap ter-resolve). */
export function tarifTierForUnit(unit: string): string {
  const u = unit.toLowerCase();
  if (u.includes("igd") || u.includes("gawat")) return "IGD";
  if (u.includes("icu")) return "ICU";
  if (u.includes("inap")) return "RAWAT_INAP:Kelas_3";
  return "IGD";
}

// ── Format harga ──────────────────────────────────────────
const RP = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
export const fmtRp = (n: number) => RP.format(n);

// ── Paket cepat (panel kurasi) — kode = master.LabTest.kode (seed) ──
// Resolve terhadap katalog ter-assign saat render: anggota yang tak tersedia disembunyikan,
// paket tanpa anggota disembunyikan, harga = jumlah harga anggota dari Tarif Matrix.
export const PAKET_DEFS: { label: string; codes: string[] }[] = [
  { label: "Darah Rutin",   codes: ["DR"] },
  { label: "Elektrolit",    codes: ["ELE"] },
  { label: "Profil Lipid",  codes: ["KOL", "HDL", "TG"] },
  { label: "Fungsi Ginjal", codes: ["UR", "CR", "UA"] },
  { label: "Fungsi Hati",   codes: ["SGOT", "SGPT", "BIL", "ALB", "GGT", "ALP"] },
  { label: "Panel DM",      codes: ["GDS", "GDP", "HBA1C"] },
  { label: "Panel Jantung", codes: ["TROP", "DR", "ELE"] },
  { label: "Koagulasi",     codes: ["PT", "APTT", "DDIMER"] },
  { label: "Panel Sepsis",  codes: ["DR", "PCT", "ELE", "CR"] },
  { label: "Panel Demam",   codes: ["DR", "WIDAL", "MAL"] },
];

// ── Status order lab (pemenuhan Laboratorium) — panel Riwayat Order Lab ──
// Workflow Lab: Menunggu → Diterima → Ambil Sampel → Sampel Diterima → Dianalisa →
// Divalidasi → Selesai (atau Ditolak / Dibatalkan). Dikelompokkan jadi bucket klinis:
// belum diterima · diproses (sudah masuk lab) · selesai · lain (negatif).

export type LabOrderBucket = "belum" | "proses" | "selesai" | "lain";

const LAB_STATUS_BUCKET: Record<string, LabOrderBucket> = {
  Menunggu:          "belum",
  Diterima:          "proses",
  "Ambil Sampel":    "proses",
  "Sampel Diterima": "proses",
  Dianalisa:         "proses",
  Divalidasi:        "proses",
  Selesai:           "selesai",
  Ditolak:           "lain",
  Dibatalkan:        "lain",
};

/** Bucket klinis dari status workflow Lab (fallback "belum" utk status tak dikenal). */
export function labOrderBucket(status: string): LabOrderBucket {
  return LAB_STATUS_BUCKET[status] ?? "belum";
}

export interface LabOrderStatusCfg {
  label: string; // label klinis (sudut pandang DPJP/perawat pengirim)
  badge: string;
  dot:   string;
}

export const LAB_ORDER_STATUS: Record<string, LabOrderStatusCfg> = {
  Menunggu:          { label: "Belum Diterima",        badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",       dot: "bg-amber-400"   },
  Diterima:          { label: "Diterima Lab",          badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",            dot: "bg-sky-500"     },
  "Ambil Sampel":    { label: "Ambil Sampel",          badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",            dot: "bg-sky-400"     },
  "Sampel Diterima": { label: "Sampel Diterima",       badge: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",         dot: "bg-cyan-500"    },
  Dianalisa:         { label: "Dianalisa",             badge: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",   dot: "bg-indigo-500"  },
  Divalidasi:        { label: "Validasi",              badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",   dot: "bg-violet-500"  },
  Selesai:           { label: "Selesai · Hasil Keluar", badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
  Ditolak:           { label: "Sampel Ditolak",        badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",         dot: "bg-rose-400"    },
  Dibatalkan:        { label: "Dibatalkan",            badge: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",     dot: "bg-slate-400"   },
};

export function labOrderStatusCfg(status: string): LabOrderStatusCfg {
  return LAB_ORDER_STATUS[status] ?? { label: status || "—", badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-200", dot: "bg-slate-400" };
}

/** Warna latar baris (soft) per bucket: belum=kuning · proses=biru · selesai=hijau · lain=merah. */
const LAB_BUCKET_ROW_BG: Record<LabOrderBucket, string> = {
  belum:   "bg-amber-50/70 hover:bg-amber-100/70",
  proses:  "bg-sky-50/60 hover:bg-sky-100/60",
  selesai: "bg-emerald-50/70 hover:bg-emerald-100/70",
  lain:    "bg-rose-50/70 hover:bg-rose-100/70",
};
export function labOrderRowBg(status: string): string {
  return LAB_BUCKET_ROW_BG[labOrderBucket(status)];
}

/** Coerce kategori string (DTO) → KategoriLab (fallback "Kimia Klinik" — punya ikon/warna). */
export function toKategoriLab(s: string): KategoriLab {
  return (s in KATEGORI_ICON ? s : "Kimia Klinik") as KategoriLab;
}

// ── DTO → LabTest ─────────────────────────────────────────
export function dtoToLabTest(d: LabTestTersediaDTO): LabTest {
  const kat = d.kategori as KategoriLab;
  return {
    id: d.id,
    kode: d.kode,
    nama: d.nama,
    kategori: kat,
    waktuTunggu: d.waktuTunggu || DEFAULT_WAKTU_TUNGGU[kat] || "1 jam",
    harga: d.harga,
  };
}
