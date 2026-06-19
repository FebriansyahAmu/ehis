// API master Katalog BMHP/BHP (browser). Tipe DI-REUSE dari schema server. Endpoint:
//   /api/v1/master/bmhp      (GET list+cursor · POST create)
//   /api/v1/master/bmhp/:id  (PATCH · DELETE)
// BmhpDTO = BmhpRecord FE → konsumen langsung pakai BmhpRecord (zero-map).

import { api } from "@/lib/api/client";
import type { BmhpRecord } from "@/lib/master/bmhpMock";
import type {
  CreateBmhpInput, UpdateBmhpInput, BmhpQuery, BmhpDTO,
} from "@/lib/schemas/master/bmhp";

export type { CreateBmhpInput, UpdateBmhpInput, BmhpQuery, BmhpDTO };

export interface BmhpListPage {
  items: BmhpDTO[];
  cursor: string | null;
}

/** GET — list terfilter (q/kategori/status) + keyset cursor. */
export async function listBmhp(query: BmhpQuery = {}, signal?: AbortSignal): Promise<BmhpListPage> {
  const { data, meta } = await api.get<BmhpDTO[]>("/master/bmhp", {
    query: { q: query.q, kategori: query.kategori, status: query.status, cursor: query.cursor, limit: query.limit },
    signal,
  });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** Ambil seluruh katalog BMHP sebagai BmhpRecord[] (konsumen non-paginasi). */
export async function fetchAllBmhp(signal?: AbortSignal): Promise<BmhpRecord[]> {
  const { items } = await listBmhp({ limit: 300 }, signal);
  return items;
}

/** POST — tambah 1 BMHP. */
export async function createBmhp(input: CreateBmhpInput, signal?: AbortSignal): Promise<BmhpDTO> {
  const { data } = await api.post<BmhpDTO>("/master/bmhp", input, { signal });
  return data;
}

/** PATCH — ubah 1 BMHP (parsial). */
export async function updateBmhp(id: string, input: UpdateBmhpInput, signal?: AbortSignal): Promise<BmhpDTO> {
  const { data } = await api.patch<BmhpDTO>(`/master/bmhp/${encodeURIComponent(id)}`, input, { signal });
  return data;
}

/** DELETE — soft-delete 1 BMHP. */
export async function deleteBmhp(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/bmhp/${encodeURIComponent(id)}`, { signal });
}
