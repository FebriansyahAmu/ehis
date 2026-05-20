import {
  Zap, FlaskConical, Radiation, BedDouble, Pill,
  Stethoscope, Truck, MoreHorizontal, type LucideIcon,
} from "lucide-react";
import type { KategoriTarif, StatusTarif, TarifRecord, PaketItem } from "@/lib/master/tarifMock";

export const KATEGORI_LIST: KategoriTarif[] = [
  "Tindakan Medis", "Laboratorium", "Radiologi",
  "Kamar Rawat", "Obat & BMHP", "Jasa Dokter", "Ambulans", "Lainnya",
];

export interface KategoriCfg {
  icon:  LucideIcon;
  bg:    string;
  text:  string;
  ring:  string;
  short: string;
}

export const KATEGORI_CFG: Record<KategoriTarif, KategoriCfg> = {
  "Tindakan Medis": { icon: Zap,          bg: "bg-teal-50",    text: "text-teal-700",    ring: "ring-teal-200",    short: "Tindakan"  },
  "Laboratorium":   { icon: FlaskConical, bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-200",     short: "Lab"       },
  "Radiologi":      { icon: Radiation,    bg: "bg-violet-50",  text: "text-violet-700",  ring: "ring-violet-200",  short: "Rad"       },
  "Kamar Rawat":    { icon: BedDouble,    bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", short: "Kamar"     },
  "Obat & BMHP":    { icon: Pill,         bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200",   short: "Obat"      },
  "Jasa Dokter":    { icon: Stethoscope,  bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-200",    short: "Dokter"    },
  "Ambulans":       { icon: Truck,        bg: "bg-orange-50",  text: "text-orange-700",  ring: "ring-orange-200",  short: "Ambulans"  },
  "Lainnya":        { icon: MoreHorizontal, bg: "bg-slate-50", text: "text-slate-600",   ring: "ring-slate-200",   short: "Lainnya"   },
};

export const STATUS_CFG: Record<StatusTarif, { label: string; bg: string; text: string; dot: string }> = {
  "Aktif":     { label: "Aktif",     bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  "Non-Aktif": { label: "Non-Aktif", bg: "bg-slate-100",  text: "text-slate-600",  dot: "bg-slate-400"   },
  "Draft":     { label: "Draft",     bg: "bg-amber-50",   text: "text-amber-700",  dot: "bg-amber-400"   },
};

export const SATUAN_LIST = [
  "Per Tindakan", "Per Item", "Per Hari", "Per Paket", "Per Kali",
] as const;

export const UNIT_OPTIONS = [
  "IGD", "Rawat Inap", "ICU", "HCU",
  "Poli Umum", "Poli Jantung", "Poli Bedah", "Poli Anak",
  "Poli Penyakit Dalam", "Poli Paru", "Laboratorium", "Radiologi", "OK", "Farmasi",
];

export const STATUS_LIST: StatusTarif[] = ["Aktif", "Non-Aktif", "Draft"];

export function fmtIDR(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);
}

export function fmtIDRShort(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)} jt`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)} rb`;
  return String(n);
}

export function calcMarginPct(tarif: number, hpp: number): number {
  if (!hpp || hpp <= 0 || tarif <= 0) return 0;
  return Math.round(((tarif - hpp) / tarif) * 100);
}

export function calcDiffPct(base: number, compare: number): number {
  if (!base || base <= 0) return 0;
  return Math.round(((compare - base) / base) * 100);
}

export function isTarifValid(r: TarifRecord): boolean {
  return !!r.kode.trim() && !!r.nama.trim() && r.tarifUmum > 0;
}

export function calcPaketTotal(items: PaketItem[], tarifs: TarifRecord[]): number {
  return items.reduce((sum, item) => {
    const t = tarifs.find((x) => x.id === item.tarifId);
    return sum + (t ? t.tarifUmum * item.qty : 0);
  }, 0);
}
