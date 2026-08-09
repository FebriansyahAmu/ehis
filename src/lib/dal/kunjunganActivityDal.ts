// kunjunganActivityDal — hitung aktivitas klinis per kunjungan untuk guard "Batalkan Kunjungan".
// Kunjungan hanya boleh dibatalkan bila BELUM ada rekam medis / tindakan / order (semua 0).
// Baris soft-deleted (deletedAt) tak dihitung; Observation append-only (tanpa soft-delete).
// Prisma murni, tanpa aturan bisnis. Terima `tx?`.

import { db, type Tx } from "@/lib/db/prisma";

/** Hitungan aktivitas klinis per kategori (indikator "kunjungan sudah dipakai klinis"). */
export interface ClinicalActivityCounts {
  diagnosa: number;   // rekam medis — Diagnosa (ICD-10)
  cppt: number;       // rekam medis — CPPT (catatan terintegrasi)
  observasi: number;  // rekam medis — Observasi/TTV
  tindakan: number;   // TindakanMedis
  resep: number;      // order — Resep
  lab: number;        // order — Laboratorium
  rad: number;        // order — Radiologi
}

/** Hitung seluruh kategori aktivitas klinis untuk 1 kunjungan (paralel). */
export async function countClinicalActivity(kunjunganId: string, tx?: Tx): Promise<ClinicalActivityCounts> {
  const d = db(tx);
  const active = { kunjunganId, deletedAt: null } as const;
  const [diagnosa, cppt, observasi, tindakan, resep, lab, rad] = await Promise.all([
    d.diagnosa.count({ where: active }),
    d.cppt.count({ where: active }),
    d.observation.count({ where: { kunjunganId } }), // append-only, tanpa deletedAt
    d.tindakanMedis.count({ where: active }),
    d.resepOrder.count({ where: active }),
    d.labOrder.count({ where: active }),
    d.radOrder.count({ where: active }),
  ]);
  return { diagnosa, cppt, observasi, tindakan, resep, lab, rad };
}

/** Total baris aktivitas (0 = kunjungan masih "bersih" → boleh dibatalkan). */
export function totalActivity(c: ClinicalActivityCounts): number {
  return c.diagnosa + c.cppt + c.observasi + c.tindakan + c.resep + c.lab + c.rad;
}
