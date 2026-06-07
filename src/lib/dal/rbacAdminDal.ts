// rbacAdminDal — akses Prisma untuk KELOLA grant Role×Permission (Mapping Hub, sisi admin).
// Terpisah dari authDal (runtime login/sesi). HANYA schema `auth`. Terima `tx?` (Service punya tx).
// Acuan: TODO-RBAC-MODUL Fase 3 · docs/API-RULES.md.

import { db, type Tx } from "@/lib/db/prisma";

/** Role aktif untuk daftar matriks. */
export function listRoles(tx?: Tx) {
  return db(tx).role.findMany({
    where: { isActive: true },
    select: { id: true, key: true, nama: true, unitScoped: true },
    orderBy: { key: "asc" },
  });
}

/** Semua grant (roleKey × kode) untuk membangun matriks. */
export function listAllRolePermissions(tx?: Tx) {
  return db(tx).rolePermission.findMany({
    select: { role: { select: { key: true } }, permission: { select: { kode: true } } },
  });
}

export function findRoleByKey(key: string, tx?: Tx) {
  return db(tx).role.findUnique({ where: { key }, select: { id: true, key: true } });
}

/** Resolusi kode → permissionId (validasi eksistensi; kode asing tersaring di Service). */
export function permissionsByKodes(kodes: string[], tx?: Tx) {
  return db(tx).permission.findMany({
    where: { kode: { in: kodes } },
    select: { id: true, kode: true },
  });
}

export function deleteRolePermissions(roleId: string, tx?: Tx) {
  return db(tx).rolePermission.deleteMany({ where: { roleId } });
}

export function insertRolePermissions(roleId: string, permissionIds: string[], tx?: Tx) {
  return db(tx).rolePermission.createMany({
    data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
    skipDuplicates: true,
  });
}
