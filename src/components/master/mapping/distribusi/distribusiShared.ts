import { type ObatRecord } from "@/lib/master/obatMock";
import { DEPO_MOCK, type DepoRecord } from "@/lib/master/depoMock";

// ── Types ─────────────────────────────────────────────────

export interface StokCell {
  /** Stok current */
  stok: number;
  /** Reorder point (minimum) */
  min: number;
  /** Stok max kapasitas */
  max: number;
}

/**
 * map[depoId][obatId] → StokCell | undefined
 * undefined = obat tidak di-stock di depo ini.
 */
export type DistribusiMap = Record<string, Record<string, StokCell | undefined>>;

export type StokStatus = "Habis" | "Kritis" | "Rendah" | "Aman" | "Penuh" | "TidakStock";

// ── Helpers ───────────────────────────────────────────────
// Obat di-fetch dari DB via `fetchAllObat()` di pane (bukan lagi mock).

export function getDepoList(): DepoRecord[] {
  return DEPO_MOCK;
}

/**
 * Default rules:
 * - Gudang Pusat → stock SEMUA obat (level 80% kapasitas)
 * - Depo IGD → emergency drugs (Resusitasi, HAM, antibiotik IV)
 * - Depo ICU → HAM + sedatives + critical care
 * - Depo OK → anestesi + analgesik kuat + HAM
 * - Apotek RI → semua kecuali specialized OK only
 * - Apotek RJ → oral & inhaler / non-emergency
 */
const KAPASITAS_BY_TIPE: Record<string, { max: number; min: number; level: number }> = {
  "depo-001": { max: 1000, min: 200, level: 0.8 }, // Gudang
  "depo-002": { max: 80,   min: 20,  level: 0.65 }, // IGD
  "depo-003": { max: 60,   min: 15,  level: 0.7  }, // ICU
  "depo-004": { max: 50,   min: 10,  level: 0.6  }, // OK
  "depo-005": { max: 200,  min: 40,  level: 0.7  }, // Apotek RI
  "depo-006": { max: 150,  min: 30,  level: 0.65 }, // Apotek RJ
};

function shouldStockInDepo(obat: ObatRecord, depoId: string): boolean {
  switch (depoId) {
    case "depo-001": return true; // Gudang stock all
    case "depo-002": // IGD
      return obat.kategori === "Antibiotik" ||
             (obat.kategori === "Analgesik" && obat.bentuk === "Injeksi") ||
             obat.kategori === "Kardiovaskular" ||
             obat.kategori === "Saluran_Nafas" ||
             obat.kategori === "Vitamin_Cairan" ||
             obat.namaGenerik.toLowerCase().includes("ondansetron") ||
             obat.isHAM;
    case "depo-003": // ICU
      return obat.isHAM ||
             obat.kategori === "Kardiovaskular" ||
             obat.kategori === "Saluran_Nafas" ||
             obat.kategori === "Vitamin_Cairan" ||
             obat.kategori === "Neurologi" ||
             obat.kategori === "Antibiotik";
    case "depo-004": // OK
      return obat.isHAM ||
             (obat.kategori === "Analgesik" && obat.bentuk === "Injeksi") ||
             obat.kategori === "Neurologi" ||
             obat.kategori === "Vitamin_Cairan" ||
             obat.kategori === "Antibiotik";
    case "depo-005": // Apotek RI
      return obat.kategori !== "Saluran_Nafas" || obat.bentuk !== "Inhaler" || true; // all
    case "depo-006": // Apotek RJ
      return obat.bentuk === "Tablet" ||
             obat.bentuk === "Kapsul" ||
             obat.bentuk === "Sirup" ||
             obat.bentuk === "Inhaler" ||
             obat.bentuk === "Salep";
    default: return false;
  }
}

