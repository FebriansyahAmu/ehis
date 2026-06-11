import type { TindakanRecord } from "@/lib/master/tindakanMock";
import type { TindakanDTO } from "@/lib/schemas/master/tindakan";
import type { AnyNode, LocationNode, LocationType } from "@/components/master/ruangan/ruanganShared";

// ── Types ─────────────────────────────────────────────────

/** Map tindakanId → array of unit kode yang boleh lakukan tindakan ini */
export type LayananMap = Record<string, string[]>;

/** Kolom matrix Layanan Unit — diturunkan dari Location (Ruangan) master. */
export interface LayananUnit {
  kode: string;
  nama: string;
  short: string;
  category: "Klinis" | "Poli" | "Penunjang";
}

/** Warna per jenis unit — dipakai header kolom matrix + panel tree filter (sumber tunggal). */
export const UNIT_CATEGORY_CFG: Record<
  LayananUnit["category"],
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  Klinis:    { label: "Klinis",    bg: "bg-rose-50",   text: "text-rose-700",   border: "border-rose-200",   dot: "bg-rose-500" },
  Poli:      { label: "Poli",      bg: "bg-sky-50",    text: "text-sky-700",    border: "border-sky-200",    dot: "bg-sky-500" },
  Penunjang: { label: "Penunjang", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", dot: "bg-violet-500" },
};

export const UNIT_CATEGORY_ORDER: LayananUnit["category"][] = ["Klinis", "Poli", "Penunjang"];

// ── Derive dari master ────────────────────────────────────

function unitCategory(lt: LocationType): LayananUnit["category"] {
  if (lt === "Rawat_Jalan") return "Poli";
  if (lt === "Penunjang") return "Penunjang";
  return "Klinis"; // IGD/ICU/HCU/Isolasi/Rawat_Inap/OK
}

// Label kolom sempit: pakai kode bila ringkas, else inisial nama.
function unitShort(kode: string, nama: string): string {
  if (kode && kode.length <= 9) return kode;
  return nama.split(/\s+/).map((w) => w[0] ?? "").join("").slice(0, 5).toUpperCase();
}

/**
 * Kolom unit = Location (Ruangan) AKTIF dari tree master Unit & Ruangan — selaras
 * pola SDM Assignment (`ruanganFromTree`). Organization (Unit) & Bed tidak masuk.
 */
export function unitsFromTree(tree: AnyNode[]): LayananUnit[] {
  return tree
    .filter((n): n is LocationNode => n.type === "Location" && n.active !== false)
    .map((n) => ({
      kode: n.kode,
      nama: n.name,
      short: unitShort(n.kode, n.name),
      category: unitCategory(n.locationType),
    }))
    .sort((a, b) => a.nama.localeCompare(b.nama, "id"));
}

/** DTO katalog tindakan (API) → TindakanRecord FE (narrow spesialisDefault). */
export function tindakanRecordsFromDTO(dtos: TindakanDTO[]): TindakanRecord[] {
  return dtos.map((d) => ({
    ...d,
    nomorKptl: d.nomorKptl ?? null,
    kompleksitas: d.kompleksitas ?? null,
    spesialisDefault: d.spesialisDefault as TindakanRecord["spesialisDefault"],
  }));
}

// ── Helpers ───────────────────────────────────────────────

/**
 * Default: tiap tindakan tersedia di unit yang ada di `unitDefault`-nya (dari katalog).
 * `validUnitKodes` (bila ada) menyaring ke kode kolom yang benar-benar ada di matrix —
 * cegah kode yatim (unitDefault katalog ≠ kode Location) mengotori statistik granted.
 */
export function initLayananMap(tindakan: TindakanRecord[], validUnitKodes?: Set<string>): LayananMap {
  const map: LayananMap = {};
  for (const t of tindakan) {
    map[t.id] = validUnitKodes
      ? t.unitDefault.filter((k) => validUnitKodes.has(k))
      : [...t.unitDefault];
  }
  return map;
}

export function hasLayanan(map: LayananMap, tindakanId: string, unitKode: string): boolean {
  return (map[tindakanId] ?? []).includes(unitKode);
}

export function countUnitPerTindakan(map: LayananMap, tindakanId: string): number {
  return (map[tindakanId] ?? []).length;
}

export function countTindakanPerUnit(map: LayananMap, unitKode: string): number {
  return Object.values(map).filter((arr) => arr.includes(unitKode)).length;
}

export function countAllLayanan(map: LayananMap): number {
  return Object.values(map).reduce((sum, arr) => sum + arr.length, 0);
}
