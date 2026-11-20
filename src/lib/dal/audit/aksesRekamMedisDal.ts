// DAL log akses BACA rekam medis — auth.akses_rekam_medis (append-only, lihat migrasi
// 20261121120000). SQL mentah ber-template (nilai selalu jadi parameter $n — aturan S4):
// upsert butuh ON CONFLICT + union array yang tak bisa diekspresikan Prisma upsert.

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/prisma";

export interface AksesUpsert {
  id: string;
  userId: string;
  pegawaiId: string | null;
  roles: string[];
  patientId: string | null;
  kunjunganId: string | null;
  subjectKey: string;
  unit: string | null;
  jalur: string;
  domains: string[];
  outcome: string;
  ipHash: string | null;
  bucketStart: Date;
  at: Date;
}

/** Insert, atau perbarui baris di jendela yang sama (last_at maju · hit_count+1 · domains ∪). */
export function upsert(e: AksesUpsert) {
  return db().$executeRaw`
    INSERT INTO "auth"."akses_rekam_medis"
      ("id","user_id","pegawai_id","roles","patient_id","kunjungan_id","subject_key","unit","jalur",
       "domains","outcome","ip_hash","bucket_start","first_at","last_at")
    VALUES
      (${e.id}::uuid, ${e.userId}::uuid, ${e.pegawaiId}::uuid, ${e.roles}::text[], ${e.patientId}::uuid,
       ${e.kunjunganId}::uuid, ${e.subjectKey}, ${e.unit}, ${e.jalur}, ${e.domains}::text[], ${e.outcome},
       ${e.ipHash}, ${e.bucketStart}, ${e.at}, ${e.at})
    ON CONFLICT ("user_id","subject_key","bucket_start","outcome") DO UPDATE SET
      "last_at" = GREATEST("akses_rekam_medis"."last_at", EXCLUDED."last_at"),
      "hit_count" = "akses_rekam_medis"."hit_count" + 1,
      "domains" = ARRAY(
        SELECT DISTINCT d FROM unnest("akses_rekam_medis"."domains" || EXCLUDED."domains") AS d ORDER BY d
      )
  `;
}

/** Subjek ringan untuk log: pasien + unit dari kunjungan (dipakai bila rute hanya tahu kunjunganId). */
export async function findKunjunganSubject(kunjunganId: string) {
  const rows = await db().$queryRaw<{ patient_id: string; unit: string }[]>`
    SELECT "patient_id", "unit"::text AS "unit" FROM "encounter"."kunjungan" WHERE "id" = ${kunjunganId}::uuid LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findPasienByNoRm(noRm: string) {
  const rows = await db().$queryRaw<{ id: string; no_rm: string; nama: string }[]>`
    SELECT "id", "no_rm", "nama" FROM "pendaftaran"."pasien" WHERE "no_rm" = ${noRm} LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findPegawai(id: string) {
  const rows = await db().$queryRaw<{ id: string; nama_lengkap: string; nip: string | null }[]>`
    SELECT "id", "nama_lengkap", "nip" FROM "master"."pegawai" WHERE "id" = ${id}::uuid LIMIT 1
  `;
  return rows[0] ?? null;
}

export function searchPegawai(q: string, limit = 10) {
  const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  return db().$queryRaw<{ id: string; nama_lengkap: string; nip: string | null }[]>`
    SELECT "id", "nama_lengkap", "nip" FROM "master"."pegawai"
     WHERE "nama_lengkap" ILIKE ${like} OR "nip" ILIKE ${like}
     ORDER BY "nama_lengkap" LIMIT ${limit}
  `;
}

export interface AksesRow {
  id: string;
  first_at: Date;
  last_at: Date;
  hit_count: number;
  outcome: string;
  jalur: string;
  domains: string[];
  unit: string | null;
  roles: string[];
  pegawai_id: string | null;
  pegawai_nama: string | null;
  pegawai_nip: string | null;
  patient_id: string | null;
  no_rm: string | null;
  pasien_nama: string | null;
  kunjungan_id: string | null;
  no_kunjungan: string | null;
}

export interface AksesListFilter {
  patientId?: string;
  pegawaiId?: string;
  dari?: Date;
  sampai?: Date; // eksklusif
  cursor?: { lastAt: Date; id: string };
  limit: number;
}

/** Daftar terbaru dulu (last_at DESC, id DESC) + keyset pagination. Ambil limit+1 utk deteksi halaman berikut. */
export function list(f: AksesListFilter) {
  const where: Prisma.Sql[] = [];
  if (f.patientId) where.push(Prisma.sql`a."patient_id" = ${f.patientId}::uuid`);
  if (f.pegawaiId) where.push(Prisma.sql`a."pegawai_id" = ${f.pegawaiId}::uuid`);
  if (f.dari) where.push(Prisma.sql`a."last_at" >= ${f.dari}`);
  if (f.sampai) where.push(Prisma.sql`a."last_at" < ${f.sampai}`);
  if (f.cursor) where.push(Prisma.sql`(a."last_at", a."id") < (${f.cursor.lastAt}, ${f.cursor.id}::uuid)`);
  const whereSql = where.length ? Prisma.sql`WHERE ${Prisma.join(where, " AND ")}` : Prisma.empty;

  return db().$queryRaw<AksesRow[]>`
    SELECT a."id", a."first_at", a."last_at", a."hit_count", a."outcome", a."jalur", a."domains", a."unit", a."roles",
           a."pegawai_id", pg."nama_lengkap" AS "pegawai_nama", pg."nip" AS "pegawai_nip",
           a."patient_id", ps."no_rm", ps."nama" AS "pasien_nama",
           a."kunjungan_id", k."no_kunjungan"
      FROM "auth"."akses_rekam_medis" a
      LEFT JOIN "master"."pegawai" pg ON pg."id" = a."pegawai_id"
      LEFT JOIN "pendaftaran"."pasien" ps ON ps."id" = a."patient_id"
      LEFT JOIN "encounter"."kunjungan" k ON k."id" = a."kunjungan_id"
      ${whereSql}
     ORDER BY a."last_at" DESC, a."id" DESC
     LIMIT ${f.limit + 1}
  `;
}