export function initDistribusiMap(
  obat: ObatRecord[],
  depo: DepoRecord[],
): DistribusiMap {
  const map: DistribusiMap = {};
  for (const d of depo) {
    map[d.id] = {};
    const cap = KAPASITAS_BY_TIPE[d.id] ?? { max: 100, min: 20, level: 0.7 };
    for (const o of obat) {
      if (shouldStockInDepo(o, d.id)) {
        const stok = Math.round(cap.max * cap.level * (0.6 + Math.random() * 0.6));
        map[d.id][o.id] = {
          stok: Math.min(stok, cap.max),
          min: cap.min,
          max: cap.max,
        };
      } else {
        map[d.id][o.id] = undefined;
      }
    }
  }
  return map;
}

export function getCell(
  map: DistribusiMap,
  depoId: string,
  obatId: string,
): StokCell | undefined {
  return map[depoId]?.[obatId];
}

export function getStokStatus(cell: StokCell | undefined): StokStatus {
  if (!cell) return "TidakStock";
  if (cell.stok <= 0) return "Habis";
  if (cell.stok <= cell.min * 0.5) return "Kritis";
  if (cell.stok <= cell.min) return "Rendah";
  if (cell.stok >= cell.max * 0.9) return "Penuh";
  return "Aman";
}

export const STOK_STATUS_CFG: Record<
  StokStatus,
  { label: string; bg: string; text: string; dot: string; ring: string }
> = {
  Habis:      { label: "Habis",          bg: "bg-rose-100",   text: "text-rose-800",   dot: "bg-rose-600",   ring: "ring-rose-300" },
  Kritis:     { label: "Kritis",         bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500", ring: "ring-orange-300" },
  Rendah:     { label: "Stok Rendah",    bg: "bg-amber-100",  text: "text-amber-800",  dot: "bg-amber-500",  ring: "ring-amber-300" },
  Aman:       { label: "Aman",           bg: "bg-emerald-100",text: "text-emerald-800",dot: "bg-emerald-500",ring: "ring-emerald-300" },
  Penuh:      { label: "Hampir Penuh",   bg: "bg-sky-100",    text: "text-sky-800",    dot: "bg-sky-500",    ring: "ring-sky-300" },
  TidakStock: { label: "Tidak Stock",    bg: "bg-slate-50",   text: "text-slate-400",  dot: "bg-slate-300",  ring: "ring-slate-200" },
};

export function toggleStock(
  map: DistribusiMap,
  depoId: string,
  obatId: string,
): DistribusiMap {
  const next: DistribusiMap = { ...map };
  next[depoId] = { ...(next[depoId] ?? {}) };
  const current = next[depoId][obatId];
  if (current) {
    next[depoId][obatId] = undefined;
  } else {
    const cap = KAPASITAS_BY_TIPE[depoId] ?? { max: 100, min: 20, level: 0.7 };
    next[depoId][obatId] = { stok: Math.round(cap.max * cap.level), min: cap.min, max: cap.max };
  }
  return next;
}

export function setStock(
  map: DistribusiMap,
  depoId: string,
  obatId: string,
  patch: Partial<StokCell>,
): DistribusiMap {
  const next: DistribusiMap = { ...map };
  next[depoId] = { ...(next[depoId] ?? {}) };
  const current = next[depoId][obatId];
  if (!current) return map;
  next[depoId][obatId] = { ...current, ...patch };
  return next;
}

export function calcStats(map: DistribusiMap, depoId: string) {
  const cells = Object.values(map[depoId] ?? {});
  const stocked = cells.filter((c): c is StokCell => !!c);
  let kritis = 0, rendah = 0, aman = 0, penuh = 0;
  for (const c of stocked) {
    const s = getStokStatus(c);
    if (s === "Habis" || s === "Kritis") kritis++;
    else if (s === "Rendah") rendah++;
    else if (s === "Penuh") penuh++;
    else aman++;
  }
  return { totalItems: stocked.length, kritis, rendah, aman, penuh };
}
