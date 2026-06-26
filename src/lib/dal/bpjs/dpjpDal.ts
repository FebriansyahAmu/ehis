// dpjpDal — Prisma murni referensi & mapping DPJP BPJS (bpjs.RefSpesialis/RefDpjp/DpjpMapping).
// Tanpa aturan bisnis. Terima `tx?`. `dokterId` = soft-ref master.Dokter (validasi di Service).

import { db, type Tx } from "@/lib/db/prisma";

export interface RefItem {
  kode: string;
  nama: string;
}
export interface RefDpjpItem extends RefItem {
  kodeSpesialis?: string | null;
}

// ── RefSpesialis ───────────────────────────────────────────────────────────────
export async function upsertRefSpesialis(items: RefItem[], tx?: Tx): Promise<void> {
  const now = new Date();
  for (const it of items) {
    await db(tx).refSpesialis.upsert({
      where: { kode: it.kode },
      create: { kode: it.kode, nama: it.nama, lastSyncedAt: now },
      update: { nama: it.nama, aktif: true, lastSyncedAt: now },
    });
  }
}

export function listRefSpesialis(tx?: Tx) {
  return db(tx).refSpesialis.findMany({ where: { aktif: true }, orderBy: { nama: "asc" } });
}

// ── RefDpjp ────────────────────────────────────────────────────────────────────
export async function upsertRefDpjp(items: RefDpjpItem[], tx?: Tx): Promise<void> {
  const now = new Date();
  for (const it of items) {
    await db(tx).refDpjp.upsert({
      where: { kode: it.kode },
      create: { kode: it.kode, nama: it.nama, kodeSpesialis: it.kodeSpesialis ?? null, lastSyncedAt: now },
      update: { nama: it.nama, kodeSpesialis: it.kodeSpesialis ?? null, aktif: true, lastSyncedAt: now },
    });
  }
}

/** Daftar RefDpjp aktif (untuk picker mapping). `mapping` = sudah dipetakan ke dokter mana. */
export function listRefDpjp(
  q: { search?: string; kodeSpesialis?: string; limit?: number },
  tx?: Tx,
) {
  return db(tx).refDpjp.findMany({
    where: {
      aktif: true,
      ...(q.kodeSpesialis ? { kodeSpesialis: q.kodeSpesialis } : {}),
      ...(q.search
        ? {
            OR: [
              { nama: { contains: q.search, mode: "insensitive" } },
              { kode: { contains: q.search } },
            ],
          }
        : {}),
    },
    orderBy: { nama: "asc" },
    take: q.limit ?? 50,
    include: { mapping: { select: { dokterId: true } } },
  });
}

// ── DpjpMapping ──────────────────────────────────────────────────────────────────
export function listMappings(tx?: Tx) {
  return db(tx).dpjpMapping.findMany({ include: { refDpjp: true } });
}

export function getMappingByDokterId(dokterId: string, tx?: Tx) {
  return db(tx).dpjpMapping.findUnique({ where: { dokterId }, include: { refDpjp: true } });
}

export function getMappingByRefKode(refDpjpKode: string, tx?: Tx) {
  return db(tx).dpjpMapping.findUnique({ where: { refDpjpKode }, select: { dokterId: true } });
}

export function upsertMapping(
  dokterId: string,
  refDpjpKode: string,
  mappedByUserId?: string | null,
  tx?: Tx,
) {
  return db(tx).dpjpMapping.upsert({
    where: { dokterId },
    create: { dokterId, refDpjpKode, mappedByUserId: mappedByUserId ?? null },
    update: { refDpjpKode, mappedByUserId: mappedByUserId ?? null },
  });
}

export async function deleteMapping(dokterId: string, tx?: Tx): Promise<number> {
  const r = await db(tx).dpjpMapping.deleteMany({ where: { dokterId } });
  return r.count;
}

// ── Resolver (build-payload) ─────────────────────────────────────────────────────
export async function getKodeByDokterId(dokterId: string, tx?: Tx): Promise<string | null> {
  const m = await db(tx).dpjpMapping.findUnique({ where: { dokterId }, select: { refDpjpKode: true } });
  return m?.refDpjpKode ?? null;
}

/** Resolve kode DPJP BPJS dari pegawaiId (Pegawai→Dokter→mapping). Read lintas-tabel utk resolver. */
export async function getKodeByPegawaiId(pegawaiId: string, tx?: Tx): Promise<string | null> {
  const dokter = await db(tx).dokter.findFirst({ where: { pegawaiId, deletedAt: null }, select: { id: true } });
  if (!dokter) return null;
  return getKodeByDokterId(dokter.id, tx);
}

// ── Board (Mapping Hub) ──────────────────────────────────────────────────────────
export function getDokterById(id: string, tx?: Tx) {
  return db(tx).dokter.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
}

export function getRefByKode(kode: string, tx?: Tx) {
  return db(tx).refDpjp.findUnique({ where: { kode } });
}

/** Semua dokter RS + status mapping kode DPJP BPJS (untuk halaman Mapping Hub). */
export async function listDokterWithMapping(tx?: Tx) {
  const [dokters, mappings] = await Promise.all([
    db(tx).dokter.findMany({
      where: { deletedAt: null },
      select: { id: true, pegawaiId: true, spesialisKode: true, pegawai: { select: { namaLengkap: true } } },
      orderBy: { pegawai: { namaLengkap: "asc" } },
    }),
    db(tx).dpjpMapping.findMany({ select: { dokterId: true, refDpjp: { select: { kode: true, nama: true } } } }),
  ]);
  const byDokter = new Map(mappings.map((m) => [m.dokterId, m.refDpjp]));
  return dokters.map((d) => ({
    dokterId: d.id,
    pegawaiId: d.pegawaiId,
    nama: d.pegawai.namaLengkap,
    spesialisKode: d.spesialisKode as string,
    mapped: byDokter.get(d.id) ?? null,
  }));
}
