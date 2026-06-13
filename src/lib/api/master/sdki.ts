// API master Katalog Keperawatan (browser). Tipe DI-REUSE dari schema server. Endpoint:
//   /api/v1/master/sdki      (GET list+cursor · POST create — kode auto D.NNNN)
//   /api/v1/master/sdki/:id  (PATCH · DELETE)

import { api } from "@/lib/api/client";
import type {
  CreateSdkiInput, UpdateSdkiInput, SdkiQuery, SdkiDTO,
} from "@/lib/schemas/master/sdki";

export type { CreateSdkiInput, UpdateSdkiInput, SdkiQuery, SdkiDTO };

export interface SdkiListPage {
  items: SdkiDTO[];
  cursor: string | null; // null = halaman terakhir
}

/** GET — list terfilter (q/kategori/jenis/status) + keyset cursor. */
export async function listSdki(query: SdkiQuery = {}, signal?: AbortSignal): Promise<SdkiListPage> {
  const { data, meta } = await api.get<SdkiDTO[]>("/master/sdki", {
    query: {
      q: query.q,
      kategori: query.kategori,
      jenis: query.jenis,
      status: query.status,
      cursor: query.cursor,
      limit: query.limit,
    },
    signal,
  });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** POST — tambah 1 diagnosa (kode auto-gen di server). */
export async function createSdki(input: CreateSdkiInput, signal?: AbortSignal): Promise<SdkiDTO> {
  const { data } = await api.post<SdkiDTO>("/master/sdki", input, { signal });
  return data;
}

/** PATCH — ubah 1 diagnosa (parsial). */
export async function updateSdki(id: string, input: UpdateSdkiInput, signal?: AbortSignal): Promise<SdkiDTO> {
  const { data } = await api.patch<SdkiDTO>(`/master/sdki/${encodeURIComponent(id)}`, input, { signal });
  return data;
}

/** DELETE — soft-delete 1 diagnosa. */
export async function deleteSdki(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/sdki/${encodeURIComponent(id)}`, { signal });
}
