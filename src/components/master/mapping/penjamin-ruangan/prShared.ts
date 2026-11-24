// Helper bersama Penjamin × Ruangan: lokasi (Ruangan tree), label/ikon jenis ruangan, kategori kode
// penjamin, dan perhitungan cakupan (kode penjamin yang sudah punya ≥ 1 mapping aktif).

import {
  Activity, BedDouble, Building2, FlaskConical, HeartPulse, Package, Pill, Radiation, Scissors,
  ShieldAlert, Siren, Stethoscope, type LucideIcon,
} from "lucide-react";
import type { MappingRuanganRecord, PenjaminKelas, PenjaminRecord } from "@/lib/master/penjaminStore";
import { RUANGAN_MOCK, type LocationNode } from "@/components/master/ruangan/ruanganShared";

/** Ruangan (Location) terdaftar dari tree Unit & Ruangan. */
export const LOCATIONS: LocationNode[] = RUANGAN_MOCK.filter((n): n is LocationNode => n.type === "Location");
export const LOC_BY_ID = new Map(LOCATIONS.map((l) => [l.id, l]));

export const LOC_TYPE: Record<string, { label: string; icon: LucideIcon }> = {
  IGD: { label: "IGD", icon: Siren },
  Rawat_Inap: { label: "Rawat Inap", icon: BedDouble },
  Rawat_Jalan: { label: "Rawat Jalan", icon: Stethoscope },
  ICU: { label: "ICU", icon: HeartPulse },
  HCU: { label: "HCU", icon: Activity },
  Isolasi: { label: "Isolasi", icon: ShieldAlert },
  OK: { label: "Kamar Operasi", icon: Scissors },
  Laboratorium: { label: "Laboratorium", icon: FlaskConical },
  Radiologi: { label: "Radiologi", icon: Radiation },
  Farmasi: { label: "Farmasi", icon: Pill },
  Gudang_Farmasi: { label: "Gudang Farmasi", icon: Package },
};
export const locType = (t: string) => LOC_TYPE[t] ?? { label: t.replace(/_/g, " "), icon: Building2 };

export const kelasLokasi = (l: LocationNode) => (l.kelas && l.kelas !== "—" ? l.kelas.replace("_", " ") : null);

/** "Spesialis_Dasar" → "Spesialis dasar"; tanpa kategori → "Lainnya". */
export const kategoriLabel = (k?: string) =>
  k ? k.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()).replace(/ (\w)/g, (_, c: string) => ` ${c.toLowerCase()}`) : "Lainnya";

/** Kode penjamin dikelompokkan per kategori (urutan kemunculan dipertahankan). */
export function groupByKategori(kelas: PenjaminKelas[]): { kategori: string; items: PenjaminKelas[] }[] {
  const map = new Map<string, PenjaminKelas[]>();
  for (const k of kelas) {
    const key = kategoriLabel(k.kategori);
    map.set(key, [...(map.get(key) ?? []), k]);
  }
  return [...map.entries()].map(([kategori, items]) => ({ kategori, items }));
}

/** Kode penjamin berstatus "terpetakan" = punya ≥ 1 mapping AKTIF. */
export function coverageOf(p: PenjaminRecord, mappings: MappingRuanganRecord[]): { mapped: number; total: number } {
  const aktif = new Set(mappings.filter((m) => m.penjaminId === p.id && m.status === "Aktif").map((m) => m.penjaminKelasId));
  return { mapped: p.kelas.filter((k) => aktif.has(k.id)).length, total: p.kelas.length };
}

export const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100));
