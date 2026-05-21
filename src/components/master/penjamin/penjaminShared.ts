import {
  ShieldCheck, Wallet, Building2, Landmark, Briefcase,
  type LucideIcon,
} from "lucide-react";
import type {
  PenjaminRecord, PenjaminTipe, StatusPenjamin, SkemaPembayaran,
  TipeFaskesBPJS, PenjaminKontak, PenjaminCoverage,
} from "@/lib/master/penjaminStore";

// ── Lists ─────────────────────────────────────────────────

export const TIPE_LIST: PenjaminTipe[] = ["Umum", "BPJS", "Asuransi_Swasta", "Jamkesda"];

export const STATUS_LIST: StatusPenjamin[] = ["Aktif", "Non_Aktif", "Suspended"];

export const SKEMA_LIST: SkemaPembayaran[] = [
  "INA_CBG", "Fee_For_Service", "Per_Diem", "Hybrid",
];

export const TIPE_FASKES_BPJS_LIST: TipeFaskesBPJS[] = ["TKP", "FKTP", "FKRTL"];

export const TARIF_GROUP_LIST = ["Umum", "BPJS", "Asuransi"] as const;

// ── Config Maps ───────────────────────────────────────────

export interface TipeCfg {
  label: string;
  short: string;
  icon: LucideIcon;
  bg: string;
  text: string;
  ring: string;
  dot: string;
}

export const TIPE_CFG: Record<PenjaminTipe, TipeCfg> = {
  Umum:            { label: "Umum / Pribadi",     short: "UMUM",     icon: Wallet,      bg: "bg-slate-50",   text: "text-slate-700",   ring: "ring-slate-200",   dot: "bg-slate-500"   },
  BPJS:            { label: "BPJS Kesehatan",     short: "BPJS",     icon: ShieldCheck, bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-500" },
  Asuransi_Swasta: { label: "Asuransi Swasta",    short: "ASURANSI", icon: Briefcase,   bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-200",     dot: "bg-sky-500"     },
  Jamkesda:        { label: "Jamkesda / Daerah",  short: "JAMKESDA", icon: Landmark,    bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200",   dot: "bg-amber-500"   },
};

export const STATUS_CFG: Record<StatusPenjamin, { label: string; bg: string; text: string; dot: string; ring: string }> = {
  Aktif:     { label: "Aktif",     bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  Non_Aktif: { label: "Non-Aktif", bg: "bg-slate-100",  text: "text-slate-600",   dot: "bg-slate-400",   ring: "ring-slate-200"   },
  Suspended: { label: "Ditangguhkan", bg: "bg-amber-50", text: "text-amber-700",  dot: "bg-amber-400",   ring: "ring-amber-200"   },
};

export const SKEMA_CFG: Record<SkemaPembayaran, { label: string; desc: string }> = {
  INA_CBG:         { label: "INA-CBG",          desc: "Paket tarif nasional per diagnosis (BPJS)" },
  Fee_For_Service: { label: "Fee-for-Service",  desc: "Per item layanan / tindakan" },
  Per_Diem:        { label: "Per Diem",         desc: "Tarif harian flat" },
  Hybrid:          { label: "Hybrid",           desc: "Kombinasi INA-CBG + FFS" },
};

// ── Helpers ───────────────────────────────────────────────

export function fmtRupiah(n: number): string {
  if (!n || n === 0) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(n);
}

export function fmtRupiahShort(n: number): string {
  if (!n || n === 0) return "—";
  if (n >= 1_000_000_000) {
    const v = n / 1_000_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)} M`;
  }
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)} jt`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)} rb`;
  return String(n);
}

export function fmtDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function getKontrakStatus(end?: string): { label: string; tone: "valid" | "soon" | "expired"; days: number } {
  if (!end) return { label: "Tanpa Periode", tone: "valid", days: 0 };
  const today = new Date();
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - today.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0)  return { label: `Berakhir ${Math.abs(days)} hr`, tone: "expired", days };
  if (days < 90) return { label: `${days} hr lagi`,                tone: "soon",    days };
  return { label: `${days} hari`, tone: "valid", days };
}

export function countCoverage(c: PenjaminCoverage): number {
  return [c.rawatInap, c.rawatJalan, c.igd, c.laboratorium, c.radiologi, c.farmasi, c.tindakan, c.ambulans]
    .filter(Boolean).length;
}

export const COVERAGE_KEYS: { key: keyof PenjaminCoverage; label: string; icon: LucideIcon }[] = [
  // populated lazily by consuming components — icons imported there to avoid cycle
  // (placeholder typed list — kept for shape stability)
] as { key: keyof PenjaminCoverage; label: string; icon: LucideIcon }[];

export function penjaminInitials(nama: string): string {
  const parts = nama.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function isPenjaminValid(r: PenjaminRecord): boolean {
  return !!r.kode.trim() && !!r.nama.trim();
}

// ── Empty factories ───────────────────────────────────────

export function emptyKontak(): PenjaminKontak {
  return { picNama: "", picTelp: "", picEmail: "", alamatKantor: "", kota: "" };
}

export function emptyCoverage(): PenjaminCoverage {
  return {
    rawatInap: true, rawatJalan: true, igd: true,
    laboratorium: true, radiologi: true, farmasi: true,
    tindakan: true, ambulans: false,
  };
}

export function emptyPenjamin(tipe: PenjaminTipe = "Asuransi_Swasta"): PenjaminRecord {
  return {
    id: `pj-${Date.now()}`,
    kode: "",
    nama: "",
    tipe,
    status: "Aktif",
    kelas: [],
    kontak: emptyKontak(),
    coverage: emptyCoverage(),
  };
}

// ── Re-exports ────────────────────────────────────────────

export { Building2 };
