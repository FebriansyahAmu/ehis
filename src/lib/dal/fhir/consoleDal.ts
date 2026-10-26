// consoleDal — baca untuk konsol Resource & Kunjungan /ehis-fhir (FH9b). Read-only.
// Daftar kunjungan = kunjungan × peta Encounter (env) × job outbox terakhir, satu query.

import { db, type Tx } from "@/lib/db/prisma";

export type KunjunganSyncFilter = "terkirim" | "belum" | "gagal" | "antre";

export interface KunjunganSyncRow {
  id: string;
  noKunjungan: string;
  unit: string;
  status: string;
  waktuKunjungan: Date;
  pasienNama: string;
  noRm: string;
  encounterIhsId: string | null;
  lastSyncAt: Date | null;
  resourceCount: number;
  jobStatus: string | null;
  jobAt: Date | null;
  jobError: string | null;
  total: number;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Kunjungan yang sudah diterima (status ≠ Registered = kandidat Encounter), terbaru dulu.
 * `q` cocok ke no. kunjungan / nama / no. RM (ILIKE) atau persis ke ID kunjungan / IHS Encounter.
 */
export function listKunjunganSync(
  env: string,
  f: { q?: string; unit?: string; sync?: KunjunganSyncFilter; page: number; pageSize: number },
  tx?: Tx,
) {
  const params: unknown[] = [env];
  const conds = [`k.deleted_at IS NULL`, `k.status::text <> 'Registered'`];
  const p = (v: unknown) => { params.push(v); return `$${params.length}`; };

  if (f.unit) conds.push(`k.unit::text = ${p(f.unit)}`);
  if (f.q) {
    const raw = f.q.trim();
    const like = p(`%${raw}%`);
    const exact = [`m.ihs_id = ${p(raw)}`];
    if (UUID_RE.test(raw)) exact.push(`k.id = ${p(raw)}::uuid`);
    conds.push(`(k.no_kunjungan ILIKE ${like} OR p.nama ILIKE ${like} OR p.no_rm ILIKE ${like} OR ${exact.join(" OR ")})`);
  }
  if (f.sync === "terkirim") conds.push(`m.id IS NOT NULL AND (j.status IS NULL OR j.status::text <> 'Failed')`);
  if (f.sync === "belum") conds.push(`m.id IS NULL`);
  if (f.sync === "gagal") conds.push(`j.status::text = 'Failed'`);
  if (f.sync === "antre") conds.push(`j.status::text IN ('Pending', 'Sending')`);

  const sql = `
    SELECT k.id::text AS id, k.no_kunjungan AS "noKunjungan", k.unit::text AS unit, k.status::text AS status,
      k.waktu_kunjungan AS "waktuKunjungan", p.nama AS "pasienNama", p.no_rm AS "noRm",
      m.ihs_id AS "encounterIhsId", m.last_sync_at AS "lastSyncAt",
      (SELECT count(*) FROM fhir.resource_map r WHERE r.env = $1 AND r.kunjungan_id = k.id)::int AS "resourceCount",
      j.status::text AS "jobStatus", j.updated_at AS "jobAt",
      COALESCE(j.last_error->>'message', j.last_error->>'reason') AS "jobError",
      COUNT(*) OVER()::int AS total
    FROM encounter.kunjungan k
    JOIN pendaftaran.pasien p ON p.id = k.patient_id
    LEFT JOIN fhir.resource_map m ON m.env = $1 AND m.local_type = 'Encounter' AND m.local_id = k.id::text
    LEFT JOIN LATERAL (
      SELECT s.status, s.updated_at, s.last_error FROM fhir.sync_log s
      WHERE s.kunjungan_id = k.id ORDER BY s.created_at DESC LIMIT 1
    ) j ON true
    WHERE ${conds.join(" AND ")}
    ORDER BY k.waktu_kunjungan DESC
    LIMIT ${p(f.pageSize)} OFFSET ${p((f.page - 1) * f.pageSize)}`;
  return db(tx).$queryRawUnsafe<KunjunganSyncRow[]>(sql, ...params);
}

/** Header kunjungan untuk detail konsol (pasien + DPJP + ruangan di-resolve terpisah). */
export function getKunjunganHeader(id: string, tx?: Tx) {
  return db(tx).kunjungan.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true, noKunjungan: true, unit: true, status: true, waktuKunjungan: true, dilayaniAt: true, selesaiAt: true,
      dpjpId: true, ruanganId: true, patientId: true,
      pasien: { select: { nama: true, noRm: true, gender: true, tanggalLahir: true } },
    },
  });
}

export function listJobsForKunjungan(kunjunganId: string, take = 20, tx?: Tx) {
  return db(tx).syncLog.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, trigger: true, status: true, attempts: true, lastError: true, ihsRefs: true, createdAt: true, updatedAt: true },
  });
}

// ── Label lokal untuk daftar Resource ───────────────────────

export async function labelsFor(localType: string, ids: string[], tx?: Tx): Promise<Map<string, { label: string; sub?: string }>> {
  const out = new Map<string, { label: string; sub?: string }>();
  if (!ids.length) return out;
  const c = db(tx);
  if (localType === "Patient") {
    for (const r of await c.pasien.findMany({ where: { id: { in: ids } }, select: { id: true, nama: true, noRm: true } })) {
      out.set(r.id, { label: r.nama, sub: `RM ${r.noRm}` });
    }
  } else if (localType === "Practitioner") {
    const rows = await c.pegawai.findMany({
      where: { id: { in: ids } },
      select: { id: true, namaLengkap: true, gelarDepan: true, gelarBelakang: true, profesi: true },
    });
    for (const r of rows) {
      out.set(r.id, { label: [r.gelarDepan, r.namaLengkap, r.gelarBelakang].filter(Boolean).join(" "), sub: r.profesi ?? undefined });
    }
  } else if (localType === "Organization") {
    for (const r of await c.organization.findMany({ where: { id: { in: ids } }, select: { id: true, nama: true, kode: true } })) {
      out.set(r.id, { label: r.nama, sub: r.kode });
    }
  } else if (localType === "Location") {
    for (const r of await c.location.findMany({ where: { id: { in: ids } }, select: { id: true, nama: true, kode: true } })) {
      out.set(r.id, { label: r.nama, sub: r.kode });
    }
  }
  return out;
}

/** No. kunjungan + nama pasien per kunjunganId — label baris resource klinis. */
export async function kunjunganLabels(ids: string[], tx?: Tx): Promise<Map<string, { noKunjungan: string; pasienNama: string }>> {
  if (!ids.length) return new Map();
  const rows = await db(tx).kunjungan.findMany({
    where: { id: { in: ids } },
    select: { id: true, noKunjungan: true, pasien: { select: { nama: true } } },
  });
  return new Map(rows.map((r) => [r.id, { noKunjungan: r.noKunjungan, pasienNama: r.pasien.nama }]));
}
