// wilayahService — referensi Wilayah Kemendagri (read-only). Lazy per-level: picker
// memuat provinsi dulu, lalu anak per parentKode saat dibuka (hindari muat 91k sekaligus).

import * as defaultDal from "@/lib/dal/master/wilayahDal";
import type { WilayahQuery, WilayahDTO } from "@/lib/schemas/master/wilayah";

type Dal = typeof defaultDal;

// Anak terbanyak per satu parent: kec dalam kab (~50) / desa dalam kec (~100). 600 = aman.
const DEFAULT_LIMIT = 600;

interface WilayahEntity {
  kode: string;
  nama: string;
  level: number;
  parentKode: string | null;
  kodeFlat: string;
}

function toDTO(w: WilayahEntity): WilayahDTO {
  return { kode: w.kode, nama: w.nama, level: w.level, parentKode: w.parentKode, kodeFlat: w.kodeFlat };
}

/** Rantai kode leluhur (termasuk kode sendiri):
 *  "31.71.01.1001" → ["31","31.71","31.71.01","31.71.01.1001"]. */
function ancestorKodes(kode: string): string[] {
  const seg = kode.split(".");
  return seg.map((_, i) => seg.slice(0, i + 1).join("."));
}

export function makeWilayahService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  /** Statistik jumlah per level + total (header halaman Master). */
  async function stats(): Promise<{ byLevel: Record<number, number>; total: number }> {
    const rows = await dal.groupCountByLevel();
    const byLevel: Record<number, number> = {};
    let total = 0;
    for (const r of rows) {
      byLevel[r.level] = r._count._all;
      total += r._count._all;
    }
    return { byLevel, total };
  }

  async function list(query: WilayahQuery): Promise<WilayahDTO[]> {
    // Mode ancestors — untuk pre-select cascading picker dari kode tersimpan.
    if (query.ancestorsOf) {
      const rows = await dal.findByKodes(ancestorKodes(query.ancestorsOf));
      return rows.map(toDTO);
    }
    // Root default: tanpa parent & tanpa pencarian → provinsi (level 1).
    const level = query.level ?? (!query.parentKode && !query.q ? 1 : undefined);
    const rows = await dal.list({
      level,
      parentKode: query.parentKode,
      q: query.q,
      limit: query.limit ?? DEFAULT_LIMIT,
    });
    return rows.map(toDTO);
  }

  return { list, stats };
}

export const wilayahService = makeWilayahService();
