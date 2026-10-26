// patientSourceDal — baca pasien untuk resolve IHS SatuSehat (FH2). Prisma murni.
// Tulis hanya denormalisasi `Pasien.idSatusehat` (diisi Service HANYA untuk env prod).

import { db, type Tx } from "@/lib/db/prisma";

const SELECT = {
  id: true, noRm: true, nama: true, gender: true, tanggalLahir: true, nikEnc: true,
  isAnonim: true, isWna: true, mergedIntoId: true, idSatusehat: true,
} as const;

export function getPatient(id: string, tx?: Tx) {
  return db(tx).pasien.findFirst({ where: { id, deletedAt: null }, select: SELECT });
}

/**
 * Pasien yang BELUM punya peta Patient di env ini — kandidat batch resolve. Hanya yang
 * bisa di-resolve via NIK: non-anonim, non-WNA, ber-NIK, bukan hasil merge. Terbaru dulu
 * (pasien aktif lebih mungkin segera butuh Encounter).
 */
export async function listUnresolved(env: string, limit: number, tx?: Tx) {
  const rows = await db(tx).$queryRaw<{ id: string }[]>`
    SELECT p.id::text AS id
    FROM pendaftaran.pasien p
    WHERE p.deleted_at IS NULL
      AND p.is_anonim = false
      AND p.is_wna = false
      AND p.nik_enc IS NOT NULL
      AND p.merged_into_id IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM fhir.resource_map m
        WHERE m.env = ${env} AND m.local_type = 'Patient' AND m.local_id = p.id::text
      )
    ORDER BY p.created_at DESC
    LIMIT ${limit}`;
  if (!rows.length) return [];
  return db(tx).pasien.findMany({ where: { id: { in: rows.map((r) => r.id) } }, select: SELECT });
}

export function setIdSatusehat(id: string, ihsId: string, tx?: Tx) {
  return db(tx).pasien.update({ where: { id }, data: { idSatusehat: ihsId } });
}
