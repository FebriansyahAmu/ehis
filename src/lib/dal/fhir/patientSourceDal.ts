// patientSourceDal — baca pasien untuk resolve IHS SatuSehat (FH2). Prisma murni.
// Tulis hanya denormalisasi `Pasien.idSatusehat` (diisi Service HANYA untuk env prod).

import { Prisma } from "@/generated/prisma/client";
import { db, type Tx } from "@/lib/db/prisma";

const SELECT = {
  id: true, noRm: true, nama: true, gender: true, tanggalLahir: true, nikEnc: true,
  isAnonim: true, isWna: true, mergedIntoId: true, idSatusehat: true, tempatLahir: true,
} as const;

export function getPatient(id: string, tx?: Tx) {
  return db(tx).pasien.findFirst({ where: { id, deletedAt: null }, select: SELECT });
}

/**
 * Pasien + elemen tambahan untuk POST Patient (Playbook MPI): No. KK, kontak, status kawin, dan
 * alamat KTP beserta kode wilayah Kemendagri. Hanya alamat KTP — Dukcapil mencocokkan dengan KTP.
 */
export function getPatientForCreate(id: string, tx?: Tx) {
  return db(tx).pasien.findFirst({
    where: { id, deletedAt: null },
    select: {
      ...SELECT,
      noKkEnc: true, noHp: true, statusPerkawinan: true,
      alamat: {
        where: { jenis: "KTP" },
        take: 1,
        select: {
          alamat: true, rtRw: true, kodePos: true,
          provinsiKode: true, kotaKode: true, kotaNama: true, kecamatanKode: true, kelurahanKode: true,
        },
      },
    },
  });
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

/**
 * Kesiapan langkah 5 Prerequisites (Nomor IHS Pasien) per env: pasien aktif (bukan hasil merge),
 * yang bisa di-resolve via NIK (non-anonim, non-WNA, ber-NIK), dan yang sudah terpetakan.
 */
export async function countIhsReadiness(env: string, tx?: Tx) {
  const rows = await db(tx).$queryRaw<{ total: number; via_nik: number; terpetakan: number }[]>`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE p.is_anonim = false AND p.is_wna = false AND p.nik_enc IS NOT NULL)::int AS via_nik,
      count(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM fhir.resource_map m
        WHERE m.env = ${env} AND m.local_type = 'Patient' AND m.local_id = p.id::text
      ))::int AS terpetakan
    FROM pendaftaran.pasien p
    WHERE p.deleted_at IS NULL AND p.merged_into_id IS NULL`;
  return rows[0] ?? { total: 0, via_nik: 0, terpetakan: 0 };
}

export interface PrereqPatientRow {
  id: string;
  no_rm: string;
  nama: string;
  ada_nik: boolean;
  is_anonim: boolean;
  is_wna: boolean;
  ihs_id: string | null;
  last_sync_at: Date | null;
}

/**
 * Daftar pasien untuk konsol Prerequisites (langkah 5) + status peta Patient di env ini.
 * Cari nama (ILIKE) atau awalan No. RM; terbaru dulu; paginasi offset.
 */
export async function listForPrereq(
  env: string,
  f: { q?: string; status: "semua" | "terpetakan" | "belum"; page: number; pageSize: number },
  tx?: Tx,
) {
  const where: Prisma.Sql[] = [Prisma.sql`p.deleted_at IS NULL`, Prisma.sql`p.merged_into_id IS NULL`];
  if (f.q) {
    const esc = f.q.replace(/[\\%_]/g, (c) => `\\${c}`);
    where.push(Prisma.sql`(p.nama ILIKE ${`%${esc}%`} OR p.no_rm ILIKE ${`${esc}%`})`);
  }
  if (f.status === "terpetakan") where.push(Prisma.sql`m.id IS NOT NULL`);
  if (f.status === "belum") where.push(Prisma.sql`m.id IS NULL`);
  const whereSql = Prisma.join(where, " AND ");
  const from = Prisma.sql`
    FROM pendaftaran.pasien p
    LEFT JOIN fhir.resource_map m
      ON m.env = ${env} AND m.local_type = 'Patient' AND m.local_id = p.id::text`;

  const [count, rows] = await Promise.all([
    db(tx).$queryRaw<{ n: number }[]>`SELECT count(*)::int AS n ${from} WHERE ${whereSql}`,
    db(tx).$queryRaw<PrereqPatientRow[]>`
      SELECT p.id::text AS id, p.no_rm, p.nama, (p.nik_enc IS NOT NULL) AS ada_nik, p.is_anonim, p.is_wna,
             m.ihs_id, m.last_sync_at
      ${from}
      WHERE ${whereSql}
      ORDER BY p.created_at DESC
      LIMIT ${f.pageSize} OFFSET ${(f.page - 1) * f.pageSize}`,
  ]);
  return { total: count[0]?.n ?? 0, rows };
}

export function setIdSatusehat(id: string, ihsId: string, tx?: Tx) {
  return db(tx).pasien.update({ where: { id }, data: { idSatusehat: ihsId } });
}
