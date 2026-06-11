// API master Katalog Tindakan (browser). Tipe DI-REUSE dari schema server. Endpoint:
//   /api/v1/master/tindakan      (GET list+cursor · POST create)
//   /api/v1/master/tindakan/:id  (PATCH · DELETE)

import { api } from "@/lib/api/client";
import type {
  CreateTindakanInput, UpdateTindakanInput, TindakanQuery, TindakanDTO,
} from "@/lib/schemas/master/tindakan";

export type { CreateTindakanInput, UpdateTindakanInput, TindakanQuery, TindakanDTO };

export interface TindakanListPage {
  items: TindakanDTO[];
  cursor: string | null; // null = halaman terakhir
}

/** GET — list terfilter (q/kategori/kompleksitas/status) + keyset cursor. */
export async function listTindakan(query: TindakanQuery = {}, signal?: AbortSignal): Promise<TindakanListPage> {
  const { data, meta } = await api.get<TindakanDTO[]>("/master/tindakan", {
    query: {
      q: query.q,
      kategori: query.kategori,
      kompleksitas: query.kompleksitas,
      status: query.status,
      cursor: query.cursor,
      limit: query.limit,
    },
    signal,
  });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** POST — tambah 1 tindakan. */
export async function createTindakan(input: CreateTindakanInput, signal?: AbortSignal): Promise<TindakanDTO> {
  const { data } = await api.post<TindakanDTO>("/master/tindakan", input, { signal });
  return data;
}

/** PATCH — ubah 1 tindakan (parsial). */
export async function updateTindakan(id: string, input: UpdateTindakanInput, signal?: AbortSignal): Promise<TindakanDTO> {
  const { data } = await api.patch<TindakanDTO>(`/master/tindakan/${encodeURIComponent(id)}`, input, { signal });
  return data;
}

/** DELETE — soft-delete 1 tindakan. */
export async function deleteTindakan(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/tindakan/${encodeURIComponent(id)}`, { signal });
}
