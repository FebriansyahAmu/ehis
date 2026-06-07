// API admin RBAC (browser) — baca matriks + simpan grant per role. Envelope-aware via `api`.

import { api } from "@/lib/api/client";
import type { RbacMatrixDTO } from "@/lib/schemas/rbac";

export type { RbacMatrixDTO };

/** GET /auth/rbac — roles + grant (kode[]) per role. */
export async function fetchRbacMatrix(signal?: AbortSignal): Promise<RbacMatrixDTO> {
  const { data } = await api.get<RbacMatrixDTO>("/auth/rbac", { signal });
  return data;
}

/** PATCH /auth/rbac/:roleKey — REPLACE grant role; kembalikan kode tersimpan (tersortir). */
export async function saveRoleGrants(roleKey: string, kodes: string[]): Promise<string[]> {
  const { data } = await api.patch<{ kodes: string[] }>(`/auth/rbac/${encodeURIComponent(roleKey)}`, { kodes });
  return data.kodes;
}
