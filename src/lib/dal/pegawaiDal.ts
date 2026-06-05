// pegawaiDal — akses Prisma MURNI domain master/kepegawaian (FLOWS §2). Tak ada aturan
// bisnis. Terima `tx?` (transaksi dimiliki Service). Soft-delete difilter default.
// PII (NIK) sudah ter-enkripsi/hash oleh Service SEBELUM sampai sini (DAL tak tahu crypto).
//
// Modular-monolith (FLOWS §9): DAL ini HANYA akses schema `master`. Tautan akun login
// (auth.User.pegawaiId) diakses lewat domain auth, bukan query langsung di sini.

import { db, type Tx } from "@/lib/db/prisma";

type JenisKelamin = "L" | "P";
type StatusPegawai = "ASN" | "Outsourcing" | "Honorer" | "Magang" | "Mitra";

// ── Bentuk data (PII sudah enc/hash; nilai sudah dinormalisasi Service) ─────────
export interface KontakData {
  nama: string;
  hubungan: string;
  noHp: string;
  alamat?: string;
}

export interface CreatePegawaiData {
  nip: string;
  nikEnc: string;
  nikHash: string;
  namaLengkap: string;
  gelarDepan?: string;
  gelarBelakang?: string;
  jenisKelamin: JenisKelamin;
  agama?: string;
  tempatLahir?: string;
  tanggalLahir?: Date;
  statusPegawai: StatusPegawai;
  profesi?: string;
  unitKerja?: string;
  tglMasuk?: Date;
  alamat?: string;
  noHp?: string;
  email?: string;
  foto?: string;
  practitionerId?: string;
  kontakDarurat: KontakData[];
}

export interface UpdatePegawaiData {
  nikEnc?: string;
  nikHash?: string;
  nip?: string;
  namaLengkap?: string;
  gelarDepan?: string;
  gelarBelakang?: string;
  jenisKelamin?: JenisKelamin;
  agama?: string;
  tempatLahir?: string;
  tanggalLahir?: Date;
  statusPegawai?: StatusPegawai;
  profesi?: string;
  unitKerja?: string;
  tglMasuk?: Date;
  alamat?: string;
  noHp?: string;
  email?: string;
  foto?: string;
  practitionerId?: string | null; // null = lepas tautan; undefined = skip
  isActive?: boolean;
}

// Relasi standar read detail (kontak darurat). Absensi = sub-domain terpisah (fase later).
const detailInclude = { kontakDarurat: true } as const;

// Kolom untuk list (anti over-fetch — tanpa kontak darurat).
const listSelect = {
  id: true,
  nip: true,
  nikEnc: true,
  namaLengkap: true,
  gelarDepan: true,
  gelarBelakang: true,
  jenisKelamin: true,
  statusPegawai: true,
  profesi: true,
  unitKerja: true,
  practitionerId: true,
  isActive: true,
  version: true,
  createdAt: true,
} as const;

export type PegawaiEntity = Awaited<ReturnType<typeof findById>>;
export type PegawaiListEntity = Awaited<ReturnType<typeof list>>["items"][number];

// ── Create ─────────────────────────────────────────────────────────────────---
export function create(data: CreatePegawaiData, tx?: Tx) {
  const { kontakDarurat, ...rest } = data;
  return db(tx).pegawai.create({
    data: { ...rest, kontakDarurat: { create: kontakDarurat } },
    include: detailInclude,
  });
}

// ── Reads (soft-delete difilter) ──────────────────────────────────────────────
export function findById(id: string, tx?: Tx) {
  return db(tx).pegawai.findFirst({ where: { id, deletedAt: null }, include: detailInclude });
}

/** Dedup/uniqueness: cari pegawai aktif by hash NIK (HMAC). */
export function findByNikHash(nikHash: string, tx?: Tx) {
  return db(tx).pegawai.findFirst({ where: { nikHash, deletedAt: null }, select: { id: true } });
}

/** Uniqueness NIP. */
export function findByNip(nip: string, tx?: Tx) {
  return db(tx).pegawai.findFirst({ where: { nip, deletedAt: null }, select: { id: true } });
}

/** List + search nama/NIP (trigram ILIKE). Cursor by id (orderBy createdAt,id desc). */
export async function list(
  params: { q?: string; status?: StatusPegawai; aktif?: boolean; cursor?: string; limit: number },
  tx?: Tx,
) {
  const { q, status, aktif, cursor, limit } = params;
  const rows = await db(tx).pegawai.findMany({
    where: {
      deletedAt: null,
      ...(status ? { statusPegawai: status } : {}),
      ...(aktif !== undefined ? { isActive: aktif } : {}),
      ...(q
        ? {
            OR: [
              { namaLengkap: { contains: q, mode: "insensitive" as const } },
              { nip: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    select: listSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1, // +1 → deteksi halaman berikutnya
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}

// ── Update (version guard — optimistic concurrency, FLOWS §7) ─────────────────
/** Update bila version cocok; bump version. Mengembalikan count (0 = stale/tak ada). */
export async function updateWithVersion(
  id: string,
  expectedVersion: number,
  data: UpdatePegawaiData,
  tx?: Tx,
): Promise<number> {
  const res = await db(tx).pegawai.updateMany({
    where: { id, version: expectedVersion, deletedAt: null },
    data: { ...data, version: { increment: 1 } },
  });
  return res.count;
}

/** Replace seluruh kontak darurat (dipanggil saat update mengirim daftar baru). */
export async function replaceKontakDarurat(pegawaiId: string, items: KontakData[], tx?: Tx): Promise<void> {
  const c = db(tx);
  await c.pegawaiKontakDarurat.deleteMany({ where: { pegawaiId } });
  if (items.length) {
    await c.pegawaiKontakDarurat.createMany({ data: items.map((i) => ({ ...i, pegawaiId })) });
  }
}

// ── Soft-delete (version guard) ───────────────────────────────────────────────
export async function softDeleteWithVersion(
  id: string,
  expectedVersion: number,
  when: Date,
  tx?: Tx,
): Promise<number> {
  const res = await db(tx).pegawai.updateMany({
    where: { id, version: expectedVersion, deletedAt: null },
    data: { deletedAt: when, isActive: false, version: { increment: 1 } },
  });
  return res.count;
}
