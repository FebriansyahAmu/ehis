// userDal — akses Prisma MURNI domain auth (sisi provisioning). Tak ada aturan bisnis.
// Terima `tx?` (transaksi dimiliki Service). passwordHash sudah di-hash Service sebelum sampai sini.
// Modular-monolith: HANYA schema `auth`. Identitas pegawai (master.Pegawai) diakses Service via pegawaiDal.

import { db, type Tx } from "@/lib/db/prisma";

type UserStatus = "Active" | "Suspended" | "Locked";

export interface CreateUserData {
  pegawaiId: string;
  username: string;
  passwordHash: string;
  mustChangePassword: boolean;
  status?: UserStatus;
}

// Relasi standar: roles (+ role utk ambil key). Anti over-fetch (tanpa permissions/tokens).
const detailInclude = { roles: { include: { role: true } } } as const;

// Kolom list: identitas akun + peran (key) + identitas pegawai tertaut (display). Tanpa hash/token.
const listSelect = {
  id: true,
  username: true,
  status: true,
  mustChangePassword: true,
  lastLoginAt: true,
  createdAt: true,
  pegawaiId: true,
  roles: { select: { role: { select: { key: true } } } },
  pegawai: {
    select: {
      namaLengkap: true,
      gelarDepan: true,
      gelarBelakang: true,
      email: true,
      nip: true,
      practitionerId: true,
      profesi: true,
    },
  },
} as const;

export type UserEntity = Awaited<ReturnType<typeof findById>>;
export type UserListEntity = Awaited<ReturnType<typeof list>>["items"][number];

// ── Create ─────────────────────────────────────────────────────────────────---
export function create(data: CreateUserData, tx?: Tx) {
  return db(tx).user.create({
    data: {
      pegawaiId: data.pegawaiId,
      username: data.username,
      passwordHash: data.passwordHash,
      mustChangePassword: data.mustChangePassword,
      ...(data.status ? { status: data.status } : {}),
    },
    include: detailInclude,
  });
}

// ── Reads (soft-delete difilter) ──────────────────────────────────────────────
export function findById(id: string, tx?: Tx) {
  return db(tx).user.findFirst({ where: { id, deletedAt: null }, include: detailInclude });
}

/** Uniqueness username (citext → CI di DB). */
export function findByUsername(username: string, tx?: Tx) {
  return db(tx).user.findFirst({ where: { username, deletedAt: null }, select: { id: true } });
}

/** 1 pegawai : 1 akun — cegah provisioning ganda. */
export function findByPegawaiId(pegawaiId: string, tx?: Tx) {
  return db(tx).user.findFirst({ where: { pegawaiId, deletedAt: null }, select: { id: true } });
}

/** Resolve KEY role → baris Role aktif (utk peta key→id saat assign). */
export function findRolesByKeys(keys: string[], tx?: Tx) {
  return db(tx).role.findMany({ where: { key: { in: keys }, isActive: true }, select: { id: true, key: true } });
}

/** List akun + cari (username / nama pegawai / NIP). Cursor by id (orderBy createdAt,id desc). */
export async function list(params: { q?: string; cursor?: string; limit: number }, tx?: Tx) {
  const { q, cursor, limit } = params;
  const rows = await db(tx).user.findMany({
    where: {
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { username: { contains: q, mode: "insensitive" as const } },
              { pegawai: { namaLengkap: { contains: q, mode: "insensitive" as const } } },
              { pegawai: { nip: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    select: listSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}

// ── Mutations (dipanggil dalam transaksi Service) ─────────────────────────────
/** Ganti seluruh peran user (delete-then-insert). */
export async function replaceRoles(userId: string, roleIds: string[], tx?: Tx): Promise<void> {
  const c = db(tx);
  await c.userRole.deleteMany({ where: { userId } });
  if (roleIds.length) {
    await c.userRole.createMany({ data: roleIds.map((roleId) => ({ userId, roleId })) });
  }
}

export function updateStatus(userId: string, status: UserStatus, tx?: Tx) {
  return db(tx).user.update({ where: { id: userId }, data: { status } });
}
