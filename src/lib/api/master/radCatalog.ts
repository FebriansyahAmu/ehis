// API master/rad-catalog (browser) — Katalog Radiologi. Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/master/rad-catalog (GET list+cursor · POST) · /:id (PATCH · DELETE).

import { api } from "@/lib/api/client";
import type {
  CreateRadCatalogInput, UpdateRadCatalogInput, RadCatalogQuery, RadCatalogDTO,
} from "@/lib/schemas/master/radCatalog";

export type { CreateRadCatalogInput, UpdateRadCatalogInput, RadCatalogQuery, RadCatalogDTO };

export interface RadCatalogListPage {
  items: RadCatalogDTO[];
  cursor: string | null; // null = halaman terakhir
}

/** GET — list terfilter (q/modalitas/kategori/status) + keyset cursor. */
export async function listRadCatalog(query: RadCatalogQuery = {}, signal?: AbortSignal): Promise<RadCatalogListPage> {
  const { data, meta } = await api.get<RadCatalogDTO[]>("/master/rad-catalog", {
    query: {
      q: query.q,
      modalitas: query.modalitas,
      kategori: query.kategori,
      status: query.status,
      cursor: query.cursor,
      limit: query.limit,
    },
    signal,
  });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** POST — tambah 1 pemeriksaan (kode auto RAD-NNNN). */
export async function createRadCatalog(input: CreateRadCatalogInput, signal?: AbortSignal): Promise<RadCatalogDTO> {
  const { data } = await api.post<RadCatalogDTO>("/master/rad-catalog", input, { signal });
  return data;
}

/** PATCH — ubah 1 pemeriksaan (parsial). */
export async function updateRadCatalog(id: string, input: UpdateRadCatalogInput, signal?: AbortSignal): Promise<RadCatalogDTO> {
  const { data } = await api.patch<RadCatalogDTO>(`/master/rad-catalog/${encodeURIComponent(id)}`, input, { signal });
  return data;
}

/** DELETE — soft-delete 1 pemeriksaan. */
export async function deleteRadCatalog(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/rad-catalog/${encodeURIComponent(id)}`, { signal });
}
