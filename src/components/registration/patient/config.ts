import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Stethoscope,
  BedDouble,
  FlaskConical,
  Radiation,
  Pill,
  Tag,
} from "lucide-react";
import type { UnitKunjungan, TipePenjamin, KategoriItem, KasirData } from "@/lib/data";

// ── Style maps ─────────────────────────────────────────────

export const UNIT_CFG: Record<
  UnitKunjungan,
  { bg: string; text: string; icon: LucideIcon }
> = {
  IGD: { bg: "bg-rose-100", text: "text-rose-700", icon: AlertCircle },
  "Rawat Jalan": { bg: "bg-sky-100", text: "text-sky-700", icon: Stethoscope },
  "Rawat Inap": { bg: "bg-emerald-100", text: "text-emerald-700", icon: BedDouble },
  Laboratorium: { bg: "bg-teal-100", text: "text-teal-700", icon: FlaskConical },
  Radiologi: { bg: "bg-orange-100", text: "text-orange-700", icon: Radiation },
  Farmasi: { bg: "bg-violet-100", text: "text-violet-700", icon: Pill },
};

export const KUNJUNGAN_STATUS: Record<string, string> = {
  Selesai: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  Aktif: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
  Dibatalkan: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
};

export const STATUS_LABEL: Record<string, string> = {
  Aktif: "Di Ruangan",
  Selesai: "Selesai",
  Dibatalkan: "Dibatalkan",
};

export type FilterStatus = "Semua" | "Aktif" | "Selesai" | "Dibatalkan";

export const FILTER_OPTS: { key: FilterStatus; label: string }[] = [
  { key: "Semua", label: "Semua" },
  { key: "Aktif", label: "Di Ruangan" },
  { key: "Selesai", label: "Selesai" },
  { key: "Dibatalkan", label: "Dibatalkan" },
];

export const PENJAMIN_CFG: Record<
  TipePenjamin,
  { bg: string; border: string; badge: string; label: string }
> = {
  BPJS_Non_PBI: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badge: "bg-emerald-600 text-white",
    label: "BPJS Non-PBI",
  },
  BPJS_PBI: {
    bg: "bg-teal-50",
    border: "border-teal-200",
    badge: "bg-teal-600 text-white",
    label: "BPJS PBI",
  },
  Umum: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    badge: "bg-slate-600 text-white",
    label: "Umum / Mandiri",
  },
  Asuransi: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    badge: "bg-indigo-600 text-white",
    label: "Asuransi Swasta",
  },
  Jamkesda: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-600 text-white",
    label: "Jamkesda",
  },
};

export const KATEGORI_CFG: Record<
  KategoriItem,
  { color: string; bg: string; icon: LucideIcon }
> = {
  Tindakan: { color: "text-sky-700", bg: "bg-sky-50 border-sky-200", icon: Stethoscope },
  Obat: { color: "text-violet-700", bg: "bg-violet-50 border-violet-200", icon: Pill },
  Laboratorium: { color: "text-teal-700", bg: "bg-teal-50 border-teal-200", icon: FlaskConical },
  Radiologi: { color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: Radiation },
  Akomodasi: { color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", icon: BedDouble },
  "Lain-lain": { color: "text-slate-700", bg: "bg-slate-50 border-slate-200", icon: Tag },
};

export const TAGIHAN_STATUS: Record<string, string> = {
  Lunas: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  "Belum Lunas": "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
  "Proses Klaim": "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  Ditanggung: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200",
};

export type JadwalStatus = "Dijadwalkan" | "Selesai" | "Tidak Hadir" | "Batal";

export const JADWAL_CFG: Record<
  JadwalStatus,
  { label: string; badge: string; dot: string; border: string; cardBg: string }
> = {
  Dijadwalkan: {
    label: "Mendatang",
    badge: "bg-sky-100 text-sky-700",
    dot: "bg-sky-500",
    border: "border-sky-200",
    cardBg: "bg-sky-50/60",
  },
  Selesai: {
    label: "Selesai",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-slate-100",
    cardBg: "bg-slate-50/40",
  },
  "Tidak Hadir": {
    label: "Tidak Hadir",
    badge: "bg-rose-100 text-rose-700",
    dot: "bg-rose-400",
    border: "border-rose-100",
    cardBg: "bg-rose-50/30",
  },
  Batal: {
    label: "Batal",
    badge: "bg-slate-100 text-slate-400",
    dot: "bg-slate-300",
    border: "border-slate-100",
    cardBg: "bg-slate-50/30",
  },
};

export const BULAN_IDX: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5,
  Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11,
};

export const POLI_OPTS = [
  "Poli Umum", "Poli Dalam", "Poli Bedah", "Poli Anak",
  "Poli Kandungan", "Poli Jantung", "Poli Saraf", "Poli Kulit",
  "Poli Mata", "Poli THT", "Poli Gigi", "Poli Paru",
  "Poli Ortopedi", "Poli Jiwa",
];

// ── Jadwal item type ────────────────────────────────────────

export type JadwalItem = {
  tanggal: string;
  jam?: string;
  dokter: string;
  poli?: string;
  status: string;
  fromKunjungan: string;
};

// ── Helpers ────────────────────────────────────────────────

export function fmtRp(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

export function parseIndoDate(s: string): Date {
  const [d, m, y] = s.split(" ");
  return new Date(+y, BULAN_IDX[m] ?? 0, +d);
}

export function calcKasir(kasir: KasirData) {
  const totalTagihan = kasir.items.reduce((s, i) => s + i.qty * i.harga, 0);
  const totalDeposit = kasir.deposits.reduce((s, d) => s + d.jumlah, 0);
  const sisaBayar = Math.max(0, totalTagihan - totalDeposit);
  const byKategori = kasir.items.reduce<Record<KategoriItem, number>>(
    (acc, i) => {
      acc[i.kategori] = (acc[i.kategori] ?? 0) + i.qty * i.harga;
      return acc;
    },
    {} as Record<KategoriItem, number>,
  );
  return { totalTagihan, totalDeposit, sisaBayar, byKategori };
}
