// auditDal — `fhir.fhir_audit_log` + `fhir.fhir_audit_payload` (FH0 · log pengiriman 2026-11-21).
// Tanpa aturan bisnis. PII sudah dimasker/di-hash & body sudah dienkripsi di Service (auditedFhirCall).
//
// SQL mentah ber-parameter (Prisma.sql) — kolom log pengiriman ditulis tanpa bergantung pada klien
// Prisma ter-generate ulang, dan query daftar memakai bentuk yang dilayani index (keyset, UNION ALL).

import { Prisma } from "@/generated/prisma/client";
import { db, type Tx } from "@/lib/db/prisma";
import { uuidv7 } from "@/lib/db/uuidv7";

export interface FhirAuditInsert {
  startedAt: Date;
  mode: string;
  target: string;
  endpoint: string;
  method: string;
  resourceType?: string | null;
  ihsId?: string | null;
  requestHash?: string | null;
  responseStatus: string;
  success: boolean;
  durationMs: number;
  errorType?: string | null;
  retryCount?: number;
  nikHash?: string | null;
  actor: string;
  actorRole: string;
  idempotencyKey?: string | null;
  localType?: string | null;
  localId?: string | null;
  kunjunganId?: string | null;
  localRefs?: string[] | null;
  requestPath?: string | null;
}

/** Body sudah tersegel (terenkripsi). */
export interface FhirAuditPayloadInsert {
  requestEnc: string | null;
  responseEnc: string | null;
  requestBytes: number | null;
  responseBytes: number | null;
  truncated: boolean;
}

/** 1 baris audit (+ isi bila ada) dalam SATU pernyataan → atomik & 1 round-trip. */
export async function insertAudit(data: FhirAuditInsert, payload?: FhirAuditPayloadInsert | null, tx?: Tx): Promise<string> {
  const id = uuidv7();
  const audit = Prisma.sql`
    INSERT INTO "fhir"."fhir_audit_log" (
      "id", "started_at", "mode", "target", "endpoint", "method", "resource_type", "ihs_id", "request_hash",
      "response_status", "success", "duration_ms", "error_type", "retry_count", "nik_hash", "actor", "actor_role",
      "idempotency_key", "local_type", "local_id", "kunjungan_id", "local_refs", "request_path"
    ) VALUES (
      ${id}::uuid, ${data.startedAt}, ${data.mode}, ${data.target}, ${data.endpoint}, ${data.method},
      ${data.resourceType ?? null}, ${data.ihsId ?? null}, ${data.requestHash ?? null},
      ${data.responseStatus}, ${data.success}, ${data.durationMs}, ${data.errorType ?? null}, ${data.retryCount ?? 0},
      ${data.nikHash ?? null}, ${data.actor}, ${data.actorRole}, ${data.idempotencyKey ?? null},
      ${data.localType ?? null}, ${data.localId ?? null}, ${data.kunjunganId ?? null}::uuid,
      ${data.localRefs?.length ? data.localRefs : null}::text[], ${data.requestPath ?? null}
    )`;

  if (!payload) {
    await db(tx).$executeRaw`${audit}`;
    return id;
  }
  await db(tx).$executeRaw`
    WITH a AS (${audit} RETURNING "id")
    INSERT INTO "fhir"."fhir_audit_payload" ("audit_id", "request_enc", "response_enc", "request_bytes", "response_bytes", "truncated")
    SELECT a."id", ${payload.requestEnc}, ${payload.responseEnc}, ${payload.requestBytes}, ${payload.responseBytes}, ${payload.truncated}
      FROM a`;
  return id;
}

/** Ringkas N panggilan terakhir (panel status) — tanpa kolom hash. */
export function listRecent(limit = 20, tx?: Tx) {
  return db(tx).fhirAuditLog.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
    select: {
      id: true, startedAt: true, mode: true, target: true, endpoint: true, method: true,
      resourceType: true, responseStatus: true, success: true, durationMs: true, errorType: true, actor: true,
    },
  });
}

// ── Log pengiriman per data ─────────────────────────────────

export interface SendLogTarget {
  mode: string;
  localType: string;
  localId: string;
  /** Resource klinis: ikutkan Bundle transaction kunjungan ini yang MEMUAT data tsb. */
  kunjunganId?: string | null;
}

export interface SendLogRow {
  id: string;
  started_at: Date;
  target: string;
  endpoint: string;
  request_path: string | null;
  method: string;
  resource_type: string | null;
  ihs_id: string | null;
  response_status: string;
  success: boolean;
  duration_ms: number;
  error_type: string | null;
  retry_count: number;
  actor: string;
  actor_nama: string | null;
  local_type: string | null;
  local_id: string | null;
  kunjungan_id: string | null;
  /** 1-based; null = panggilan langsung (bukan entry Bundle). */
  entry_index: number | null;
  entry_count: number | null;
  has_body: boolean;
}

const ROW_COLS = Prisma.sql`
  l."id", l."started_at", l."target", l."endpoint", l."request_path", l."method", l."resource_type", l."ihs_id",
  l."response_status", l."success", l."duration_ms", l."error_type", l."retry_count", l."actor",
  l."local_type", l."local_id", l."kunjungan_id", l."local_refs"`;

