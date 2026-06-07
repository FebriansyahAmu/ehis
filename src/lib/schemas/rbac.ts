// Zod + DTO admin RBAC (kelola Role × Permission dari Mapping Hub). Acuan: TODO-RBAC-MODUL Fase 3.
// Source of truth runtime = auth.role_permissions (ditulis di sini, dibaca rbacCache).

import { z } from "zod";

/** Param :roleKey (mis. "Registrasi"). */
export const RoleKeyParam = z.object({
  roleKey: z.string().trim().min(1).max(40),
});
export type RoleKeyParam = z.infer<typeof RoleKeyParam>;

/** Body PATCH — daftar lengkap kode permission yang di-grant (REPLACE, bukan delta). */
export const UpdateRoleGrantsInput = z.object({
  kodes: z.array(z.string().trim().min(1).max(80)).max(500),
});
export type UpdateRoleGrantsInput = z.infer<typeof UpdateRoleGrantsInput>;

export interface RoleSummaryDTO {
  key: string;
  nama: string;
  /** false = role global (bypass unit-scope ABAC); true = unit-scoped. */
  unitScoped: boolean;
}

/** Matriks lengkap untuk RBACPane: roles + grant per role (daftar kode "resource:action"). */
export interface RbacMatrixDTO {
  roles: RoleSummaryDTO[];
  grants: Record<string, string[]>;
}
