// rbacAdminService — kelola grant Role×Permission (Mapping Hub). Menulis auth.role_permissions
// (source of truth runtime) lalu invalidasi rbacCache agar perubahan langsung berlaku.
// Acuan: TODO-RBAC-MODUL Fase 3 · docs/BACKEND-FLOWS.md (layering, tx di Service).

import { transaction } from "@/lib/db/prisma";
import * as defaultDal from "@/lib/dal/rbacAdminDal";
import { invalidateRbacCache } from "@/lib/auth/rbacCache";
import { Errors } from "@/lib/errors/appError";
import type { RbacMatrixDTO } from "@/lib/schemas/rbac";

type Dal = typeof defaultDal;

export function makeRbacAdminService(deps: { dal?: Dal } = {}) {
  const dal = deps.dal ?? defaultDal;

  /** Matriks lengkap: roles + grant (kode[]) per roleKey. */
  async function getMatrix(): Promise<RbacMatrixDTO> {
    const [roles, rows] = await Promise.all([dal.listRoles(), dal.listAllRolePermissions()]);
    const grants: Record<string, string[]> = {};
    for (const r of roles) grants[r.key] = [];
    for (const row of rows) (grants[row.role.key] ??= []).push(row.permission.kode);
    return { roles, grants };
  }

  /** REPLACE seluruh grant satu role dengan `kodes` (delete-all + insert). Idempoten.
   *  Kode asing (tak ada di Permission) → 400 agar typo tak diam-diam terbuang. */
  async function updateRoleGrants(roleKey: string, kodes: string[]): Promise<{ kodes: string[] }> {
    const role = await dal.findRoleByKey(roleKey);
    if (!role) throw Errors.notFound(`Role ${roleKey} tidak ditemukan`);

    const unique = [...new Set(kodes)];
    const found = unique.length ? await dal.permissionsByKodes(unique) : [];
    if (found.length !== unique.length) {
      const known = new Set(found.map((p) => p.kode));
      const unknown = unique.filter((k) => !known.has(k));
      throw Errors.validation(`Permission tidak dikenal: ${unknown.join(", ")}`);
    }

    await transaction(async (tx) => {
      await dal.deleteRolePermissions(role.id, tx);
      if (found.length) await dal.insertRolePermissions(role.id, found.map((p) => p.id), tx);
    });

    invalidateRbacCache(); // sesi yang masih hidup pakai izin lama s/d access kedaluwarsa (≤30m)
    return { kodes: found.map((p) => p.kode).sort() };
  }

  return { getMatrix, updateRoleGrants };
}

export const rbacAdminService = makeRbacAdminService();