/** Panggilan untuk 1 data: milik sendiri ∪ Bundle kunjungan yang memuatnya. Ambil limit+1 (deteksi halaman berikut). */
function targetUnion(t: SendLogTarget, cursor: { at: Date; id: string } | undefined, take: number | null): Prisma.Sql {
  const ks = cursor ? Prisma.sql`AND (l."started_at", l."id") < (${cursor.at}, ${cursor.id}::uuid)` : Prisma.empty;
  const lim = take === null ? Prisma.empty : Prisma.sql`ORDER BY l."started_at" DESC, l."id" DESC LIMIT ${take}`;
  // Tiap cabang = index scan terurut sendiri (local_idx / kunjungan_idx) + LIMIT; UNION ALL aman karena
  // cabang disjoint (baris Bundle ber-local_type 'Bundle', baris data ber-local_type data itu).
  const own = Prisma.sql`(
    SELECT ${ROW_COLS} FROM "fhir"."fhir_audit_log" l
     WHERE l."mode" = ${t.mode} AND l."local_type" = ${t.localType} AND l."local_id" = ${t.localId} ${ks}
     ${lim})`;
  if (!t.kunjunganId) return own;
  const bundle = Prisma.sql`(
    SELECT ${ROW_COLS} FROM "fhir"."fhir_audit_log" l
     WHERE l."mode" = ${t.mode} AND l."kunjungan_id" = ${t.kunjunganId}::uuid AND l."local_type" = 'Bundle'
       AND ${`${t.localType}|${t.localId}`} = ANY (l."local_refs") ${ks}
     ${lim})`;
  return Prisma.sql`${own} UNION ALL ${bundle}`;
}

/**
 * Halaman log (terbaru dulu, keyset `(started_at, id)`) — stabil walau ada panggilan baru masuk,
 * biaya tetap per halaman (tanpa OFFSET). Nama aktor di-resolve via PK users (cast di sisi actor).
 */
export function listForTarget(t: SendLogTarget, f: { cursor?: { at: Date; id: string }; limit: number }, tx?: Tx) {
  const key = `${t.localType}|${t.localId}`;
  return db(tx).$queryRaw<SendLogRow[]>`
    SELECT u."id"::text AS "id", u."started_at", u."target", u."endpoint", u."request_path", u."method", u."resource_type",
           u."ihs_id", u."response_status", u."success", u."duration_ms", u."error_type", u."retry_count", u."actor",
           COALESCE(pg."nama_lengkap", us."username"::text) AS "actor_nama",
           u."local_type", u."local_id", u."kunjungan_id"::text AS "kunjungan_id",
           array_position(u."local_refs", ${key}) AS "entry_index",
           cardinality(u."local_refs") AS "entry_count",
           (p."audit_id" IS NOT NULL) AS "has_body"
      FROM (${targetUnion(t, f.cursor, f.limit + 1)}) u
      LEFT JOIN "fhir"."fhir_audit_payload" p ON p."audit_id" = u."id"
      LEFT JOIN "auth"."users" us
             ON us."id" = CASE WHEN u."actor" ~ '^[0-9a-fA-F-]{36}$' THEN u."actor"::uuid END
      LEFT JOIN "master"."pegawai" pg ON pg."id" = us."pegawai_id"
     ORDER BY u."started_at" DESC, u."id" DESC
     LIMIT ${f.limit + 1}`;
}

/** Total panggilan 1 data (hanya untuk halaman pertama — dihitung dari index, tanpa membaca body). */
export async function countForTarget(t: SendLogTarget, tx?: Tx): Promise<number> {
  const rows = await db(tx).$queryRaw<{ n: number }[]>`
    SELECT count(*)::int AS "n" FROM (${targetUnion(t, undefined, null)}) u`;
  return rows[0]?.n ?? 0;
}

export interface SendLogDetailRow extends SendLogRow {
  request_enc: string | null;
  response_enc: string | null;
  request_bytes: number | null;
  response_bytes: number | null;
  truncated: boolean | null;
  mode: string;
}

/** 1 panggilan + isinya (PK lookup ×2). `focusKey` = "<localType>|<localId>" untuk nomor entry Bundle. */
export async function getDetail(id: string, focusKey: string | null, tx?: Tx): Promise<SendLogDetailRow | null> {
  const rows = await db(tx).$queryRaw<SendLogDetailRow[]>`
    SELECT l."id"::text AS "id", l."started_at", l."target", l."endpoint", l."request_path", l."method",
           l."resource_type", l."ihs_id", l."response_status", l."success", l."duration_ms", l."error_type",
           l."retry_count", l."actor", l."local_type", l."local_id", l."kunjungan_id"::text AS "kunjungan_id", l."mode",
           COALESCE(pg."nama_lengkap", us."username"::text) AS "actor_nama",
           CASE WHEN ${focusKey}::text IS NULL THEN NULL ELSE array_position(l."local_refs", ${focusKey}::text) END AS "entry_index",
           cardinality(l."local_refs") AS "entry_count",
           (p."audit_id" IS NOT NULL) AS "has_body",
           p."request_enc", p."response_enc", p."request_bytes", p."response_bytes", p."truncated"
      FROM "fhir"."fhir_audit_log" l
      LEFT JOIN "fhir"."fhir_audit_payload" p ON p."audit_id" = l."id"
      LEFT JOIN "auth"."users" us
             ON us."id" = CASE WHEN l."actor" ~ '^[0-9a-fA-F-]{36}$' THEN l."actor"::uuid END
      LEFT JOIN "master"."pegawai" pg ON pg."id" = us."pegawai_id"
     WHERE l."id" = ${id}::uuid`;
  return rows[0] ?? null;
}

/**
 * Pangkas isi log yang melewati masa retensi — bertahap (maks `batch` baris per pernyataan) agar
 * transaksi & lock tetap pendek. Baris audit (metadata) tidak disentuh.
 */
export async function purgePayloadsBefore(before: Date, batch = 2_000, tx?: Tx): Promise<number> {
  return db(tx).$executeRaw`
    DELETE FROM "fhir"."fhir_audit_payload"
     WHERE "audit_id" IN (
       SELECT "audit_id" FROM "fhir"."fhir_audit_payload"
        WHERE "created_at" < ${before}
        ORDER BY "created_at"
        LIMIT ${batch})`;
}
