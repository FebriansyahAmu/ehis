// API master ICD (browser). Tipe DI-REUSE dari schema server. Endpoint:
//   /api/v1/master/icd        (GET list+cursor · POST create)
//   /api/v1/master/icd/:id    (PATCH · DELETE)
//   /api/v1/master/icd/import (POST bulk import)

import { api } from "@/lib/api/client";
import type {
  CreateIcdInput, UpdateIcdInput, ImportIcdInput, ImportIcdResult, IcdQuery, IcdDTO,
} from "@/lib/schemas/master/icd";

export type { CreateIcdInput, UpdateIcdInput, ImportIcdInput, ImportIcdResult, IcdQuery, IcdDTO };

export interface IcdListPage {
  items: IcdDTO[];
  cursor: string | null; // null = halaman terakhir
}

/** GET — list terfilter (jenis/q/status) + keyset cursor. */
export async function listIcd(query: IcdQuery = {}, signal?: AbortSignal): Promise<IcdListPage> {
  const { data, meta } = await api.get<IcdDTO[]>("/master/icd", {
    query: {
      jenis: query.jenis,
      q: query.q,
      status: query.status,
      cursor: query.cursor,
      limit: query.limit,
    },
    signal,
  });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** POST — tambah 1 kode. */
export async function createIcd(input: CreateIcdInput, signal?: AbortSignal): Promise<IcdDTO> {
  const { data } = await api.post<IcdDTO>("/master/icd", input, { signal });
  return data;
}

/** PATCH — ubah 1 kode (parsial). */
export async function updateIcd(id: string, input: UpdateIcdInput, signal?: AbortSignal): Promise<IcdDTO> {
  const { data } = await api.patch<IcdDTO>(`/master/icd/${encodeURIComponent(id)}`, input, { signal });
  return data;
}

/** DELETE — soft-delete 1 kode. */
export async function deleteIcd(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/icd/${encodeURIComponent(id)}`, { signal });
}

/** POST — bulk import 1 jenis (dedup di server). Untuk file besar, panggil per batch. */
export async function importIcd(input: ImportIcdInput, signal?: AbortSignal): Promise<ImportIcdResult> {
  const { data } = await api.post<ImportIcdResult>("/master/icd/import", input, { signal });
  return data;
}
