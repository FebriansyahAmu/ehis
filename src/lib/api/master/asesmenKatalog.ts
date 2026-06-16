// API master Asesmen Katalog (browser). Tipe DI-REUSE dari schema server. Endpoint:
//   /api/v1/master/asesmen-katalog      (GET list+filter · POST create — kode auto <PREFIX>-NNN)
//   /api/v1/master/asesmen-katalog/:id  (PATCH · DELETE)

import { api } from "@/lib/api/client";
import type {
  CreateAsesmenInput, UpdateAsesmenInput, AsesmenQuery, AsesmenItemDTO,
} from "@/lib/schemas/master/asesmenKatalog";

export type { CreateAsesmenInput, UpdateAsesmenInput, AsesmenQuery, AsesmenItemDTO };

/** GET — list terfilter (q/kategori/status). */
export async function listAsesmenKatalog(query: AsesmenQuery = {}, signal?: AbortSignal): Promise<AsesmenItemDTO[]> {
  const { data } = await api.get<AsesmenItemDTO[]>("/master/asesmen-katalog", {
    query: { q: query.q, kategori: query.kategori, status: query.status, limit: query.limit },
    signal,
  });
  return data;
}

/** POST — tambah 1 item (kode auto-gen di server). */
export async function createAsesmenKatalog(input: CreateAsesmenInput, signal?: AbortSignal): Promise<AsesmenItemDTO> {
  const { data } = await api.post<AsesmenItemDTO>("/master/asesmen-katalog", input, { signal });
  return data;
}

/** PATCH — ubah 1 item (parsial). */
export async function updateAsesmenKatalog(id: string, input: UpdateAsesmenInput, signal?: AbortSignal): Promise<AsesmenItemDTO> {
  const { data } = await api.patch<AsesmenItemDTO>(`/master/asesmen-katalog/${encodeURIComponent(id)}`, input, { signal });
  return data;
}

/** DELETE — soft-delete 1 item. */
export async function deleteAsesmenKatalog(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/asesmen-katalog/${encodeURIComponent(id)}`, { signal });
}
