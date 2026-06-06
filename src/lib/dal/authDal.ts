// authDal — akses Prisma MURNI domain auth, sisi RUNTIME (login/sesi/RBAC). Terpisah dari
// userDal (provisioning). Terima `tx?` (transaksi dimiliki Service). HANYA schema `auth`
// (identitas pegawai untuk display via relasi User.pegawai). Acuan: docs/BACKEND-AUTH.md §4.4.

import { db, type Tx } from "@/lib/db/prisma";

// Identitas + otorisasi + state keamanan untuk login & rebuild sesi.
const authSelect = {
  id: true,
  username: true,
  passwordHash: true,
  status: true,
  tokenVersion: true,
  mustChangePassword: true,
  failedLoginCount: true,
  lockedUntil: true,
  pegawaiId: true,
  roles: { select: { role: { select: { key: true, unitScoped: true, isActive: true } } } },
  unitScopes: { select: { unitId: true } },
  pegawai: { select: { namaLengkap: true, gelarDepan: true, gelarBelakang: true } },
} as const;

export type AuthUserEntity = NonNullable<Awaited<ReturnType<typeof findByUsername>>>;

// ── Reads ──────────────────────────────────────────────────────────────────---

/** Login by username (citext → CI). Soft-deleted dikecualikan. */
export function findByUsername(username: string, tx?: Tx) {
  return db(tx).user.findFirst({ where: { username, deletedAt: null }, select: authSelect });
}

/** Rebuild sesi pasca-refresh. */
export function findAuthById(id: string, tx?: Tx) {
  return db(tx).user.findFirst({ where: { id, deletedAt: null }, select: authSelect });
}

/** Flat (roleKey × kode permission) untuk rbacCache. Hanya role aktif. */
export async function loadRolePermissions(tx?: Tx): Promise<{ roleKey: string; kode: string }[]> {
  const rows = await db(tx).rolePermission.findMany({
    where: { role: { isActive: true } },
    select: { role: { select: { key: true } }, permission: { select: { kode: true } } },
  });
  return rows.map((r) => ({ roleKey: r.role.key, kode: r.permission.kode }));
}

// ── Keamanan akun (lockout / sesi) ────────────────────────────────────────────

export function incFailedLogin(userId: string, lockedUntil: Date | null, tx?: Tx) {
  return db(tx).user.update({
    where: { id: userId },
    data: { failedLoginCount: { increment: 1 }, ...(lockedUntil ? { lockedUntil } : {}) },
  });
}

export function resetFailedLogin(userId: string, ip: string | null, now: Date, tx?: Tx) {
  return db(tx).user.update({
    where: { id: userId },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: now, lastLoginIp: ip },
  });
}

/** Bump = revoke SEMUA sesi user (dicek saat refresh selama Redis ditunda). */
export function bumpTokenVersion(userId: string, tx?: Tx) {
  return db(tx).user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
}

export function updatePassword(userId: string, passwordHash: string, tx?: Tx) {
  return db(tx).user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: false },
  });
}

// ── Refresh token (rotating + reuse detection) ────────────────────────────────

export interface CreateRefreshData {
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  ip: string | null;
  userAgent: string | null;
}

export function createRefresh(data: CreateRefreshData, tx?: Tx) {
  return db(tx).refreshToken.create({ data });
}

export function findRefreshByHash(tokenHash: string, tx?: Tx) {
  return db(tx).refreshToken.findUnique({ where: { tokenHash } });
}

/** Tandai 1 refresh revoked (opsional link penerus saat rotasi). */
export function revokeRefresh(id: string, now: Date, replacedById: string | null, tx?: Tx) {
  return db(tx).refreshToken.update({
    where: { id },
    data: { revokedAt: now, ...(replacedById ? { replacedById } : {}) },
  });
}

/** Reuse detection: cabut seluruh family (token dicuri & dipakai ulang). */
export function revokeFamily(familyId: string, now: Date, tx?: Tx) {
  return db(tx).refreshToken.updateMany({
    where: { familyId, revokedAt: null },
    data: { revokedAt: now },
  });
}

/** Logout semua: hapus/cabut seluruh refresh user. */
export function revokeAllUserRefresh(userId: string, now: Date, tx?: Tx) {
  return db(tx).refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: now },
  });
}

export function touchRefresh(id: string, now: Date, tx?: Tx) {
  return db(tx).refreshToken.update({ where: { id }, data: { lastUsedAt: now } });
}
